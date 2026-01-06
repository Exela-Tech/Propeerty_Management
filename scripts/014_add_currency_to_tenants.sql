-- Add currency column to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'UGX';

-- Add check constraint to ensure valid currency values
ALTER TABLE public.tenants
ADD CONSTRAINT tenants_currency_check 
CHECK (currency IN ('UGX', 'USD'));

-- Update existing records to have a currency
UPDATE public.tenants
SET currency = 'UGX'
WHERE currency IS NULL;
