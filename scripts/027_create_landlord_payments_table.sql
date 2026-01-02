-- Create landlord_payments table to track payments made to landlords
CREATE TABLE IF NOT EXISTS landlord_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  receipt_number VARCHAR(10) UNIQUE NOT NULL,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_landlord_payments_landlord_id ON landlord_payments(landlord_id);
CREATE INDEX idx_landlord_payments_payment_date ON landlord_payments(payment_date);
