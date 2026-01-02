-- Add currency column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX';

-- Add check constraint for currency values
ALTER TABLE transactions ADD CONSTRAINT transactions_currency_check 
  CHECK (currency IN ('UGX', 'USD'));
