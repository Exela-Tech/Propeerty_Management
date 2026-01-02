-- Make lease_end_date nullable in tenants table since it's not needed for now
ALTER TABLE public.tenants 
ALTER COLUMN lease_end_date DROP NOT NULL;

-- Add a comment explaining this is for future development
COMMENT ON COLUMN public.tenants.lease_end_date IS 'Optional lease end date - reserved for future development';
