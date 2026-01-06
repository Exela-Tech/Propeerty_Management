-- Add payment_due_day column to owners table
ALTER TABLE owners ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 30;

-- Add comment explaining the field
COMMENT ON COLUMN owners.payment_due_day IS 'Day of the month when landlord payment is due (5, 15, or 30)';
