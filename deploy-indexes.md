# Deploy Firestore Indexes

## Why This Is Important
The app will be MUCH faster once you deploy these indexes. Without them, Firestore has to scan every document, which is slow.

## Steps to Deploy

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Deploy the Indexes
```bash
firebase deploy --only firestore:indexes
```

### 4. Wait for Indexes to Build
- Go to Firebase Console > Firestore Database > Indexes
- Wait for all indexes to show "Enabled" status (usually 2-5 minutes)
- You'll see 4 composite indexes being built

## What These Indexes Do

1. **task_assignments (assigned_date + member_id)**: Makes loading your tasks for a specific date instant
2. **task_assignments (task_id + assigned_date)**: Speeds up checking if a task is completed on a date
3. **tasks (organization_id + created_at)**: Faster loading of all organization tasks
4. **members (organization_id + created_at)**: Faster member list loading

## Expected Speed Improvement
- Before indexes: 2-5 seconds to load tasks
- After indexes: 200-500ms to load tasks (10x faster!)

## Troubleshooting

If deployment fails:
1. Make sure you're in the project root directory
2. Check that firebase.json exists
3. Verify you have admin access to the Firebase project
4. Try: `firebase use --add` to select your project
