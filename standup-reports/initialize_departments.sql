-- Initialize Departments Structure

-- First, add director role to allowed roles in users table
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('member', 'manager', 'director'));

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  director_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add department_id to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add department_id to users table (for direct department assignments)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for departments table
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to promote user to director
CREATE OR REPLACE FUNCTION public.promote_to_director(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET role = 'director'
  WHERE id = user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign director to department
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

-- Create function to assign team to department
CREATE OR REPLACE FUNCTION public.assign_team_to_department(team_id UUID, department_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.teams
  SET department_id = department_id
  WHERE id = team_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up row-level security policies for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policy for directors to manage departments
CREATE POLICY "Directors can manage departments" 
ON public.departments
FOR ALL
TO authenticated
USING (
  director_id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'director') OR
  role() = 'service_role'
);

-- Policy for everyone to view departments
CREATE POLICY "Everyone can view departments" 
ON public.departments
FOR SELECT
TO authenticated
USING (true);

-- Create new department view
CREATE OR REPLACE VIEW public.departments_view AS
SELECT 
  d.id,
  d.name,
  d.description,
  d.created_at,
  d.updated_at,
  d.director_id,
  u.name as director_name,
  u.email as director_email,
  (
    SELECT COUNT(*) 
    FROM public.teams t 
    WHERE t.department_id = d.id
  ) as team_count,
  (
    SELECT COUNT(*) 
    FROM public.users usr 
    WHERE usr.department_id = d.id
  ) as direct_member_count
FROM 
  public.departments d
LEFT JOIN 
  public.users u ON d.director_id = u.id;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Promote a specific user to be the first director (replace the ID with a valid user ID)
-- SELECT promote_to_director('REPLACE_WITH_USER_ID');

-- Create a sample department and assign the director (uncomment and replace IDs as needed)
-- INSERT INTO public.departments (name, description) 
-- VALUES ('Engineering', 'Software development and engineering teams');

-- SELECT assign_director_to_department(
--   (SELECT id FROM public.departments WHERE name = 'Engineering'),
--   'REPLACE_WITH_DIRECTOR_USER_ID'
-- ); 