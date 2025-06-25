-- Create task_activities table for tracking task history and comments
CREATE TABLE IF NOT EXISTS task_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'status_changed', 'task_created', 'comment_added', etc.
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_user_id ON task_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON task_activities(created_at);

-- Enable Row Level Security
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_activities
-- Users can view activities for tasks they have access to
CREATE POLICY "Users can view task activities for accessible tasks" ON task_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN users u ON u.team_id = t.team_id
            WHERE t.id = task_activities.task_id
            AND u.id = auth.uid()
        )
    );

-- Users can insert activities for tasks they have access to
CREATE POLICY "Users can insert task activities for accessible tasks" ON task_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN users u ON u.team_id = t.team_id
            WHERE t.id = task_activities.task_id
            AND u.id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Create a function to automatically create activity when task status changes
CREATE OR REPLACE FUNCTION create_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed, create an activity record
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_activities (
            task_id,
            user_id,
            action,
            from_status,
            to_status,
            comment
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            OLD.status,
            NEW.status,
            'Status updated automatically'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track status changes
CREATE TRIGGER task_status_change_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_task_activity();

-- Create a function to get task history with user details
CREATE OR REPLACE FUNCTION get_task_history(task_uuid UUID)
RETURNS TABLE (
    id UUID,
    action VARCHAR(50),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.id,
        ta.action,
        ta.from_status,
        ta.to_status,
        ta.comment,
        ta.created_at,
        u.name as user_name,
        u.email as user_email
    FROM task_activities ta
    JOIN users u ON u.id = ta.user_id
    WHERE ta.task_id = task_uuid
    ORDER BY ta.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 