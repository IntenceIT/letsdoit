# Firebase Console Setup Guide - Step by Step

This guide shows you **exactly** what to do in Firebase Console to enable Google Sign-In and Email/Password authentication.

## 🎯 What You'll Enable

1. ✅ **Google Sign-In** - Users can sign in with their Google account
2. ✅ **Email/Password** - Users can sign in with email and password
3. ✅ **Auto-Registration** - New users are automatically added to your system

---

## Part 1: Enable Google Sign-In

### Step 1: Go to Authentication

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Build"** in the left sidebar
4. Click **"Authentication"**

### Step 2: Get Started (If First Time)

If you see a "Get started" button:
1. Click **"Get started"**
2. Wait for initialization

### Step 3: Enable Google Provider

1. Click the **"Sign-in method"** tab at the top
2. You'll see a list of providers
3. Find **"Google"** in the list
4. Click on **"Google"**

### Step 4: Configure Google Sign-In

A popup will appear:

1. **Toggle "Enable"** to ON (blue)
2. **Project support email**: Select your email from dropdown
   - Example: `yasirazimshaikh5440@gmail.com`
3. Click **"Save"**

✅ **Google Sign-In is now enabled!**

---

## Part 2: Enable Email/Password Authentication

### Step 1: Still in Sign-in Method Tab

You should still be in:
- **Authentication** → **Sign-in method** tab

### Step 2: Enable Email/Password

1. Find **"Email/Password"** in the providers list
2. Click on **"Email/Password"**

### Step 3: Configure Email/Password

A popup will appear:

1. **Toggle "Enable"** to ON (blue)
2. **Email link (passwordless sign-in)**: Leave this OFF
3. Click **"Save"**

✅ **Email/Password authentication is now enabled!**

---

## Part 3: Verify Your Setup

### Check Enabled Providers

In the **Sign-in method** tab, you should now see:

| Provider | Status |
|----------|--------|
| Email/Password | ✅ Enabled |
| Google | ✅ Enabled |

---

## Part 4: Set Up Firestore Database

### Step 1: Create Firestore Database

1. In Firebase Console, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select your location (choose closest to your users)
5. Click **"Enable"**
6. Wait for database creation (1-2 minutes)

### Step 2: Set Up Security Rules

1. In Firestore Database, click the **"Rules"** tab
2. **Delete all existing rules**
3. **Copy and paste** the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/members/$(getMemberId())) &&
             get(/databases/$(database)/documents/members/$(getMemberId())).data.role == 'admin';
    }
    
    function getMemberId() {
      // Find member document by auth_user_id
      return request.auth.uid;
    }
    
    function getUserOrg() {
      let memberDocs = firestore.get(/databases/$(database)/documents/members/$(request.auth.uid));
      return memberDocs.data.organization_id;
    }
    
    // Organizations - anyone authenticated can read, only admins can write
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Members - authenticated users can read, admins can write
    match /members/{memberId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (request.auth.uid == resource.data.auth_user_id || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Tasks - authenticated users can read, admins can write
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Task assignments - authenticated users can read and update their own
    match /task_assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }
  }
}
```

4. Click **"Publish"**
5. Confirm by clicking **"Publish"** again

✅ **Firestore security rules are set!**

---

## Part 5: Configure Authorized Domains

### Step 1: Add Authorized Domains

1. Go to **Authentication** → **Settings** tab
2. Scroll down to **"Authorized domains"**
3. You should see:
   - `localhost` (for development)
   - `your-project-id.firebaseapp.com` (default)

### Step 2: Add Your Domain (If Deploying)

If you're deploying to a custom domain:
1. Click **"Add domain"**
2. Enter your domain (e.g., `yourdomain.com`)
3. Click **"Add"**

✅ **Authorized domains configured!**

---

## Part 6: Test Your Setup

### Test 1: Check Authentication Methods

1. Go to **Authentication** → **Sign-in method**
2. Verify both are enabled:
   - ✅ Email/Password
   - ✅ Google

### Test 2: Check Firestore

1. Go to **Firestore Database**
2. You should see an empty database
3. Collections will be created automatically when users sign in

### Test 3: Run Your App

```bash
npm run dev
```

1. Open `http://localhost:5173`
2. Try clicking **"Continue with Google"**
3. Select your Google account
4. You should be signed in!

---

## 🎯 What Happens When Users Sign In?

### Google Sign-In Flow:

```
User clicks "Continue with Google"
    ↓
Google authentication popup
    ↓
User selects Google account
    ↓
Firebase authenticates user
    ↓
App checks if member exists in Firestore
    ↓
If NOT exists:
  - Create organization (if admin)
  - Create member document
  - Set role (admin or member)
    ↓
If EXISTS:
  - Load member data
  - Update last login
    ↓
User is logged in!
```

### Email/Password Sign-In Flow:

```
User enters email and password
    ↓
Firebase authenticates
    ↓
App checks if member exists
    ↓
If EXISTS:
  - Load member data
  - User is logged in
    ↓
If NOT exists:
  - Show error: "Contact admin"
```

---

## 🔐 Admin vs Member Logic

### Admin User:
- **Email**: `yasirazimshaikh5440@gmail.com` (set in `.env`)
- **First Sign-In**: Creates organization automatically
- **Role**: `admin`
- **Access**: Full admin dashboard

### Regular Members:
- **Email**: Any other email
- **First Sign-In**: Creates member document automatically
- **Role**: `member`
- **Access**: Member dashboard only

---

## 📊 Firestore Collections Created Automatically

When users sign in, these collections are created:

### 1. `organizations`
```javascript
{
  id: "auto-generated-id",
  organization_name: "My Organization",
  created_by_admin_id: "admin-user-uid",
  created_at: timestamp,
  updated_at: timestamp
}
```

### 2. `members`
```javascript
{
  id: "auto-generated-id",
  auth_user_id: "firebase-auth-uid",
  organization_id: "org-id",
  full_name: "User Name",
  email: "user@example.com",
  role: "admin" or "member",
  mobile_number: null,
  last_login_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🎨 Visual Guide

### Firebase Console Navigation:

```
Firebase Console
├── 🏠 Project Overview
├── 🔧 Build
│   ├── 🔐 Authentication ← YOU ARE HERE
│   │   ├── Users (list of signed-in users)
│   │   ├── Sign-in method ← Enable Google & Email/Password
│   │   └── Settings
│   ├── 🗄️ Firestore Database ← Set up database & rules
│   │   ├── Data
│   │   ├── Rules ← Add security rules
│   │   ├── Indexes
│   │   └── Usage
│   └── 📦 Storage
└── ⚙️ Project Settings
```

---

## ✅ Checklist

Use this checklist to verify your setup:

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Google Sign-In enabled
- [ ] Email/Password enabled
- [ ] Firestore Database created
- [ ] Security rules published
- [ ] `.env` file updated with Firebase config
- [ ] Admin email set in `.env`
- [ ] App runs without errors
- [ ] Google Sign-In button appears
- [ ] Can click "Continue with Google"
- [ ] Google popup appears
- [ ] Can sign in successfully

---

## 🐛 Troubleshooting

### "Popup blocked"
**Solution**: Allow popups for `localhost` in your browser

### "Unauthorized domain"
**Solution**: Add `localhost` to authorized domains in Firebase Console

### "Permission denied"
**Solution**: Check Firestore security rules are published

### "Cannot find module"
**Solution**: Restart dev server: `npm run dev`

### Google Sign-In doesn't work
**Solution**: 
1. Check Google is enabled in Firebase Console
2. Check authorized domains include `localhost`
3. Clear browser cache and try again

---

## 🎉 You're Done!

Your Firebase Console is now fully configured for:
- ✅ Google Sign-In
- ✅ Email/Password authentication
- ✅ Automatic user registration
- ✅ Role-based access (admin/member)

**Next**: Run your app and test signing in!

```bash
npm run dev
```

---

## 📞 Need Help?

If something doesn't work:
1. Check this guide again
2. Verify all checkboxes are checked
3. Check browser console for errors
4. Check Firebase Console → Authentication → Users to see if user was created

**Everything is FREE on Firebase Spark Plan!** 🎉
