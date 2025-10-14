-- Add type column to leave_plans table
ALTER TABLE public.leave_plans ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'vacation' CHECK (type IN ('vacation', 'sick', 'personal', 'family', 'other'));

-- Create index on the type column
CREATE INDEX IF NOT EXISTS leave_plans_type_idx ON public.leave_plans (type);