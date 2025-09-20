-- Add metadata column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment to the column
COMMENT ON COLUMN tasks.metadata IS 'JSON metadata for tasks including sprint assignments and other flexible attributes';

-- Create index for better query performance on metadata
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON tasks USING GIN (metadata);