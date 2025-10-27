-- Database Migration Script: Assign existing data to companies
-- This script assumes all existing users belong to a default company or need to be assigned appropriately

-- Step 1: Create a default company for existing users (if needed)
-- This is a simplified approach - in practice, you might want to create individual companies for users
INSERT INTO companies (id, name, slug, created_by) 
SELECT 
    gen_random_uuid(),
    'Legacy Company',
    'legacy-company',
    id
FROM users 
WHERE company_id IS NULL
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Assign existing users to the default company or to companies based on some logic
-- For existing users, we'll need to determine which company they should belong to
-- This could be based on their email domain, team association, or other business logic

-- First, update users who don't have a company to assign them to a default company
-- This is a simplified approach - in a real migration you'd have more sophisticated logic
UPDATE users 
SET company_id = (
    SELECT id 
    FROM companies 
    WHERE slug = 'legacy-company'
    LIMIT 1
)
WHERE company_id IS NULL;

-- Step 3: Update related tables with company_id based on associated user's company
UPDATE teams 
SET company_id = u.company_id
FROM users u
WHERE teams.company_id IS NULL 
AND teams.manager_id = u.id;

-- If teams don't have manager_id, try via team_members
UPDATE teams 
SET company_id = u.company_id
FROM users u, team_members tm
WHERE teams.company_id IS NULL 
AND tm.team_id = teams.id
AND tm.user_id = u.id;

-- Step 4: Update projects with company_id
UPDATE projects 
SET company_id = u.company_id
FROM users u
WHERE projects.company_id IS NULL
AND projects.created_by = u.id;

-- Step 5: Update tasks with company_id
UPDATE tasks 
SET company_id = u.company_id
FROM users u
WHERE tasks.company_id IS NULL
AND (tasks.assignee_id = u.id OR tasks.created_by = u.id);

-- Step 6: Update leave_plans with company_id
UPDATE leave_plans 
SET company_id = u.company_id
FROM users u
WHERE leave_plans.company_id IS NULL
AND leave_plans.user_id = u.id;

-- Step 7: Update announcements with company_id
UPDATE announcements 
SET company_id = u.company_id
FROM users u
WHERE announcements.company_id IS NULL
AND announcements.created_by = u.id;

-- Step 8: Update all other tables that now have company_id
UPDATE notes 
SET company_id = u.company_id
FROM users u
WHERE notes.company_id IS NULL
AND notes.user_id = u.id;

UPDATE sprints 
SET company_id = p.company_id
FROM projects p
WHERE sprints.company_id IS NULL
AND sprints.project_id = p.id;

UPDATE project_sections 
SET company_id = p.company_id
FROM projects p
WHERE project_sections.company_id IS NULL
AND project_sections.project_id = p.id;

UPDATE project_topics 
SET company_id = ps.company_id
FROM project_sections ps
WHERE project_topics.company_id IS NULL
AND project_topics.section_id = ps.id;

UPDATE project_topic_content 
SET company_id = pt.company_id
FROM project_topics pt
WHERE project_topic_content.company_id IS NULL
AND project_topic_content.topic_id = pt.id;

UPDATE project_assignments 
SET company_id = p.company_id
FROM projects p
WHERE project_assignments.company_id IS NULL
AND project_assignments.project_id = p.id;

UPDATE user_profiles 
SET company_id = u.company_id
FROM users u
WHERE user_profiles.company_id IS NULL
AND user_profiles.user_id = u.id;

-- Update other tables as needed...

-- Step 9: Verify all data has company_id assigned
-- These queries should return 0 rows if migration is successful
-- SELECT COUNT(*) FROM users WHERE company_id IS NULL;
-- SELECT COUNT(*) FROM teams WHERE company_id IS NULL;
-- SELECT COUNT(*) FROM projects WHERE company_id IS NULL;
-- SELECT COUNT(*) FROM tasks WHERE company_id IS NULL;
-- SELECT COUNT(*) FROM leave_plans WHERE company_id IS NULL;

-- Step 10: Add NOT NULL constraints after verification (optional, do in separate migration)
-- ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE teams ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE projects ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE tasks ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE leave_plans ALTER COLUMN company_id SET NOT NULL;