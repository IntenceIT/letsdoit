# 🔔 Push Notification Setup Checklist

## Quick Setup (15 minutes)

### ✅ Step 1: Upgrade to Blaze Plan (2 min)
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your project
- [ ] Click "Upgrade" → Choose "Blaze (Pay as you go)"
- [ ] Add payment card (won't charge - see cost guide)
- [ ] Confirm upgrade

**Cost: $0/month for your usage** (see FIREBASE_BLAZE_PLAN_GUIDE.md)

---

### ✅ Step 2: Enable Cloud Messaging API (1 min)
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Select your Firebase project
- [ ] Navigate to: APIs & Services → Library
- [ ] Search: "Firebase Cloud Messaging API"
- [ ] Click "Enable"

---

### ✅ Step 3: Get VAPID Key (2 min)
- [ ] Go to Firebase Console → Project Settings
- [ ] Click "Cloud Messaging" tab
- [ ] Scroll to "Web Push certificates"
- [ ] Click "Generate key pair"
- [ ] Copy the key (starts with "B...")

**Add to your `.env` file:**
```env
VITE_FIREBASE_VAPID_KEY=BAbCdEfGhIjKlMnOpQrStUvWxYz...
```

---

### ✅ Step 4: Deploy Cloud Functions (5 min)

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy functions
firebase deploy --only functions
```

**Expected output:**
```
✔ functions[resetTasksAtMidnight] Successful update operation.
✔ functions[sendReminderNotifications] Successful update operation.
✔ functions[manualResetTasks] Successful update operation.
```

---

### ✅ Step 5: Test Notifications (5 min)

#### Test 1: Request Permission
1. Open your app in browser
2. Login as a user
3. Browser will ask: "Allow notifications?"
4. Click "Allow"
5. Check browser console for: "FCM Token: ..."

#### Test 2: Manual Test (Optional)
```bash
# Trigger manual reset to test notifications
firebase functions:shell

# In the shell, run:
resetTasksAtMidnight()
```

Or use the HTTP endpoint:
```bash
# Get your function URL from Firebase Console
curl https://asia-south1-YOUR_PROJECT.cloudfunctions.net/manualResetTasks
```

---

## 🎯 What Happens After Setup

### Daily at 12:00 AM (Midnight):
1. ✅ Archives yesterday's task data
2. ✅ Resets all tasks to "not done"
3. ✅ Sends notification to all users:
   ```
   🌅 New Day Started!
   All your tasks have been refreshed. Let's make today productive!
   ```
4. ✅ Deletes data older than 1 year

### Daily at 7:00 PM (Evening):
1. ✅ Checks each user's incomplete tasks
2. ✅ Sends personalized notification:
   ```
   ⏰ Hi [Name]! 3 Tasks Pending
   Don't forget: Task 1, Task 2, Task 3
   ```
3. ✅ Only sends if user has pending tasks
4. ✅ Only sends if user has granted permission

---

## 🔍 Verify Setup

### Check Cloud Functions:
- [ ] Go to Firebase Console → Functions
- [ ] You should see 3 functions:
  - `resetTasksAtMidnight` (scheduled: 0 0 * * *)
  - `sendReminderNotifications` (scheduled: 0 19 * * *)
  - `manualResetTasks` (HTTP trigger)

### Check Firestore Collections:
- [ ] `task_assignments` - Current tasks
- [ ] `task_history` - Archived data (will populate after first midnight)
- [ ] `members` - Should have `fcm_token` field after users grant permission

### Check Logs:
```bash
# View function logs
firebase functions:log

# Or in Firebase Console → Functions → Logs
```

---

## 📱 User Experience

### First Time User:
1. User logs in
2. Browser asks: "Allow notifications?"
3. User clicks "Allow"
4. FCM token saved to their profile
5. They'll receive notifications from now on

### Daily Notifications:
- **12 AM**: Everyone gets "New day started" notification
- **7 PM**: Only users with pending tasks get personalized reminder

### Mobile Experience:
- Works on Android Chrome, iOS Safari (PWA)
- Notifications appear even when app is closed
- Clicking notification opens the app
- Native app-like experience!

---

## 🐛 Troubleshooting

### No notifications received?
1. Check if user granted permission (browser settings)
2. Check if `fcm_token` exists in member document
3. Check function logs: `firebase functions:log`
4. Verify Cloud Messaging API is enabled

### Functions not running?
1. Verify Blaze plan is active
2. Check function deployment: `firebase functions:list`
3. Check logs for errors: `firebase functions:log`

### Token not saving?
1. Check VAPID key in `.env` file
2. Verify Firebase config is correct
3. Check browser console for errors

---

## 💰 Cost Monitoring

### Set Budget Alerts:
- [ ] Firebase Console → Usage and billing
- [ ] Click "Set budget alerts"
- [ ] Set alerts at: $1, $5, $10
- [ ] Add your email

### Check Usage:
```bash
# View current month usage
firebase projects:list
firebase functions:log --limit 100
```

**Expected monthly cost: $0.00** ✅

---

## ✨ Success Criteria

You'll know everything works when:
- [ ] Users can grant notification permission
- [ ] FCM tokens appear in member documents
- [ ] 12 AM: All tasks reset, notifications sent
- [ ] 7 PM: Personalized reminders sent to users with pending tasks
- [ ] Old data (>1 year) gets deleted automatically
- [ ] Firebase Console shows $0.00 usage

---

## 🎉 You're Done!

Your app now has:
1. ✅ Native-like push notifications
2. ✅ Automatic daily task reset
3. ✅ Personalized evening reminders
4. ✅ 1-year data retention
5. ✅ All for FREE!

**Need help? Check the logs or Firebase Console for detailed information.**
