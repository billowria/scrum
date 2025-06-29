-- Create the announcements table
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now(),
  "title" text NOT NULL,
  "content" text NOT NULL,
  "team_id" uuid REFERENCES "teams" ("id") ON DELETE CASCADE,
  "created_by" uuid REFERENCES "users" ("id") ON DELETE CASCADE,
  "expiry_date" timestamp with time zone NOT NULL
);

-- Create the announcement dismissals table to track which users have dismissed which announcements
CREATE TABLE IF NOT EXISTS "announcement_dismissals" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  "user_id" uuid REFERENCES "users" ("id") ON DELETE CASCADE NOT NULL,
  "announcement_id" uuid REFERENCES "announcements" ("id") ON DELETE CASCADE NOT NULL,
  "dismissed_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("user_id", "announcement_id")
);

-- Table to track which user has read which announcement
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  read_at timestamp,
  UNIQUE (announcement_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_announcements_team_id" ON "announcements" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_announcements_created_by" ON "announcements" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_announcements_expiry_date" ON "announcements" ("expiry_date");
CREATE INDEX IF NOT EXISTS "idx_announcement_dismissals_user_id" ON "announcement_dismissals" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_announcement_dismissals_announcement_id" ON "announcement_dismissals" ("announcement_id");

-- Create a function and trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON "announcements"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create announcements view
CREATE OR REPLACE VIEW announcements_with_metadata AS
SELECT 
  a.*,
  u.name as creator_name,
  t.name as team_name
FROM announcements a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN teams t ON a.team_id = t.id;

-- Set up row-level security policies for announcements
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;

-- Policy for managers and admins to manage announcements
CREATE POLICY "Managers and admins can CRUD announcements" 
ON "announcements"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin')
  )
  OR role() = 'service_role'
);

-- Policy for team members to view announcements for their team only
CREATE POLICY "Team members can view announcements for their team" 
ON "announcements"
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM users
    WHERE id = auth.uid()
  )
  OR role() = 'service_role'
);

-- Set up row-level security policies for announcement dismissals
ALTER TABLE "announcement_dismissals" ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own dismissals
CREATE POLICY "Users can CRUD their own dismissals" 
ON "announcement_dismissals"
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR role() = 'service_role');

-- Create a helper function to check if a user is a manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
DECLARE
  is_mgr BOOLEAN;
BEGIN
  SELECT role = 'manager' INTO is_mgr
  FROM users
  WHERE id = auth.uid();
  RETURN is_mgr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create/update announcements
CREATE OR REPLACE FUNCTION manage_announcement(
  p_title text,
  p_content text,
  p_team_id uuid,
  p_expiry_date timestamp with time zone,
  p_announcement_id uuid DEFAULT NULL
)
RETURNS announcements
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_result announcements;
BEGIN
  -- Get current user ID and role
  SELECT id, role INTO v_user_id, v_user_role
  FROM users 
  WHERE id = auth.uid();
  
  -- Check if user has permission
  IF v_user_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Only managers and admins can manage announcements';
  END IF;

  -- Format expiry date to end of day
  p_expiry_date := date_trunc('day', p_expiry_date) + interval '23 hours 59 minutes 59 seconds';

  IF p_announcement_id IS NULL THEN
    -- Create new announcement
    INSERT INTO announcements (
      title,
      content,
      team_id,
      created_by,
      expiry_date
    ) VALUES (
      p_title,
      p_content,
      p_team_id,
      v_user_id,
      p_expiry_date
    )
    RETURNING * INTO v_result;
  ELSE
    -- Update existing announcement
    UPDATE announcements
    SET
      title = p_title,
      content = p_content,
      team_id = p_team_id,
      expiry_date = p_expiry_date,
      updated_at = now()
    WHERE id = p_announcement_id
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$; 