/**
 * COMPREHENSIVE SCHEMA REFERENCE - Synced with actual Supabase database
 * This provides the AI with an accurate, structured view of the database.
 * Last updated: 2026-01-27
 */
export const FULL_SCHEMA = `
=== DOMAIN: IDENTITY & ACCESS ===
- users: [id (uuid PK), name (text), email (text), role (text: admin/manager/member), team_id (uuid FK→teams), company_id (uuid FK→companies), manager_id (uuid FK→users), is_online (bool), avatar_url (text), created_at, updated_at]
- companies: [id (uuid PK), name (text), domain (text), created_at]
- teams: [id (uuid PK), name (text), description (text), company_id (uuid FK→companies)]
- user_profiles: [id (uuid PK), user_id (uuid FK→users UNIQUE), job_title (text), bio (text), phone (text), avatar_url (text), slack_handle (text)]

=== DOMAIN: WORK & PROJECTS ===
- projects: [id (uuid PK), name (text), description (text), status (text: active/completed/on_hold), start_date (date), end_date (date), budget (numeric), company_id (uuid FK→companies), created_at, updated_at]
- project_assignments: [id (uuid PK), project_id (uuid FK→projects), user_id (uuid FK→users), role_in_project (text), is_favorite (bool), company_id (uuid FK→companies), assigned_at, created_at] -- USE THIS TABLE to find which projects a user is assigned to
- sprints: [id (uuid PK), name (text), start_date (date), end_date (date), status (text: active/closed/planning), goal (text), project_id (uuid FK→projects), company_id (uuid FK→companies)]
- tasks: [id (uuid PK), title (text), description (text), status (text: To Do/In Progress/Review/Completed), priority (text: Low/Medium/High/Urgent), assignee_id (uuid FK→users), reporter_id (uuid FK→users), project_id (uuid FK→projects), sprint_id (uuid FK→sprints), due_date (date), estimated_hours (numeric), company_id (uuid FK→companies), created_at, updated_at]
- subtasks: [id (uuid PK), title (text), is_completed (bool), task_id (uuid FK→tasks), created_at]
- comments: [id (uuid PK), content (text), user_id (uuid FK→users), task_id (uuid FK→tasks), created_at]

=== DOMAIN: HR & TIME ===
- leave_plans: [id (uuid PK), user_id (uuid FK→users), start_date (date), end_date (date), type (text: sick/vacation/personal/wfh), status (text: approved/pending/rejected), reason (text), company_id (uuid FK→companies), created_at]
- timesheets: [id (uuid PK), user_id (uuid FK→users), date (date), duration (numeric - hours), description (text), project_id (uuid FK→projects), company_id (uuid FK→companies), created_at]
- holidays: [id (uuid PK), date (date), name (text), type (text), company_id (uuid FK→companies)]

=== DOMAIN: COMMUNICATION ===
- daily_reports: [id (uuid PK), user_id (uuid FK→users), date (date), yesterday (text - what was done), today (text - plan for today), blockers (text), mood_score (int 1-5), company_id (uuid FK→companies), created_at]
- announcements: [id (uuid PK), title (text), content (text), priority (text), target_user_id (uuid FK→users), team_id (uuid FK→teams), company_id (uuid FK→companies), expiry_date (date), is_read (bool), read_by (uuid[]), created_at]
- achievements: [id (uuid PK), title (text), description (text), award_type (text), user_id (uuid FK→users), company_id (uuid FK→companies), created_by (uuid FK→users), awarded_at, image_url (text)]
- notes: [id (uuid PK), title (text), content (text), user_id (uuid FK→users), project_id (uuid FK→projects), is_pinned (bool), tags (text[]), company_id (uuid FK→companies), created_at, updated_at]

=== DOMAIN: BILLING & SUBSCRIPTIONS ===
- subscription_plans: [id (uuid PK), name (text), price_monthly (numeric), price_yearly (numeric), features (jsonb), max_users (int), is_active (bool)]
- subscriptions: [id (uuid PK), company_id (uuid FK→companies), plan_id (uuid FK→subscription_plans), status (text: active/cancelled/expired), current_period_start (timestamp), current_period_end (timestamp), created_at]
- payments: [id (uuid PK), user_id (uuid FK→users), company_id (uuid FK→companies), plan_id (uuid FK→subscription_plans), amount (numeric), currency (text), razorpay_order_id (text), razorpay_payment_id (text), status (text: pending/completed/failed), billing_cycle (text), invoice_number (int), created_at]

=== DOMAIN: SYSTEM ===
- audit_log: [id (uuid PK), user_id (uuid FK→users), action (text), table_name (text), details (jsonb), created_at]
`;

/**
 * RELATIONSHIP GRAPH (Foreign Keys)
 * Helps AI perform complex JOINs.
 */
export const RELATIONSHIPS = `
KEY RELATIONSHIPS:
- users.company_id → companies.id (User belongs to Company)
- users.team_id → teams.id (User belongs to Team)
- users.manager_id → users.id (User reports to Manager)
- teams.company_id → companies.id (Team belongs to Company)
- projects.company_id → companies.id
- project_assignments.project_id → projects.id (Many-to-many: Users ↔ Projects)
- project_assignments.user_id → users.id
- tasks.assignee_id → users.id (Task assigned to User)
- tasks.reporter_id → users.id (Task created by User)
- tasks.project_id → projects.id
- tasks.sprint_id → sprints.id
- tasks.company_id → companies.id
- subtasks.task_id → tasks.id
- comments.task_id → tasks.id
- comments.user_id → users.id
- daily_reports.user_id → users.id
- daily_reports.company_id → companies.id
- leave_plans.user_id → users.id
- leave_plans.company_id → companies.id
- timesheets.user_id → users.id
- timesheets.project_id → projects.id
- achievements.user_id → users.id
- notes.user_id → users.id
- notes.project_id → projects.id
- subscriptions.company_id → companies.id
- subscriptions.plan_id → subscription_plans.id
- payments.user_id → users.id
- payments.company_id → companies.id

COMMON JOIN PATTERNS:
1. Get user name: JOIN users ON users.id = table.user_id → SELECT users.name
2. Get assignee name: JOIN users ON users.id = tasks.assignee_id
3. Get project name: JOIN projects ON projects.id = table.project_id
4. Get team members: SELECT * FROM users WHERE team_id = 'X'
5. Get user's tasks: SELECT * FROM tasks WHERE assignee_id = 'USER_ID'
`;

/**
 * AI PERSONALITY & PROTOCOL (The Detective Pass)
 */
export const SYSTEM_PROTOCOL = `
You are "Sync", an elite Data Scientist & Project Intelligence AI.
Your goal is to investigate data and provide RAW TRUTH.

PROTOCOL:
1. Identify if user needs data.
2. If YES, write perfect, read-only SQL.
3. ALWAYS JOIN with the 'users' or 'companies' table to get NAMES. Users hate IDs like UUIDs.
4. Scope ALL queries with the provided 'company_id'.

NEVER output reasoning like "I will now check...". Output ONLY SQL in a block or a direct text response if no data is needed.
`;

/**
 * FINAL CURATION PROTOCOL (The User-Facing Pass)
 */
export const CURATION_PROTOCOL = `
You are the "Answer Architect". Your job is to take raw database results and turn them into a PREMIUM USER EXPERIENCE.

STRICT UI/UX RULES:
1. **NO IDs**: Never show a UUID or ID (e.g., '550e8400...'). Show the **Name** instead.
2. **HUMAN DATES**: Convert '2026-01-26' into 'Today', 'Yesterday', 'Monday, Jan 26th', etc.
3. **HYPER-CRISP**: 1-2 powerful sentences maximum. 
4. **FORMATTING**: Use **Bold** for key names and numbers. Use bullet points if listing > 1 item.
5. **TONE**: Professional, Senior Executive partner. Not a "chatbot".

Example Bad: "Task id 123 for user id 456 is done."
Example Good: "**Akhil's** 'Login Page' task is **Completed**."
`;

/**
 * TASK GENERATION PROTOCOL
 */
export const TASK_ARCHITECT_PROTOCOL = `
You are the "Task Architect", an expert Product Manager and Technical Lead.
Your goal is to take a rough idea or context and transform it into a perfectly structured User Story or Task.

INPUT:
- Context/Goal: The user's rough idea.
- Type: Feature, Bug, Improvement, or General Task.
- Tone: Standard, Formal, or Detailed.

OUTPUT FORMAT (JSON ONLY):
{
  "title": "Clear, concise, action-oriented title",
  "description": "Markdown formatted description"
}

GUIDELINES:
1. **Title**: Start with a verb (e.g., "Implement", "Fix", "Design"). Keep it under 60 chars if possible.
2. **Description**:
   - Use standard Markdown.
   - For **Features**: Include "User Story" (As a... I want to... So that...) and "Acceptance Criteria" (Checklist).
   - For **Bugs**: Include "Steps to Reproduce", "Expected Behavior", and "Actual Behavior".
   - For **Improvements**: Explain "Current State", "Desired State", and "Benefits".
   - Use bolding for emphasis.
3. **Tone**:
   - Standard: Professional but concise.
   - Formal: Strictly business, no emojis, very structured.
   - Detailed: More verbose, includes technical considerations or edge cases.

EXAMPLE OUTPUT JSON:
{
  "title": "Implement Social Login Authentication",
  "description": "### User Story\\n**As a** user,\\n**I want to** log in using my Google account,\\n**So that** I can access the platform quickly without creating a new password.\\n\\n### Acceptance Criteria\\n- [ ] User can see 'Continue with Google' button on login page.\\n- [ ] Clicking button redirects to Google OAuth flow.\\n- [ ] Successful auth creates a new user record if one doesn't exist.\\n- [ ] Failed auth shows a friendly error message."
}
`;
