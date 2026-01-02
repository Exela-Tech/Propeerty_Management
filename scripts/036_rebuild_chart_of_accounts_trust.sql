-- Rebuild Chart of Accounts with proper trust accounting structure
-- This replaces the old CoA with trust accounting principles

-- Drop old account if exists and recreate
DROP VIEW IF EXISTS account_balances;

-- Clear existing accounts (only run once)
DELETE FROM chart_of_accounts;

-- ASSETS (1000-1999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
-- Bank Accounts
('1010', 'Operating Bank Account', 'asset', 'bank', 'Main bank account for operating funds', 'debit'),
('1011', 'Trust Bank Account', 'asset', 'bank', 'Bank account for tenant rent held in trust', 'debit'),

-- Undeposited Funds
('1015', 'Undeposited Funds', 'asset', 'receivable', 'Payments received but not yet deposited', 'debit'),

-- Receivables
('1020', 'Tenant Receivables', 'asset', 'receivable', 'Outstanding rent from tenants', 'debit'),
('1025', 'Landlord Advance Receivable', 'asset', 'receivable', 'Advances given to landlords', 'debit');

-- LIABILITIES (2000-2999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
-- Trust Accounts (Liability = Money held in trust)
('2010', 'Rent Held in Trust', 'liability', 'trust_liability', 'Tenant rent held on behalf of landlords (LIABILITY)', 'credit'),
('2015', 'Tenant Security Deposits', 'liability', 'deposit', 'Security deposits held from tenants', 'credit'),

-- Landlord Accounts
('2020', 'Landlord Payable', 'liability', 'payable', 'Amount owed to individual landlords after deductions', 'credit'),

-- Deferred Income
('2030', 'Advance Rent Liability', 'liability', 'deferred_income', 'Rent collected in advance from tenants', 'credit');

-- EQUITY (3000-3999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
('3010', 'Owner Equity', 'equity', 'equity', 'Owner capital contribution', 'credit'),
('3020', 'Retained Earnings', 'equity', 'retained_earnings', 'Accumulated profits or losses', 'credit');

-- INCOME (4000-4999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
-- Operating Income (Company Income Only)
('4010', 'Management Fee Income', 'income', 'service_income', 'Management fees charged to landlords (NOT tenant rent)', 'credit'),
('4020', 'Late Payment Fees', 'income', 'service_income', 'Late payment penalties collected', 'credit'),
('4030', 'Utility Income', 'income', 'service_income', 'Utility charges passed to tenants', 'credit'),
('4040', 'Commission Income', 'income', 'service_income', 'Commission from landlords', 'credit'),
('4050', 'Miscellaneous Income', 'income', 'service_income', 'Other income sources', 'credit');

-- EXPENSES (5000-5999)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category, description, normal_balance) VALUES
-- Operating Expenses
('5010', 'Maintenance & Repairs', 'expense', 'operating_expense', 'Building maintenance and repairs (tenant-related)', 'debit'),
('5015', 'Property Management Expenses', 'expense', 'operating_expense', 'Direct property management costs', 'debit'),
('5020', 'Salaries & Wages', 'expense', 'personnel_expense', 'Staff salaries and wages', 'debit'),
('5030', 'Utilities Expense', 'expense', 'operating_expense', 'Water, electricity, gas for common areas', 'debit'),
('5040', 'Insurance Expense', 'expense', 'operating_expense', 'Property and liability insurance', 'debit'),
('5050', 'Commission Paid', 'expense', 'operating_expense', 'Commissions paid to landlords', 'debit'),
('5060', 'Administrative Expense', 'expense', 'operating_expense', 'Office supplies, communications, miscellaneous', 'debit'),
('5070', 'Transportation Expense', 'expense', 'operating_expense', 'Vehicle and travel expenses', 'debit'),
('5080', 'Office Rent Expense', 'expense', 'operating_expense', 'Office space rental', 'debit');

-- Recreate the account_balances view
CREATE OR REPLACE VIEW account_balances AS
SELECT 
  coa.id,
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.account_category,
  coa.normal_balance,
  COALESCE(SUM(CASE WHEN coa.normal_balance = 'debit' THEN gl.debit - gl.credit ELSE gl.credit - gl.debit END), 0) as current_balance,
  COALESCE(SUM(gl.debit), 0) as total_debits,
  COALESCE(SUM(gl.credit), 0) as total_credits
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.id = gl.account_id
WHERE coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.account_category, coa.normal_balance;
