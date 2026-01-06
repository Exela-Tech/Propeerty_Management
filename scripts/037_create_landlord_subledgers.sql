-- Create landlord sub-ledgers to track what each landlord is owed
-- This maintains individual landlord accounting statements

CREATE TABLE IF NOT EXISTS landlord_subledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES owners(id),
  transaction_date DATE NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('rent_collected', 'management_fee', 'expense_deduction', 'commission', 'payment_to_landlord', 'adjustment')),
  description TEXT NOT NULL,
  
  -- Rent collected (from tenants)
  rent_collected NUMERIC DEFAULT 0,
  
  -- Deductions from rent
  management_fee_deducted NUMERIC DEFAULT 0,
  expense_deducted NUMERIC DEFAULT 0,  -- maintenance, repairs, etc.
  commission_deducted NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  
  -- Amount paid to landlord
  amount_paid_to_landlord NUMERIC DEFAULT 0,
  
  -- Running balance
  balance_before NUMERIC DEFAULT 0,
  balance_after NUMERIC DEFAULT 0,
  
  -- Tracking
  reference_id UUID,
  property_id UUID REFERENCES properties(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landlord_subledger_landlord ON landlord_subledger(landlord_id);
CREATE INDEX idx_landlord_subledger_date ON landlord_subledger(transaction_date);
CREATE INDEX idx_landlord_subledger_reference ON landlord_subledger(reference_type);

-- View for landlord balances
CREATE OR REPLACE VIEW landlord_balances AS
SELECT 
  ls.landlord_id,
  o.name as landlord_name,
  COALESCE(SUM(ls.rent_collected), 0) as total_rent_collected,
  COALESCE(SUM(ls.management_fee_deducted), 0) as total_management_fees,
  COALESCE(SUM(ls.expense_deducted), 0) as total_expenses,
  COALESCE(SUM(ls.commission_deducted), 0) as total_commissions,
  COALESCE(SUM(ls.amount_paid_to_landlord), 0) as total_paid,
  COALESCE(SUM(ls.rent_collected - ls.management_fee_deducted - ls.expense_deducted - ls.commission_deducted - ls.other_deductions), 0) as balance_owed
FROM landlord_subledger ls
LEFT JOIN owners o ON ls.landlord_id = o.id
GROUP BY ls.landlord_id, o.name;
