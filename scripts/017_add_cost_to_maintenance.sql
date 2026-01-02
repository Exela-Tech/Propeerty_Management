-- Add unit_id and estimated_cost columns to maintenance_requests table
ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS estimated_cost numeric(10, 2),
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'UGX',
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- Add check constraint for currency
ALTER TABLE public.maintenance_requests
ADD CONSTRAINT maintenance_requests_currency_check 
CHECK (currency IN ('UGX', 'USD'));

-- Add comment
COMMENT ON COLUMN public.maintenance_requests.estimated_cost IS 'Estimated cost of the maintenance work';
COMMENT ON COLUMN public.maintenance_requests.approved IS 'Whether the maintenance cost has been approved by admin';
