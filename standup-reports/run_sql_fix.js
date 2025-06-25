const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and service role key
const supabaseUrl = 'https://zfyxudmjeytmdtigxmfc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Set this in your environment

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTaskStatusEnum() {
  try {
    console.log('Checking current enum values...');
    
    // Check current enum values
    const { data: currentValues, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status') ORDER BY enumsortorder;" 
      });
    
    if (checkError) {
      console.error('Error checking enum values:', checkError);
      return;
    }
    
    console.log('Current enum values:', currentValues);
    
    // Check what status values currently exist
    console.log('Checking current task statuses...');
    const { data: currentStatuses, error: statusCheckError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT status, COUNT(*) FROM tasks GROUP BY status;" 
      });
    
    if (statusCheckError) {
      console.error('Error checking current statuses:', statusCheckError);
      return;
    }
    
    console.log('Current task statuses:', currentStatuses);
    
    // Drop the default constraint
    console.log('Dropping default constraint...');
    const { error: dropDefaultError } = await supabase
      .rpc('exec_sql', { 
        sql: "ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;" 
      });
    
    if (dropDefaultError) {
      console.error('Error dropping default constraint:', dropDefaultError);
      return;
    }
    
    // Create new enum type
    console.log('Creating new enum type...');
    const { error: createError } = await supabase
      .rpc('exec_sql', { 
        sql: "CREATE TYPE task_status_new AS ENUM ('To Do', 'In Progress', 'Review', 'Completed');" 
      });
    
    if (createError) {
      console.error('Error creating new enum:', createError);
      return;
    }
    
    // Update tasks table
    console.log('Updating tasks table...');
    const { error: updateError } = await supabase
      .rpc('exec_sql', { 
        sql: "ALTER TABLE tasks ALTER COLUMN status TYPE task_status_new USING CASE WHEN status::text = 'Done' THEN 'Completed'::task_status_new ELSE status::text::task_status_new END;" 
      });
    
    if (updateError) {
      console.error('Error updating tasks table:', updateError);
      return;
    }
    
    // Add back the default constraint
    console.log('Adding back default constraint...');
    const { error: addDefaultError } = await supabase
      .rpc('exec_sql', { 
        sql: "ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'To Do';" 
      });
    
    if (addDefaultError) {
      console.error('Error adding default constraint:', addDefaultError);
      return;
    }
    
    // Drop old enum and rename new one
    console.log('Cleaning up enum types...');
    const { error: cleanupError } = await supabase
      .rpc('exec_sql', { 
        sql: "DROP TYPE task_status; ALTER TYPE task_status_new RENAME TO task_status;" 
      });
    
    if (cleanupError) {
      console.error('Error cleaning up enum types:', cleanupError);
      return;
    }
    
    console.log('Task status enum fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing task status enum:', error);
  }
}

fixTaskStatusEnum(); 