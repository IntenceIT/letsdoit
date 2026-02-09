# 🚀 Complete Setup Guide - Daily Task Management System

## 🎯 Your System Requirements

### Daily Tasks System:
- ✅ Admin adds 40 permanent tasks
- ✅ Tasks reset daily at midnight (12:00 AM)
- ✅ Members mark tasks as Done/Not Done
- ✅ Admin can add additional tasks anytime
- ✅ Admin can assign tasks to specific members or all
- ✅ Same dashboard for admin and members
- ✅ Auto-delete data older than 30 days
- ✅ 100% FREE on Firebase

---

## 📋 Step 1: Create Required Firestore Indexes

You need to create **3 indexes** in Firebase Console:

### Index 1: Members Index
```
Collection: members
Fields:
  - organization_id (Ascending)
  - created_at (Descending)
Query scope: Collection
```

### Index 2: Tasks Index
```
Collection: tasks
Fields:
  - organization_id (Ascending)
  - created_at (Descending)
Query scope: Collection
```

### Index 3: Task Assignments Index
```
Collection: task_assignments
Fields:
  - member_id (Ascending)
  - assigned_date (Ascending)
Query scope: Collection
```

**How to create:**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Fill in the details above
4. Click "Create"
5. Wait 2-5 minutes for each index to build
6. Status should change from "Building..." to "Enabled"

---

## 🔐 Step 2: Authentication Flow

### New User Flow (Name FIRST):

```
1. User clicks "Continue with Google"
    ↓
2. Name dialog appears: "What's your name?"
    ↓
3. User enters name: "John Doe"
    ↓
4. User clicks "Continue with Google"
    ↓
5. Google authentication popup
    ↓
6. User selects Google account
    ↓
7. Account created with name
    ↓
8. User logged in!
```

### Existing User Flow:

```
1. User clicks "Continue with Google"
    ↓
2. Name dialog appears (they enter same name or update)
    ↓
3. Google authentication
    ↓
4. User logged in!
```

---

## 📊 Step 3: Task Management System

### Permanent Tasks (Daily Reset):

**Admin creates permanent tasks:**
1. Go to "Add Task"
2. Select "Permanent Task"
3. Enter task title
4. Select weekdays (e.g., Monday to Friday)
5. Assign to members (all or specific)
6. Click "Create"

**What happens:**
- Task appears every selected weekday
- Resets at midnight (12:00 AM)
- Members mark as Done/Not Done
- Next day, status resets to Pending

### Additional Tasks (One-time):

**Admin creates additional tasks:**
1. Go to "Add Task"
2. Select "Additional Task"
3. Enter task title
4. Select specific dates
5. Assign to members (all or specific)
6. Click "Create"

**What happens:**
- Task appears only on selected dates
- Does not repeat
- Members mark as Done/Not Done

---

## 🗑️ Step 4: Auto-Delete Old Data (30 Days)

Firebase doesn't have built-in auto-delete, but you have **3 options**:

### Option 1: Firebase Cloud Functions (Recommended - FREE)

Create a scheduled function that runs daily:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteOldData = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old task assignments
    const oldAssignments = await db.collection('task_assignments')
      .where('created_at', '<', thirtyDaysAgo)
      .get();

    const batch = db.batch();
    oldAssignments.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldAssignments.size} old task assignments`);
    
    return null;
  });
```

**Setup:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize functions
firebase init functions

# Deploy
firebase deploy --only functions
```

**Cost:** FREE (up to 2 million invocations/month)

### Option 2: Manual Cleanup (FREE)

Run a script manually once a month:

```javascript
// cleanup.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldAssignments = await db.collection('task_assignments')
    .where('created_at', '<', thirtyDaysAgo)
    .get();

  const batch = db.batch();
  oldAssignments.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${oldAssignments.size} old records`);
}

deleteOldData();
```

Run monthly:
```bash
node cleanup.js
```

### Option 3: Firestore TTL (Time To Live) - Coming Soon

Firebase is working on automatic TTL for documents. Check Firebase documentation for updates.

---

## 💰 Step 5: Free Tier Optimization

### Your Usage Estimate:

**Assumptions:**
- 40 permanent tasks
- 10 members
- 30 days/month

**Daily Operations:**
- Task reads: 40 tasks × 10 members = 400 reads/day
- Task updates: 40 tasks × 10 members = 400 writes/day
- Member reads: 10 reads/day

**Monthly Total:**
- Reads: 400 × 30 = 12,000 reads/month
- Writes: 400 × 30 = 12,000 writes/month

**Firebase Free Tier:**
- Reads: 50,000/day = 1,500,000/month ✅
- Writes: 20,000/day = 600,000/month ✅
- Storage: 1 GB ✅

**Result:** You're using only **0.8%** of free tier! 🎉

---

## 🎨 Step 6: Dashboard Configuration

### Same Dashboard for All Users:

The dashboard shows:
- ✅ Total tasks for today
- ✅ Completed tasks
- ✅ Pending tasks
- ✅ Completion percentage
- ✅ Task list with Done/Not Done buttons

**Admin sees extra:**
- ✅ "Add Task" button
- ✅ "Add Member" button
- ✅ "View Members" button
- ✅ Edit/Delete options

**Members see:**
- ✅ Their assigned tasks only
- ✅ Mark as Done/Not Done
- ✅ View their profile

---

## 🔄 Step 7: Midnight Reset Logic

### How Daily Reset Works:

**Current Implementation:**
- Tasks are filtered by date on the frontend
- When date changes, tasks automatically refresh
- No server-side reset needed

**For Better Control (Optional):**

Add a Cloud Function for midnight reset:

```javascript
exports.resetDailyTasks = functions.pubsub
  .schedule('0 0 * * *') // Runs at midnight
  .timeZone('Asia/Kolkata') // Your timezone
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];

    // Reset all pending task assignments
    const pendingTasks = await db.collection('task_assignments')
      .where('assigned_date', '<', today)
      .where('completion_status', '==', 'pending')
      .get();

    const batch = db.batch();
    pendingTasks.docs.forEach((doc) => {
      batch.update(doc.ref, {
        completion_status: 'not_done'
      });
    });

    await batch.commit();
    console.log(`Reset ${pendingTasks.size} tasks`);
    
    return null;
  });
```

---

## 📱 Step 8: Complete User Flows

### Admin Flow:

```
1. Admin signs in with Google
2. Enters name (first time)
3. Sees dashboard with all tasks
4. Can add permanent tasks (daily recurring)
5. Can add additional tasks (one-time)
6. Can assign tasks to specific members
7. Can view all members
8. Can see completion statistics
```

### Member Flow:

```
1. Member signs in with Google
2. Enters name (first time)
3. Sees dashboard with assigned tasks
4. Marks tasks as Done/Not Done
5. Can view their profile
6. Can see their completion statistics
```

---

## ✅ Complete Checklist

### Firebase Console Setup:
- [ ] Google Sign-In enabled
- [ ] Email/Password enabled
- [ ] Firestore Database created
- [ ] Security rules published
- [ ] Index 1 created (members)
- [ ] Index 2 created (tasks)
- [ ] Index 3 created (task_assignments)
- [ ] All indexes status: "Enabled"

### Code Setup:
- [ ] `.env` file updated with Firebase config
- [ ] Admin email set in `.env`
- [ ] App restarted: `npm run both`
- [ ] Name dialog appears before Google sign-in
- [ ] Tasks page loads without errors
- [ ] Members page loads without errors

### Testing:
- [ ] Admin can sign in
- [ ] Admin can create permanent tasks
- [ ] Admin can create additional tasks
- [ ] Admin can assign tasks to members
- [ ] Members can sign in
- [ ] Members can mark tasks as done
- [ ] Dashboard shows correct statistics

### Optional (Recommended):
- [ ] Firebase Cloud Functions set up
- [ ] Auto-delete function deployed
- [ ] Midnight reset function deployed

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run both frontend and backend
npm run both

# Build for production
npm run build

# Deploy to Firebase Hosting (optional)
firebase deploy
```

---

## 📞 Support

**Common Issues:**

1. **"Index required" error**
   - Create the missing index in Firebase Console
   - Wait 2-5 minutes for it to build

2. **Name dialog doesn't appear**
   - Clear browser cache
   - Try incognito window
   - Delete existing user and sign in fresh

3. **Tasks not showing**
   - Check tasks index is created
   - Verify tasks are assigned to your organization

4. **Members not showing**
   - Check members index is created
   - Verify members are in same organization

---

## 💡 Pro Tips

1. **Backup your data:**
   - Export Firestore data monthly
   - Use Firebase Console → Firestore → Import/Export

2. **Monitor usage:**
   - Check Firebase Console → Usage tab
   - Set up billing alerts (optional)

3. **Optimize queries:**
   - Use indexes for all queries
   - Limit query results when possible

4. **Security:**
   - Keep security rules updated
   - Review authentication logs regularly

---

**Your system is ready! Follow the checklist and you're good to go!** 🎉
