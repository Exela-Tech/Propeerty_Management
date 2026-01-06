-- Add additional fields to profiles table for admin profile and settings
-- This script adds address, company information, and other profile fields

-- Add address fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add company information fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_address TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
