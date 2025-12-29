-- Add phone number to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update role enum to include blocker
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'landlord', 'blocker', 'renter'));

-- Add currency to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD'));

-- Update rent_payments to include currency and make tenant_id optional
ALTER TABLE public.rent_payments
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD'));

ALTER TABLE public.rent_payments
ALTER COLUMN tenant_id DROP NOT NULL;

-- Drop tenants table and its constraints
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Update RLS policies to allow blockers to manage properties
DROP POLICY IF EXISTS "Landlords can manage their properties" ON public.properties;
CREATE POLICY "Landlords and blockers can manage their properties"
ON public.properties
FOR ALL
TO authenticated
USING (
  landlord_id = auth.uid() AND
  get_user_role(auth.uid()) IN ('landlord', 'blocker')
)
WITH CHECK (
  landlord_id = auth.uid() AND
  get_user_role(auth.uid()) IN ('landlord', 'blocker')
);

-- Update property insert policy
DROP POLICY IF EXISTS "Landlords can create properties" ON public.properties;
CREATE POLICY "Landlords and blockers can create properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  landlord_id = auth.uid() AND
  get_user_role(auth.uid()) IN ('landlord', 'blocker')
);
