CREATE TABLE IF NOT EXISTS tax_configuration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vat_rate NUMERIC(5, 4) DEFAULT 0.18,
  paye_enabled BOOLEAN DEFAULT true,
  withholding_tax_rate NUMERIC(5, 4) DEFAULT 0.05,
  nssf_rate NUMERIC(5, 4) DEFAULT 0.1,
  sacco_rate NUMERIC(5, 4) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('VAT', 'PAYE', 'WITHHOLDING_TAX', 'NSSF')),
  amount NUMERIC(12, 2) NOT NULL,
  description VARCHAR(255),
  reference_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'filed')),
  transaction_date DATE NOT NULL,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tax_transactions_type ON tax_transactions(tax_type);
CREATE INDEX idx_tax_transactions_status ON tax_transactions(status);
CREATE INDEX idx_tax_transactions_date ON tax_transactions(transaction_date);
