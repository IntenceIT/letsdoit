-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for task type
CREATE TYPE public.task_type AS ENUM ('permanent', 'additional');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  mobile_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles as per security requirement)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  remarks TEXT,
  task_type task_type NOT NULL,
  requires_ai_count BOOLEAN DEFAULT FALSE,
  -- For permanent tasks: weekdays (array of day names)
  weekdays TEXT[] DEFAULT '{}',
  -- For additional tasks: date range
  start_date DATE,
  end_date DATE,
  -- Assigned users (for additional tasks, null means all users for permanent)
  assigned_users UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_completions table for daily status tracking
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  ai_count_value TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (task_id, user_id, completion_date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE user_id = _user_id
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- User roles RLS policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own role on signup" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tasks RLS policies
CREATE POLICY "Authenticated users can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Task completions RLS policies
CREATE POLICY "Users can view task completions" ON public.task_completions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own completions" ON public.task_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" ON public.task_completions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete completions" ON public.task_completions
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Function to handle new user creation (auto-create profile and assign role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT := 'yasirazimshaikh5440@gmail.com';
  user_role app_role;
BEGIN
  -- Determine role based on email
  IF NEW.email = admin_email THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();