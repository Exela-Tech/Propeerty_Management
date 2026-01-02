-- Drop the existing foreign key constraint that references profiles table
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_landlord_id_fkey;

-- Make landlord_id nullable since it's optional
ALTER TABLE public.properties
ALTER COLUMN landlord_id DROP NOT NULL;

-- Add new foreign key constraint that references owners table
ALTER TABLE public.properties
ADD CONSTRAINT properties_landlord_id_fkey 
FOREIGN KEY (landlord_id) 
REFERENCES public.owners(id) 
ON DELETE SET NULL;

-- Also make owner_id reference the owners table correctly
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

ALTER TABLE public.properties
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.owners(id) 
ON DELETE SET NULL;
