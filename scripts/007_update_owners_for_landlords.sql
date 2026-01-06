-- Update owners table to support landlords functionality
-- The owners table will be used to store landlord records (property owners)
-- instead of the profiles table which is for system users only

-- Add any additional fields if needed
ALTER TABLE owners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the landlord_stats view to use owners table
DROP VIEW IF EXISTS landlord_stats CASCADE;

CREATE OR REPLACE VIEW landlord_stats AS
SELECT 
  o.id as landlord_id,
  o.name as first_name,
  '' as last_name,
  o.email,
  '' as company_name,
  COUNT(DISTINCT p.id) as total_properties,
  COALESCE(SUM(p.total_units), 0) as total_units,
  COUNT(DISTINCT t.id) as total_tenants,
  COALESCE(SUM(t.monthly_rent), 0) as total_monthly_revenue
FROM owners o
LEFT JOIN properties p ON p.landlord_id = o.id
LEFT JOIN tenants t ON t.property_id = p.id
GROUP BY o.id, o.name, o.email;

-- Grant access to the view
GRANT SELECT ON landlord_stats TO authenticated;

-- Update RLS policies to ensure admins can manage owners as landlords
-- (These policies already exist based on the schema, but we're documenting them here)
-- Admins can insert, update, delete, and view all owners
-- This allows the admin system to manage landlord records properly
