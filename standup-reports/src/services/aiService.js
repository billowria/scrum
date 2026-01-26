import OpenAI from 'openai';
import { supabase } from '../supabaseClient';
import { FULL_SCHEMA, RELATIONSHIPS, TASK_ARCHITECT_PROTOCOL } from './ai/constants';

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const openai = new OpenAI({
    apiKey: OPENROUTER_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
        'HTTP-Referer': 'https://squadsync.vercel.app',
        'X-Title': 'Sync Intelligence',
    },
});

/**
 * Get current user context with full profile
 */
export const fetchUserContext = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('users')
            .select('id, name, email, role, team_id, company_id, avatar_url')
            .eq('id', user.id)
            .single();

        if (!profile) return null;

        // Parallel fetch for Company and Team names
        const promises = [];

        if (profile?.company_id) {
            promises.push(
                supabase.from('companies').select('name').eq('id', profile.company_id).single()
                    .then(({ data }) => { profile.company_name = data?.name || 'Unknown'; })
            );
        }

        if (profile?.team_id) {
            promises.push(
                supabase.from('teams').select('name').eq('id', profile.team_id).single()
                    .then(({ data }) => { profile.team_name = data?.name || 'Unknown'; })
            );
        }

        await Promise.all(promises);

        return profile;
    } catch (e) {
        console.error('Context resolution failed:', e);
        return null;
    }
};

/**
 * SECURITY: Validate and enforce company_id in all queries
 * This prevents cross-company data access
 */
const validateAndSecureQuery = (sql, user) => {
    let secureSql = sql.trim(); // Don't lower case immediately so we preserve casing if needed, though we check lower for keywords

    // 1. Basic Security Checks
    const lower = secureSql.toLowerCase();

    // Only allow SELECT
    if (!lower.startsWith('select')) {
        throw new Error('Only SELECT queries allowed');
    }

    // Block dangerous operations
    const forbidden = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create', 'grant'];
    for (const word of forbidden) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
            throw new Error(`Operation not allowed: ${word}`);
        }
    }

    // 2. Company Isolation (Global)
    // Identify if the query targets tables that need company filtering
    const tableRegex = /from\s+([a-zA-Z0-9_]+)/i;
    const match = secureSql.match(tableRegex);
    const table = match ? match[1].toLowerCase() : '';

    const companyTables = ['users', 'teams', 'projects', 'tasks', 'daily_reports', 'leave_plans',
        'timesheets', 'announcements', 'achievements', 'holidays', 'sprints', 'project_assignments'];

    // Check if the query is touching a protected table
    let touchesProtectedTable = false;
    for (const t of companyTables) {
        if (lower.includes(t)) {
            touchesProtectedTable = true;
            break;
        }
    }

    if (touchesProtectedTable) {
        // Enforce company_id check if not present (simple check, robust parser would be better but this works for AI gen queries)
        // We generally rely on the AI to add it, but we force inject if missing for safety
        if (!lower.includes(`company_id = '${user.company_id}'`) && !lower.includes(`company_id='${user.company_id}'`)) {
            if (lower.includes('where')) {
                secureSql = secureSql.replace(/where/i, `WHERE company_id = '${user.company_id}' AND`);
            } else {
                // Insert WHERE before ordering/limits or at end
                const splitPoints = secureSql.match(/(order by|limit|group by|$)/i);
                if (splitPoints) {
                    const index = splitPoints.index;
                    secureSql = secureSql.slice(0, index) + ` WHERE company_id = '${user.company_id}' ` + secureSql.slice(index);
                }
            }
        }
    }

    // 3. RBAC: Member Restrictions
    // If user is a MEMBER (not admin/manager), restrict access to their assigned projects
    if (user.role === 'member') {
        const protectedProjectTables = ['projects', 'tasks', 'sprints', 'subtasks'];

        let targetTable = null;
        for (const t of protectedProjectTables) {
            if (lower.includes(`from ${t}`) || lower.includes(`join ${t}`)) {
                targetTable = t;
                break;
            }
        }

        if (targetTable) {
            // Add subquery filter for project access
            // Logic: AND project_id IN (SELECT project_id FROM project_assignments WHERE user_id = 'USER_ID')
            // Special case: 'projects' table uses 'id' instead of 'project_id' usually

            const projectFilter = `project_id IN (SELECT project_id FROM project_assignments WHERE user_id = '${user.id}')`;
            const idFilter = `id IN (SELECT project_id FROM project_assignments WHERE user_id = '${user.id}')`;

            const filterToAdd = targetTable === 'projects' ? idFilter : projectFilter;

            if (secureSql.match(/where/i)) {
                secureSql = secureSql.replace(/where/i, `WHERE ${filterToAdd} AND`);
            } else {
                // Should have been added by company check, but if not:
                const splitPoints = secureSql.match(/(order by|limit|group by|$)/i);
                if (splitPoints) {
                    const index = splitPoints.index;
                    secureSql = secureSql.slice(0, index) + ` WHERE ${filterToAdd} ` + secureSql.slice(index);
                }
            }
        }
    }

    return secureSql;
};

/**
 * Execute SQL with security enforcement
 */
const executeSecureQuery = async (sql, user) => {
    try {
        const securedSql = validateAndSecureQuery(sql, user);

        // Execute via RPC function
        const { data, error } = await supabase.rpc('execute_readonly_query', { query_text: securedSql });

        if (error) {
            // Fallback: parse table and use SDK with company filter
            const match = securedSql.match(/from\s+([\w.]+)/i);
            if (match) {
                const table = match[1].replace('public.', '');
                const result = await supabase
                    .from(table)
                    .select('*')
                    .eq('company_id', user.company_id)
                    .limit(20);
                return result.error ? { error: result.error.message } : { data: result.data };
            }
            return { error: error.message };
        }

        // Check if RPC returned an error object
        if (data && data.error) {
            return { error: data.error };
        }

        return { data: data || [] };
    } catch (err) {
        return { error: err.message };
    }
};

/**
 * Format data for AI - ALWAYS show names, never IDs
 * Resolves user_id, assignee_id, reporter_id etc. to actual user names
 */
const formatDataForAI = async (data) => {
    if (!data || data.length === 0) return 'No data found.';

    // 1. Collect all unique user IDs from the data
    const userIdFields = ['user_id', 'assignee_id', 'reporter_id', 'assigned_to', 'created_by', 'updated_by'];
    const userIds = new Set();

    for (const row of data) {
        for (const field of userIdFields) {
            if (row[field]) userIds.add(row[field]);
        }
    }

    // 2. Batch fetch user names
    let userMap = {};
    if (userIds.size > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', Array.from(userIds));

        if (users) {
            for (const u of users) {
                userMap[u.id] = u.name;
            }
        }
    }

    // 3. Transform data - replace IDs with names
    return data.slice(0, 15).map(row => {
        const clean = {};
        for (const [key, value] of Object.entries(row)) {
            // Skip all generic ID fields and timestamps
            if (key === 'id' || key === 'company_id' || key === 'team_id' || key === 'project_id') continue;
            if (key === 'created_at' || key === 'updated_at') continue;

            // Replace user ID fields with names
            if (userIdFields.includes(key) && value && userMap[value]) {
                const nameKey = key.replace('_id', '').replace('assigned_to', 'assignee').replace('created_by', 'creator');
                clean[nameKey] = userMap[value];
                continue;
            }

            // Format dates nicely
            if (key.includes('date') && value) {
                try {
                    clean[key] = new Date(value).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric'
                    });
                } catch { clean[key] = value; }
            } else if (!key.toLowerCase().includes('id')) {
                // Skip remaining ID-like fields
                clean[key] = value;
            }
        }
        return clean;
    });
};

/**
 * Extract only the final answer - aggressive cleaning
 */
const extractFinalAnswer = (text) => {
    if (!text) return '';

    let cleaned = text;

    // Remove thinking blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');

    // Remove SQL blocks
    cleaned = cleaned.replace(/```sql[\s\S]*?```/gi, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/gi, '');

    // Remove reasoning sentences
    const lines = cleaned.split('\n').filter(line => {
        const t = line.trim().toLowerCase();
        if (!t) return false;
        if (t.startsWith('since ')) return false;
        if (t.startsWith('let me ')) return false;
        if (t.startsWith('i need ')) return false;
        if (t.startsWith('i should ')) return false;
        if (t.startsWith('first,')) return false;
        if (t.startsWith('the response ')) return false;
        if (t.startsWith('the final ')) return false;
        if (t.includes('sql')) return false;
        if (t.includes('database')) return false;
        if (t.includes('query')) return false;
        return true;
    });

    return lines.join('\n').trim() || text.split('\n').pop()?.trim() || '';
};

/**
 * MAIN: Generate secure AI response
 */
export const generateResponse = async (userQuery, _nullProp, chatHistory = []) => {
    if (!OPENROUTER_KEY) return { text: "System Error: Missing API Key." };

    const user = await fetchUserContext();
    if (!user) return { text: "Please login to continue." };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let contextPrompt = "";
    if (_nullProp && _nullProp.type && _nullProp.id) {
        contextPrompt = `
FOCUSED CONTEXT DATA (User explicitly attached this):
Type: ${_nullProp.type}
Title: ${_nullProp.title || _nullProp.label}
${_nullProp.description ? `Description: ${_nullProp.description}` : ''}
${_nullProp.project ? `Project: ${_nullProp.project}` : ''}
NOTE: Prioritize this item in your response. If the user asks for help, analyze the title and description to provide actionable guidance.
`;
    }

    // Build security-aware system prompt
    const systemPrompt = `You are Sync, an AI assistant for SquadSync - a project management and team collaboration platform.
${contextPrompt}

===== CURRENT USER CONTEXT =====
- User ID: ${user.id}
- Name: ${user.name}
- Email: ${user.email || 'N/A'}
- Role: ${user.role}
- Company: ${user.company_name}
- Company ID: ${user.company_id}
- Team: ${user.team_name || 'None'}
- Team ID: ${user.team_id || 'None'}

TODAY'S DATE: ${today}

===== CRITICAL SECURITY RULES =====
1. ALWAYS filter by company_id = '${user.company_id}' on ALL queries
2. For "my" questions (my tasks, my reports, my leaves), filter by user_id/assignee_id = '${user.id}'
3. Show NAMES not UUIDs - always JOIN users table to get names
4. ACCESS CONTROL:
   - Admins/Managers: Can see ALL company data
   - Members: Can ONLY see Projects/Tasks they are assigned to

===== DATABASE SCHEMA =====
${FULL_SCHEMA}

===== RELATIONSHIPS =====
${RELATIONSHIPS}

===== RESPONSE GUIDELINES =====
1. If data is needed, write a SELECT query in a \`\`\`sql code block
2. ALWAYS use JOINs to show names instead of IDs
3. For personal queries like "my tasks", use: WHERE assignee_id = '${user.id}'
4. For personal reports: WHERE user_id = '${user.id}'
5. Limit results to 20 rows max
6. Answer in 1-2 natural sentences after getting data
7. **CASE-INSENSITIVE**: When filtering by names (project name, user name), use ILIKE or LOWER() for case-insensitive matching

===== QUERY EXAMPLES =====
- "My tasks": SELECT t.title, t.status, t.priority, t.due_date FROM tasks t WHERE t.assignee_id = '${user.id}' AND t.company_id = '${user.company_id}' AND t.status != 'Completed'
- "Team members": SELECT u.name, u.email, u.role FROM users u WHERE u.company_id = '${user.company_id}'
- "Who is on leave": SELECT u.name, lp.start_date, lp.end_date, lp.type FROM leave_plans lp JOIN users u ON u.id = lp.user_id WHERE lp.company_id = '${user.company_id}' AND lp.status = 'approved' AND lp.start_date <= CURRENT_DATE AND lp.end_date >= CURRENT_DATE
- "Tasks in project Carnival": SELECT COUNT(*) FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.assignee_id = '${user.id}' AND t.company_id = '${user.company_id}' AND LOWER(p.name) ILIKE '%carnival%'`;

    try {
        // Build conversation context from chat history (keep more messages for context)
        const recentHistory = chatHistory.slice(-8).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        // Add conversation awareness to system prompt if there's history
        const conversationContext = recentHistory.length > 0
            ? `\n===== CONVERSATION CONTEXT =====\nYou are in an ongoing conversation. When the user says "it", "those", "them", "that project", "those tasks", etc., refer back to the most recent context from the conversation. Use previous answers to inform your current response.\n`
            : '';

        // Step 1: Get AI to decide if SQL needed
        const response1 = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: systemPrompt + conversationContext },
                ...recentHistory,
                { role: 'user', content: userQuery }
            ],
            temperature: 0.3
        });

        let aiOutput = response1.choices[0].message.content;
        const sqlMatch = aiOutput.match(/```sql\n?([\s\S]*?)```/);

        if (sqlMatch) {
            // Execute secured SQL
            const sql = sqlMatch[1].trim();
            const result = await executeSecureQuery(sql, user);

            let dataForAI;
            if (result.error) {
                dataForAI = `Error: ${result.error}`;
            } else {
                // CRITICAL: await the async function!
                const formattedData = await formatDataForAI(result.data);
                dataForAI = JSON.stringify(formattedData, null, 2);
            }

            // Step 2: Answer with data
            const response2 = await openai.chat.completions.create({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: `You are Sync. Give a brief, natural answer based on the data. 1-2 sentences max. Use NAMES and readable DATES. Never mention SQL or databases. Today is ${today}.` },
                    { role: 'user', content: userQuery },
                    { role: 'assistant', content: `I found this data: ${dataForAI}` },
                    { role: 'user', content: 'Give me a brief, friendly answer.' }
                ],
                temperature: 0.3
            });

            return { text: extractFinalAnswer(response2.choices[0].message.content) };
        }

        return { text: extractFinalAnswer(aiOutput) };

    } catch (error) {
        console.error('AI Error:', error);
        return { text: "Sorry, I'm having trouble right now. Please try again." };
    }
};


export const fetchContextData = async () => ({});

