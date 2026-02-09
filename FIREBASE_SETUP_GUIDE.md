# Firebase Setup Guide

This guide will help you set up Firebase for your Task Management application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "task-management-app")
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "Task Management Web")
3. Check "Also set up Firebase Hosting" if you want to deploy (optional)
4. Click "Register app"
5. Copy the Firebase configuration object - you'll need these values

## Step 3: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your-api-key-from-firebase"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## Step 4: Enable Firebase Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on the "Sign-in method" tab
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 5: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll set up rules next)
4. Select your Cloud Firestore location (choose closest to your users)
5. Click "Enable"

## Step 6: Set Up Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with the following:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to get user's organization
    function getUserOrg() {
      return get(/databases/$(database)/documents/members/$(request.auth.uid)).data.organization_id;
    }
    
    // Organizations collection
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update, delete: if isAdmin() && resource.data.id == getUserOrg();
    }
    
    // Members collection
    match /members/{memberId} {
      allow read: if isAuthenticated() && resource.data.organization_id == getUserOrg();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == memberId;
      allow delete: if isAdmin();
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && resource.data.organization_id == getUserOrg();
      allow create, update, delete: if isAdmin();
    }
    
    // Task assignments collection
    match /task_assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                      (resource.data.member_id == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
  }
}
\`\`\`

3. Click "Publish"

## Step 7: Create Firestore Collections

Firebase Firestore will automatically create collections when you add the first document. However, you need to understand the structure:

### Collections Structure:

1. **organizations**
   - `organization_name` (string)
   - `created_by_admin_id` (string, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **members**
   - `auth_user_id` (string) - Firebase Auth UID
   - `organization_id` (string) - Reference to organization
   - `full_name` (string)
   - `email` (string)
   - `role` (string) - "admin" or "member"
   - `mobile_number` (string, nullable)
   - `last_login_at` (timestamp, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. **tasks**
   - `organization_id` (string)
   - `task_title` (string)
   - `task_description` (string, nullable)
   - `remarks` (string, nullable)
   - `task_type` (string) - "permanent" or "additional"
   - `requires_ai_count` (boolean)
   - `weekdays` (array of strings, nullable) - ["Monday", "Tuesday", etc.]
   - `start_date` (string, nullable) - "YYYY-MM-DD"
   - `end_date` (string, nullable) - "YYYY-MM-DD"
   - `assigned_by_admin` (string, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **task_assignments**
   - `task_id` (string) - Reference to task
   - `member_id` (string) - Reference to member
   - `assigned_date` (string) - "YYYY-MM-DD"
   - `completion_status` (string) - "pending", "completed", or "not_done"
   - `ai_count_value` (string, nullable)
   - `completed_at` (timestamp, nullable)
   - `created_at` (timestamp)

## Step 8: Create Your First Admin User

### Method 1: Using Firebase Console (Recommended)

1. Go to **Build** → **Authentication** → **Users** tab
2. Click "Add user"
3. Enter email: `yasirazimshaikh5440@gmail.com`
4. Enter a password (remember this!)
5. Click "Add user"
6. Copy the **User UID** (you'll need this)

### Method 2: Create Admin User Manually in Firestore

1. Go to **Firestore Database**
2. Create a new collection called `organizations`:
   - Click "Start collection"
   - Collection ID: `organizations`
   - Add first document:
     - Document ID: Auto-ID
     - Fields:
       - `organization_name`: "My Organization" (string)
       - `created_by_admin_id`: null
       - `created_at`: (use timestamp)
       - `updated_at`: (use timestamp)
   - Click "Save"
   - **Copy the auto-generated Document ID** (this is your organization_id)

3. Create `members` collection:
   - Click "Start collection"
   - Collection ID: `members`
   - Add first document:
     - Document ID: Auto-ID
     - Fields:
       - `auth_user_id`: [paste the User UID from Authentication]
       - `organization_id`: [paste the organization Document ID]
       - `full_name`: "Admin User" (string)
       - `email`: "yasirazimshaikh5440@gmail.com" (string)
       - `role`: "admin" (string)
       - `mobile_number`: "+918799132161" (string)
       - `last_login_at`: null
       - `created_at`: (use timestamp)
       - `updated_at`: (use timestamp)
   - Click "Save"

## Step 9: Set Up Firestore Indexes (Optional but Recommended)

For better query performance, create these indexes:

1. Go to **Firestore Database** → **Indexes** tab
2. Click "Create index"
3. Create the following composite indexes:

**Index 1: Members by Organization**
- Collection: `members`
- Fields:
  - `organization_id` (Ascending)
  - `created_at` (Descending)

**Index 2: Tasks by Organization**
- Collection: `tasks`
- Fields:
  - `organization_id` (Ascending)
  - `created_at` (Descending)

**Index 3: Task Assignments by Member and Date**
- Collection: `task_assignments`
- Fields:
  - `member_id` (Ascending)
  - `assigned_date` (Ascending)

**Index 4: Task Assignments by Task**
- Collection: `task_assignments`
- Fields:
  - `task_id` (Ascending)
  - `assigned_date` (Descending)

## Step 10: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Try logging in with your admin credentials
4. If successful, you should see the dashboard!

## Troubleshooting

### "Permission denied" errors
- Check your Firestore security rules
- Ensure the user is authenticated
- Verify the member document exists with correct `auth_user_id`

### "Firebase: Error (auth/user-not-found)"
- Create the user in Firebase Authentication first
- Ensure email matches exactly

### "Cannot read properties of null"
- Ensure member document exists in Firestore
- Check that `auth_user_id` matches the Firebase Auth UID

### Environment variables not loading
- Restart your development server after changing `.env`
- Ensure variable names start with `VITE_`
- Check for typos in variable names

## Firebase Free Tier Limits

Firebase offers a generous free tier (Spark Plan):

### Firestore:
- **Stored data**: 1 GB
- **Document reads**: 50,000/day
- **Document writes**: 20,000/day
- **Document deletes**: 20,000/day

### Authentication:
- **Unlimited** users on free tier

### Bandwidth:
- **10 GB/month** outbound

These limits are more than enough for small to medium-sized applications. If you exceed these limits, Firebase will automatically upgrade you to the pay-as-you-go Blaze plan.

## Next Steps

1. ✅ Remove all Supabase-related files and folders
2. ✅ Test all features (login, tasks, members)
3. ✅ Deploy your application
4. Consider setting up Firebase Cloud Functions for scheduled tasks (if needed)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Firebase Console → **Build** → **Authentication** for auth issues
3. Check Firebase Console → **Build** → **Firestore Database** for data issues
4. Review the Firestore security rules

---

**Congratulations!** 🎉 Your application is now running on Firebase!
