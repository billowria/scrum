-- Add sprint_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Add comment to the column
COMMENT ON COLUMN tasks.sprint_id IS 'Reference to the sprint this task belongs to';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);