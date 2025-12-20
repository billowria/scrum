import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import './ReportEntryNew.css'; // Create this file or add styles inline if preferred, but for now we inject style
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
  FiBriefcase,
  FiTarget,
  FiUsers,
  FiZap,
  FiActivity,
  FiArrowRight,
  FiArrowLeft,
  FiPlus
} from 'react-icons/fi';
import { format, subDays, isToday, isYesterday } from 'date-fns';

const ReportEntryNew = () => {
  const navigate = useNavigate();
  const { currentCompany: selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMobile, setIsMobile] = useState(false);

  // Wizard State
  const [activeStep, setActiveStep] = useState(0); // 0: Yesterday, 1: Today, 2: Blockers
  const steps = ['yesterday', 'today', 'blockers'];
  const activeEditorKey = steps[activeStep];

  // Form State
  const [yesterdayContent, setYesterdayContent] = useState('');
  const [todayContent, setTodayContent] = useState('');
  const [blockersContent, setBlockersContent] = useState('');



  const saveTimeoutRef = useRef(null);

  // Ref to hold latest actions to avoid stale closures in editor event handlers
  const actionsRef = useRef({ nextStep: () => { }, handleSubmit: () => { } });

  // Update actions ref
  useEffect(() => {
    actionsRef.current = { nextStep, handleSubmit };
  }, [activeStep, loading]); // Dependencies that affect these functions

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
      class: 'prose prose-sm max-w-none focus:outline-none text-slate-600 leading-relaxed min-h-[200px]'
    }
  };

  const yesterdayEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What did you accomplish yesterday?' })
    ],
    content: yesterdayContent,
    onUpdate: ({ editor }) => {
      setYesterdayContent(editor.getHTML());
      debouncedSave();
    },
    editorProps: {
      ...editorProps,
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();
          actionsRef.current.nextStep();
          return true;
        }
        return false;
      }
    }
  });

  const todayEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What will you work on today?' })
    ],
    content: todayContent,
    onUpdate: ({ editor }) => {
      setTodayContent(editor.getHTML());
      debouncedSave();
    },
    editorProps: {
      ...editorProps,
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();
          actionsRef.current.nextStep();
          return true;
        }
        return false;
      }
    }
  });

  const blockersEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Any blockers? (Optional)' })
    ],
    content: blockersContent,
    onUpdate: ({ editor }) => {
      setBlockersContent(editor.getHTML());
      debouncedSave();
    },
    editorProps: {
      ...editorProps,
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();
          actionsRef.current.handleSubmit();
          return true;
        }
        return false;
      }
    }
  });

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data
  useEffect(() => {
    if (selectedCompany) {
      fetchTeamMembers();
      fetchMyTasks();
      fetchReport();
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
        .eq('date', reportDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching report:', error);
      }

      if (data) {
        setYesterdayContent(data.yesterday || '');
        setTodayContent(data.today || '');
        setBlockersContent(data.blockers || '');

        yesterdayEditor?.commands.setContent(data.yesterday || '');
        todayEditor?.commands.setContent(data.today || '');
        blockersEditor?.commands.setContent(data.blockers || '');
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
        .select('id, title, status, priority, project_id, projects(id, name)')
        .eq('company_id', selectedCompany.id)
        .eq('assignee_id', user.id)
        .neq('status', 'Completed')
        .order('created_at', { ascending: false })
        .limit(15);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's team
      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!userData?.team_id) return;

      // Fetch team members from the same team
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, team_id')
        .eq('team_id', userData.team_id)
        .eq('company_id', selectedCompany.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error fetching team:', err);
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
      if (!user || !selectedCompany?.id) return;

      const reportData = {
        company_id: selectedCompany.id,
        user_id: user.id,
        date: reportDate,
        yesterday: yesterdayContent,
        today: todayContent,
        blockers: blockersContent,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportData, { onConflict: 'user_id,date' });

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
      // Optional: Add a toast notification here
      navigate('/standup-reports');
    }, 800);
  };

  // Template insertion
  const insertTemplate = (template) => {
    let editor = null;
    if (activeEditorKey === 'yesterday') editor = yesterdayEditor;
    if (activeEditorKey === 'today') editor = todayEditor;
    if (activeEditorKey === 'blockers') editor = blockersEditor;

    if (editor) {
      const currentContent = editor.getText();
      const newLine = currentContent.trim() ? '<br>' : '';
      editor.chain().focus().insertContent(newLine + template).run();
    }
  };

  // Insert task
  const insertTask = (task) => {
    let editor = null;
    if (activeEditorKey === 'yesterday') editor = yesterdayEditor;
    if (activeEditorKey === 'today') editor = todayEditor;
    if (activeEditorKey === 'blockers') editor = blockersEditor;

    if (editor) {
      const taskText = `#TASK-${task.id} `;
      editor.chain().focus().insertContent(taskText).run();
    }
  };

  // Mention team member
  const mentionMember = (member) => {
    let editor = null;
    if (activeEditorKey === 'yesterday') editor = yesterdayEditor;
    if (activeEditorKey === 'today') editor = todayEditor;
    if (activeEditorKey === 'blockers') editor = blockersEditor;

    if (editor) {
      const mention = `@${member.id} `;
      editor.chain().focus().insertContent(mention).run();
    }
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const nextStep = () => {
    if (activeStep < 2) setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1);
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-800 dark:text-slate-200 antialiased overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Context - Hidden on Mobile */}
        {!isMobile && (
          <aside className="w-[320px] border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 z-0">
            <div className="px-6 pt-6 pb-2">
              <div className="mb-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Daily Standup</h1>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mt-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>{formatDateLabel(reportDate)}</span>
                  <span className="text-slate-300">•</span>
                  <span>{format(new Date(reportDate), 'MMMM d, yyyy')}</span>
                </div>
                {lastSaved && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
                    <FiSave className="w-3 h-3" />
                    <span>Saved {format(lastSaved, 'h:mm a')}</span>
                  </div>
                )}
              </div>

              {/* Team Mentions - Top Priority */}
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                  <FiUsers className="w-3.5 h-3.5" />
                  Team Mentions
                </h3>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {teamMembers.slice(0, 10).map(member => (
                      <button
                        key={member.id}
                        onClick={() => mentionMember(member)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                      >
                        <div className="relative shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{member.name?.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">@{member.name?.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>
                        <FiPlus className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                  {teamMembers.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">No team members</p>
                  )}
                </div>
              </div>

              {/* Active Tasks Section */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-6"></div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                  <FiTarget className="w-3.5 h-3.5" />
                  Active Tasks
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{myTasks.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
              {fetchingTasks ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <FiLoader className="animate-spin w-5 h-5" />
                  <span className="text-xs">Loading tasks...</span>
                </div>
              ) : myTasks.length > 0 ? (
                myTasks.map(task => (
                  <motion.button
                    key={task.id}
                    onClick={() => insertTask(task)}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${task.status === 'In Progress' ? 'bg-indigo-500' : 'bg-slate-300'} group-hover:bg-indigo-500 transition-colors`}></div>
                    <div className="pl-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {task.status}
                        </span>
                        {task.priority === 'High' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="High Priority" />
                        )}
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                          {task.projects?.name}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors truncate leading-tight">
                        {task.title}
                      </h4>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FiBriefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No active tasks</p>
                  <p className="text-[10px] text-slate-400">You're all caught up!</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center: Wizard Experience */}
        <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 relative flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden">

          {/* Mobile Header */}
          {isMobile && (
            <div className="w-full px-4 py-3 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Daily Standup</h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mt-1">
                <FiCalendar className="w-4 h-4" />
                <span>{formatDateLabel(reportDate)}</span>
              </div>
              {lastSaved && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
                  <FiSave className="w-3 h-3" />
                  <span>Saved {format(lastSaved, 'h:mm a')}</span>
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-full lg:max-w-2xl">
            {/* Step Indicators */}
            <div className="flex justify-center mb-8 gap-3">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === step ? 'w-8 bg-indigo-500' : activeStep > step ? 'w-4 bg-indigo-200' : 'w-4 bg-slate-200'}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div
                  key="step-yesterday"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PremiumEditor
                    title="Yesterday's Progress"
                    subtitle="What did you implement, fix, or achieve?"
                    icon={<FiCheckCircle className="w-5 h-5 text-emerald-500" />}
                    editor={yesterdayEditor}
                    isActive={true}
                    accentColor="emerald"
                  />
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Next: Today's Focus</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="step-today"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PremiumEditor
                    title="Today's Focus"
                    subtitle="What are your key goals and priorities?"
                    icon={<FiTarget className="w-5 h-5 text-indigo-500" />}
                    editor={todayEditor}
                    isActive={true}
                    accentColor="indigo"
                  />
                  <div className="flex justify-between mt-6 gap-3">
                    <button
                      onClick={prevStep}
                      className="px-4 py-2.5 sm:px-6 sm:py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors flex items-center gap-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Next: Blockers</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step-blockers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PremiumEditor
                    title="Blockers & Impediments"
                    subtitle="Is anything holding you back?"
                    icon={<FiAlertCircle className="w-5 h-5 text-rose-500" />}
                    editor={blockersEditor}
                    isActive={true}
                    accentColor="rose"
                  />
                  <div className="flex justify-between mt-6 gap-3">
                    <button
                      onClick={prevStep}
                      className="px-4 py-2.5 sm:px-6 sm:py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors flex items-center gap-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <motion.button
                      onClick={handleSubmit}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative px-6 py-2.5 sm:px-8 sm:py-3 bg-slate-900 text-white text-base font-semibold rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-2 relative z-10">
                        {loading ? (
                          <>
                            <FiLoader className="animate-spin w-5 h-5" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Report</span>
                            <FiSend className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar: Helpers - Hidden on Mobile */}
        {!isMobile && (
          <aside className="w-[280px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-6">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
                <FiZap className="w-3.5 h-3.5" />
                Quick Actions
              </h3>

              <div className="space-y-3">
                <p className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  Editing <span className="text-slate-700 px-1.5 py-0.5 bg-slate-100 rounded capitalize">{activeEditorKey}</span>
                </p>
                {templates[activeEditorKey]?.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertTemplate(template)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-medium transition-colors border border-transparent hover:border-indigo-100 group"
                  >
                    <span className="opacity-70 group-hover:opacity-100">{template}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto p-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
                <FiUsers className="w-3.5 h-3.5" />
                Team Mention
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => mentionMember(member)}
                    className="aspect-square rounded-full bg-slate-100 hover:bg-indigo-100 hover:ring-2 ring-indigo-500/20 transition-all flex items-center justify-center relative group"
                    title={member.name}
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">{member.name?.charAt(0)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

      </main>
    </div>
  );
};

const PremiumEditor = ({ title, subtitle, icon, editor, isActive, accentColor, isPrimary }) => {

  const activeStyles = {
    emerald: "ring-4 ring-emerald-500/30 border-emerald-400/50 shadow-[0_8px_30px_rgb(16,185,129,0.12)]",
    indigo: "ring-4 ring-indigo-500/30 border-indigo-400/50 shadow-[0_8px_30px_rgb(99,102,241,0.12)]",
    rose: "ring-4 ring-rose-500/30 border-rose-400/50 shadow-[0_8px_30px_rgb(244,63,94,0.12)]",
  };

  return (
    <div
      className={`
                group relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 ease-out flex flex-col min-h-[400px]
                ${isActive
          ? `${activeStyles[accentColor]} translate-y-[-2px]`
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
        }
            `}
    >
      <div className={`
                px-6 py-5 border-b flex items-center justify-between
                ${isActive ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 bg-white'}
                rounded-t-2xl
            `}>
        <div className="flex items-center gap-4">
          <div className={`
                        p-2.5 rounded-xl transition-colors
                        ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-slate-100'}
                    `}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Visual Indicator for Active State */}
        <div className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-500
                    ${isActive ? `bg-${accentColor}-500 scale-100` : 'bg-slate-200 scale-0'}
                 `} />
      </div>

      <div className="p-6 flex-1 flex flex-col relative cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} className="flex-1" />

        {!isActive && !editor?.getText()?.trim() && (
          <div className="absolute inset-0 bg-slate-50/30 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-semibold text-slate-400 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50">
              Click to edit
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportEntryNew;
