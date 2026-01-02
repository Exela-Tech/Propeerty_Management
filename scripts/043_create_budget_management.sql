CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_name VARCHAR(255) NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER,
  property_id UUID REFERENCES properties(id),
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'archived')),
  created_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, budget_year, budget_month)
);

CREATE TABLE IF NOT EXISTS budget_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  category_id UUID REFERENCES expense_categories(id),
  budgeted_amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_variances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES budget_line_items(id),
  actual_amount NUMERIC(12, 2) NOT NULL,
  variance_amount NUMERIC(12, 2) NOT NULL,
  variance_percentage NUMERIC(5, 2),
  variance_type TEXT CHECK (variance_type IN ('favorable', 'unfavorable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgets_year ON budgets(budget_year);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_property ON budgets(property_id);
CREATE INDEX idx_budget_line_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_variances_budget ON budget_variances(budget_id);
