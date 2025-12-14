import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../supabaseClient';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiSend,
  FiLoader,
  FiSave,
  FiClock,
  FiHash,
  FiUser,
  FiTrendingUp,
  FiCopy,
  FiZap,
  FiTarget,
  FiUsers,
  FiFileText,
  FiCommand
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';

const ReportEntryNew = () => {
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [stats, setStats] = useState({ tasksCompleted: 0, reportsThisWeek: 0 });
  const [lastSaved, setLastSaved] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeEditor, setActiveEditor] = useState(null);

  // Form State
  const [yesterdayContent, setYesterdayContent] = useState('');
  const [todayContent, setTodayContent] = useState('');
  const [blockersContent, setBlockersContent] = useState('');

  // UI State
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const saveTimeoutRef = useRef(null);

  // Templates for quick insertion
  const templates = {
    yesterday: [
      '✅ Implemented [feature name]',
      '🐛 Fixed bug in [component]',
      '📝 Reviewed PRs for [project]',
      '🚀 Deployed [version] to production',
      '🤝 Met with team to discuss [topic]'
    ],
    today: [
      '🎯 Working on [task name]',
      '🔍 Investigating [issue]',
      '📞 Meeting with [person] at [time]',
      '✨ Starting work on [feature]',
      '🧪 Testing [component]'
    ],
    blockers: [
      '⏳ Waiting for [person/thing]',
      '❓ Need clarification on [topic]',
      '🔧 Blocked by [technical issue]',
      '📄 Missing [documentation/resource]'
    ]
  };

  // Initialize Editors  
  const editorProps = {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed'
    }
  };

  const yesterdayEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What did you accomplish yesterday?' })
    ],
    content: yesterdayContent,
    editorProps,
    onUpdate: ({ editor }) => {
      setYesterdayContent(editor.getHTML());
      debouncedSave();
    },
    onFocus: () => setActiveEditor('yesterday')
  });

  const todayEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What will you work on today?' })
    ],
    content: todayContent,
    editorProps,
    onUpdate: ({ editor }) => {
      setTodayContent(editor.getHTML());
      debouncedSave();
    },
    onFocus: () => setActiveEditor('today')
  });

  const blockersEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Any blockers? (Optional)' })
    ],
    content: blockersContent,
    editorProps,
    onUpdate: ({ editor }) => {
      setBlockersContent(editor.getHTML());
      debouncedSave();
    },
    onFocus: () => setActiveEditor('blockers')
  });

  // Fetch data
  useEffect(() => {
    if (selectedCompany) {
      fetchReport();
      fetchMyTasks();
      fetchTeamMembers();
      fetchStats();
    }
  }, [selectedCompany, reportDate]);

  const fetchReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .eq('user_id', user.id)
        .eq('report_date', reportDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching report:', error);
      }

      if (data) {
        setYesterdayContent(data.yesterday_text || '');
        setTodayContent(data.today_text || '');
        setBlockersContent(data.blockers_text || '');

        yesterdayEditor?.commands.setContent(data.yesterday_text || '');
        todayEditor?.commands.setContent(data.today_text || '');
        blockersEditor?.commands.setContent(data.blockers_text || '');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchMyTasks = async () => {
    setFetchingTasks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, project_id, projects(name, color)')
        .eq('company_id', selectedCompany.id)
        .contains('assignees', [user.id])
        .neq('status', 'Done')
        .limit(10);

      if (error) throw error;
      setMyTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setFetchingTasks(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('company_id', selectedCompany.id)
        .limit(8);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get completed tasks this week
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', selectedCompany.id)
        .contains('assignees', [user.id])
        .eq('status', 'Done')
        .gte('updated_at', weekAgo);

      // Get reports this week
      const { count: reportsCount } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', selectedCompany.id)
        .eq('user_id', user.id)
        .gte('report_date', format(subDays(new Date(), 7), 'yyyy-MM-dd'));

      setStats({
        tasksCompleted: tasksCount || 0,
        reportsThisWeek: reportsCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Auto-save
  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleDraftSave();
    }, 2000);
  };

  const handleDraftSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reportData = {
        company_id: selectedCompany.id,
        user_id: user.id,
        report_date: reportDate,
        yesterday_text: yesterdayContent,
        today_text: todayContent,
        blockers_text: blockersContent,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportData, { onConflict: 'company_id, user_id, report_date' });

      if (error) throw error;
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await handleDraftSave();
    setTimeout(() => {
      setLoading(false);
      alert('✅ Report submitted successfully!');
      fetchStats(); // Refresh stats
    }, 800);
  };

  // Template insertion
  const insertTemplate = (template) => {
    let editor = null;
    if (activeEditor === 'yesterday') editor = yesterdayEditor;
    if (activeEditor === 'today') editor = todayEditor;
    if (activeEditor === 'blockers') editor = blockersEditor;

    if (editor) {
      const currentContent = editor.getText();
      const newLine = currentContent.trim() ? '<br>' : '';
      editor.chain().focus().insertContent(newLine + template).run();
    }
  };

  // Insert task
  const insertTask = (task) => {
    let editor = null;
    if (activeEditor === 'yesterday') editor = yesterdayEditor;
    if (activeEditor === 'today') editor = todayEditor;
    if (activeEditor === 'blockers') editor = blockersEditor;

    if (editor) {
      const taskLink = `<a href="/tasks/${task.id}" class="text-indigo-600 font-medium hover:underline">#${task.title}</a> `;
      editor.chain().focus().insertContent(taskLink).run();
    }
  };

  // Mention team member
  const mentionMember = (member) => {
    let editor = null;
    if (activeEditor === 'yesterday') editor = yesterdayEditor;
    if (activeEditor === 'today') editor = todayEditor;
    if (activeEditor === 'blockers') editor = blockersEditor;

    if (editor) {
      const mention = `<span class="text-blue-600 font-medium">@${member.name}</span> `;
      editor.chain().focus().insertContent(mention).run();
    }
    setShowMentionPopup(false);
  };

  const wordCount = (html) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.trim().split(/\s+/).filter(w => w).length;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Daily Standup Report</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FiCalendar className="w-3 h-3" />
              <span>{format(new Date(reportDate), 'EEEE, MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FiSave className="w-3 h-3" />
              <span>Saved {format(lastSaved, 'h:mm a')}</span>
            </div>
          )}

          <motion.button
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin w-4 h-4" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                <span>Submit Report</span>
              </>
            )}
          </motion.button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-[260px_1fr_300px] gap-0 overflow-hidden">
        {/* Left Panel */}
        <aside className="border-r border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Stats */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-3 h-3" />
                This Week
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Tasks Done</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.tasksCompleted}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Reports</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.reportsThisWeek}</p>
                </div>
              </div>
            </div>

            {/* Active Tasks */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiTarget className="w-3 h-3" />
                Your Tasks
              </h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {fetchingTasks ? (
                  <div className="text-xs text-slate-400 flex items-center gap-2 p-2">
                    <FiLoader className="animate-spin w-3 h-3" /> Loading...
                  </div>
                ) : myTasks.length > 0 ? (
                  myTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => insertTask(task)}
                      disabled={!activeEditor}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                        <span className="text-[10px] text-slate-500 uppercase">{task.projects?.name}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-2">No active tasks</p>
                )}
              </div>
            </div>

            {/* Team */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiUsers className="w-3 h-3" />
                Quick Mention
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {teamMembers.slice(0, 8).map(member => (
                  <button
                    key={member.id}
                    onClick={() => mentionMember(member)}
                    disabled={!activeEditor}
                    title={member.name}
                    className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Editors */}
        <div className="flex flex-col p-6 gap-4 overflow-hidden">
          {/* Yesterday */}
          <CompactEditor
            icon={<FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            title="Yesterday"
            subtitle="Accomplishments"
            color="emerald"
            editor={yesterdayEditor}
            isActive={activeEditor === 'yesterday'}
            wordCount={wordCount(yesterdayContent)}
          />

          {/* Today */}
          <CompactEditor
            icon={<FiTarget className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            title="Today"
            subtitle="Plans"
            color="blue"
            editor={todayEditor}
            isActive={activeEditor === 'today'}
            wordCount={wordCount(todayContent)}
          />

          {/* Blockers */}
          <CompactEditor
            icon={<FiAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            title="Blockers"
            subtitle="Optional"
            color="amber"
            editor={blockersEditor}
            isActive={activeEditor === 'blockers'}
            wordCount={wordCount(blockersContent)}
          />
        </div>

        {/* Right Panel */}
        <aside className="border-l border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Templates */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiZap className="w-3 h-3" />
                Quick Templates
              </h3>
              {activeEditor && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 mb-2">
                    For: <span className="font-semibold capitalize">{activeEditor}</span>
                  </p>
                  {templates[activeEditor]?.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertTemplate(template)}
                      className="w-full p-2 text-left text-xs rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              )}
              {!activeEditor && (
                <p className="text-xs text-slate-400 italic">Click on an editor to see templates</p>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiCommand className="w-3 h-3" />
                Shortcuts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Submit</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">⌘ Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Bold</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">⌘ B</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Italic</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">⌘ I</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">List</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">⌘ ⇧ 8</kbd>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex items-start gap-2 mb-2">
                <FiZap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">Pro Tip</h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                    Click tasks on the left to insert links. Use templates for consistency. Mention teammates for collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

// Compact Editor Component
const CompactEditor = ({ icon, title, subtitle, color, editor, isActive, wordCount }) => {
  const colorClasses = {
    emerald: {
      bg: 'from-emerald-500/5 to-teal-500/5',
      ring: 'ring-emerald-500/30',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    blue: {
      bg: 'from-blue-500/5 to-indigo-500/5',
      ring: 'ring-blue-500/30',
      border: 'border-blue-200 dark:border-blue-800'
    },
    amber: {
      bg: 'from-amber-500/5 to-orange-500/5',
      ring: 'ring-amber-500/30',
      border: 'border-amber-200 dark:border-amber-800'
    }
  };

  return (
    <div className={`flex-1 flex flex-col rounded-2xl border ${isActive ? `${colorClasses[color].border} ring-2 ${colorClasses[color].ring}` : 'border-slate-200 dark:border-slate-800'} bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden transition-all`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 ${isActive ? `bg-gradient-to-r ${colorClasses[color].bg}` : 'bg-slate-50/50 dark:bg-slate-900/50'} flex items-center justify-between transition-all`}>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {wordCount > 0 && (
          <span className="text-[10px] text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            {wordCount} words
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default ReportEntryNew;
