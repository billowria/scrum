-- Add company_id to daily_reports table (missed in original migration)

-- Add company_id column to daily_reports table
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_company_id ON daily_reports(company_id);

-- Update existing records to assign them to companies based on the user's company
UPDATE daily_reports
SET company_id = users.company_id
FROM users
WHERE daily_reports.user_id = users.id
AND users.company_id IS NOT NULL;

-- Add RLS policy for daily_reports
DROP POLICY IF EXISTS "Daily reports company isolation" ON daily_reports;
CREATE POLICY "Daily reports company isolation" ON daily_reports
  FOR ALL USING (
    company_id = (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Enable RLS on daily_reports if not already enabled
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;