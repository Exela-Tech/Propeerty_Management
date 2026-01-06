-- Create or update profile for the authenticated user
-- Run this script to create the profile for user ID: 6ca18b53-52e2-4199-a47e-2f49a168a1e1

-- First, check if profile exists
DO $$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '6ca18b53-52e2-4199-a47e-2f49a168a1e1') THEN
    -- Get user email from auth.users
    INSERT INTO public.profiles (id, email, first_name, last_name, role, is_admin, created_at)
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)) as first_name,
      COALESCE(raw_user_meta_data->>'last_name', 'Admin') as last_name,
      'admin' as role,
      true as is_admin,
      now() as created_at
    FROM auth.users
    WHERE id = '6ca18b53-52e2-4199-a47e-2f49a168a1e1';
    
    RAISE NOTICE 'Profile created successfully for user 6ca18b53-52e2-4199-a47e-2f49a168a1e1';
  ELSE
    -- Update existing profile to ensure admin status
    UPDATE public.profiles
    SET 
      role = 'admin',
      is_admin = true
    WHERE id = '6ca18b53-52e2-4199-a47e-2f49a168a1e1';
    
    RAISE NOTICE 'Profile updated successfully for user 6ca18b53-52e2-4199-a47e-2f49a168a1e1';
  END IF;
END $$;

-- Verify the profile
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_admin,
  created_at
FROM public.profiles
WHERE id = '6ca18b53-52e2-4199-a47e-2f49a168a1e1';
