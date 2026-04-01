-- 044_045_fix_deposit_items_relationships.sql
-- Combined fix for deposit_items schema + relationships.
--
-- deposit_items.payment_id is polymorphic:
--   - tenant_payments.id
--   - landlord_payments.id
-- Therefore payment_id MUST NOT have an FK to tenant_payments.
--
-- deposit_items should instead relate via:
--   - tenant_id -> tenants(id)
--   - landlord_id -> owners(id)

BEGIN;

-- 1) Remove incorrect FK constraints (safe no matter what exists)
ALTER TABLE deposit_items
DROP CONSTRAINT IF EXISTS fk_deposit_items_tenant_payment;

ALTER TABLE deposit_items
DROP CONSTRAINT IF EXISTS deposit_items_tenant_payment_fkey;

-- 2) Drop existing tenant/landlord constraints so we can recreate cleanly
ALTER TABLE deposit_items
DROP CONSTRAINT IF EXISTS deposit_items_tenant_fkey;

ALTER TABLE deposit_items
DROP CONSTRAINT IF EXISTS deposit_items_landlord_fkey;

-- 3) Add correct FK for tenant_id
ALTER TABLE deposit_items
ADD CONSTRAINT deposit_items_tenant_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- 4) Add correct FK for landlord_id
ALTER TABLE deposit_items
ADD CONSTRAINT deposit_items_landlord_fkey
  FOREIGN KEY (landlord_id) REFERENCES owners(id) ON DELETE SET NULL;

-- 5) Add useful indexes
CREATE INDEX IF NOT EXISTS idx_deposit_items_payment_id ON deposit_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_deposit_items_tenant_id ON deposit_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposit_items_landlord_id ON deposit_items(landlord_id);

COMMIT;
