-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.properties'::regclass 
AND conname = 'properties_property_type_check';

-- Drop the old constraint if it exists
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Add new constraint with correct values
ALTER TABLE public.properties
ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN ('Residential', 'Commercial', 'Mixed-Use', 'Industrial', 'residential', 'commercial', 'mixed-use', 'industrial'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.properties'::regclass 
AND conname = 'properties_property_type_check';
