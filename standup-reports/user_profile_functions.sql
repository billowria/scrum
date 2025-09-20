-- Function to create or update a user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
    p_user_id UUID,
    p_avatar_url TEXT DEFAULT NULL,
    p_job_title TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_slack_handle TEXT DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    avatar_url TEXT,
    job_title TEXT,
    bio TEXT,
    start_date DATE,
    phone TEXT,
    slack_handle TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO user_profiles (
        user_id,
        avatar_url,
        job_title,
        bio,
        start_date,
        phone,
        slack_handle,
        linkedin_url
    )
    VALUES (
        p_user_id,
        p_avatar_url,
        p_job_title,
        p_bio,
        p_start_date,
        p_phone,
        p_slack_handle,
        p_linkedin_url
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        job_title = COALESCE(EXCLUDED.job_title, user_profiles.job_title),
        bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
        start_date = COALESCE(EXCLUDED.start_date, user_profiles.start_date),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        slack_handle = COALESCE(EXCLUDED.slack_handle, user_profiles.slack_handle),
        linkedin_url = COALESCE(EXCLUDED.linkedin_url, user_profiles.linkedin_url),
        updated_at = NOW()
    RETURNING 
        user_profiles.id,
        user_profiles.user_id,
        user_profiles.avatar_url,
        user_profiles.job_title,
        user_profiles.bio,
        user_profiles.start_date,
        user_profiles.phone,
        user_profiles.slack_handle,
        user_profiles.linkedin_url,
        user_profiles.created_at,
        user_profiles.updated_at;
END;
$$;

-- Function to get a user's complete profile information
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    team_id UUID,
    manager_id UUID,
    department_id UUID,
    avatar_url TEXT,
    job_title TEXT,
    bio TEXT,
    start_date DATE,
    phone TEXT,
    slack_handle TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
AS $
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
    up.created_at,
    up.updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = p_user_id;
$;;

-- Add comments to describe the functions
COMMENT ON FUNCTION upsert_user_profile IS 'Creates or updates a user profile';
COMMENT ON FUNCTION get_user_profile IS 'Retrieves complete user information including profile data';