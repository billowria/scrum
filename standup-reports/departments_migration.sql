-- Add new department table
CREATE TABLE IF NOT EXISTS "departments" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now(),
  "director_id" uuid REFERENCES "users" ("id") ON DELETE SET NULL
);

-- Add department_id to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Add department_id to users table (for direct department assignments)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Update role check constraint to include 'director' role
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('member', 'manager', 'director'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_director_id ON departments(director_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for departments table
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON "departments"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to assign a team to a department
CREATE OR REPLACE FUNCTION public.assign_team_to_department(team_id UUID, department_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.teams
  SET department_id = department_id
  WHERE id = team_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign a director to a department
CREATE OR REPLACE FUNCTION public.assign_director_to_department(department_id UUID, director_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify the user exists and has director role
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = director_id AND role = 'director') THEN
    RAISE EXCEPTION 'Invalid director ID or user is not a director';
  END IF;
  
  UPDATE public.departments
  SET director_id = director_id
  WHERE id = department_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to promote a user to director role
CREATE OR REPLACE FUNCTION public.promote_to_director(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET role = 'director'
  WHERE id = user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up row-level security policies for departments
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;

-- Policy for directors to manage their departments
CREATE POLICY "Directors can manage their departments" 
ON "departments"
FOR ALL
TO authenticated
USING (
  director_id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'director') OR
  role() = 'service_role'
);

-- Policy for everyone to view departments
CREATE POLICY "Everyone can view departments" 
ON "departments"
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 