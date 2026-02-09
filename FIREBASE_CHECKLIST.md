# Firebase Setup Checklist

Use this checklist to ensure your Firebase setup is complete.

## ☐ Step 1: Create Firebase Project

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Add project" or "Create a project"
- [ ] Enter project name
- [ ] Complete project creation
- [ ] Note down your Project ID: `___________________`

## ☐ Step 2: Register Web App

- [ ] Click the Web icon (`</>`) in Firebase Console
- [ ] Enter app nickname
- [ ] Click "Register app"
- [ ] Copy Firebase configuration values:
  - [ ] API Key: `___________________`
  - [ ] Auth Domain: `___________________`
  - [ ] Project ID: `___________________`
  - [ ] Storage Bucket: `___________________`
  - [ ] Messaging Sender ID: `___________________`
  - [ ] App ID: `___________________`

## ☐ Step 3: Update Environment Variables

- [ ] Open `.env` file in project root
- [ ] Replace all `VITE_FIREBASE_*` values with your Firebase config
- [ ] Save the file
- [ ] Verify no placeholder values remain

## ☐ Step 4: Enable Authentication

- [ ] Go to **Build** → **Authentication** in Firebase Console
- [ ] Click "Get started"
- [ ] Go to "Sign-in method" tab
- [ ] Enable **Email/Password** authentication
- [ ] Click "Save"

## ☐ Step 5: Create Firestore Database

- [ ] Go to **Build** → **Firestore Database**
- [ ] Click "Create database"
- [ ] Choose **Start in production mode**
- [ ] Select your location
- [ ] Click "Enable"
- [ ] Wait for database to be created

## ☐ Step 6: Set Up Security Rules

- [ ] In Firestore Database, go to **Rules** tab
- [ ] Copy security rules from `FIREBASE_SETUP_GUIDE.md`
- [ ] Paste into the Rules editor
- [ ] Click "Publish"
- [ ] Verify rules are published successfully

## ☐ Step 7: Create Admin User

### 7a. Create in Authentication
- [ ] Go to **Build** → **Authentication** → **Users**
- [ ] Click "Add user"
- [ ] Enter email: `yasirazimshaikh5440@gmail.com` (or your email)
- [ ] Enter a strong password
- [ ] Click "Add user"
- [ ] **IMPORTANT**: Copy the User UID: `___________________`

### 7b. Create Organization Document
- [ ] Go to **Firestore Database**
- [ ] Click "Start collection"
- [ ] Collection ID: `organizations`
- [ ] Click "Next"
- [ ] Document ID: Click "Auto-ID"
- [ ] Add fields:
  - [ ] `organization_name` (string): "My Organization"
  - [ ] `created_by_admin_id` (null): null
  - [ ] `created_at` (timestamp): Click timestamp icon
  - [ ] `updated_at` (timestamp): Click timestamp icon
- [ ] Click "Save"
- [ ] **IMPORTANT**: Copy the Document ID: `___________________`

### 7c. Create Member Document
- [ ] In Firestore Database, click "Start collection"
- [ ] Collection ID: `members`
- [ ] Click "Next"
- [ ] Document ID: Click "Auto-ID"
- [ ] Add fields:
  - [ ] `auth_user_id` (string): [paste User UID from 7a]
  - [ ] `organization_id` (string): [paste Organization ID from 7b]
  - [ ] `full_name` (string): "Admin User"
  - [ ] `email` (string): "yasirazimshaikh5440@gmail.com"
  - [ ] `role` (string): "admin"
  - [ ] `mobile_number` (string): "+918799132161"
  - [ ] `last_login_at` (null): null
  - [ ] `created_at` (timestamp): Click timestamp icon
  - [ ] `updated_at` (timestamp): Click timestamp icon
- [ ] Click "Save"

## ☐ Step 8: Create Firestore Indexes (Optional)

- [ ] Go to **Firestore Database** → **Indexes** tab
- [ ] Create index for members by organization
- [ ] Create index for tasks by organization
- [ ] Create index for task assignments by member and date
- [ ] Create index for task assignments by task

**Note**: You can skip this step initially. Firebase will prompt you to create indexes when needed.

## ☐ Step 9: Test Your Setup

- [ ] Open terminal in project directory
- [ ] Run: `npm install` (if not already done)
- [ ] Run: `npm run dev`
- [ ] Open browser to `http://localhost:5173`
- [ ] Try logging in with admin credentials
- [ ] Verify you can see the dashboard
- [ ] Try creating a test task
- [ ] Try creating a test member

## ☐ Step 10: Verify Everything Works

- [ ] Login works correctly
- [ ] Dashboard displays properly
- [ ] Can create new tasks
- [ ] Can create new members
- [ ] Can view members list
- [ ] Can view tasks list
- [ ] Can mark tasks as complete
- [ ] No console errors in browser

## 🎉 Completion

- [ ] All steps completed successfully
- [ ] Application is running on Firebase
- [ ] Admin user can log in
- [ ] All features are working

## 📝 Important Information to Save

**Firebase Project Details:**
- Project ID: `___________________`
- Project Name: `___________________`

**Admin Credentials:**
- Email: `___________________`
- Password: `___________________` (keep secure!)

**Organization ID:**
- Organization Document ID: `___________________`

**Admin User:**
- User UID: `___________________`
- Member Document ID: `___________________`

## 🐛 Troubleshooting

If something doesn't work:

1. **Check Environment Variables**
   - [ ] Restart dev server after changing `.env`
   - [ ] Verify all `VITE_FIREBASE_*` variables are set
   - [ ] No placeholder values remain

2. **Check Firebase Console**
   - [ ] Authentication is enabled
   - [ ] Firestore database is created
   - [ ] Security rules are published
   - [ ] User exists in Authentication
   - [ ] Member document exists in Firestore

3. **Check Browser Console**
   - [ ] Open Developer Tools (F12)
   - [ ] Check Console tab for errors
   - [ ] Look for Firebase-related errors

4. **Common Issues**
   - "Permission denied" → Check security rules
   - "User not found" → Create user in Authentication
   - "Cannot read properties of null" → Check member document exists
   - "Invalid credentials" → Verify email and password

## 📚 Reference Documents

- `FIREBASE_SETUP_GUIDE.md` - Detailed setup instructions
- `FIREBASE_QUICK_REFERENCE.md` - How to use Firebase
- `MIGRATION_SUMMARY.md` - What changed from Supabase
- `README.md` - Project documentation

---

**Good luck with your Firebase setup!** 🚀
