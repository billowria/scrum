-- Fix RLS policies to resolve circular dependency in CompanyContext
-- This adds a policy for users to read their own data without company restrictions

-- Add policy for users to read their own data (resolves circular dependency)
CREATE POLICY "Users can view their own user data" ON users
  FOR SELECT USING (id = auth.uid());

-- Note: The "Users can view users in their company" policy will still apply for other users
-- This creates an OR condition where users can see:
-- 1. Their own data (any company_id)
-- 2. Other users in the same company (requires company_id match)