# 🚀 Quick Start - Push Notifications Setup

## ⚡ 5-Minute Setup

### 1. Get Firebase Keys (3 min)

**Service Account:**
- Firebase Console → Settings → Service Accounts → Generate new private key
- Copy: `project_id`, `client_email`, `private_key`

**VAPID Key:**
- Firebase Console → Cloud Messaging → Generate key pair
- Copy the key

### 2. Generate Cron Secret (30 sec)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Add to Vercel (1 min)
Vercel Dashboard → Settings → Environment Variables:
```env
VITE_FIREBASE_VAPID_KEY=BAbCdEfGhIjKlMnOpQrStUvWxYz...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\n-----END PRIVATE KEY-----\n"
CRON_SECRET=your_generated_secret
```

### 4. Deploy (30 sec)
```bash
git add .
git commit -m "Add notifications"
git push
```

## ✅ Done!

- **12 AM**: Tasks reset, notifications sent
- **7 PM**: Reminders sent to users with pending tasks
- **Cost**: $0/month forever
- **Works**: Like WhatsApp notifications

## 📱 Test It

1. Open app on mobile
2. Login
3. Allow notifications when prompted
4. Wait for 12 AM or 7 PM
5. Get notifications!

## 🔍 Verify

- Vercel → Cron Jobs → Should show 2 active crons
- Firebase → Firestore → `members` → Check `fcm_token` field
- Vercel → Logs → Filter "Cron" → See execution logs

## 💡 Features

✅ Native-like push notifications
✅ Daily task reset at 12 AM
✅ Personalized reminders at 7 PM
✅ 1-year data retention
✅ First-time permission prompt
✅ Profile toggle button
✅ 100% FREE forever

## 📚 Full Guide

See `COMPLETE_SETUP_GUIDE.md` for detailed instructions.

---

**That's it! Your app now has professional push notifications!** 🎉
