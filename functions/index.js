const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

/**
 * Scheduled Function: Reset all tasks at midnight (12:00 AM)
 * Runs every day at 00:00 (midnight) in Asia/Kolkata timezone
 */
exports.resetTasksAtMidnight = functions
  .region('asia-south1') // Mumbai region (closest to India)
  .pubsub
  .schedule('0 0 * * *') // Every day at 00:00 (midnight)
  .timeZone('Asia/Kolkata') // Indian Standard Time
  .onRun(async (context) => {
    console.log('🕛 Running daily task reset at midnight...');
    
    try {
      // Get all task assignments
      const assignmentsSnapshot = await db.collection('task_assignments').get();
      
      if (assignmentsSnapshot.empty) {
        console.log('No task assignments to reset');
        return null;
      }

      // Batch update all assignments to reset status
      const batch = db.batch();
      let resetCount = 0;

      assignmentsSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          completion_status: 'pending',
          completed_at: null,
          ai_count_value: null
        });
        resetCount++;
      });

      await batch.commit();
      console.log(`✅ Successfully reset ${resetCount} task assignments`);
      
      return null;
    } catch (error) {
      console.error('❌ Error resetting tasks:', error);
      return null;
    }
  });

/**
 * Scheduled Function: Send notifications at 7:00 PM
 * Runs every day at 19:00 (7:00 PM) in Asia/Kolkata timezone
 */
exports.sendReminderNotifications = functions
  .region('asia-south1')
  .pubsub
  .schedule('0 19 * * *') // Every day at 19:00 (7:00 PM)
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🔔 Sending reminder notifications at 7:00 PM...');
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all approved members
      const membersSnapshot = await db.collection('members')
        .where('status', '==', 'approved')
        .get();
      
      if (membersSnapshot.empty) {
        console.log('No approved members found');
        return null;
      }

      // For each member, check their pending tasks
      const notifications = [];
      
      for (const memberDoc of membersSnapshot.docs) {
        const member = memberDoc.data();
        const memberId = memberDoc.id;
        
        // Get member's task assignments for today
        const assignmentsSnapshot = await db.collection('task_assignments')
          .where('member_id', '==', memberId)
          .where('assigned_date', '==', today)
          .where('completion_status', '!=', 'completed')
          .get();
        
        if (!assignmentsSnapshot.empty) {
          const pendingTasks = [];
          
          // Get task details for each pending assignment
          for (const assignmentDoc of assignmentsSnapshot.docs) {
            const assignment = assignmentDoc.data();
            const taskDoc = await db.collection('tasks').doc(assignment.task_id).get();
            
            if (taskDoc.exists) {
              pendingTasks.push(taskDoc.data().task_title);
            }
          }
          
          if (pendingTasks.length > 0) {
            // Get FCM token for this member (if they have one)
            const fcmToken = member.fcm_token;
            
            if (fcmToken) {
              const message = {
                notification: {
                  title: `⏰ ${pendingTasks.length} Task${pendingTasks.length > 1 ? 's' : ''} Remaining`,
                  body: `You have pending tasks:\n${pendingTasks.slice(0, 3).join(', ')}${pendingTasks.length > 3 ? '...' : ''}`,
                },
                data: {
                  type: 'task_reminder',
                  count: pendingTasks.length.toString(),
                  tasks: JSON.stringify(pendingTasks)
                },
                token: fcmToken
              };
              
              notifications.push(admin.messaging().send(message));
            }
          }
        }
      }
      
      // Send all notifications
      if (notifications.length > 0) {
        await Promise.all(notifications);
        console.log(`✅ Sent ${notifications.length} reminder notifications`);
      } else {
        console.log('No notifications to send (no pending tasks or no FCM tokens)');
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      return null;
    }
  });

/**
 * HTTP Function: Manually trigger task reset (for testing)
 */
exports.manualResetTasks = functions
  .region('asia-south1')
  .https
  .onRequest(async (req, res) => {
    try {
      const assignmentsSnapshot = await db.collection('task_assignments').get();
      const batch = db.batch();
      let resetCount = 0;

      assignmentsSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          completion_status: 'pending',
          completed_at: null,
          ai_count_value: null
        });
        resetCount++;
      });

      await batch.commit();
      res.json({ success: true, message: `Reset ${resetCount} tasks` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
