const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

/**
 * Scheduled Function: Archive yesterday's data, reset tasks, send notifications, cleanup old data
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
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // STEP 1: Archive yesterday's task completion data
      console.log('📦 Archiving yesterday\'s data...');
      const assignmentsSnapshot = await db.collection('task_assignments')
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
          original_assignment_id: doc.id
        });
        archivedCount++;
      }
      
      if (archivedCount > 0) {
        await archiveBatch.commit();
        console.log(`✅ Archived ${archivedCount} task records from ${yesterdayStr}`);
      }
      
      // STEP 2: Create new task assignments for today (don't update old ones)
      console.log('🔄 Creating new task assignments for today...');
      const todayStr = today.toISOString().split('T')[0];
      
      // Get all tasks
      const tasksSnapshot = await db.collection('tasks').get();
      
      // Get all approved members
      const approvedMembersSnapshot = await db.collection('members')
        .where('status', '==', 'approved')
        .get();
      
      const createBatch = db.batch();
      let createdCount = 0;
      
      // For each task, create assignments for today
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        
        // Check if task should be assigned today based on weekdays, dates, etc.
        const shouldAssignToday = true; // You can add logic here for weekday filtering
        
        if (shouldAssignToday) {
          // Check if task is assigned to specific members or all
          const targetMembers = task.assigned_members && task.assigned_members.length > 0
            ? approvedMembersSnapshot.docs.filter(m => task.assigned_members.includes(m.id))
            : approvedMembersSnapshot.docs;
          
          // Create assignment for each target member
          for (const memberDoc of targetMembers) {
            // Check if assignment already exists for today
            const existingAssignment = await db.collection('task_assignments')
              .where('task_id', '==', taskDoc.id)
              .where('member_id', '==', memberDoc.id)
              .where('assigned_date', '==', todayStr)
              .limit(1)
              .get();
            
            // Only create if doesn't exist
            if (existingAssignment.empty) {
              const newAssignmentRef = db.collection('task_assignments').doc();
              createBatch.set(newAssignmentRef, {
                task_id: taskDoc.id,
                member_id: memberDoc.id,
                assigned_date: todayStr,
                completion_status: 'pending',
                ai_count_value: null,
                completed_at: null,
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              createdCount++;
            }
          }
        }
      }
      
      if (createdCount > 0) {
        await createBatch.commit();
        console.log(`✅ Created ${createdCount} new task assignments for ${todayStr}`);
      } else {
        console.log('No new assignments needed (already exist for today)');
      }
      
      // STEP 3: Send push notifications to all users
      console.log('🔔 Sending daily reset notifications...');
      const membersSnapshot = await db.collection('members')
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
              body: 'All your tasks have been refreshed. Let\'s make today productive!',
            },
            data: {
              type: 'daily_reset',
              date: today.toISOString().split('T')[0]
            },
            token: fcmToken
          };
          
          notifications.push(
            admin.messaging().send(message).catch(err => {
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
      
      const oldDataSnapshot = await db.collection('task_history')
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
      return null;
    } catch (error) {
      console.error('❌ Error in daily reset:', error);
      return null;
    }
  });

/**
 * Scheduled Function: Send personalized notifications at 7:00 PM for incomplete tasks
 * Runs every day at 19:00 (7:00 PM) in Asia/Kolkata timezone
 */
exports.sendReminderNotifications = functions
  .region('asia-south1')
  .pubsub
  .schedule('0 19 * * *') // Every day at 19:00 (7:00 PM)
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🔔 Sending 7 PM reminder notifications...');
    
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

      let totalNotificationsSent = 0;
      let membersWithPendingTasks = 0;
      
      // For each member, check their pending tasks
      for (const memberDoc of membersSnapshot.docs) {
        const member = memberDoc.data();
        const memberId = memberDoc.id;
        const memberName = member.name || 'there';
        
        // Get member's incomplete task assignments for today
        const assignmentsSnapshot = await db.collection('task_assignments')
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
                title: taskData.task_title,
                type: taskData.task_type
              });
            }
          }
          
          if (pendingTasks.length > 0) {
            const fcmToken = member.fcm_token;
            
            if (fcmToken) {
              // Create personalized message
              const taskList = pendingTasks.slice(0, 3).map(t => t.title).join(', ');
              const moreText = pendingTasks.length > 3 ? ` and ${pendingTasks.length - 3} more` : '';
              
              const message = {
                notification: {
                  title: `⏰ Hi ${memberName}! ${pendingTasks.length} Task${pendingTasks.length > 1 ? 's' : ''} Pending`,
                  body: `Don't forget: ${taskList}${moreText}`,
                },
                data: {
                  type: 'evening_reminder',
                  member_id: memberId,
                  count: pendingTasks.length.toString(),
                  date: today,
                  tasks: JSON.stringify(pendingTasks)
                },
                token: fcmToken,
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    channelId: 'task_reminders'
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: pendingTasks.length
                    }
                  }
                }
              };
              
              try {
                await admin.messaging().send(message);
                totalNotificationsSent++;
                membersWithPendingTasks++;
                console.log(`✅ Sent to ${memberName}: ${pendingTasks.length} pending tasks`);
              } catch (err) {
                console.error(`❌ Failed to send to ${memberName} (${memberId}):`, err.message);
              }
            } else {
              console.log(`⚠️ ${memberName} has ${pendingTasks.length} pending tasks but no FCM token`);
            }
          }
        }
      }
      
      console.log(`✨ 7 PM Reminder Summary:`);
      console.log(`   - Total members checked: ${membersSnapshot.size}`);
      console.log(`   - Members with pending tasks: ${membersWithPendingTasks}`);
      console.log(`   - Notifications sent: ${totalNotificationsSent}`);
      
      return null;
    } catch (error) {
      console.error('❌ Error sending 7 PM notifications:', error);
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
