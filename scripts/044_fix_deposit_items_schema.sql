-- Fix the deposit_items table to properly reference tenant payments
ALTER TABLE deposit_items
ADD CONSTRAINT fk_deposit_items_tenant_payment
FOREIGN KEY (payment_id) REFERENCES tenant_payments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_deposit_items_payment_id ON deposit_items(payment_id);
