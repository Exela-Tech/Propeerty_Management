-- Add rent_due_day column to tenants table
-- This tracks the day of the month (1-31) when rent is due
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS rent_due_day integer;

-- Add check constraint to ensure rent_due_day is between 1 and 31
ALTER TABLE public.tenants
ADD CONSTRAINT tenants_rent_due_day_check 
CHECK (rent_due_day >= 1 AND rent_due_day <= 31);

-- Set default value to 1st of the month if not specified
ALTER TABLE public.tenants
ALTER COLUMN rent_due_day SET DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN public.tenants.rent_due_day IS 'Day of the month (1-31) when rent is due each month';
