-- Add balance tracking to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Update existing tenants to calculate their balance
UPDATE tenants 
SET balance = COALESCE(monthly_rent, 0);

-- Create a function to update tenant balance when payment is recorded
CREATE OR REPLACE FUNCTION update_tenant_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total paid and recalculate balance
  UPDATE tenants 
  SET 
    total_paid = COALESCE(total_paid, 0) + NEW.amount,
    balance = COALESCE(monthly_rent, 0) - (COALESCE(total_paid, 0) + NEW.amount),
    last_payment_date = NEW.payment_date
  WHERE id = NEW.tenant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance on payment
DROP TRIGGER IF EXISTS trigger_update_tenant_balance ON tenant_payments;
CREATE TRIGGER trigger_update_tenant_balance
  AFTER INSERT ON tenant_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_balance();
