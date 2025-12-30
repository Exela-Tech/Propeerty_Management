-- Accounting System Module for Property Management
-- This script creates tables and functions for rent collection, commissions, payouts, and expenses

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Create enum for payout status
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'processing');

-- Create enum for expense categories
CREATE TYPE expense_category AS ENUM ('maintenance', 'utilities', 'staff', 'marketing', 'legal', 'insurance', 'other');

-- Re-create tenants table with accounting fields
DROP TABLE IF EXISTS public.tenants CASCADE;
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_phone TEXT NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  monthly_rent DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  deposit_paid DECIMAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update rent_payments table for accounting
DROP TABLE IF EXISTS public.rent_payments CASCADE;
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount_paid DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  commission_rate DECIMAL NOT NULL DEFAULT 10.0,
  commission_amount DECIMAL NOT NULL,
  landlord_payout DECIMAL NOT NULL,
  stripe_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create landlord_payouts table
CREATE TABLE IF NOT EXISTS public.landlord_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_rent_collected DECIMAL NOT NULL DEFAULT 0,
  total_commission DECIMAL NOT NULL DEFAULT 0,
  total_payout DECIMAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status payout_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(landlord_id, month, year, currency)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  expense_date DATE NOT NULL,
  responsible_staff UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Landlords can view their tenants"
  ON public.tenants FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete tenants"
  ON public.tenants FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

-- Rent payments policies
CREATE POLICY "Landlords can view their rent payments"
  ON public.rent_payments FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all rent payments"
  ON public.rent_payments FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert rent payments"
  ON public.rent_payments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update rent payments"
  ON public.rent_payments FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Landlord payouts policies
CREATE POLICY "Landlords can view their payouts"
  ON public.landlord_payouts FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all payouts"
  ON public.landlord_payouts FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage payouts"
  ON public.landlord_payouts FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Expenses policies
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_tenants_landlord ON public.tenants(landlord_id);
CREATE INDEX idx_tenants_property ON public.tenants(property_id);
CREATE INDEX idx_rent_payments_tenant ON public.rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_landlord ON public.rent_payments(landlord_id);
CREATE INDEX idx_rent_payments_date ON public.rent_payments(year, month);
CREATE INDEX idx_landlord_payouts_landlord ON public.landlord_payouts(landlord_id);
CREATE INDEX idx_landlord_payouts_date ON public.landlord_payouts(year, month);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- Create function to calculate commission and payout
CREATE OR REPLACE FUNCTION calculate_payment_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate commission amount (default 10%)
  NEW.commission_amount := NEW.amount_paid * (NEW.commission_rate / 100);
  
  -- Calculate landlord payout
  NEW.landlord_payout := NEW.amount_paid - NEW.commission_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate amounts
CREATE TRIGGER calculate_payment_amounts_trigger
  BEFORE INSERT OR UPDATE ON public.rent_payments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_amounts();

-- Create function to update landlord payout summary
CREATE OR REPLACE FUNCTION update_landlord_payout_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update landlord payout summary
  INSERT INTO public.landlord_payouts (
    landlord_id,
    month,
    year,
    total_rent_collected,
    total_commission,
    total_payout,
    currency
  )
  VALUES (
    NEW.landlord_id,
    NEW.month,
    NEW.year,
    NEW.amount_paid,
    NEW.commission_amount,
    NEW.landlord_payout,
    NEW.currency
  )
  ON CONFLICT (landlord_id, month, year, currency)
  DO UPDATE SET
    total_rent_collected = landlord_payouts.total_rent_collected + NEW.amount_paid,
    total_commission = landlord_payouts.total_commission + NEW.commission_amount,
    total_payout = landlord_payouts.total_payout + NEW.landlord_payout,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update payout summary when payment is recorded
CREATE TRIGGER update_payout_summary_trigger
  AFTER INSERT ON public.rent_payments
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION update_landlord_payout_summary();
