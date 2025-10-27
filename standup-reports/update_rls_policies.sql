-- Update RLS policies to enforce company-based data isolation

-- Update users table RLS policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own user data" ON users;
CREATE POLICY "Company managers can create users in their company" ON users
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

DROP POLICY IF EXISTS "Users can update their own user data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Managers can update users in their company" ON users
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  )
  WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Update teams table RLS policies
DROP POLICY IF EXISTS "Users can view all teams" ON teams;
CREATE POLICY "Users can view teams in their company" ON teams
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert teams in their company" ON teams
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

CREATE POLICY "Managers can update teams in their company" ON teams
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

CREATE POLICY "Managers can delete teams in their company" ON teams
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

-- Update projects table RLS policies
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view projects in their company" ON projects
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects in their company" ON projects
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their company" ON projects
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their company" ON projects
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Update tasks table RLS policies
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
CREATE POLICY "Users can view tasks in their company" ON tasks
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their company" ON tasks
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their company" ON tasks
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their company" ON tasks
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Update leave_plans table RLS policies
DROP POLICY IF EXISTS "Users can view all leave plans" ON leave_plans;
CREATE POLICY "Users can view leave plans in their company" ON leave_plans
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own leave plans" ON leave_plans
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own leave plans" ON leave_plans
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own leave plans" ON leave_plans
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Update announcements table RLS policies
DROP POLICY IF EXISTS "Users can view all announcements" ON announcements;
CREATE POLICY "Users can view announcements in their company" ON announcements
  FOR SELECT USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert announcements in their company" ON announcements
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

CREATE POLICY "Managers can update announcements in their company" ON announcements
  FOR UPDATE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

CREATE POLICY "Managers can delete announcements in their company" ON announcements
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      SELECT role 
      FROM users 
      WHERE id = auth.uid()
    ) = 'manager'
  );

-- Enable RLS for all tables that will have company isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;