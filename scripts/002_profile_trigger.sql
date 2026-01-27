-- ============================
-- FIX RLS POLICIES (Profiles & Admin Access)
-- ============================

-- Drop existing policies that may cause recursion or conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view all rent payments" ON public.rent_payments;

-- ============================
-- SAFE SECURITY DEFINER FUNCTION
-- ============================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Prevent RLS recursion
ALTER FUNCTION public.get_user_role(UUID) SET row_security = off;

-- ============================
-- PROFILE POLICIES
-- ============================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'admin');

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.get_user_role(auth.uid()) = 'admin');

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for self-signup / triggers)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================
-- OTHER TABLE POLICIES
-- ============================

-- Properties
CREATE POLICY "Admins can view all properties"
ON public.properties FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all properties"
ON public.properties FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'admin');

-- Tenants
CREATE POLICY "Admins can view all tenants"
ON public.tenants FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

-- Rent payments
CREATE POLICY "Admins can view all rent payments"
ON public.rent_payments FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');
