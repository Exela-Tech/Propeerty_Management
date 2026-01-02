-- Create General Ledger table for tracking all transactions
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  transaction_date DATE NOT NULL,
  reference_id UUID,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('tenant_payment', 'landlord_payment', 'maintenance', 'expense', 'journal_entry')),
  description TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  running_balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'UGX',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX idx_gl_account_id ON general_ledger(account_id);
CREATE INDEX idx_gl_transaction_date ON general_ledger(transaction_date);
CREATE INDEX idx_gl_reference_type ON general_ledger(reference_type);
CREATE INDEX idx_gl_reference_id ON general_ledger(reference_id);

-- Create a view for account balances (for easy reporting)
CREATE OR REPLACE VIEW account_balances AS
SELECT 
  coa.id,
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.normal_balance,
  COALESCE(SUM(CASE WHEN coa.normal_balance = 'debit' THEN gl.debit - gl.credit ELSE gl.credit - gl.debit END), 0) as current_balance,
  COALESCE(SUM(gl.debit), 0) as total_debits,
  COALESCE(SUM(gl.credit), 0) as total_credits
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.id = gl.account_id
WHERE coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance;
