-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL-friendly identifier for the company
  logo_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- The initial manager/owner
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add updated_at trigger for companies table
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
   BEFORE UPDATE ON companies
   FOR EACH ROW
   EXECUTE PROCEDURE update_companies_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies table
-- Users can view companies they belong to
CREATE POLICY "Users can view companies they belong to" ON companies
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT u.company_id 
      FROM users u 
      WHERE u.id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT created_by FROM companies WHERE id = companies.id
    )
  );

-- Only company creators can update their company
CREATE POLICY "Company creators can update their company" ON companies
  FOR UPDATE USING (created_by = auth.uid());

-- Anyone authenticated can create a company (for new signups)
CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');