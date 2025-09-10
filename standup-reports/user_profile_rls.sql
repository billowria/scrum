-- Enable Row Level Security for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles table

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" 
ON user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON user_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Managers can read profiles of their team members
CREATE POLICY "Managers can view team profiles" 
ON user_profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM users u1 
        JOIN users u2 ON u1.team_id = u2.team_id
        WHERE u1.id = user_profiles.user_id 
        AND u2.id = auth.uid() 
        AND u2.role = 'manager'
    )
);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles" 
ON user_profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON user_profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON TABLE user_profiles TO postgres;
GRANT EXECUTE ON FUNCTION upsert_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;