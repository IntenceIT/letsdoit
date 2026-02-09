# Task Management Application

A comprehensive task management system with Firebase backend, featuring user authentication, task assignments, and real-time updates.

## 🚀 Features

- **User Authentication**: Secure login with Firebase Authentication
- **Task Management**: Create permanent and additional tasks
- **Member Management**: Add and manage team members
- **Task Assignments**: Assign tasks to members with date-based scheduling
- **Real-time Updates**: Instant synchronization across all users
- **Admin Dashboard**: Comprehensive admin controls
- **Mobile Responsive**: Works seamlessly on all devices

## 🛠️ Technologies Used

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Firebase Authentication** for user management
- **Cloud Firestore** for database
- **Node.js + Express** for backend API (optional)

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher) installed
- npm or yarn package manager
- A Firebase account (free tier works perfectly)

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Firebase

Follow the detailed instructions in [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) to:
1. Create a Firebase project
2. Enable Authentication and Firestore
3. Configure security rules
4. Create your first admin user

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

VITE_ADMIN_EMAIL="your-admin-email@example.com"
VITE_ADMIN_MOBILE="+1234567890"
```

### Step 5: Start Development Server

```bash
# Frontend only
npm run dev

# Frontend + Backend (if using Node.js backend)
npm run both
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Firebase integration
│   │   └── firebase/      # Firebase config and services
│   ├── pages/             # Application pages
│   └── lib/               # Utility functions
├── backend/               # Node.js backend (optional)
│   ├── controllers/       # API controllers
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── services/          # Business logic
└── public/                # Static assets
```

## 🔐 Firebase Collections Structure

### organizations
- `organization_name`: string
- `created_by_admin_id`: string (nullable)
- `created_at`: timestamp
- `updated_at`: timestamp

### members
- `auth_user_id`: string (Firebase Auth UID)
- `organization_id`: string
- `full_name`: string
- `email`: string
- `role`: "admin" | "member"
- `mobile_number`: string (nullable)
- `last_login_at`: timestamp (nullable)
- `created_at`: timestamp
- `updated_at`: timestamp

### tasks
- `organization_id`: string
- `task_title`: string
- `task_description`: string (nullable)
- `remarks`: string (nullable)
- `task_type`: "permanent" | "additional"
- `requires_ai_count`: boolean
- `weekdays`: array of strings (nullable)
- `start_date`: string (nullable)
- `end_date`: string (nullable)
- `assigned_by_admin`: string (nullable)
- `created_at`: timestamp
- `updated_at`: timestamp

### task_assignments
- `task_id`: string
- `member_id`: string
- `assigned_date`: string (YYYY-MM-DD)
- `completion_status`: "pending" | "completed" | "not_done"
- `ai_count_value`: string (nullable)
- `completed_at`: timestamp (nullable)
- `created_at`: timestamp

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Build your app
npm run build

# Deploy
firebase deploy
```

### Deploy to Vercel/Netlify

1. Connect your repository to Vercel or Netlify
2. Set environment variables in the platform dashboard
3. Deploy automatically on push to main branch

## 📱 Usage

### Admin Features
- Create and manage tasks
- Add team members
- View all task completions
- Manage organization settings

### Member Features
- View assigned tasks
- Mark tasks as complete
- View task history
- Update profile information

## 🔒 Security

- Firebase Authentication handles user security
- Firestore security rules protect data access
- Environment variables keep sensitive data secure
- Role-based access control (Admin/Member)

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" errors**
- Check Firestore security rules
- Ensure user is authenticated
- Verify member document exists

**Environment variables not loading**
- Restart development server
- Check variable names start with `VITE_`
- Verify `.env` file is in root directory

**Firebase connection issues**
- Verify Firebase configuration in `.env`
- Check Firebase project is active
- Ensure billing is enabled (if using paid features)

For more help, see [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)

## 📊 Firebase Free Tier Limits

- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Bandwidth**: 10 GB/month

Perfect for small to medium applications!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Check the [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
- Review Firebase Console logs
- Check browser console for errors

---

**Built with ❤️ using React, TypeScript, and Firebase**
