-- Create indexes on company_id for all tables to improve query performance

-- Indexes for core tables
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_plans_company_id ON leave_plans(company_id);

-- Indexes for other tables
CREATE INDEX IF NOT EXISTS idx_announcements_company_id ON announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_company_id ON notes(company_id);
CREATE INDEX IF NOT EXISTS idx_sprints_company_id ON sprints(company_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_company_id ON project_sections(company_id);
CREATE INDEX IF NOT EXISTS idx_project_topics_company_id ON project_topics(company_id);
CREATE INDEX IF NOT EXISTS idx_project_topic_content_company_id ON project_topic_content(company_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_company_id ON project_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_company_id ON direct_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_company_id ON conversation_participants(company_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_company_id ON task_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_company_id ON user_achievements(company_id);
CREATE INDEX IF NOT EXISTS idx_achievements_company_id ON achievements(company_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_company_id ON timesheets(company_id);


-- Additional composite indexes that may be useful
CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_company_assignee ON tasks(company_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_plans_company_dates ON leave_plans(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_company_team ON users(company_id, team_id);