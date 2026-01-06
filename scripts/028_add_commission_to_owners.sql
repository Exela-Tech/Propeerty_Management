-- Add commission_percentage column to owners table
ALTER TABLE public.owners ADD COLUMN commission_percentage NUMERIC DEFAULT 10;

-- Add comment to explain the field
COMMENT ON COLUMN public.owners.commission_percentage IS 'Commission/deduction percentage deducted from landlord payouts (0-100)';
