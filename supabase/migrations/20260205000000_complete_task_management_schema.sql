-- =====================================================
-- COMPLETE TASK MANAGEMENT SYSTEM SCHEMA
-- Matches exact requirements from specification
-- =====================================================

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS public.task_completions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.task_type CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  created_by_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MEMBERS TABLE
-- =====================================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  mobile_number TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TASKS TABLE
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  remarks TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('permanent', 'additional')),
  requires_ai_count BOOLEAN DEFAULT FALSE,
  weekdays TEXT[] DEFAULT '{}', -- For permanent tasks
  start_date DATE, -- For additional tasks
  end_date DATE, -- For additional tasks
  assigned_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TASK ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_status TEXT NOT NULL CHECK (completion_status IN ('pending', 'completed')) DEFAULT 'pending',
  ai_count_value TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, member_id, assigned_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_members_auth_user_id ON public.members(auth_user_id);
CREATE INDEX idx_members_organization_id ON public.members(organization_id);
CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_member_id ON public.task_assignments(member_id);
CREATE INDEX idx_task_assignments_assigned_date ON public.task_assignments(assigned_date);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.members
    WHERE auth_user_id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM public.members
    WHERE auth_user_id = user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Admins can view their organization
CREATE POLICY "Admins can view their organization" ON public.organizations
FOR SELECT TO authenticated USING (
  id = get_user_organization(auth.uid())
  AND is_admin(auth.uid())
);

-- Admins can update their organization
CREATE POLICY "Admins can update their organization" ON public.organizations
FOR UPDATE TO authenticated USING (
  id = get_user_organization(auth.uid())
  AND is_admin(auth.uid())
);

-- =====================================================
-- MEMBERS POLICIES
-- =====================================================

-- Users can view members in their organization
CREATE POLICY "Users can view members in their organization" ON public.members
FOR SELECT TO authenticated USING (
  organization_id = get_user_organization(auth.uid())
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.members
FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.members
FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

-- Admins can insert members
CREATE POLICY "Admins can insert members" ON public.members
FOR INSERT TO authenticated WITH CHECK (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- Admins can update members
CREATE POLICY "Admins can update members" ON public.members
FOR UPDATE TO authenticated USING (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- Admins can delete members
CREATE POLICY "Admins can delete members" ON public.members
FOR DELETE TO authenticated USING (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization" ON public.tasks
FOR SELECT TO authenticated USING (
  organization_id = get_user_organization(auth.uid())
);

-- Admins can insert tasks
CREATE POLICY "Admins can insert tasks" ON public.tasks
FOR INSERT TO authenticated WITH CHECK (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- Admins can update tasks
CREATE POLICY "Admins can update tasks" ON public.tasks
FOR UPDATE TO authenticated USING (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- Admins can delete tasks
CREATE POLICY "Admins can delete tasks" ON public.tasks
FOR DELETE TO authenticated USING (
  is_admin(auth.uid())
  AND organization_id = get_user_organization(auth.uid())
);

-- =====================================================
-- TASK ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view their own assignments
CREATE POLICY "Users can view their own assignments" ON public.task_assignments
FOR SELECT TO authenticated USING (
  member_id IN (
    SELECT id FROM public.members
    WHERE auth_user_id = auth.uid()
  )
);

-- Admins can view all assignments in their organization
CREATE POLICY "Admins can view all assignments" ON public.task_assignments
FOR SELECT TO authenticated USING (
  is_admin(auth.uid())
  AND task_id IN (
    SELECT id FROM public.tasks
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Admins can insert assignments
CREATE POLICY "Admins can insert assignments" ON public.task_assignments
FOR INSERT TO authenticated WITH CHECK (
  is_admin(auth.uid())
  AND task_id IN (
    SELECT id FROM public.tasks
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Users can update their own assignments
CREATE POLICY "Users can update their own assignments" ON public.task_assignments
FOR UPDATE TO authenticated USING (
  member_id IN (
    SELECT id FROM public.members
    WHERE auth_user_id = auth.uid()
  )
);

-- Admins can update all assignments
CREATE POLICY "Admins can update all assignments" ON public.task_assignments
FOR UPDATE TO authenticated USING (
  is_admin(auth.uid())
  AND task_id IN (
    SELECT id FROM public.tasks
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Admins can delete assignments
CREATE POLICY "Admins can delete assignments" ON public.task_assignments
FOR DELETE TO authenticated USING (
  is_admin(auth.uid())
  AND task_id IN (
    SELECT id FROM public.tasks
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- =====================================================
-- AUTO-CREATE MEMBER ON GOOGLE SIGN-IN
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT := 'yasirazimshaikh5440@gmail.com';
  admin_mobile TEXT := '+918799132161';
  user_role TEXT;
  user_org_id UUID;
  default_org_id UUID;
BEGIN
  -- Determine role
  IF NEW.email = admin_email THEN
    user_role := 'admin';
    
    -- Create organization for admin if it doesn't exist
    INSERT INTO public.organizations (organization_name, created_by_admin_id)
    VALUES ('TaskFlow Organization', NEW.id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO user_org_id;
    
    -- Get the organization ID if it already exists
    IF user_org_id IS NULL THEN
      SELECT id INTO user_org_id
      FROM public.organizations
      WHERE created_by_admin_id = NEW.id
      LIMIT 1;
    END IF;
  ELSE
    user_role := 'member';
    
    -- Get default organization (first admin's organization)
    SELECT id INTO default_org_id
    FROM public.organizations
    ORDER BY created_at ASC
    LIMIT 1;
    
    user_org_id := default_org_id;
  END IF;

  -- Insert or update member
  INSERT INTO public.members (
    auth_user_id,
    organization_id,
    full_name,
    email,
    role,
    mobile_number,
    last_login_at
  )
  VALUES (
    NEW.id,
    user_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    user_role,
    CASE WHEN NEW.email = admin_email THEN admin_mobile ELSE NULL END,
    NOW()
  )
  ON CONFLICT (auth_user_id)
  DO UPDATE SET
    last_login_at = NOW(),
    full_name = COALESCE(EXCLUDED.full_name, members.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 30-DAY DATA RETENTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_assignments()
RETURNS void AS $$
BEGIN
  DELETE FROM public.task_assignments
  WHERE assigned_date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DAILY RESET FOR PERMANENT TASKS
-- =====================================================

CREATE OR REPLACE FUNCTION reset_daily_tasks()
RETURNS void AS $$
BEGIN
  -- Reset completion status for permanent tasks
  UPDATE public.task_assignments ta
  SET 
    completion_status = 'pending',
    completed_at = NULL,
    ai_count_value = NULL
  FROM public.tasks t
  WHERE ta.task_id = t.id
    AND t.task_type = 'permanent'
    AND ta.assigned_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;