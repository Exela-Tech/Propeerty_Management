-- Create first admin user
-- After running this script, you can login with the email you provide

-- Updated to use 'admin' role instead of 'super_admin' to match database constraints
-- This function promotes a user to admin with full privileges
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update or insert profile with admin role (matches database constraint)
  INSERT INTO profiles (id, email, first_name, last_name, role, is_admin, created_at, updated_at)
  VALUES (user_id, user_email, 'Admin', 'User', 'admin', true, NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    is_admin = true,
    updated_at = NOW();
    
  RAISE NOTICE 'User % has been promoted to Admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage (uncomment and replace with your email):
-- SELECT promote_to_admin('your-email@example.com');
