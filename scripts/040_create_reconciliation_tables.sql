CREATE TABLE IF NOT EXISTS reconciliations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_type TEXT NOT NULL CHECK (reconciliation_type IN ('bank', 'account')),
  reference_id UUID NOT NULL,
  reconciliation_date DATE NOT NULL,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reconciliations_type ON reconciliations(reconciliation_type);
CREATE INDEX idx_reconciliations_date ON reconciliations(reconciliation_date);
