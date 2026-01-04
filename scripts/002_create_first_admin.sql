-- Create First Admin Script
-- This script promotes an existing user to admin role
-- 
-- Instructions:
-- 1. Sign up normally at /auth/sign-up
-- 2. Replace 'your-email@example.com' below with your actual email
-- 3. Run this script in your Supabase SQL Editor

-- Update user role to admin
UPDATE public.profiles
SET 
  role = 'admin',
  is_admin = true,
  updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  role,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'your-email@example.com';

-- Note: If you see role = 'admin' and is_admin = true, you're all set!
-- You can now log in and access the admin dashboard at /admin
