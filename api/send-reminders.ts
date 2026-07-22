import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

/**
 * POST /api/send-reminders
 *
 * Sends ONE push notification per user summarising ALL their pending tasks for today.
 * Notification format:
 *   Title : "Lets Do It : Pending Tasks"
 *   Body  : "• Task A  • Task B  • Task C  (and 2 more)"
 *
 * Called by:
 *   - Vercel cron job (runs every hour, checks if current IST hour matches saved setting)
 *   - Admin "Send Test Now" button (passes { test: true } to skip time check)
 *
 * Security: requires Authorization: Bearer <CRON_SECRET>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isTest = req.body?.test === true;

  // ── Load notification time setting from Firestore ──────────────────────────
  let scheduledHour = 19;   // default 7 PM IST
  let scheduledMinute = 0;

  try {
    const settingDoc = await db.collection('settings').doc('notification_time').get();
    if (settingDoc.exists) {
      const data = settingDoc.data()!;
      scheduledHour = typeof data.hour === 'number' ? data.hour : 19;
      scheduledMinute = typeof data.minute === 'number' ? data.minute : 0;
    }
  } catch (e) {
    console.warn('Could not read notification_time setting, using default 19:00 IST');
  }

  // ── Time gate: only fire if current IST time matches (skip for test) ───────
  if (!isTest) {
    // Vercel runs in UTC; IST = UTC + 5:30
    const nowUtc = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const nowIst = new Date(nowUtc.getTime() + istOffsetMs);
    const currentHour = nowIst.getUTCHours();
    const currentMinute = nowIst.getUTCMinutes();

    // Allow a ±5 minute window around the scheduled minute
    const scheduledTotalMin = scheduledHour * 60 + scheduledMinute;
    const currentTotalMin = currentHour * 60 + currentMinute;
    const diff = Math.abs(currentTotalMin - scheduledTotalMin);

    if (diff > 5) {
      console.log(`⏩ Skipping — current IST ${currentHour}:${String(currentMinute).padStart(2, '0')}, scheduled ${scheduledHour}:${String(scheduledMinute).padStart(2, '0')}`);
      return res.status(200).json({
        success: true,
        skipped: true,
        message: `Not yet time. Scheduled ${scheduledHour}:${String(scheduledMinute).padStart(2, '0')} IST`,
      });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  console.log(`🔔 Sending pending task reminders for ${today} (test=${isTest})`);

  try {
    // Get all approved members
    const membersSnapshot = await db
      .collection('members')
      .where('status', '==', 'approved')
      .get();

    if (membersSnapshot.empty) {
      return res.status(200).json({ success: true, message: 'No approved members' });
    }

    let sent = 0;
    let skippedNoToken = 0;
    let skippedNoPending = 0;
    const results: { member: string; status: string; tasks?: number }[] = [];

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const memberId = memberDoc.id;
      const memberName = (memberData.full_name || 'User').split(' ')[0]; // first name only
      const fcmToken = memberData.fcm_token;

      if (!fcmToken) {
        skippedNoToken++;
        results.push({ member: memberData.full_name, status: 'no_token' });
        continue;
      }

      // Get all PENDING assignments for this member today
      const assignmentsSnap = await db
        .collection('task_assignments')
        .where('member_id', '==', memberId)
        .where('assigned_date', '==', today)
        .where('completion_status', '==', 'pending')
        .get();

      if (assignmentsSnap.empty) {
        skippedNoPending++;
        results.push({ member: memberData.full_name, status: 'all_done' });
        continue;
      }

      // Collect task titles
      const taskTitles: string[] = [];
      for (const assignDoc of assignmentsSnap.docs) {
        const taskId = assignDoc.data().task_id;
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        if (taskDoc.exists) {
          const title = taskDoc.data()?.task_title || 'Untitled Task';
          taskTitles.push(title);
        }
      }

      if (taskTitles.length === 0) {
        skippedNoPending++;
        continue;
      }

      // Build ONE notification with ALL tasks listed
      // Show up to 5 tasks inline, mention count for rest
      const MAX_SHOWN = 5;
      const shownTasks = taskTitles.slice(0, MAX_SHOWN);
      const remaining = taskTitles.length - shownTasks.length;

      const bodyLines = shownTasks.map((t) => `• ${t}`).join('\n');
      const bodyText = remaining > 0
        ? `${bodyLines}\n(+${remaining} more)`
        : bodyLines;

      const message: admin.messaging.Message = {
        notification: {
          title: 'Lets Do It : Pending Tasks',
          body: bodyText,
        },
        data: {
          type: 'daily_reminder',
          member_id: memberId,
          count: taskTitles.length.toString(),
          date: today,
        },
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'task_reminders',
            tag: 'pending_tasks', // replaces previous notification instead of stacking
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: taskTitles.length,
              'content-available': 1,
            },
          },
        },
      };

      try {
        await admin.messaging().send(message);
        sent++;
        results.push({ member: memberData.full_name, status: 'sent', tasks: taskTitles.length });
        console.log(`✅ ${memberData.full_name}: sent (${taskTitles.length} pending tasks)`);
      } catch (err: any) {
        console.error(`❌ ${memberData.full_name}: ${err.message}`);
        results.push({ member: memberData.full_name, status: `failed: ${err.message}` });
      }
    }

    console.log(`📊 Summary: sent=${sent}, no_token=${skippedNoToken}, all_done=${skippedNoPending}`);

    return res.status(200).json({
      success: true,
      date: today,
      isTest,
      summary: { sent, skippedNoToken, skippedNoPending, total: membersSnapshot.size },
      results,
    });
  } catch (error: any) {
    console.error('❌ Error sending reminders:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
