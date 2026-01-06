-- Promote jonusashaba@gmail.com to admin
-- Run this AFTER the user has signed up with this email

-- Removed updated_at field that doesn't exist in profiles table
-- Update the profile to make them an admin
UPDATE public.profiles
SET 
  is_admin = true,
  role = 'admin'
WHERE email = 'jonusashaba@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'jonusashaba@gmail.com';
