-- Get the Bank Account GL account ID (should be 1010 or similar)
-- First, ensure we have bank accounts in the chart of accounts
INSERT INTO chart_of_accounts 
  (account_code, account_name, account_type, account_category, description, normal_balance, is_active)
VALUES 
  ('1010', 'Exela Bank Account', 'asset', 'cash_and_bank', 'Exela Bank current account for tenant rent deposits', 'debit', true),
  ('1011', 'Cash Bank Account', 'asset', 'cash_and_bank', 'Cash Bank current account for tenant rent deposits', 'debit', true)
ON CONFLICT (account_code) DO NOTHING;

-- Now insert the bank accounts
INSERT INTO bank_accounts 
  (account_name, bank_name, gl_account_id, currency, is_active)
SELECT 
  'Exela Bank - Main Account' as account_name,
  'Exela Bank' as bank_name,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1010') as gl_account_id,
  'UGX' as currency,
  true as is_active
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_name = 'Exela Bank - Main Account');

INSERT INTO bank_accounts 
  (account_name, bank_name, gl_account_id, currency, is_active)
SELECT 
  'Cash Bank - Main Account' as account_name,
  'Cash Bank' as bank_name,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1011') as gl_account_id,
  'UGX' as currency,
  true as is_active
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_name = 'Cash Bank - Main Account');
