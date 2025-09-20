-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    job_title TEXT,
    bio TEXT,
    start_date DATE,
    phone TEXT,
    slack_handle TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure only one profile per user
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_job_title ON user_profiles(job_title);

-- Add comments to describe the table and columns
COMMENT ON TABLE user_profiles IS 'Stores extended profile information for users';
COMMENT ON COLUMN user_profiles.user_id IS 'Reference to the user in the users table';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user profile picture';
COMMENT ON COLUMN user_profiles.job_title IS 'User job title or position';
COMMENT ON COLUMN user_profiles.bio IS 'User biography or about section';
COMMENT ON COLUMN user_profiles.start_date IS 'User start date with the company';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number';
COMMENT ON COLUMN user_profiles.slack_handle IS 'User Slack or Teams handle';
COMMENT ON COLUMN user_profiles.linkedin_url IS 'URL to user LinkedIn profile';
COMMENT ON COLUMN user_profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN user_profiles.updated_at IS 'Timestamp when profile was last updated';

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
   BEFORE UPDATE ON user_profiles
   FOR EACH ROW
   EXECUTE PROCEDURE update_user_profiles_updated_at();

-- Create a view to get user info with profile data
CREATE OR REPLACE VIEW user_info AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.team_id,
    u.manager_id,
    u.department_id,
    COALESCE(u.avatar_url, up.avatar_url) as avatar_url,
    up.job_title,
    up.bio,
    up.start_date,
    up.phone,
    up.slack_handle,
    up.linkedin_url,
    up.created_at as profile_created_at,
    up.updated_at as profile_updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;