-- 1. Create a new join table to link managers to multiple teams.
DROP TABLE IF EXISTS manager_teams;

CREATE TABLE manager_teams (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT manager_teams_unique UNIQUE (manager_id, team_id)
);

-- 2. Add policies for the new table to restrict access.
--    - Allow admins to manage all assignments.
--    - Allow managers to view their own assignments.
ALTER TABLE manager_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access"
ON manager_teams
FOR ALL
USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);

CREATE POLICY "Allow managers to view their own team assignments"
ON manager_teams
FOR SELECT
USING (
  auth.uid() = manager_id
);

-- 3. To improve performance when fetching a manager's teams.
CREATE INDEX idx_manager_teams_manager_id ON manager_teams(manager_id);

-- 4. It's good practice to ensure the 'admin' role is a valid option.
--    If you have a 'roles' enum, you would alter it. If it's a text field, this is informational.
--    Assuming a user_roles enum doesn't exist and it's text based on common Supabase setups.
--    If you have an enum like this: CREATE TYPE user_role AS ENUM ('member', 'manager', 'director');
--    You would run: ALTER TYPE user_role ADD VALUE 'admin';

-- 5. Remove the old `team_id` from the `users` table for managers, as it's now redundant.
--    We will no longer store a single team for a manager in the user record.
--    NOTE: This is a destructive change. First, you should migrate existing manager/team relationships
--    to the new `manager_teams` table before running this.
--
--    Example migration script (run this BEFORE clearing the team_id):
--    INSERT INTO manager_teams (manager_id, team_id)
--    SELECT id, team_id
--    FROM users
--    WHERE role = 'manager' AND team_id IS NOT NULL;
--
--    After migrating, you could consider nullifying the team_id for managers.
--    UPDATE users SET team_id = NULL WHERE role = 'manager';

COMMENT ON COLUMN users.team_id IS 'The team a regular user belongs to. For managers, their teams are now stored in the manager_teams table.';

-- 6. Function to get all team IDs for a manager
CREATE OR REPLACE FUNCTION get_managed_team_ids(manager_id_param UUID)
RETURNS TABLE(team_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT mt.team_id FROM manager_teams mt WHERE mt.manager_id = manager_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 