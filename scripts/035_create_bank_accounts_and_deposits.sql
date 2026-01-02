-- Create Bank Accounts table for managing multiple bank/cash accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name VARCHAR NOT NULL UNIQUE,
  bank_name VARCHAR NOT NULL,
  account_number VARCHAR,
  routing_number VARCHAR,
  gl_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'UGX',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Payment Deposits table to track deposit bundles
CREATE TABLE IF NOT EXISTS payment_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  total_amount NUMERIC NOT NULL,
  deposit_date DATE NOT NULL,
  deposit_reference VARCHAR,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'reconciled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Deposit Items table to track individual payments in a deposit
CREATE TABLE IF NOT EXISTS deposit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deposit_id UUID NOT NULL REFERENCES payment_deposits(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('tenant_payment', 'landlord_payment')),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  tenant_id UUID,
  landlord_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to tenant_payments to track deposits
ALTER TABLE tenant_payments ADD COLUMN IF NOT EXISTS is_deposited BOOLEAN DEFAULT false;
ALTER TABLE tenant_payments ADD COLUMN IF NOT EXISTS deposit_id UUID REFERENCES payment_deposits(id);

-- Add columns to landlord_payments to track deposits
ALTER TABLE landlord_payments ADD COLUMN IF NOT EXISTS is_deposited BOOLEAN DEFAULT false;
ALTER TABLE landlord_payments ADD COLUMN IF NOT EXISTS deposit_id UUID REFERENCES payment_deposits(id);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bank_gl_account ON bank_accounts(gl_account_id);
CREATE INDEX IF NOT EXISTS idx_deposits_bank ON payment_deposits(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON payment_deposits(deposit_date);
CREATE INDEX IF NOT EXISTS idx_deposit_items_deposit ON deposit_items(deposit_id);
CREATE INDEX IF NOT EXISTS idx_deposit_items_payment ON deposit_items(payment_id);

-- Insert default undeposited funds account if it doesn't exist
INSERT INTO chart_of_accounts 
  (account_code, account_name, account_type, account_category, description, normal_balance, is_active)
VALUES 
  ('1015', 'Undeposited Funds', 'asset', 'cash_and_bank', 'Temporary holding account for payments not yet deposited to bank', 'debit', true)
ON CONFLICT (account_code) DO NOTHING;
