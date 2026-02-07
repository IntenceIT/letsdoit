# 🚀 Complete Supabase Setup Guide for Task Management System

## 📋 Prerequisites
- Supabase account
- Google Cloud Console account
- Node.js and npm/yarn installed

## 🔧 Step-by-Step Setup

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: "TaskFlow Management"
5. Enter database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

### Step 2: Configure Environment Variables
Update your `.env` file with your project details:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Admin Configuration
VITE_ADMIN_EMAIL="yasirazimshaikh5440@gmail.com"
```

**Where to find these values:**
- Go to Project Settings → API
- Copy "Project URL" for `VITE_SUPABASE_URL`
- Copy "anon public" key for `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 3: Enable Google OAuth

#### 3.1 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

#### 3.2 Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
5. Copy Client ID and Client Secret

#### 3.3 Configure Supabase Auth
1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Paste Google Client ID and Client Secret
4. Click "Save"

### Step 4: Run Database Migration

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Manual SQL Execution
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the content from `supabase/migrations/20260205000000_complete_task_management_schema.sql`
3. Click "Run"

### Step 5: Deploy Edge Functions (Optional - for automated cleanup)

```bash
# Deploy the daily cleanup function
supabase functions deploy daily-cleanup

# Set up environment variables for the function
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To get Service Role Key:**
- Go to Project Settings → API
- Copy "service_role" key (keep this secret!)

### Step 6: Set Up Automated Cleanup (Optional)

Since Supabase Free Tier doesn't support pg_cron, you can use external services:

#### Option A: GitHub Actions
Create `.github/workflows/daily-cleanup.yml`:

```yaml
name: Daily Cleanup
on:
  schedule:
    - cron: '0 0 * * *' # Run daily at midnight UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project-ref.supabase.co/functions/v1/daily-cleanup
```

#### Option B: Vercel Cron (if deploying on Vercel)
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/daily-cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Step 7: Test the Setup

#### 7.1 Test Google Authentication
1. Start your development server: `npm run dev`
2. Go to login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. Check if you're redirected to dashboard

#### 7.2 Verify Database Setup
1. Go to Supabase Dashboard → Table Editor
2. You should see these tables:
   - `organizations`
   - `members`
   - `tasks`
   - `task_assignments`

#### 7.3 Check Admin Access
1. Sign in with `yasirazimshaikh5440@gmail.com`
2. You should have admin privileges
3. Try creating a task
4. Check if other users can see the task

### Step 8: Production Deployment

#### 8.1 Update Environment Variables
For production, update your hosting platform with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ADMIN_EMAIL`

#### 8.2 Update Google OAuth Redirect URLs
Add your production domain to Google Cloud Console:
```
https://yourdomain.com
https://your-project-ref.supabase.co/auth/v1/callback
```

## 🔒 Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admin email configured correctly
- ✅ Google OAuth properly configured
- ✅ Service role key kept secret
- ✅ Environment variables secured

## 🚨 Troubleshooting

### Common Issues:

1. **Google OAuth not working**
   - Check redirect URLs match exactly
   - Verify Google+ API is enabled
   - Ensure Client ID/Secret are correct

2. **Database connection issues**
   - Verify SUPABASE_URL is correct
   - Check if anon key is valid
   - Ensure project is not paused

3. **Admin privileges not working**
   - Verify admin email matches exactly
   - Check if user exists in members table
   - Ensure RLS policies are applied

4. **Tasks not showing**
   - Check if user is in correct organization
   - Verify task assignments are created
   - Check date filters

## 📊 Database Schema Overview

```
organizations
├── id (UUID, PK)
├── organization_name
├── created_by_admin_id (FK → auth.users)
└── timestamps

members
├── id (UUID, PK)
├── auth_user_id (FK → auth.users)
├── organization_id (FK → organizations)
├── full_name, email, role
├── mobile_number
└── timestamps

tasks
├── id (UUID, PK)
├── organization_id (FK → organizations)
├── task_title, task_description
├── task_type (permanent/additional)
├── weekdays[], start_date, end_date
└── timestamps

task_assignments
├── id (UUID, PK)
├── task_id (FK → tasks)
├── member_id (FK → members)
├── assigned_date, completion_status
├── ai_count_value, completed_at
└── timestamps
```

## 🎯 Key Features Implemented

- ✅ Google OAuth Authentication
- ✅ Role-based Access Control (Admin/Member)
- ✅ Organization-based Multi-tenancy
- ✅ Task Assignment System
- ✅ Daily Task Reset for Permanent Tasks
- ✅ 30-day Data Retention
- ✅ Row Level Security
- ✅ Automatic User Registration
- ✅ Real-time Task Completion Tracking

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables
3. Check Supabase logs in Dashboard → Logs
4. Review browser console for errors

Your Supabase-powered Task Management System is now ready! 🎉