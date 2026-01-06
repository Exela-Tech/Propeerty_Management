-- Correct the foreign key relationships to match actual schema
-- deposit_items table already has tenant_id and landlord_id columns
-- Just add proper foreign key constraints

-- Drop incorrect constraints if they exist
ALTER TABLE IF EXISTS deposit_items 
DROP CONSTRAINT IF EXISTS deposit_items_tenant_payment_fkey;

-- Add correct foreign key for tenant_id
ALTER TABLE deposit_items 
ADD CONSTRAINT deposit_items_tenant_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- Add foreign key for landlord_id  
ALTER TABLE deposit_items 
ADD CONSTRAINT deposit_items_landlord_fkey 
  FOREIGN KEY (landlord_id) REFERENCES owners(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_deposit_items_tenant ON deposit_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposit_items_landlord ON deposit_items(landlord_id);
