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
 * Vercel Cron Job: Send personalized reminders at 7:00 PM
 * Schedule: 0 19 * * * (Every day at 19:00 UTC+5:30 IST)
 * 
 * This function:
 * 1. Checks each user's incomplete tasks for today
 * 2. Sends personalized notifications with their specific pending tasks
 * 3. Only sends if user has pending tasks and has granted permission
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

  console.log('🔔 Sending 7 PM reminder notifications...');

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get all approved members
    const membersSnapshot = await db
      .collection('members')
      .where('status', '==', 'approved')
      .get();

    if (membersSnapshot.empty) {
      console.log('No approved members found');
      return res.status(200).json({
        success: true,
        message: 'No approved members found',
      });
    }

    let totalNotificationsSent = 0;
    let membersWithPendingTasks = 0;

    // For each member, check their pending tasks
    for (const memberDoc of membersSnapshot.docs) {
      const member = memberDoc.data();
      const memberId = memberDoc.id;
      const memberName = member.full_name || 'there';

      // Get member's incomplete task assignments for today
      const assignmentsSnapshot = await db
        .collection('task_assignments')
        .where('member_id', '==', memberId)
        .where('assigned_date', '==', today)
        .where('completion_status', '==', 'pending') // Only pending tasks
        .get();

      if (!assignmentsSnapshot.empty) {
        const pendingTasks = [];

        // Get task details for each pending assignment
        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const assignment = assignmentDoc.data();
          const taskDoc = await db.collection('tasks').doc(assignment.task_id).get();

          if (taskDoc.exists) {
            const taskData = taskDoc.data();
            pendingTasks.push({
              title: taskData?.task_title || 'Untitled Task',
              type: taskData?.task_type || 'general',
            });
          }
        }

        if (pendingTasks.length > 0) {
          const fcmToken = member.fcm_token;

          if (fcmToken) {
            // Create personalized message
            const taskList = pendingTasks
              .slice(0, 3)
              .map((t) => t.title)
              .join(', ');
            const moreText =
              pendingTasks.length > 3 ? ` and ${pendingTasks.length - 3} more` : '';

            const message = {
              notification: {
                title: `⏰ Hi ${memberName}! ${pendingTasks.length} Task${
                  pendingTasks.length > 1 ? 's' : ''
                } Pending`,
                body: `Don't forget: ${taskList}${moreText}`,
              },
              data: {
                type: 'evening_reminder',
                member_id: memberId,
                count: pendingTasks.length.toString(),
                date: today,
                tasks: JSON.stringify(pendingTasks),
              },
              token: fcmToken,
              android: {
                priority: 'high' as const,
                notification: {
                  sound: 'default',
                  channelId: 'task_reminders',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: pendingTasks.length,
                  },
                },
              },
            };

            try {
              await admin.messaging().send(message);
              totalNotificationsSent++;
              membersWithPendingTasks++;
              console.log(`✅ Sent to ${memberName}: ${pendingTasks.length} pending tasks`);
            } catch (err: any) {
              console.error(`❌ Failed to send to ${memberName} (${memberId}):`, err.message);
            }
          } else {
            console.log(
              `⚠️ ${memberName} has ${pendingTasks.length} pending tasks but no FCM token`
            );
          }
        }
      }
    }

    console.log(`✨ 7 PM Reminder Summary:`);
    console.log(`   - Total members checked: ${membersSnapshot.size}`);
    console.log(`   - Members with pending tasks: ${membersWithPendingTasks}`);
    console.log(`   - Notifications sent: ${totalNotificationsSent}`);

    return res.status(200).json({
      success: true,
      totalMembers: membersSnapshot.size,
      membersWithPendingTasks,
      notificationsSent: totalNotificationsSent,
      message: '7 PM reminders sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error sending 7 PM notifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
