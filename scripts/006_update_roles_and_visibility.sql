-- Update role enum to include seller and remove renter
-- Drop the old enum and create a new one with the correct values
ALTER TABLE profiles ALTER COLUMN role TYPE text;

-- Update existing roles
UPDATE profiles SET role = 'seller' WHERE role = 'renter';

-- Create new enum type
DO $$ BEGIN
  CREATE TYPE user_role_new AS ENUM ('admin', 'seller', 'blocker', 'landlord');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update the column to use the new enum
ALTER TABLE profiles ALTER COLUMN role TYPE user_role_new USING role::user_role_new;

-- Drop old enum if it exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Rename new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Add a column to properties to track the owner's role for filtering
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_role user_role;

-- Update existing properties with their owner's role
UPDATE properties p
SET owner_role = pr.role
FROM profiles pr
WHERE p.landlord_id = pr.id;

-- Create a trigger to automatically set owner_role when a property is created
CREATE OR REPLACE FUNCTION set_property_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  SELECT role INTO NEW.owner_role
  FROM profiles
  WHERE id = NEW.landlord_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_owner_role_trigger ON properties;
CREATE TRIGGER set_owner_role_trigger
  BEFORE INSERT OR UPDATE OF landlord_id ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_owner_role();

-- Update RLS policies to allow seller, blocker, and landlord to create properties
DROP POLICY IF EXISTS "Users can create properties" ON properties;
CREATE POLICY "Users can create properties" ON properties
  FOR INSERT
  WITH CHECK (
    auth.uid() = landlord_id AND
    get_user_role(auth.uid()) IN ('seller', 'blocker', 'landlord')
  );

-- Update the view policy to exclude landlord properties from public view
DROP POLICY IF EXISTS "Anyone can view approved properties" ON properties;
CREATE POLICY "Anyone can view approved properties" ON properties
  FOR SELECT
  USING (
    status = 'approved' OR
    landlord_id = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );
