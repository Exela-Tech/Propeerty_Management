-- Update the payment_method constraint to include all payment methods
ALTER TABLE tenant_payments DROP CONSTRAINT IF EXISTS tenant_payments_payment_method_check;

ALTER TABLE tenant_payments ADD CONSTRAINT tenant_payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'card'));
