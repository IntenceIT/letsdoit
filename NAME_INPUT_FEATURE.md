# ✨ Name Input Feature - How It Works

## 🎯 What's New?

When someone signs in with Google for the **first time**, they will be asked to enter their name before they can proceed.

---

## 📋 User Flow

### For New Users (First Time Google Sign-In):

```
1. User clicks "Continue with Google"
    ↓
2. Google authentication popup appears
    ↓
3. User selects their Google account
    ↓
4. Google authenticates successfully
    ↓
5. App checks: Is this user already registered?
    ↓
6. NO → Show "What's your name?" dialog
    ↓
7. User enters their full name
    ↓
8. User clicks "Continue"
    ↓
9. Account created with:
   - Name: [User entered name]
   - Email: [From Google]
   - Role: admin or member (auto-detected)
    ↓
10. User is logged in!
```

### For Existing Users:

```
1. User clicks "Continue with Google"
    ↓
2. Google authentication
    ↓
3. App checks: User already exists?
    ↓
4. YES → Log in directly (no name dialog)
    ↓
5. User is logged in!
```

---

## 🎨 What Users See

### Step 1: Login Page
```
┌─────────────────────────────────┐
│      TaskFlow                   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [G] Continue with Google│   │ ← Click here
│  └─────────────────────────┘   │
│                                 │
│         ─── OR ───              │
│                                 │
│  Email: [____________]          │
│  Password: [____________]       │
│  [Sign In]                      │
└─────────────────────────────────┘
```

### Step 2: Google Sign-In Popup
```
┌─────────────────────────────────┐
│  Sign in with Google            │
│                                 │
│  Choose an account:             │
│                                 │
│  ○ john.doe@gmail.com           │
│  ○ jane.smith@gmail.com         │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

### Step 3: Name Dialog (NEW USERS ONLY)
```
┌─────────────────────────────────┐
│  Welcome! What's your name?     │
│                                 │
│  Please enter your full name    │
│  to complete registration       │
│                                 │
│  Full Name                      │
│  [👤 ___________________]       │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

### Step 4: Dashboard
```
User is logged in and sees dashboard!
```

---

## 👥 Admin View - Members List

After users sign in, admin sees:

```
┌─────────────────────────────────────────┐
│  Team Members                  [+ Add]  │
├─────────────────────────────────────────┤
│                                         │
│  👤 Yasir Azim Shaikh                   │
│     yasirazimshaikh5440@gmail.com      │
│     Role: Admin                         │
│     Last login: Just now                │
│     [Edit] [Delete]                     │
│                                         │
│  👤 John Doe                            │ ← Name entered by user
│     john.doe@gmail.com                  │ ← Email from Google
│     Role: Member                        │
│     Last login: 2 minutes ago           │
│     [Edit] [Delete]                     │
│                                         │
│  👤 Jane Smith                          │ ← Name entered by user
│     jane.smith@gmail.com                │ ← Email from Google
│     Role: Member                        │
│     Last login: 5 minutes ago           │
│     [Edit] [Delete]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Data Stored in Firestore

When a user signs in with Google and enters their name:

```javascript
{
  id: "auto-generated-id",
  auth_user_id: "firebase-auth-uid",
  organization_id: "your-org-id",
  full_name: "John Doe",              // ← User entered this
  email: "john.doe@gmail.com",        // ← From Google
  role: "member",                     // ← Auto-detected
  mobile_number: null,
  last_login_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🎯 Use Cases

### Use Case 1: Admin First Login

**Admin**: yasirazimshaikh5440@gmail.com

1. Clicks "Continue with Google"
2. Selects admin email
3. **Name dialog appears**
4. Enters: "Yasir Azim Shaikh"
5. Clicks "Continue"
6. ✅ Logged in as admin
7. ✅ Organization created

### Use Case 2: New Member Joins

**Member**: john.doe@gmail.com

1. Clicks "Continue with Google"
2. Selects their Google account
3. **Name dialog appears**
4. Enters: "John Doe"
5. Clicks "Continue"
6. ✅ Logged in as member
7. ✅ Added to organization
8. ✅ Appears in admin's Members list

### Use Case 3: Existing Member Returns

**Member**: john.doe@gmail.com (already registered)

1. Clicks "Continue with Google"
2. Selects their Google account
3. **No name dialog** (already has name)
4. ✅ Logged in directly

---

## 📊 Benefits

### For Admin:
- ✅ See real names in Members list
- ✅ Know who each member is
- ✅ Better member management
- ✅ Professional appearance

### For Users:
- ✅ Simple one-time name entry
- ✅ Quick Google sign-in
- ✅ No complex registration form
- ✅ Name saved permanently

---

## 🔧 Technical Details

### Name Validation:
- Name cannot be empty
- Whitespace is trimmed
- Minimum 1 character required

### Name Storage:
- Stored in Firestore `members` collection
- Field: `full_name`
- Cannot be changed by user (only admin can edit)

### Name Display:
- Shown in Members list
- Shown in profile
- Used for task assignments
- Used in notifications

---

## 🧪 Testing Steps

### Test 1: New User with Google

1. Open app in **incognito/private window**
2. Click "Continue with Google"
3. Select a Google account (not admin)
4. ✅ Name dialog should appear
5. Enter name: "Test User"
6. Click "Continue"
7. ✅ Should be logged in
8. ✅ Check admin's Members list - should see "Test User"

### Test 2: Existing User

1. Sign out
2. Click "Continue with Google" again
3. Select same Google account
4. ✅ Should log in directly (no name dialog)

### Test 3: Admin

1. Sign out
2. Click "Continue with Google"
3. Select admin email
4. ✅ Name dialog appears (if first time)
5. Enter admin name
6. ✅ Logged in as admin

---

## ⚙️ Configuration

### Admin Email

Set in `.env` file:
```env
VITE_ADMIN_EMAIL="yasirazimshaikh5440@gmail.com"
```

This email will be recognized as admin automatically.

### Name Requirements

- **Minimum length**: 1 character
- **Maximum length**: No limit
- **Allowed characters**: Any (letters, numbers, spaces, etc.)
- **Required**: Yes (cannot skip)

---

## 🎨 Customization

### Change Dialog Title

Edit `src/pages/Login.tsx`:
```typescript
<DialogTitle>Welcome! What's your name?</DialogTitle>
```

### Change Placeholder

Edit `src/pages/Login.tsx`:
```typescript
<Input
  placeholder="Enter your full name"
  ...
/>
```

### Change Button Text

Edit `src/pages/Login.tsx`:
```typescript
<Button>Continue</Button>
```

---

## 🐛 Troubleshooting

### Name dialog doesn't appear

**Cause**: User already exists in database

**Solution**: This is normal - name dialog only shows for new users

### Name not showing in Members list

**Cause**: Firestore index not created

**Solution**: Create index in Firebase Console (see main guide)

### Can't submit without name

**Cause**: Name validation working correctly

**Solution**: Enter a name to continue

---

## ✅ Summary

**What happens:**
1. New user clicks "Continue with Google"
2. Google authentication
3. Name dialog appears
4. User enters name
5. Account created
6. User logged in

**What admin sees:**
- User's name (entered by user)
- User's email (from Google)
- User's role (auto-detected)
- Last login time

**Benefits:**
- ✅ Real names in Members list
- ✅ Better user identification
- ✅ Professional appearance
- ✅ Simple user experience

---

**Everything is ready! Just restart your app and test!** 🚀
