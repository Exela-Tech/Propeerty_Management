-- Create a function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_admin, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'landlord', -- Default role for new signups
    false,      -- Not admin by default
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now fix the existing user (jonusashaba@gmail.com)
-- First, let's create their profile if it doesn't exist
INSERT INTO public.profiles (id, email, first_name, last_name, role, is_admin, created_at, updated_at)
VALUES (
  '6ca18b53-52e2-4199-a47e-2f49a168a1e1',
  'jonusashaba@gmail.com',
  'Jonus',
  'Ashaba',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_admin = true,
  email = 'jonusashaba@gmail.com',
  first_name = 'Jonus',
  last_name = 'Ashaba',
  updated_at = NOW();

-- Verify the profile was created
SELECT id, email, first_name, last_name, role, is_admin, created_at
FROM public.profiles
WHERE email = 'jonusashaba@gmail.com';
