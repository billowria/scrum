-- Add billing details to companies if not exists
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_details JSONB DEFAULT '{}'::jsonb;

-- Ensure billing_details is viewable/editable by company admins (handled by existing policies usually, but good to check)
-- Existing policies usually cover 'select *' and 'update' for team members/admins.
-- No extra policy needed as long as they can access the companies table.
