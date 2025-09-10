-- Initialize user profiles for existing users
-- This script will create a profile entry for each existing user if one doesn't already exist

INSERT INTO user_profiles (user_id)
SELECT id 
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Update the user_info view to ensure it's using the latest structure
CREATE OR REPLACE VIEW user_info AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.team_id,
    u.manager_id,
    u.department_id,
    up.avatar_url,
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