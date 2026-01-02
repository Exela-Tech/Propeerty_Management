ALTER TABLE tenant_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_receipt_number ON tenant_payments(receipt_number);
