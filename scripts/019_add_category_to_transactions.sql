-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;

-- Add check constraint for valid categories
ALTER TABLE transactions ADD CONSTRAINT transactions_category_check 
CHECK (category IN ('salary', 'transport', 'wage', 'internet', 'field_expense', 'office_rent', 'utilities', 'cleaning', 'maintenance', 'other'));

-- Make property_id nullable for internal expenses
ALTER TABLE transactions ALTER COLUMN property_id DROP NOT NULL;
