# Firestore Rules - What To Replace

## Your Current Rules Have This Problem:
```javascript
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
}
```

This tries to find a member document using `request.auth.uid` as the document ID, but your member documents use random IDs, so it fails.

## Two Solutions:

---

## Solution 1: Simple Fix (No Approval System)
**Just fixes the task creation error**

Replace your entire Firestore rules with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    // Organizations
    match /organizations/{orgId} {
      allow read, write: if isAuthenticated();
    }

    // Members
    match /members/{memberId} {
      allow read, write: if isAuthenticated();
    }

    // Tasks
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated();
    }

    // Task assignments
    match /task_assignments/{assignmentId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

**Pros:**
- ✅ Fixes task creation immediately
- ✅ No code changes needed
- ✅ Works with your current database structure

**Cons:**
- ⚠️ Any authenticated user can write to database
- ⚠️ No admin-only restrictions
- ⚠️ Less secure

---

## Solution 2: Full Security + Approval System (Recommended)
**Fixes task creation + adds user approval**

Replace your entire Firestore rules with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user's member document exists and is approved
    function isApprovedMember() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.status == 'approved';
    }
    
    // Check if user is admin (must be approved first)
    function isAdmin() {
      return isApprovedMember() &&
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if isApprovedMember();
      allow write: if isAdmin();
    }

    // Members - special rules for approval flow
    match /members/{memberId} {
      // Anyone authenticated can read their own pending status
      allow read: if isAuthenticated();
      // Anyone authenticated can create their own member doc (for signup)
      allow create: if isAuthenticated() && request.auth.uid == memberId;
      // Only admin can update/delete
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Tasks - only approved members can read, only admin can write
    match /tasks/{taskId} {
      allow read: if isApprovedMember();
      allow create, update, delete: if isAdmin();
    }

    // Task assignments - only approved members
    match /task_assignments/{assignmentId} {
      allow read: if isApprovedMember();
      allow create, update: if isApprovedMember();
      allow delete: if isAdmin();
    }
  }
}
```

**Pros:**
- ✅ Maximum security
- ✅ Admin must approve new users
- ✅ Only admins can create/edit tasks
- ✅ Professional approach

**Cons:**
- ⚠️ Requires deleting existing members and signing in again
- ⚠️ Uses the code changes I made

**Additional Steps for Solution 2:**
1. Deploy the rules above
2. Go to Firestore Database → Data
3. Delete all documents in `members` collection
4. Sign out and sign in again
5. Admin is auto-approved, others need approval

---

## My Recommendation:

**Use Solution 2** because:
1. It's more secure
2. You get user approval system
3. It's what companies expect
4. I've already written all the code

But if you want quick fix right now, use Solution 1 and upgrade to Solution 2 later.

---

## How To Deploy:

1. Go to: https://console.firebase.google.com
2. Select your project
3. Click: **Firestore Database** → **Rules** tab
4. Delete everything in the editor
5. Paste one of the solutions above
6. Click **Publish**
7. Done! ✅

---

**Choose your solution and deploy it now!**
