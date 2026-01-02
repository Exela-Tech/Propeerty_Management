-- Create owners table to store property owners (separate from landlords who manage properties)
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add owner_id to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;

-- Add location column to properties (will replace address, city, state, zip_code)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Make old address fields nullable since we're using location field now
ALTER TABLE properties 
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN city DROP NOT NULL,
ALTER COLUMN state DROP NOT NULL,
ALTER COLUMN zip_code DROP NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_owners_landlord_id ON owners(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- Enable RLS on owners table
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for owners table
-- Landlords can view their own owners
CREATE POLICY "Landlords can view their own owners"
    ON owners FOR SELECT
    USING (landlord_id = auth.uid());

-- Landlords can insert their own owners
CREATE POLICY "Landlords can insert their own owners"
    ON owners FOR INSERT
    WITH CHECK (landlord_id = auth.uid());

-- Landlords can update their own owners
CREATE POLICY "Landlords can update their own owners"
    ON owners FOR UPDATE
    USING (landlord_id = auth.uid());

-- Landlords can delete their own owners
CREATE POLICY "Landlords can delete their own owners"
    ON owners FOR DELETE
    USING (landlord_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can view all owners"
    ON owners FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can insert all owners"
    ON owners FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update all owners"
    ON owners FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete all owners"
    ON owners FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER owners_updated_at
    BEFORE UPDATE ON owners
    FOR EACH ROW
    EXECUTE FUNCTION update_owners_updated_at();
