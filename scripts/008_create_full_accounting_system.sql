-- Full-Fledged Accounting System for Property Management
-- This script creates a comprehensive accounting module with Trust Accounting principles

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Account Types (Chart of Accounts hierarchy)
CREATE TYPE account_type AS ENUM (
  'ASSET',           -- Assets
  'LIABILITY',       -- Liabilities
  'EQUITY',          -- Equity
  'REVENUE',         -- Income/Revenue
  'EXPENSE'          -- Expenses
);

-- Account Categories (for detailed classification)
CREATE TYPE account_category AS ENUM (
  -- Assets
  'CURRENT_ASSET', 'FIXED_ASSET', 'BANK_ACCOUNT', 'TRUST_ACCOUNT',
  -- Liabilities
  'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'TRUST_LIABILITY', 'ACCOUNTS_PAYABLE',
  -- Equity
  'OWNERS_EQUITY', 'RETAINED_EARNINGS',
  -- Revenue
  'OPERATING_REVENUE', 'MANAGEMENT_FEE_INCOME', 'OTHER_INCOME',
  -- Expenses
  'OPERATING_EXPENSE', 'MAINTENANCE_EXPENSE', 'ADMINISTRATIVE_EXPENSE', 'TAX_EXPENSE'
);

-- Journal Types
CREATE TYPE journal_type AS ENUM (
  'GENERAL',         -- General Journal (adjustments, corrections)
  'SALES',           -- Sales Journal (rent + management fees)
  'PURCHASE',        -- Purchase Journal (repairs, vendor bills)
  'CASH',            -- Cash Journal (deposits, withdrawals)
  'PAYROLL',         -- Payroll Journal
  'CLOSING'          -- Closing entries
);

-- Transaction Status
CREATE TYPE transaction_status AS ENUM (
  'DRAFT',           -- Draft transaction
  'POSTED',          -- Posted to GL
  'REVERSED',        -- Reversed transaction
  'VOIDED'           -- Voided transaction
);

-- Payment Terms
CREATE TYPE payment_terms AS ENUM (
  'IMMEDIATE',       -- Due immediately
  'NET_7',           -- Net 7 days
  'NET_15',          -- Net 15 days
  'NET_30',          -- Net 30 days
  'NET_45',          -- Net 45 days
  'NET_60'           -- Net 60 days
);

-- ============================================================================
-- CHART OF ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code VARCHAR(20) NOT NULL UNIQUE,  -- e.g., "1000", "2000-001"
  account_name TEXT NOT NULL,
  account_type account_type NOT NULL,
  account_category account_category,
  parent_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,  -- Hierarchy level (1 = top level)
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_account BOOLEAN NOT NULL DEFAULT false,  -- System accounts cannot be deleted
  description TEXT,
  normal_balance account_type NOT NULL,  -- DEBIT for Assets/Expenses, CREDIT for Liabilities/Equity/Revenue
  currency TEXT NOT NULL DEFAULT 'UGX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for Chart of Accounts
CREATE INDEX idx_coa_code ON public.chart_of_accounts(account_code);
CREATE INDEX idx_coa_type ON public.chart_of_accounts(account_type);
CREATE INDEX idx_coa_parent ON public.chart_of_accounts(parent_account_id);
CREATE INDEX idx_coa_active ON public.chart_of_accounts(is_active);

-- ============================================================================
-- GENERAL LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  journal_entry_id UUID,  -- Will reference journal_entries table
  description TEXT NOT NULL,
  reference_number VARCHAR(50),  -- External reference (invoice, receipt, etc.)
  debit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  running_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Running balance for this account
  currency TEXT NOT NULL DEFAULT 'UGX',
  status transaction_status NOT NULL DEFAULT 'POSTED',
  period_month INTEGER NOT NULL,  -- For period locking
  period_year INTEGER NOT NULL,
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_by UUID REFERENCES public.general_ledger(id),  -- Points to reversal entry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.profiles(id),
  CONSTRAINT check_debit_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- Create indexes for General Ledger
CREATE INDEX idx_gl_account ON public.general_ledger(account_id);
CREATE INDEX idx_gl_date ON public.general_ledger(transaction_date);
CREATE INDEX idx_gl_period ON public.general_ledger(period_year, period_month);
CREATE INDEX idx_gl_journal ON public.general_ledger(journal_entry_id);
CREATE INDEX idx_gl_status ON public.general_ledger(status);
CREATE INDEX idx_gl_reference ON public.general_ledger(reference_number);

-- ============================================================================
-- JOURNAL ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_number VARCHAR(50) NOT NULL UNIQUE,  -- Auto-generated (e.g., "GJ-2024-001")
  journal_type journal_type NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status transaction_status NOT NULL DEFAULT 'DRAFT',
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_by UUID REFERENCES public.journal_entries(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.profiles(id),
  CONSTRAINT check_balanced_entry CHECK (total_debit = total_credit)
);

-- Create indexes for Journal Entries
CREATE INDEX idx_journal_type ON public.journal_entries(journal_type);
CREATE INDEX idx_journal_date ON public.journal_entries(entry_date);
CREATE INDEX idx_journal_period ON public.journal_entries(period_year, period_month);
CREATE INDEX idx_journal_status ON public.journal_entries(status);
CREATE INDEX idx_journal_number ON public.journal_entries(journal_number);

-- ============================================================================
-- JOURNAL ENTRY LINES (Detail lines for each journal entry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  debit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  reference_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_line_debit_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- Create indexes for Journal Entry Lines
CREATE INDEX idx_jel_journal ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account ON public.journal_entry_lines(account_id);

-- ============================================================================
-- LANDLORD SUB-LEDGERS (Trust Accounting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.landlord_sub_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,  -- 'RENT_COLLECTED', 'EXPENSE_PAID', 'FEE_CHARGED', 'PAYOUT'
  description TEXT NOT NULL,
  rent_collected DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expenses_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  management_fee_charged DECIMAL(15, 2) NOT NULL DEFAULT 0,
  payout_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  running_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Net amount owed to landlord
  currency TEXT NOT NULL DEFAULT 'UGX',
  reference_id UUID,  -- Reference to rent_payment, expense, landlord_payment, etc.
  reference_type VARCHAR(50),  -- 'rent_payment', 'expense', 'landlord_payment'
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for Landlord Sub-ledgers
CREATE INDEX idx_landlord_sub_ledger_landlord ON public.landlord_sub_ledgers(landlord_id);
CREATE INDEX idx_landlord_sub_ledger_date ON public.landlord_sub_ledgers(transaction_date);
CREATE INDEX idx_landlord_sub_ledger_period ON public.landlord_sub_ledgers(period_year, period_month);
CREATE INDEX idx_landlord_sub_ledger_reference ON public.landlord_sub_ledgers(reference_id, reference_type);

-- ============================================================================
-- ACCOUNTS PAYABLE (AP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES public.owners(id),  -- Can be landlord or external vendor
  vendor_name TEXT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms payment_terms NOT NULL DEFAULT 'NET_30',
  subtotal DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(15, 2) NOT NULL,  -- total_amount - paid_amount
  currency TEXT NOT NULL DEFAULT 'UGX',
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',  -- 'OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'VOIDED'
  description TEXT,
  property_id UUID REFERENCES public.properties(id),
  expense_category VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_ap_balance CHECK (balance_amount = total_amount - paid_amount)
);

-- Create indexes for Accounts Payable
CREATE INDEX idx_ap_vendor ON public.accounts_payable(vendor_id);
CREATE INDEX idx_ap_due_date ON public.accounts_payable(due_date);
CREATE INDEX idx_ap_status ON public.accounts_payable(status);
CREATE INDEX idx_ap_invoice ON public.accounts_payable(invoice_number);

-- ============================================================================
-- AP PAYMENTS (Payments made against AP invoices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ap_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ap_invoice_id UUID NOT NULL REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,  -- 'cash', 'check', 'bank_transfer', etc.
  bank_account_id UUID,  -- Reference to bank accounts table
  reference_number VARCHAR(100),
  notes TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for AP Payments
CREATE INDEX idx_ap_payment_invoice ON public.ap_payments(ap_invoice_id);
CREATE INDEX idx_ap_payment_date ON public.ap_payments(payment_date);
CREATE INDEX idx_ap_payment_journal ON public.ap_payments(journal_entry_id);

-- ============================================================================
-- BANK ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  bank_name TEXT NOT NULL,
  account_type VARCHAR(50) NOT NULL,  -- 'TRUST', 'OPERATING', 'PAYROLL', 'TAX'
  currency TEXT NOT NULL DEFAULT 'UGX',
  opening_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  gl_account_id UUID REFERENCES public.chart_of_accounts(id),  -- Link to GL account
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for Bank Accounts
CREATE INDEX idx_bank_account_type ON public.bank_accounts(account_type);
CREATE INDEX idx_bank_account_active ON public.bank_accounts(is_active);
CREATE INDEX idx_bank_account_gl ON public.bank_accounts(gl_account_id);

-- ============================================================================
-- BANK RECONCILIATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  reconciliation_date DATE NOT NULL,
  statement_balance DECIMAL(15, 2) NOT NULL,
  book_balance DECIMAL(15, 2) NOT NULL,
  reconciled_balance DECIMAL(15, 2) NOT NULL,
  difference DECIMAL(15, 2) NOT NULL DEFAULT 0,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for Bank Reconciliations
CREATE INDEX idx_bank_recon_account ON public.bank_reconciliations(bank_account_id);
CREATE INDEX idx_bank_recon_date ON public.bank_reconciliations(reconciliation_date);

-- ============================================================================
-- PERIOD LOCKING (Audit & Compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  period_name TEXT NOT NULL,  -- e.g., "January 2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period_month, period_year)
);

-- Create indexes for Accounting Periods
CREATE INDEX idx_period_date ON public.accounting_periods(start_date, end_date);
CREATE INDEX idx_period_locked ON public.accounting_periods(is_locked);

-- ============================================================================
-- AUDIT LOG (Transaction History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE', 'POST', 'REVERSE'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for Audit Log
CREATE INDEX idx_audit_table_record ON public.accounting_audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON public.accounting_audit_log(changed_at);
CREATE INDEX idx_audit_changed_by ON public.accounting_audit_log(changed_by);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_sub_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage all accounting data
CREATE POLICY "Admins can manage chart of accounts"
  ON public.chart_of_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all general ledger"
  ON public.general_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage journal entries"
  ON public.journal_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage landlord sub-ledgers"
  ON public.landlord_sub_ledgers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Landlords can view their sub-ledger"
  ON public.landlord_sub_ledgers FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can manage accounts payable"
  ON public.accounts_payable FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage bank accounts"
  ON public.bank_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage accounting periods"
  ON public.accounting_periods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log is read-only for admins
CREATE POLICY "Admins can view audit log"
  ON public.accounting_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate journal number
CREATE OR REPLACE FUNCTION generate_journal_number(j_type journal_type, p_year INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10);
  next_num INTEGER;
  journal_num VARCHAR(50);
BEGIN
  -- Set prefix based on journal type
  CASE j_type
    WHEN 'GENERAL' THEN prefix := 'GJ';
    WHEN 'SALES' THEN prefix := 'SJ';
    WHEN 'PURCHASE' THEN prefix := 'PJ';
    WHEN 'CASH' THEN prefix := 'CJ';
    WHEN 'PAYROLL' THEN prefix := 'PJ';
    WHEN 'CLOSING' THEN prefix := 'CL';
    ELSE prefix := 'JE';
  END CASE;
  
  -- Get next number for this journal type and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(journal_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.journal_entries
  WHERE journal_type = j_type
    AND period_year = p_year
    AND journal_number LIKE prefix || '-' || p_year || '-%';
  
  -- Format: GJ-2024-001
  journal_num := prefix || '-' || p_year || '-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN journal_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate running balance for an account
CREATE OR REPLACE FUNCTION calculate_account_balance(
  p_account_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_balance DECIMAL(15, 2);
  v_normal_balance account_type;
BEGIN
  -- Get normal balance for the account
  SELECT normal_balance INTO v_normal_balance
  FROM public.chart_of_accounts
  WHERE id = p_account_id;
  
  -- Calculate balance based on normal balance
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN v_normal_balance IN ('ASSET', 'EXPENSE') THEN
          debit_amount - credit_amount
        ELSE
          credit_amount - debit_amount
      END
    ), 0
  )
  INTO v_balance
  FROM public.general_ledger
  WHERE account_id = p_account_id
    AND transaction_date <= p_as_of_date
    AND status = 'POSTED'
    AND is_reversed = false;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to post journal entry to General Ledger
CREATE OR REPLACE FUNCTION post_journal_entry(p_journal_entry_id UUID)
RETURNS VOID AS $$
DECLARE
  v_entry RECORD;
  v_line RECORD;
  v_running_balance DECIMAL(15, 2);
BEGIN
  -- Get journal entry
  SELECT * INTO v_entry
  FROM public.journal_entries
  WHERE id = p_journal_entry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry not found';
  END IF;
  
  IF v_entry.status != 'DRAFT' THEN
    RAISE EXCEPTION 'Journal entry is not in DRAFT status';
  END IF;
  
  -- Check if period is locked
  IF EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE period_month = v_entry.period_month
      AND period_year = v_entry.period_year
      AND is_locked = true
  ) THEN
    RAISE EXCEPTION 'Accounting period is locked';
  END IF;
  
  -- Post each line to General Ledger
  FOR v_line IN 
    SELECT * FROM public.journal_entry_lines
    WHERE journal_entry_id = p_journal_entry_id
    ORDER BY line_number
  LOOP
    -- Calculate running balance for this account
    SELECT calculate_account_balance(v_line.account_id, v_entry.entry_date)
    INTO v_running_balance;
    
    -- Update running balance based on debit/credit
    IF v_line.debit_amount > 0 THEN
      v_running_balance := v_running_balance + v_line.debit_amount;
    ELSE
      v_running_balance := v_running_balance - v_line.credit_amount;
    END IF;
    
    -- Insert into General Ledger
    INSERT INTO public.general_ledger (
      transaction_date,
      account_id,
      journal_entry_id,
      description,
      reference_number,
      debit_amount,
      credit_amount,
      running_balance,
      currency,
      status,
      period_month,
      period_year,
      created_by,
      posted_at,
      posted_by
    ) VALUES (
      v_entry.entry_date,
      v_line.account_id,
      p_journal_entry_id,
      v_line.description,
      v_line.reference_number,
      v_line.debit_amount,
      v_line.credit_amount,
      v_running_balance,
      v_entry.currency,
      'POSTED',
      v_entry.period_month,
      v_entry.period_year,
      v_entry.created_by,
      NOW(),
      v_entry.created_by
    );
  END LOOP;
  
  -- Update journal entry status
  UPDATE public.journal_entries
  SET status = 'POSTED',
      posted_at = NOW(),
      posted_by = created_by
  WHERE id = p_journal_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL CHART OF ACCOUNTS (System Accounts for Trust Accounting)
-- ============================================================================

-- Insert default system accounts following Trust Accounting principles
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, account_category, level, is_system_account, normal_balance, description) VALUES
-- ASSETS (1000-1999)
('1000', 'Assets', 'ASSET', 'CURRENT_ASSET', 1, true, 'ASSET', 'Top-level asset account'),
('1100', 'Current Assets', 'ASSET', 'CURRENT_ASSET', 2, true, 'ASSET', 'Current assets category'),
('1110', 'Cash and Cash Equivalents', 'ASSET', 'CURRENT_ASSET', 3, true, 'ASSET', 'Cash on hand and in bank'),
('1120', 'Trust Bank Account', 'ASSET', 'TRUST_ACCOUNT', 3, true, 'ASSET', 'Bank account for tenant rent (held in trust)'),
('1130', 'Operating Bank Account', 'ASSET', 'BANK_ACCOUNT', 3, true, 'ASSET', 'Operating bank account for company operations'),
('1200', 'Accounts Receivable', 'ASSET', 'CURRENT_ASSET', 2, true, 'ASSET', 'Amounts owed to the company'),
('1500', 'Fixed Assets', 'ASSET', 'FIXED_ASSET', 2, true, 'ASSET', 'Fixed assets category'),

-- LIABILITIES (2000-2999)
('2000', 'Liabilities', 'LIABILITY', 'CURRENT_LIABILITY', 1, true, 'LIABILITY', 'Top-level liability account'),
('2100', 'Current Liabilities', 'LIABILITY', 'CURRENT_LIABILITY', 2, true, 'LIABILITY', 'Current liabilities category'),
('2110', 'Rent Trust Liability', 'LIABILITY', 'TRUST_LIABILITY', 3, true, 'LIABILITY', 'Rent collected from tenants (held in trust for landlords)'),
('2120', 'Landlord Payables', 'LIABILITY', 'ACCOUNTS_PAYABLE', 3, true, 'LIABILITY', 'Amounts owed to landlords'),
('2130', 'Accounts Payable', 'LIABILITY', 'ACCOUNTS_PAYABLE', 3, true, 'LIABILITY', 'Amounts owed to vendors'),
('2200', 'Tax Payable', 'LIABILITY', 'CURRENT_LIABILITY', 2, true, 'LIABILITY', 'Taxes owed to government'),

-- EQUITY (3000-3999)
('3000', 'Equity', 'EQUITY', 'OWNERS_EQUITY', 1, true, 'EQUITY', 'Top-level equity account'),
('3100', 'Owners Equity', 'EQUITY', 'OWNERS_EQUITY', 2, true, 'EQUITY', 'Owners equity'),
('3200', 'Retained Earnings', 'EQUITY', 'RETAINED_EARNINGS', 2, true, 'EQUITY', 'Retained earnings'),

-- REVENUE (4000-4999)
('4000', 'Revenue', 'REVENUE', 'OPERATING_REVENUE', 1, true, 'REVENUE', 'Top-level revenue account'),
('4100', 'Operating Revenue', 'REVENUE', 'OPERATING_REVENUE', 2, true, 'REVENUE', 'Operating revenue'),
('4110', 'Management Fee Income', 'REVENUE', 'MANAGEMENT_FEE_INCOME', 3, true, 'REVENUE', 'Management fees charged to landlords'),
('4200', 'Other Income', 'REVENUE', 'OTHER_INCOME', 2, true, 'REVENUE', 'Other income sources'),

-- EXPENSES (5000-5999)
('5000', 'Expenses', 'EXPENSE', 'OPERATING_EXPENSE', 1, true, 'EXPENSE', 'Top-level expense account'),
('5100', 'Operating Expenses', 'EXPENSE', 'OPERATING_EXPENSE', 2, true, 'EXPENSE', 'Operating expenses'),
('5110', 'Repairs and Maintenance', 'EXPENSE', 'MAINTENANCE_EXPENSE', 3, true, 'EXPENSE', 'Property repairs and maintenance'),
('5120', 'Administrative Expenses', 'EXPENSE', 'ADMINISTRATIVE_EXPENSE', 3, true, 'EXPENSE', 'Administrative expenses'),
('5200', 'Tax Expenses', 'EXPENSE', 'TAX_EXPENSE', 2, true, 'EXPENSE', 'Tax expenses');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
