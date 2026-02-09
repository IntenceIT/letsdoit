# How Admin Approves Users - Visual Guide 👨‍💼

## Admin View: Members Page

### Step 1: Go to Members Page
- Click on **Profile** (bottom nav)
- Click on **"Team Members"** button

### Step 2: See Pending Users
You'll see a button at the top:
```
┌─────────────────────────────────────┐
│  [Pending (2)]  [Bulk Delete]       │
└─────────────────────────────────────┘
```

Click **"Pending (2)"** to see users waiting for approval.

### Step 3: Approve or Reject

Each pending user shows:
```
┌─────────────────────────────────────────────┐
│  👤  John Doe                    [⚠️ Pending] │
│      john@example.com                       │
│      +1234567890                            │
│                              [✓]  [✗]       │
└─────────────────────────────────────────────┘
```

**Buttons:**
- **[✓] Green Checkmark** = Approve user (they can access app)
- **[✗] Red X** = Reject user (they cannot access app)

### Step 4: After Approval

User disappears from "Pending" list and appears in main members list:
```
┌─────────────────────────────────────────────┐
│  👤  John Doe                    [Admin]     │
│      john@example.com                       │
│      +1234567890                            │
│                    [💬]  [✏️]  [🗑️]         │
└─────────────────────────────────────────────┘
```

---

## User View: What They See

### Before Approval:
```
┌─────────────────────────────────────┐
│           ⏰                         │
│                                     │
│     Pending Approval                │
│                                     │
│  Your account is waiting for        │
│  admin approval                     │
│                                     │
│  Email: john@example.com            │
│  Name: John Doe                     │
│  Status: 🟡 Pending                 │
│                                     │
│  Please wait for an administrator   │
│  to approve your access.            │
│                                     │
│  [Sign Out]                         │
└─────────────────────────────────────┘
```

### After Approval:
User refreshes page → Goes to Dashboard automatically! ✅

---

## Admin Features in Members Page

### View All Members (Default View)
Shows all approved members with:
- Name and email
- Phone number (if provided)
- Admin badge (if admin)
- Actions: Send SMS, Edit, Delete

### View Pending Members
Click "Pending" button to see:
- All users waiting for approval
- Approve/Reject buttons
- User details

### Bulk Delete
- Click "Bulk Delete"
- Select multiple members
- Delete them all at once

---

## Status Badges

You'll see these badges on members:

**🔵 Admin** = Administrator (can manage everything)
**🟡 Pending** = Waiting for approval (only in pending view)

---

## Quick Actions

### Approve User:
1. Go to Members → Pending
2. Click green ✓
3. Done! User can access app

### Reject User:
1. Go to Members → Pending
2. Click red ✗
3. User cannot access app

### Edit Member:
1. Go to Members (main view)
2. Click pencil icon ✏️
3. Edit details

### Delete Member:
1. Go to Members (main view)
2. Click trash icon 🗑️
3. Confirm deletion

---

## Important Notes

### Auto-Approval:
- **Admin email** (from `.env`) is auto-approved
- **Regular users** need manual approval

### Cannot Delete:
- ❌ Cannot delete yourself
- ❌ Cannot delete other admins

### Notifications:
- User gets toast notification when approved
- Admin sees success message

---

## Example Workflow

### Scenario: New Employee Joins

**Day 1 - Morning:**
1. New employee signs in with Google
2. Sees "Pending Approval" screen
3. Contacts you (admin)

**Day 1 - You (Admin):**
1. Open app → Members → Pending
2. See new employee waiting
3. Click green ✓ to approve
4. Tell employee to refresh

**Day 1 - Employee:**
1. Refreshes page
2. Can now access dashboard
3. Can view and complete tasks!

---

## Security Features

✅ **Only authenticated users** can sign in
✅ **Only approved users** can access app
✅ **Only admin** can approve users
✅ **Only admin** can create/edit tasks
✅ **Firestore rules** enforce this (can't be bypassed)

---

**That's it! Simple and secure user approval system.** 🎉
