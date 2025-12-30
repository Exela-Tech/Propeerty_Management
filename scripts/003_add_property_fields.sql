-- Add land to property_type enum
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'land';

-- Add listing_type enum
DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('sale', 'rent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS listing_type listing_type NOT NULL DEFAULT 'rent',
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL,
  ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false;

-- Make bedrooms and bathrooms nullable for land properties
ALTER TABLE public.properties 
  ALTER COLUMN bedrooms DROP NOT NULL,
  ALTER COLUMN bathrooms DROP NOT NULL;

-- Update rent_amount to be nullable (not required for sale properties)
ALTER TABLE public.properties 
  ALTER COLUMN rent_amount DROP NOT NULL,
  ALTER COLUMN deposit_amount DROP NOT NULL;
