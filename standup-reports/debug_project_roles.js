// Debug script to check user roles in projects
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProjectRoles() {
  try {
    console.log('=== DEBUGGING PROJECT ROLES ===');
    
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    console.log('Current user:', user.id);
    
    // 2. Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    console.log('User profile:', profile);
    
    // 3. Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) throw projectsError;
    console.log(`Found ${projects.length} projects`);
    
    // 4. Check user's role in each project
    for (const project of projects) {
      console.log(`\n--- Project: ${project.name} (ID: ${project.id}) ---`);
      
      const { data: assignments, error: assignmentError } = await supabase
        .from('project_assignments')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id);
      
      if (assignmentError) {
        console.log('Error fetching assignments:', assignmentError);
        continue;
      }
      
      if (assignments.length === 0) {
        console.log('User is NOT assigned to this project');
      } else {
        console.log('User assignments:', assignments);
        assignments.forEach(a => {
          console.log(`Role: ${a.role_in_project}`);
        });
      }
    }
    
    // 5. Get all project assignments for the user
    console.log('\n=== ALL PROJECT ASSIGNMENTS FOR USER ===');
    const { data: allAssignments, error: allError } = await supabase
      .from('project_assignments')
      .select(`
        *,
        projects(name),
        users(name)
      `)
      .eq('user_id', user.id);
    
    if (allError) throw allError;
    
    console.log('All assignments:', allAssignments);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugProjectRoles();