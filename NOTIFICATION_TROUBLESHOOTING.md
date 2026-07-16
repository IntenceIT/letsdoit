# 🔧 Notification Troubleshooting Guide

## 🔴 **"Permission Denied" Error - Even After Allowing**

### **Root Cause:**
The VAPID key is missing or incorrect in your `.env` file.

### **Quick Fix:**
1. **Get VAPID Key** (2 minutes):
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select project: `letsdoit-2026`
   - Project Settings → Cloud Messaging → Web Push certificates
   - Click "Generate key pair"
   - Copy the key (starts with "B...")

2. **Update `.env` file**:
   ```env
   VITE_FIREBASE_VAPID_KEY=BAbCdEfGhIjKlMnOpQrStUvWxYz...
   ```

3. **Restart your app** completely

---

## 🔴 **Toggle Button Not Working**

### **Symptoms:**
- Button is disabled/grayed out
- Clicking doesn't do anything
- Shows "Disabled" even after allowing

### **Fix Steps:**
1. **Check Browser Console** (F12):
   - Look for errors like "VAPID key not configured"
   - Look for "FCM Token obtained" message

2. **Clear Browser Data**:
   - Go to browser settings
   - Clear site data for your app
   - Refresh and try again

3. **Check Permission Status**:
   - Browser settings → Notifications
   - Make sure your site is "Allowed"

---

## 🔴 **Browser Permission Issues**

### **Android Chrome:**
- Settings → Site Settings → Notifications
- Find your app → Allow

### **iOS Safari:**
- Settings → Safari → Notifications
- Allow notifications for your site

### **Desktop Chrome:**
- Click lock icon in address bar
- Set Notifications to "Allow"

---

## ✅ **How to Test if Working**

### **Step 1: Check Permission**
1. Open browser console (F12)
2. Toggle notifications ON
3. Look for these messages:
   ```
   Notification permission granted
   FCM Token obtained: BAbCdEf...
   FCM token saved to member document
   ```

### **Step 2: Verify Database**
1. Go to Firebase Console → Firestore
2. Open your member document
3. Check if `fcm_token` field exists and has a value

### **Step 3: Test Notification**
```bash
# Deploy functions first
firebase deploy --only functions

# Test manual trigger
curl https://asia-south1-letsdoit-2026.cloudfunctions.net/manualResetTasks
```

---

## 📱 **Mobile Browser Issues**

### **PWA Installation Required:**
Some mobile browsers require the app to be "installed" as PWA:

1. **Android Chrome:**
   - Tap menu → "Add to Home Screen"
   - Open from home screen (not browser)

2. **iOS Safari:**
   - Tap share → "Add to Home Screen"
   - Open from home screen

---

## 🕐 **Notification Schedule**

After setup, you'll receive:
- **12:00 AM**: Daily reset notification (everyone)
- **11:00 AM**: Pending tasks reminder (only if you have pending tasks)

---

## 🐛 **Common Error Messages**

### **"VAPID key not configured"**
- **Fix**: Add VAPID key to `.env` file and restart app

### **"Firebase messaging not available"**
- **Fix**: Check if you're using HTTPS (required for notifications)

### **"Failed to get FCM token"**
- **Fix**: Check Firebase project configuration

### **"Permission denied"**
- **Fix**: Clear browser data and allow notifications again

---

## ✨ **Success Indicators**

You'll know it's working when:
- ✅ Toggle button responds to clicks
- ✅ Browser console shows "FCM Token obtained"
- ✅ Firestore member document has `fcm_token` field
- ✅ No error messages in console
- ✅ Toggle shows "Enabled - Daily reminders at 12 AM & 11 AM"

---

## 🆘 **Still Not Working?**

1. **Check `.env` file** - Make sure VAPID key is there
2. **Restart app completely** - Close all tabs and reopen
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
4. **Try different browser** - Test in Chrome/Firefox
5. **Check Firebase Console** - Verify project settings

**Most issues are solved by adding the VAPID key and restarting the app!** 🎯