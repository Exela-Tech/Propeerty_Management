-- Make landlord_id nullable since we're using owners table to store landlord data
ALTER TABLE public.owners 
ALTER COLUMN landlord_id DROP NOT NULL;

-- Update the landlord_stats view to work with nullable landlord_id
DROP VIEW IF EXISTS public.landlord_stats;

CREATE OR REPLACE VIEW public.landlord_stats AS
SELECT 
  o.id as landlord_id,
  o.name as landlord_name,
  o.email,
  o.phone,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT u.id) as total_units,
  COUNT(DISTINCT t.id) as total_tenants,
  COALESCE(SUM(t.monthly_rent), 0) as total_monthly_revenue
FROM public.owners o
LEFT JOIN public.properties p ON p.owner_id = o.id
LEFT JOIN public.units u ON u.property_id = p.id
LEFT JOIN public.tenants t ON t.property_id = p.id
GROUP BY o.id, o.name, o.email, o.phone;
