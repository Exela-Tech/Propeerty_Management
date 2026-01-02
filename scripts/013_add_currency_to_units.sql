-- Add currency column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX';

-- Update existing units to have default currency
UPDATE units SET currency = 'UGX' WHERE currency IS NULL;
