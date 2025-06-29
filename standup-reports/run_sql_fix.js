import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://zfyxudmjeytmdtigxmfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeXh1ZG1qZXl0bWR0aWd4bWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTM4MzMsImV4cCI6MjA2MjgyOTgzM30.bs6no7SqD6OcZ_Qsr2jZTGd6v_TSC98Im17gjewjTBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFix(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql_statement: statement.trim()
        });
        
        if (error) {
          console.error('Error executing SQL:', error);
          process.exit(1);
        }
      }
    }
    
    console.log('SQL fix applied successfully');
  } catch (error) {
    console.error('Error running SQL fix:', error);
    process.exit(1);
  }
}

// Get the SQL file path from command line arguments
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('Please provide the SQL file path as an argument');
  process.exit(1);
}

runSqlFix(sqlFile); 