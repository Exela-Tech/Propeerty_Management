CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  employment_date DATE NOT NULL,
  position VARCHAR(100),
  salary NUMERIC(12, 2) NOT NULL,
  employment_type TEXT DEFAULT 'full-time',
  status TEXT DEFAULT 'active',
  nssf_number VARCHAR(50),
  tin_number VARCHAR(50),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'processed', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  gross_salary NUMERIC(12, 2) NOT NULL,
  paye_deduction NUMERIC(12, 2) DEFAULT 0,
  nssf_deduction NUMERIC(12, 2) DEFAULT 0,
  loan_deduction NUMERIC(12, 2) DEFAULT 0,
  sacco_deduction NUMERIC(12, 2) DEFAULT 0,
  other_deductions NUMERIC(12, 2) DEFAULT 0,
  net_salary NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX idx_payroll_records_employee ON payroll_records(employee_id);
CREATE INDEX idx_payroll_periods_status ON payroll_periods(status);
