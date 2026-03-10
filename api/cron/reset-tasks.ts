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
 * Vercel Cron Job: Reset tasks at midnight (12:00 AM)
 * Schedule: 0 0 * * * (Every day at 00:00 UTC+5:30 IST)
 * 
 * This function:
 * 1. Archives yesterday's task data
 * 2. Resets all tasks to "pending"
 * 3. Sends push notifications to all users
 * 4. Deletes data older than 1 year
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify this is a cron request (security)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕛 Running daily task reset at midnight...');

  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    // STEP 1: Archive yesterday's task completion data
    console.log('📦 Archiving yesterday\'s data...');
    const assignmentsSnapshot = await db
      .collection('task_assignments')
      .where('assigned_date', '==', yesterdayStr)
      .get();

    const archiveBatch = db.batch();
    let archivedCount = 0;

    for (const doc of assignmentsSnapshot.docs) {
      const data = doc.data();

      // Create archive record
      const archiveRef = db.collection('task_history').doc();
      archiveBatch.set(archiveRef, {
        ...data,
        archived_at: admin.firestore.FieldValue.serverTimestamp(),
        original_assignment_id: doc.id,
      });
      archivedCount++;
    }

    if (archivedCount > 0) {
      await archiveBatch.commit();
      console.log(`✅ Archived ${archivedCount} task records from ${yesterdayStr}`);
    }

    // STEP 2: Reset all current task assignments to pending
    console.log('🔄 Resetting all tasks to pending...');
    const allAssignmentsSnapshot = await db.collection('task_assignments').get();

    const resetBatch = db.batch();
    let resetCount = 0;

    allAssignmentsSnapshot.forEach((doc) => {
      resetBatch.update(doc.ref, {
        completion_status: 'pending',
        completed_at: null,
        ai_count_value: null,
        assigned_date: today.toISOString().split('T')[0], // Update to today
      });
      resetCount++;
    });

    if (resetCount > 0) {
      await resetBatch.commit();
      console.log(`✅ Reset ${resetCount} task assignments`);
    }

    // STEP 3: Send push notifications to all users
    console.log('🔔 Sending daily reset notifications...');
    const membersSnapshot = await db
      .collection('members')
      .where('status', '==', 'approved')
      .get();

    const notifications = [];
    let notificationCount = 0;

    for (const memberDoc of membersSnapshot.docs) {
      const member = memberDoc.data();
      const fcmToken = member.fcm_token;

      if (fcmToken) {
        const message = {
          notification: {
            title: '🌅 New Day Started!',
            body: "All your tasks have been refreshed. Let's make today productive!",
          },
          data: {
            type: 'daily_reset',
            date: today.toISOString().split('T')[0],
          },
          token: fcmToken,
        };

        notifications.push(
          admin
            .messaging()
            .send(message)
            .catch((err) => {
              console.error(`Failed to send to ${memberDoc.id}:`, err.message);
            })
        );
        notificationCount++;
      }
    }

    if (notifications.length > 0) {
      await Promise.all(notifications);
      console.log(`✅ Sent ${notificationCount} daily reset notifications`);
    }

    // STEP 4: Delete data older than 1 year
    console.log('🗑️ Cleaning up old data (>1 year)...');
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoTimestamp = admin.firestore.Timestamp.fromDate(oneYearAgo);

    const oldDataSnapshot = await db
      .collection('task_history')
      .where('archived_at', '<', oneYearAgoTimestamp)
      .limit(500) // Process in batches to avoid timeout
      .get();

    if (!oldDataSnapshot.empty) {
      const deleteBatch = db.batch();
      let deleteCount = 0;

      oldDataSnapshot.forEach((doc) => {
        deleteBatch.delete(doc.ref);
        deleteCount++;
      });

      await deleteBatch.commit();
      console.log(`✅ Deleted ${deleteCount} old records (>1 year)`);
    } else {
      console.log('No old data to delete');
    }

    console.log('✨ Daily reset completed successfully!');

    return res.status(200).json({
      success: true,
      archived: archivedCount,
      reset: resetCount,
      notifications: notificationCount,
      message: 'Daily reset completed successfully',
    });
  } catch (error: any) {
    console.error('❌ Error in daily reset:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
