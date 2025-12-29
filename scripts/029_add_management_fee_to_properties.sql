ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS management_fee NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS management_fee_type VARCHAR DEFAULT 'percentage' CHECK (management_fee_type IN ('percentage', 'fixed'));

COMMENT ON COLUMN public.properties.management_fee IS 'Management fee amount (percentage or fixed value)';
COMMENT ON COLUMN public.properties.management_fee_type IS 'Type of management fee: percentage or fixed amount';
