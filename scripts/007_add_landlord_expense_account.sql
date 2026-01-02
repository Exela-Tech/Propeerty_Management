-- Add Landlord Payout Expense account to chart of accounts
-- This account will be debited when paying landlords (expense increases)

-- Added account_category and normal_balance required fields
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, normal_balance, description, is_active)
VALUES 
  ('5020', 'Landlord Payout Expense', 'expense', 'Operating Expenses', 'debit', 'Payments made to property owners for rent collection', true)
ON CONFLICT (account_code) DO NOTHING;

-- Add bank_account_id column to landlord_payments if it doesn't exist
ALTER TABLE landlord_payments 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id);

-- Add comment explaining the column
COMMENT ON COLUMN landlord_payments.bank_account_id IS 'The bank account used to make this payment to the landlord';
