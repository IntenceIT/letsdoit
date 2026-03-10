# 🚀 Complete Setup Guide - FREE Push Notifications & Auto Task Reset

## ✅ What You're Getting (100% FREE Forever!)

1. **Push Notifications** - Native app-like notifications on mobile
2. **12 AM Daily Reset** - Auto-reset tasks, archive data, send notifications
3. **7 PM Reminders** - Personalized notifications for incomplete tasks
4. **1-Year Data Retention** - Auto-delete data older than 365 days

**Cost: $0/month forever** (using Vercel Cron + Firebase Spark plan)

---

## 📋 Prerequisites

- Firebase project (Spark/Free plan)
- Vercel account (free)
- Your app deployed on Vercel

---

## 🔧 Step-by-Step Setup (20 minutes)

### Step 1: Get Firebase Service Account Key (5 min)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ Settings → Project Settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Open the JSON file and copy these values:
   - `project_id`
   - `client_email`
   - `private_key`

### Step 2: Get Firebase VAPID Key (2 min)

1. In Firebase Console → Project Settings
2. Click "Cloud Messaging" tab
3. Scroll to "Web Push certificates"
4. Click "Generate key pair"
5. Copy the key (starts with "B...")

### Step 3: Generate Cron Secret (1 min)

Run this command to generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output.

### Step 4: Add Environment Variables to Vercel (5 min)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```env
# Firebase Config (already have these)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# NEW: Firebase VAPID Key for Push Notifications
VITE_FIREBASE_VAPID_KEY=BAbCdEfGhIjKlMnOpQrStUvWxYz...

# NEW: Firebase Admin SDK (from service account JSON)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"

# NEW: Cron Job Security
CRON_SECRET=your_generated_secret_from_step_3
```

**Important:** 
- For `FIREBASE_PRIVATE_KEY`, keep the quotes and `\n` characters
- Make sure all variables are added to "Production", "Preview", and "Development" environments

### Step 5: Deploy to Vercel (2 min)

```bash
# Commit your changes
git add .
git commit -m "Add push notifications and cron jobs"
git push

# Vercel will auto-deploy
```

Or manually deploy:
```bash
vercel --prod
```

### Step 6: Enable Cron Jobs in Vercel (2 min)

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Cron Jobs"
3. You should see:
   - `/api/cron/reset-tasks` - Runs at 12:00 AM IST (18:30 UTC)
   - `/api/cron/send-reminders` - Runs at 7:00 PM IST (13:30 UTC)
4. Both should show as "Active"

### Step 7: Test Notifications (3 min)

1. Open your app on mobile browser
2. Login as a user
3. You'll see a popup: "Stay on Track! 🎯"
4. Click "Enable Notifications"
5. Browser asks: "Allow notifications?"
6. Click "Allow"
7. Done! You'll receive notifications

**Test manually:**
```bash
# Test 12 AM reset
curl -X GET https://your-app.vercel.app/api/cron/reset-tasks \
  -H "Authorization: Bearer your_cron_secret"

# Test 7 PM reminders
curl -X GET https://your-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer your_cron_secret"
```

---

## 📱 User Experience

### First Time Login:
1. User logs in
2. After 2 seconds, popup appears: "Stay on Track! 🎯"
3. User clicks "Enable Notifications"
4. Browser asks permission
5. User clicks "Allow"
6. Done! They'll receive notifications

### Daily at 12:00 AM:
```
🔔 Notification appears on phone
┌─────────────────────────────────┐
│ 🌅 New Day Started!             │
│ All your tasks have been        │
│ refreshed. Let's make today     │
│ productive!                     │
└─────────────────────────────────┘
```

### Daily at 7:00 PM (if user has pending tasks):
```
🔔 Notification appears on phone
┌─────────────────────────────────┐
│ ⏰ Hi Rahul! 3 Tasks Pending    │
│ Don't forget: Morning Exercise, │
│ Team Meeting, Code Review       │
└─────────────────────────────────┘
```

### Managing Notifications:
- Go to Profile page
- Toggle "Push Notifications" switch
- Enable/disable anytime

---

## 🔍 Verify Everything Works

### Check Cron Jobs:
1. Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → "Functions"
3. You should see:
   - `api/cron/reset-tasks.ts`
   - `api/cron/send-reminders.ts`

### Check Logs:
1. Vercel Dashboard → Your Project → Logs
2. Filter by "Cron"
3. You'll see execution logs at 12 AM and 7 PM

### Check Firestore:
1. Firebase Console → Firestore Database
2. Collections:
   - `task_assignments` - Current tasks
   - `task_history` - Archived data (appears after first midnight)
   - `members` - Check `fcm_token` field (appears after user enables notifications)

---

## 🐛 Troubleshooting

### Notifications not working?

**Check 1: VAPID Key**
```bash
# In browser console (F12)
console.log(import.meta.env.VITE_FIREBASE_VAPID_KEY)
# Should show: BAbCdEfGhIjKlMnOpQrStUvWxYz...
```

**Check 2: FCM Token**
```bash
# In Firestore, check member document
# Should have: fcm_token: "dAbCdEfGhIjKlMnOpQrStUvWxYz..."
```

**Check 3: Browser Permission**
- Open browser settings
- Search for "Notifications"
- Make sure your site is "Allowed"

### Cron jobs not running?

**Check 1: Environment Variables**
```bash
# Vercel Dashboard → Settings → Environment Variables
# Verify all variables are set
```

**Check 2: Cron Schedule**
```bash
# vercel.json should have:
"crons": [
  {
    "path": "/api/cron/reset-tasks",
    "schedule": "30 18 * * *"  // 12:00 AM IST
  },
  {
    "path": "/api/cron/send-reminders",
    "schedule": "30 13 * * *"  // 7:00 PM IST
  }
]
```

**Check 3: Logs**
```bash
# Vercel Dashboard → Logs
# Filter by "Cron" to see execution logs
```

### Firebase Admin errors?

**Check 1: Service Account**
```bash
# Make sure FIREBASE_PRIVATE_KEY has \n characters
# Example: "-----BEGIN PRIVATE KEY-----\nYour\nKey\n-----END PRIVATE KEY-----\n"
```

**Check 2: Permissions**
```bash
# Firebase Console → Project Settings → Service Accounts
# Make sure service account has "Firebase Admin SDK" role
```

---

## 💰 Cost Breakdown

### Vercel (FREE Forever):
- ✅ 100 GB bandwidth/month
- ✅ 100 hours serverless functions
- ✅ Unlimited cron jobs
- Your usage: ~1 hour/month
- **Cost: $0/month** ✅

### Firebase Spark Plan (FREE Forever):
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ UNLIMITED push notifications
- Your usage: ~1,000 operations/day
- **Cost: $0/month** ✅

### Total Cost: **$0/month forever!** 🎉

---

## 📊 What Happens Daily

### At 12:00 AM (Midnight):
1. ✅ Archives yesterday's task data to `task_history`
2. ✅ Resets all tasks to "not done" (pending)
3. ✅ Updates `assigned_date` to today
4. ✅ Sends "New Day Started!" notification to all users
5. ✅ Deletes records older than 1 year from `task_history`

### At 7:00 PM (Evening):
1. ✅ Checks each user's tasks for today
2. ✅ Finds incomplete tasks
3. ✅ Sends personalized notification with task names
4. ✅ Only sends if user has pending tasks
5. ✅ Only sends if user has enabled notifications

---

## 🎉 Success Checklist

- [ ] Firebase service account key added to Vercel
- [ ] VAPID key added to Vercel
- [ ] Cron secret generated and added
- [ ] App deployed to Vercel
- [ ] Cron jobs showing as "Active" in Vercel
- [ ] Users can enable notifications in app
- [ ] FCM tokens appear in Firestore `members` collection
- [ ] Test notification works
- [ ] Cron jobs execute at scheduled times
- [ ] Logs show successful execution

---

## 🚀 You're Done!

Your app now has:
1. ✅ Native-like push notifications on mobile
2. ✅ Automatic daily task reset at 12 AM
3. ✅ Personalized evening reminders at 7 PM
4. ✅ 1-year data retention with auto-cleanup
5. ✅ All for FREE forever!

**Users will love the native app experience!** 📱✨
