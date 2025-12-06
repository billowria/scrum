-- Holidays Table for Company Holidays
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, date) -- One holiday per date per company
);

-- Enable Row Level Security
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Policy: All users in the company can view holidays
CREATE POLICY "Users can view company holidays" ON holidays
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Only managers can insert holidays
CREATE POLICY "Managers can insert holidays" ON holidays
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND users.company_id = holidays.company_id
    )
  );

-- Policy: Only managers can update holidays
CREATE POLICY "Managers can update holidays" ON holidays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND users.company_id = holidays.company_id
    )
  );

-- Policy: Only managers can delete holidays
CREATE POLICY "Managers can delete holidays" ON holidays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND users.company_id = holidays.company_id
    )
  );

-- Index for faster lookups by company and date
CREATE INDEX idx_holidays_company_date ON holidays(company_id, date);
