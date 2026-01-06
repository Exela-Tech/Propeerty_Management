-- Add payment_period and overpayment_credit columns to tenant_payments table
ALTER TABLE tenant_payments
ADD COLUMN IF NOT EXISTS payment_period VARCHAR(7),
ADD COLUMN IF NOT EXISTS overpayment_credit NUMERIC DEFAULT 0;

-- Add prepaid_balance column to tenants table to track overpayment credits
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS prepaid_balance NUMERIC DEFAULT 0;
