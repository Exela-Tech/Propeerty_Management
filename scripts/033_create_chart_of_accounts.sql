-- Create Chart of Accounts table for hierarchical account structure
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code VARCHAR(10) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  account_category TEXT NOT NULL,
  description TEXT,
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_active BOOLEAN DEFAULT true,
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX idx_coa_account_code ON chart_of_accounts(account_code);
CREATE INDEX idx_coa_account_type ON chart_of_accounts(account_type);
CREATE INDEX idx_coa_is_active ON chart_of_accounts(is_active);

-- Insert default chart of accounts for property management
-- Assets (1000-1999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('1010', 'Bank Account', 'asset', 'bank', 'Main operating bank account', 'debit'),
('1020', 'Cash Register', 'asset', 'cash', 'Physical cash on hand', 'debit'),
('1030', 'Tenant Receivables', 'asset', 'receivable', 'Outstanding rent from tenants', 'debit'),
('1040', 'Landlord Prepaid', 'asset', 'prepaid', 'Prepayments to landlords', 'debit');

-- Liabilities (2000-2999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('2010', 'Landlord Payable', 'liability', 'payable', 'Amount owed to landlords', 'credit'),
('2020', 'Tenant Deposits Liability', 'liability', 'deposit', 'Security deposits held from tenants', 'credit'),
('2030', 'Advance Rent Received', 'liability', 'deferred_income', 'Rent received in advance', 'credit');

-- Equity (3000-3999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('3010', 'Owner Equity', 'equity', 'equity', 'Owner investment in company', 'credit'),
('3020', 'Retained Earnings', 'equity', 'retained_earnings', 'Accumulated profits/losses', 'credit');

-- Income (4000-4999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('4010', 'Rent Income', 'income', 'service_income', 'Rent collected from tenants', 'credit'),
('4020', 'Management Fee Income', 'income', 'service_income', 'Management fees charged', 'credit'),
('4030', 'Late Payment Fees', 'income', 'service_income', 'Late payment penalties', 'credit'),
('4040', 'Utility Income', 'income', 'service_income', 'Utility charges passed to tenants', 'credit');

-- Expenses (5000-5999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('5010', 'Maintenance & Repairs', 'expense', 'operating_expense', 'Building maintenance and repairs', 'debit'),
('5020', 'Salaries & Wages', 'expense', 'personnel_expense', 'Staff salaries and wages', 'debit'),
('5030', 'Utilities Expense', 'expense', 'operating_expense', 'Water, electricity, gas', 'debit'),
('5040', 'Insurance Expense', 'expense', 'operating_expense', 'Property insurance', 'debit'),
('5050', 'Commission Expense', 'expense', 'operating_expense', 'Landlord commission paid', 'debit'),
('5060', 'Administrative Expense', 'expense', 'operating_expense', 'Office supplies, communications', 'debit'),
('5070', 'Transportation Expense', 'expense', 'operating_expense', 'Vehicle and travel expenses', 'debit'),
('5080', 'Office Rent Expense', 'expense', 'operating_expense', 'Office space rental', 'debit');
