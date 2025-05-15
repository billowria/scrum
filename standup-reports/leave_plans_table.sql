-- Create leave_plans table for tracking team member leave plans
CREATE TABLE IF NOT EXISTS public.leave_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for leave_plans table
ALTER TABLE public.leave_plans ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all leave plans (everyone can see all leave plans)
CREATE POLICY "Users can view all leave plans" 
  ON public.leave_plans 
  FOR SELECT 
  USING (true);

-- Policy to allow users to insert their own leave plans
CREATE POLICY "Users can insert their own leave plans" 
  ON public.leave_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own leave plans
CREATE POLICY "Users can update their own leave plans" 
  ON public.leave_plans 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own leave plans
CREATE POLICY "Users can delete their own leave plans" 
  ON public.leave_plans 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.leave_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS leave_plans_user_id_idx ON public.leave_plans (user_id);
CREATE INDEX IF NOT EXISTS leave_plans_date_range_idx ON public.leave_plans (start_date, end_date);
CREATE INDEX IF NOT EXISTS leave_plans_status_idx ON public.leave_plans (status);
