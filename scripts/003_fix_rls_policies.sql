-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view all rent payments" ON public.rent_payments;

-- Create a security definer function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN user_role_result;
END;
$$;

-- Recreate profiles policies using the helper function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Recreate properties policies using the helper function
CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Recreate tenants policies using the helper function
CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Recreate rent payments policies using the helper function
CREATE POLICY "Admins can view all rent payments"
  ON public.rent_payments FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');
