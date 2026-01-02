-- Create First Admin User
-- This script creates an admin user directly in the database
-- Use this as an alternative to the signup form if you're having issues

-- Step 1: First, sign up normally at /auth/sign-up with your email and password
-- Step 2: Find your user ID from the auth.users table (or check your email)
-- Step 3: Update the email below and run this script

-- Updated to use 'admin' role instead of 'super_admin' to match database constraints
-- Replace 'your-email@example.com' with the email you used to sign up
UPDATE profiles 
SET 
  role = 'admin',
  is_admin = true
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, first_name, last_name, role, is_admin 
FROM profiles 
WHERE email = 'your-email@example.com';
