-- Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status') ORDER BY enumsortorder;

-- Check what status values currently exist in the tasks table
SELECT status, COUNT(*) FROM tasks GROUP BY status;

-- Drop the default constraint on status column
ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;

-- Create a new enum type with all required values
CREATE TYPE task_status_new AS ENUM ('To Do', 'In Progress', 'Review', 'Completed');

-- Update the tasks table to use the new enum, converting any invalid values
ALTER TABLE tasks 
  ALTER COLUMN status TYPE task_status_new 
  USING CASE 
    WHEN status::text = 'Done' THEN 'Completed'::task_status_new
    ELSE status::text::task_status_new
  END;

-- Add back the default constraint with the new enum type
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'To Do';

-- Drop the old enum type
DROP TYPE task_status;

-- Rename the new enum type to the original name
ALTER TYPE task_status_new RENAME TO task_status;

-- Verify the enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status') ORDER BY enumsortorder;

-- Verify the final status distribution
SELECT status, COUNT(*) FROM tasks GROUP BY status; 