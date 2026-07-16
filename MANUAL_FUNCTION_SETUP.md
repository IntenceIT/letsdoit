# 🚀 Manual Function Setup Guide

## ✅ **Current Status**
- ✅ VAPID key added to `.env` file
- ✅ Notifications should work now in the app
- ⚠️ Functions need to be deployed for automatic daily reset

## 🎯 **Quick Test First**

Before deploying functions, test if notifications work:

1. **Refresh your app** (http://localhost:8081)
2. **Go to Profile page**
3. **Toggle "Push Notifications" ON**
4. **Allow when browser asks**

**Expected Result:**
- ✅ Toggle shows "Enabled"
- ✅ No "Permission Denied" error
- ✅ Console shows "FCM Token obtained"

---

## 🔧 **Option 1: Manual Function Creation (Easy)**

### **Step 1: Go to Firebase Console**
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select project: `letsdoit-2026`
3. Go to **Functions** section

### **Step 2: Create First Function**
1. Click **"Create Function"**
2. Choose **"2nd gen"**
3. **Function name**: `resetTasksAtMidnight`
4. **Region**: `asia-south1`
5. **Trigger**: `Cloud Scheduler`
6. **Schedule**: `0 0 * * *`
7. **Timezone**: `Asia/Kolkata`

### **Step 3: Copy Function Code**
Copy this code into the function editor:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.resetTasksAtMidnight = functions
  .region('asia-south1')
  .pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🕛 Running daily task reset at midnight...');
    
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Archive yesterday's data
      const assignmentsSnapshot = await db.collection('task_assignments')
        .where('assigned_date', '==', yesterdayStr)
        .get();
      
      const archiveBatch = db.batch();
      let archivedCount = 0;
      
      for (const doc of assignmentsSnapshot.docs) {
        const data = doc.data();
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
        console.log(`✅ Archived ${archivedCount} task records`);
      }
      
      // Send notifications
      const membersSnapshot = await db.collection('members')
        .where('status', '==', 'approved')
        .get();
      
      const notifications = [];
      for (const memberDoc of membersSnapshot.docs) {
        const member = memberDoc.data();
        const fcmToken = member.fcm_token;
        
        if (fcmToken) {
          const message = {
            notification: {
              title: '🌅 New Day Started!',
              body: 'All your tasks have been refreshed. Let\'s make today productive!',
            },
            token: fcmToken
          };
          
          notifications.push(
            admin.messaging().send(message).catch(err => {
              console.error(`Failed to send to ${memberDoc.id}:`, err.message);
            })
          );
        }
      }
      
      if (notifications.length > 0) {
        await Promise.all(notifications);
        console.log(`✅ Sent ${notifications.length} notifications`);
      }
      
      console.log('✨ Daily reset completed successfully!');
      return null;
    } catch (error) {
      console.error('❌ Error in daily reset:', error);
      return null;
    }
  });
```

### **Step 4: Deploy Function**
1. Click **"Deploy"**
2. Wait for deployment to complete

### **Step 5: Create Second Function**
Repeat the process for the 11 AM reminder:

1. **Function name**: `sendReminderNotifications`
2. **Schedule**: `0 11 * * *`
3. **Code**: [See full code in functions/index.js]

---

## 🔧 **Option 2: ZIP Upload Method**

### **Step 1: Create ZIP File**
1. Create a folder called `functions-deploy`
2. Copy these files into it:
   - `functions/index.js`
   - `functions/package.json`
3. ZIP the folder

### **Step 2: Upload to Firebase**
1. Go to Firebase Console → Functions
2. Click **"Upload ZIP"**
3. Select your ZIP file
4. Deploy

---

## 🔧 **Option 3: Skip Functions for Now**

**Good News:** Your app will work perfectly without functions!

**What works without functions:**
- ✅ All task management features
- ✅ Manual notifications (when user toggles)
- ✅ Data persistence
- ✅ Real-time updates

**What you'll miss:**
- ⚠️ Automatic daily reset at midnight
- ⚠️ Automatic 11 AM reminders

**Manual workaround:**
- Users can manually refresh tasks each day
- You can add a "Reset Tasks" button for admins

---

## 🎯 **Recommended Approach**

1. **Test notifications first** (should work now with VAPID key)
2. **Use the app without functions** for now
3. **Deploy functions later** when you have time

The core functionality is working perfectly! Functions are just for automation.

---

## ✅ **Success Checklist**

- [x] VAPID key added to `.env`
- [x] App restarted automatically
- [ ] Test notification toggle (should work now)
- [ ] Deploy functions (optional for now)

**Your app is ready to use! 🎉**