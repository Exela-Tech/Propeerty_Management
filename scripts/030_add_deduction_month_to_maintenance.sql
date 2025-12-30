-- Add deduction_month field to maintenance_requests table
-- This allows posting maintenance expenses to any future month as advance deductions
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS deduction_month CHARACTER VARYING;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_maintenance_deduction_month 
ON maintenance_requests(property_id, deduction_month);
