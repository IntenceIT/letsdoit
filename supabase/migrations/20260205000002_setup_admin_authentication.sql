-- =====================================================
-- SETUP ADMIN USER AND FIX AUTHENTICATION
-- Run this migration after the complete schema
-- =====================================================

-- Step 1: Update the handle_new_user function to properly handle admin
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
    
    -- If still no org (shouldn't happen), create one
    IF user_org_id IS NULL THEN
      INSERT INTO public.organizations (organization_name, created_by_admin_id)
      VALUES ('TaskFlow Organization', NEW.id)
      RETURNING id INTO user_org_id;
    END IF;
  ELSE
    user_role := 'member';
    
    -- Get the admin's organization (first organization in database)
    SELECT id INTO default_org_id
    FROM public.organizations
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If no organization exists yet, we have a problem
    IF default_org_id IS NULL THEN
      RAISE EXCEPTION 'No organization exists. Admin must sign up first.';
    END IF;
    
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
    full_name = COALESCE(EXCLUDED.full_name, members.full_name),
    organization_id = COALESCE(EXCLUDED.organization_id, members.organization_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop and recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create a function to manually create admin if needed
-- This can be called if admin doesn't exist yet
CREATE OR REPLACE FUNCTION public.create_admin_user_if_not_exists()
RETURNS void AS $$
DECLARE
  admin_email TEXT := 'yasirazimshaikh5440@gmail.com';
  admin_id UUID;
  org_id UUID;
BEGIN
  -- Check if admin user exists in auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Admin exists, ensure organization and member record exist
    
    -- Create or get organization
    INSERT INTO public.organizations (organization_name, created_by_admin_id)
    VALUES ('TaskFlow Organization', admin_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO org_id;
    
    IF org_id IS NULL THEN
      SELECT id INTO org_id FROM public.organizations WHERE created_by_admin_id = admin_id LIMIT 1;
    END IF;
    
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (organization_name, created_by_admin_id)
      VALUES ('TaskFlow Organization', admin_id)
      RETURNING id INTO org_id;
    END IF;
    
    -- Create or update member record
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
      admin_id,
      org_id,
      'Yasir Azim Shaikh',
      admin_email,
      'admin',
      '+918799132161',
      NOW()
    )
    ON CONFLICT (auth_user_id)
    DO UPDATE SET
      role = 'admin',
      organization_id = org_id,
      full_name = 'Yasir Azim Shaikh',
      mobile_number = '+918799132161';
    
    RAISE NOTICE 'Admin user setup completed for existing user';
  ELSE
    RAISE NOTICE 'Admin user does not exist in auth.users. Please create via Supabase Auth first.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Run the admin creation function
SELECT public.create_admin_user_if_not_exists();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;