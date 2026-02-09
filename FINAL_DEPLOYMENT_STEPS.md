# Final Deployment Steps - User Approval System 🚀

## What You're Getting:
✅ Admin must approve users before they can access the app
✅ Users see "Pending Approval" screen while waiting
✅ Admin sees pending users and can approve/reject them
✅ Only approved users can view tasks
✅ Only admin can create/edit/delete tasks
✅ Maximum security

---

## Step 1: Deploy Firestore Rules (5 minutes)

### 1.1 Open Firebase Console
Go to: https://console.firebase.google.com

### 1.2 Navigate to Rules
- Select your project
- Click **Firestore Database** (left sidebar)
- Click **Rules** tab (top)

### 1.3 Replace Rules
- Delete everything in the editor
- Copy the rules from `USER_APPROVAL_SYSTEM.md` (or below)
- Paste into the editor
- Click **Publish**

**Rules to paste:**
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isApprovedMember() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.status == 'approved';
    }
    
    function isAdmin() {
      return isApprovedMember() &&
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }

    match /organizations/{orgId} {
      allow read: if isApprovedMember();
      allow write: if isAdmin();
    }

    match /members/{memberId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == memberId;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /tasks/{taskId} {
      allow read: if isApprovedMember();
      allow create, update, delete: if isAdmin();
    }

    match /task_assignments/{assignmentId} {
      allow read: if isApprovedMember();
      allow create, update: if isApprovedMember();
      allow delete: if isAdmin();
    }
  }
}
```

---

## Step 2: Clean Database (2 minutes)

### 2.1 Go to Data Tab
- In Firebase Console
- Click **Data** tab (next to Rules)

### 2.2 Delete Members Collection
- Find `members` collection
- Click on it
- Delete ALL documents inside
- (Click the 3 dots → Delete on each document)

### 2.3 Delete Organizations (Optional)
- Find `organizations` collection
- Delete all documents
- (Will be recreated automatically)

**Why?** Old members use wrong structure. New ones will be created correctly.

---

## Step 3: Test the System (10 minutes)

### 3.1 Test as Admin
1. **Sign out** from your app
2. **Sign in** with your admin email (from `.env` file)
3. Should go directly to **Dashboard** ✅ (auto-approved)
4. Try **adding a task** - should work! ✅
5. Go to **Members** page
6. Click **"Pending"** button (top right)

### 3.2 Test as Regular User
1. Open app in **incognito/private window**
2. **Sign in** with a different Google account
3. Should see **"Pending Approval"** screen ✅
4. Cannot access dashboard/tasks ✅

### 3.3 Test Approval Flow
1. Back to admin window
2. Go to **Members** → Click **"Pending"**
3. You should see the new user waiting
4. Click **green checkmark (✓)** to approve
5. Go back to user window
6. **Refresh the page**
7. User should now access the app! ✅

---

## Step 4: Verify Everything Works

### Admin Can:
- ✅ Add tasks
- ✅ Edit tasks
- ✅ Delete tasks
- ✅ See all members
- ✅ Approve/reject users
- ✅ Mark tasks as done/not done

### Regular User Can (After Approval):
- ✅ View tasks
- ✅ Mark tasks as done/not done
- ✅ View their profile
- ❌ Cannot add/edit/delete tasks
- ❌ Cannot see members page

### Pending User Can:
- ✅ Sign in
- ✅ See pending approval screen
- ❌ Cannot access anything else

---

## Troubleshooting

### Issue: "Missing or insufficient permissions" when adding task
**Solution:** 
- Make sure you published the rules
- Sign out and sign in again
- Check that your email matches `.env` VITE_ADMIN_EMAIL

### Issue: Admin sees "Pending Approval" screen
**Solution:**
- Check `.env` file has correct admin email
- Delete member document and sign in again
- Admin should be auto-approved

### Issue: Can't approve users
**Solution:**
- Make sure you're signed in as admin
- Check Firestore rules are published
- Refresh the page

### Issue: User still pending after approval
**Solution:**
- User needs to refresh their page
- Check Firestore Data → members → verify status is 'approved'

---

## What Happens Now:

### New User Flow:
1. User signs in with Google
2. Member document created with `status: 'pending'`
3. User sees "Pending Approval" screen
4. Admin approves
5. Status changes to `'approved'`
6. User refreshes → Full access!

### Admin Flow:
1. Admin signs in
2. Auto-approved (status: 'approved', role: 'admin')
3. Full access immediately
4. Can approve other users

---

## Code Changes Summary (Already Done ✅)

I've already updated these files:
- ✅ `src/integrations/firebase/types.ts` - Added status field
- ✅ `src/integrations/firebase/firestore.ts` - Use auth_user_id as doc ID
- ✅ `src/contexts/AuthContext.tsx` - Auto-approve admin, pending for others
- ✅ `src/pages/PendingApproval.tsx` - New pending screen
- ✅ `src/pages/Members.tsx` - Approve/reject buttons
- ✅ `src/hooks/useMembers.ts` - Export Member type
- ✅ `src/App.tsx` - Routing for pending users

---

## Next Steps After This Works:

Once the approval system is working, we can add:
1. **Daily task reset at 12 AM** (reset all tasks to "not done")
2. **7 PM notifications** (remind users about pending tasks)
3. **WhatsApp integration** (send notifications via WhatsApp)

---

## Summary Checklist:

- [ ] Deploy Firestore rules
- [ ] Delete old members from database
- [ ] Sign out and sign in as admin
- [ ] Test adding a task (should work!)
- [ ] Test with another user (should see pending screen)
- [ ] Approve the user from Members page
- [ ] Verify user can now access app

**Once all checked, you're done!** 🎉

---

**Need help? Check the browser console for errors or let me know!**
