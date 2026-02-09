# Firestore Rules Fix - Task Creation Permission Error

## Problem
You were getting "Missing or insufficient permissions" error when trying to add tasks because:

1. Your Firestore security rules check if the user is an admin by looking up their member document
2. The rules use `request.auth.uid` to find the member document
3. But your member documents were using auto-generated IDs, not the `auth_user_id` as the document ID
4. This mismatch meant the rules couldn't find the member document to check admin status

## Solution
We've made two key changes:

### 1. Updated Member Document Structure
- Changed `membersService.create()` to use `auth_user_id` as the document ID (instead of auto-generated ID)
- Updated `getByAuthUserId()` to directly fetch by document ID (faster and simpler)
- This allows Firestore rules to check: `get(/databases/$(database)/documents/members/$(request.auth.uid))`

### 2. Updated Firestore Security Rules
The new rules properly check admin status:
```javascript
function isAdmin() {
  return isAuthenticated() &&
         exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
}
```

## Deployment Steps

### Step 1: Deploy the New Firestore Rules
Copy the contents of `firestore.rules` and paste them into your Firebase Console:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the new rules from `firestore.rules`
5. Click **Publish**

### Step 2: Handle Existing Members (If Any)

**Option A: If you have existing members in the database:**
You need to migrate them. The system will automatically create new members with the correct structure, but old members won't work. You have two choices:

1. **Delete existing members and re-register** (Simplest)
   - Go to Firestore Console → members collection
   - Delete all existing member documents
   - Have all users (including admin) sign in again with Google
   - New member documents will be created with correct structure

2. **Run migration script** (Preserves data)
   - Contact me if you need help with this

**Option B: If this is a fresh setup with no existing members:**
- Just deploy the rules and you're good to go!
- New members will automatically use the correct structure

## Testing

After deploying the rules:

1. Sign out from your app
2. Sign in again with your admin account
3. Try adding a task
4. It should work without permission errors!

## What Changed in Code

### firestore.ts
- `membersService.create()` now uses `setDoc()` with `auth_user_id` as document ID
- `getByAuthUserId()` now directly fetches by document ID (no query needed)

### firestore.rules
- `isAdmin()` function now correctly checks member document using `request.auth.uid`
- Tasks can only be created/updated/deleted by admins
- All authenticated users can read tasks and manage their own task assignments

## Future: Daily Task Reset at 12 AM

For your requirement to reset tasks daily at 12 AM, you'll need to:

1. Use Firebase Cloud Functions (scheduled function)
2. Or use the backend scheduler you already have in `backend/scheduler/taskScheduler.js`

Let me know if you want help setting up the daily reset functionality!
