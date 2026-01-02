-- Ensure admin profile exists for the authenticated user
-- Run this script after creating your admin account

-- Check if profile exists for jonusashaba@gmail.com
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jonusashaba@gmail.com';

    IF v_user_id IS NOT NULL THEN
        -- Insert or update the profile
        INSERT INTO profiles (id, email, first_name, last_name, role, is_admin)
        VALUES (
            v_user_id,
            'jonusashaba@gmail.com',
            'Jonus',
            'Ashaba',
            'admin',
            true
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            is_admin = true,
            role = 'admin',
            first_name = COALESCE(profiles.first_name, 'Jonus'),
            last_name = COALESCE(profiles.last_name, 'Ashaba');

        RAISE NOTICE 'Profile created/updated for user: %', v_user_id;
    ELSE
        RAISE NOTICE 'No user found with email jonusashaba@gmail.com';
    END IF;
END $$;

-- Verify the profile
SELECT id, email, first_name, last_name, role, is_admin
FROM profiles
WHERE email = 'jonusashaba@gmail.com';
