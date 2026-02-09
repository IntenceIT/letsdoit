# Firebase Quick Reference Guide

## 🔥 Firebase vs SQL - Key Differences

Firebase Firestore is a **NoSQL document database**, not a traditional SQL database. Here are the key differences:

### SQL vs Firestore Terminology

| SQL | Firestore |
|-----|-----------|
| Database | Project |
| Table | Collection |
| Row | Document |
| Column | Field |
| JOIN | Subcollection or Client-side join |
| Index | Composite Index |

### No SQL Queries in Firebase!

**Important**: Firebase Firestore does NOT use SQL queries. Instead, you use:
- JavaScript/TypeScript SDK methods
- Firebase Console UI
- REST API

## 📝 Common Operations

### 1. Adding Data (INSERT in SQL)

**SQL Way:**
```sql
INSERT INTO members (full_name, email, role) 
VALUES ('John Doe', 'john@example.com', 'member');
```

**Firebase Way (Console):**
1. Go to Firestore Database
2. Click on `members` collection
3. Click "Add document"
4. Fill in fields
5. Click "Save"

**Firebase Way (Code):**
```typescript
import { membersService } from '@/integrations/firebase/firestore';

await membersService.create({
  auth_user_id: 'user-uid',
  organization_id: 'org-id',
  full_name: 'John Doe',
  email: 'john@example.com',
  role: 'member',
  mobile_number: null,
  last_login_at: null,
});
```

### 2. Reading Data (SELECT in SQL)

**SQL Way:**
```sql
SELECT * FROM members WHERE organization_id = 'org-123';
```

**Firebase Way (Console):**
1. Go to Firestore Database
2. Click on `members` collection
3. Browse documents
4. Use "Filter" button for specific queries

**Firebase Way (Code):**
```typescript
import { membersService } from '@/integrations/firebase/firestore';

const members = await membersService.getByOrganization('org-123');
```

### 3. Updating Data (UPDATE in SQL)

**SQL Way:**
```sql
UPDATE members 
SET full_name = 'Jane Doe' 
WHERE id = 'member-123';
```

**Firebase Way (Console):**
1. Go to Firestore Database
2. Navigate to the document
3. Click on the field value
4. Edit and press Enter

**Firebase Way (Code):**
```typescript
import { membersService } from '@/integrations/firebase/firestore';

await membersService.update('member-123', {
  full_name: 'Jane Doe'
});
```

### 4. Deleting Data (DELETE in SQL)

**SQL Way:**
```sql
DELETE FROM members WHERE id = 'member-123';
```

**Firebase Way (Console):**
1. Go to Firestore Database
2. Navigate to the document
3. Click the three dots menu
4. Click "Delete document"

**Firebase Way (Code):**
```typescript
import { membersService } from '@/integrations/firebase/firestore';

await membersService.delete('member-123');
```

## 🔍 How to Query Data in Firebase Console

### Method 1: Browse Collections
1. Open Firebase Console
2. Go to **Firestore Database**
3. Click on a collection name (e.g., `members`)
4. Browse through documents

### Method 2: Use Filters
1. In Firestore Database, select a collection
2. Click the **"Filter"** button
3. Add filter conditions:
   - Field path: `organization_id`
   - Operator: `==`
   - Value: `your-org-id`
4. Click "Apply"

### Method 3: Use Document Path
If you know the document ID:
1. In Firestore Database
2. Enter the path in the search: `members/document-id`
3. Press Enter

## 📊 Common Queries You'll Need

### Get All Members in an Organization

**Console:**
1. Go to `members` collection
2. Filter: `organization_id == your-org-id`

**Code:**
```typescript
const members = await membersService.getByOrganization('org-id');
```

### Get All Tasks for Today

**Console:**
1. Go to `tasks` collection
2. Filter: `organization_id == your-org-id`
3. Manually check `weekdays` or `start_date`/`end_date`

**Code:**
```typescript
const tasks = await tasksService.getByOrganization('org-id');
// Filter in code based on date logic
```

### Get Task Assignments for a Member

**Console:**
1. Go to `task_assignments` collection
2. Filter: `member_id == member-id`
3. Filter: `assigned_date == 2026-02-07`

**Code:**
```typescript
const assignments = await taskAssignmentsService.getByMemberAndDate(
  'member-id',
  '2026-02-07'
);
```

### Check if User is Admin

**Console:**
1. Go to `members` collection
2. Find document with `auth_user_id == user-uid`
3. Check `role` field

**Code:**
```typescript
const isUserAdmin = await isAdmin('user-uid');
```

## 🔐 Managing Users

### Create a New User

**Step 1: Create in Authentication**
1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Enter email and password
4. Click "Add user"
5. **Copy the User UID**

**Step 2: Create Member Document**
1. Go to **Firestore Database** → `members`
2. Click "Add document"
3. Fill in:
   - `auth_user_id`: [paste User UID]
   - `organization_id`: [your org ID]
   - `full_name`: "User Name"
   - `email`: "user@example.com"
   - `role`: "member" or "admin"
   - `mobile_number`: "+1234567890"
   - `last_login_at`: null
   - `created_at`: (click timestamp icon)
   - `updated_at`: (click timestamp icon)
4. Click "Save"

### Change User Password

1. Go to **Authentication** → **Users**
2. Find the user
3. Click the three dots menu
4. Click "Reset password"
5. Enter new password
6. Click "Save"

### Delete a User

**Step 1: Delete from Authentication**
1. Go to **Authentication** → **Users**
2. Find the user
3. Click the three dots menu
4. Click "Delete user"

**Step 2: Delete Member Document**
1. Go to **Firestore Database** → `members`
2. Find the member document
3. Click three dots → "Delete document"

## 📈 Monitoring and Debugging

### View Recent Activity
1. Go to **Firestore Database**
2. Click on "Usage" tab
3. See reads, writes, and deletes

### Check Security Rules
1. Go to **Firestore Database**
2. Click "Rules" tab
3. Review and test rules

### View Authentication Logs
1. Go to **Authentication**
2. Click "Users" tab
3. See last sign-in times

### Debug Permission Errors
1. Check browser console for error messages
2. Go to **Firestore Database** → **Rules**
3. Use the "Rules Playground" to test queries
4. Verify user is authenticated
5. Check member document exists with correct `auth_user_id`

## 🎯 Best Practices

### 1. Always Use Timestamps
```typescript
import { Timestamp } from 'firebase/firestore';

created_at: Timestamp.now()
```

### 2. Use Null for Optional Fields
```typescript
mobile_number: null  // Not undefined or empty string
```

### 3. Validate Data Before Writing
```typescript
if (!email || !full_name) {
  throw new Error('Required fields missing');
}
```

### 4. Use Transactions for Related Updates
```typescript
// When updating multiple documents that depend on each other
import { runTransaction } from 'firebase/firestore';
```

### 5. Index Your Queries
If you see "requires an index" error:
1. Click the link in the error message
2. Firebase will create the index automatically
3. Wait a few minutes for index to build

## 🚨 Common Errors and Solutions

### "Missing or insufficient permissions"
**Solution:** Check Firestore security rules and ensure user is authenticated

### "The query requires an index"
**Solution:** Click the link in error message to create index automatically

### "Document does not exist"
**Solution:** Verify document ID is correct and document exists in Firestore

### "auth/user-not-found"
**Solution:** Create user in Firebase Authentication first

### "Cannot read properties of null"
**Solution:** Check that member document exists with correct `auth_user_id`

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

---

**Remember**: Firebase is NOT SQL! Think in terms of documents and collections, not tables and rows.
