import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiCheckCircle, FiAlertCircle, FiClipboard, FiList, FiUsers, 
  FiSend, FiCopy, FiStar, FiBold, FiItalic, FiCode, FiAtSign, FiFileText, 
  FiPlus, FiCheck, FiEdit, FiX, FiClock, FiTarget, FiTrendingUp, FiZap,
  FiBookmark, FiHash, FiLink, FiSave, FiRefreshCw, FiArrowLeft, FiChevronDown,
  FiChevronUp, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { format, subDays } from 'date-fns';
import '../tiptap.css';

// Success animation
const SuccessAnimation = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-3xl p-12 shadow-2xl max-w-md"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <FiCheckCircle className="h-24 w-24 text-green-500 mb-4" />
          </motion.div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Success!</h3>
          <p className="text-gray-600 text-center">Your daily report has been submitted</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Formatting toolbar component
const EditorToolbar = ({ editor, onInsert }) => {
  if (!editor) return null;
  
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}
        title="Bold (Ctrl+B)"
      >
        <FiBold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}
        title="Italic (Ctrl+I)"
      >
        <FiItalic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('code') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}
        title="Code"
      >
        <FiCode className="h-4 w-4" />
      </button>
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}
        title="Bullet List"
      >
        <FiList className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}
        title="Numbered List"
      >
        <FiFileText className="h-4 w-4" />
      </button>
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      <button
        type="button"
        onClick={() => onInsert?.('task')}
        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
        title="Insert Task"
      >
        <FiPlus className="h-3 w-3" />
        Task
      </button>
      <button
        type="button"
        onClick={() => onInsert?.('mention')}
        className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
        title="Mention User"
      >
        <FiAtSign className="h-3 w-3" />
        Mention
      </button>
    </div>
  );
};

export default function ReportEntryNew() {
  // State management
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingReport, setExistingReport] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [previousReport, setPreviousReport] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [wordCount, setWordCount] = useState({ yesterday: 0, today: 0, blockers: 0 });
  const [taskSearch, setTaskSearch] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);
  
  const navigate = useNavigate();

  // Tiptap editors
  const yesterdayEditor = useEditor({
    extensions: [StarterKit],
    content: yesterday,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setYesterday(html);
      setWordCount(prev => ({ ...prev, yesterday: editor.getText().split(/\s+/).filter(Boolean).length }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  const todayEditor = useEditor({
    extensions: [StarterKit],
    content: today,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setToday(html);
      setWordCount(prev => ({ ...prev, today: editor.getText().split(/\s+/).filter(Boolean).length }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  const blockersEditor = useEditor({
    extensions: [StarterKit],
    content: blockers,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setBlockers(html);
      setWordCount(prev => ({ ...prev, blockers: editor.getText().split(/\s+/).filter(Boolean).length }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-4',
      },
    },
  });

  // Fetch previous day's report
  const fetchPreviousReport = async (userId) => {
    try {
      const previousDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_reports')
        .select('today')
        .eq('user_id', userId)
        .eq('date', previousDate)
        .single();
      
      if (data && !error) {
        setPreviousReport(data);
      }
    } catch (error) {
      console.error('Error fetching previous report:', error);
    }
  };

  // Copy yesterday's "today" to current "yesterday"
  const copyFromPreviousReport = () => {
    if (previousReport?.today) {
      setYesterday(previousReport.today);
      if (yesterdayEditor?.view) {
        try {
          yesterdayEditor.commands.setContent(previousReport.today);
        } catch (error) {
          console.warn('Error setting content:', error);
        }
      }
      setMessage({ type: 'success', text: 'Copied from yesterday\'s planned tasks!' });
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch teams
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name');
        setTeams(teamsData || []);

        // Fetch user's team
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (userData?.team_id) {
          setSelectedTeam(userData.team_id);
          
          // Fetch team members
          const { data: members } = await supabase
            .from('users')
            .select('id, name')
            .eq('team_id', userData.team_id)
            .order('name');
          setTeamMembers(members || []);
        }

        // Fetch user's tasks
        setTasksLoading(true);
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status, priority, assignee:users!tasks_assignee_id_fkey(name)')
          .eq('assignee_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(100);
        
        if (tasksError) {
          console.error('Tasks error:', tasksError);
        } else {
          console.log('Fetched tasks:', tasks);
          setMyTasks(tasks || []);
        }
        setTasksLoading(false);

        // Fetch previous report
        await fetchPreviousReport(user.id);

        // Check for existing report
        const { data: reportData } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        if (reportData) {
          setExistingReport(reportData);
          setYesterday(reportData.yesterday || '');
          setToday(reportData.today || '');
          setBlockers(reportData.blockers || '');
          setMessage({ type: 'info', text: 'Editing existing report for this date.' });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    initializeData();
  }, [date]);

  // Sync content to editors
  useEffect(() => {
    if (yesterdayEditor?.view && yesterday !== yesterdayEditor.getHTML()) {
      try {
        yesterdayEditor.commands.setContent(yesterday);
      } catch (error) {
        console.warn('Error setting yesterday content:', error);
      }
    }
  }, [yesterday, yesterdayEditor]);

  useEffect(() => {
    if (todayEditor?.view && today !== todayEditor.getHTML()) {
      try {
        todayEditor.commands.setContent(today);
      } catch (error) {
        console.warn('Error setting today content:', error);
      }
    }
  }, [today, todayEditor]);

  useEffect(() => {
    if (blockersEditor?.view && blockers !== blockersEditor.getHTML()) {
      try {
        blockersEditor.commands.setContent(blockers);
      } catch (error) {
        console.warn('Error setting blockers content:', error);
      }
    }
  }, [blockers, blockersEditor]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !yesterday && !today && !blockers) return;
    
    const autoSaveTimer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !selectedTeam) return;

        const reportData = {
          user_id: user.id,
          date,
          yesterday,
          today,
          blockers,
          updated_at: new Date().toISOString()
        };

        if (existingReport) {
          await supabase
            .from('daily_reports')
            .update(reportData)
            .eq('id', existingReport.id);
        } else {
          reportData.created_at = new Date().toISOString();
          const { data } = await supabase
            .from('daily_reports')
            .insert([reportData])
            .select()
            .single();
          
          if (data) setExistingReport(data);
        }
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [yesterday, today, blockers, autoSaveEnabled, date, selectedTeam, existingReport]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'You must be assigned to a team to submit reports' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const reportData = {
        user_id: user.id,
        date,
        yesterday,
        today,
        blockers,
        updated_at: new Date().toISOString()
      };

      if (existingReport) {
        await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', existingReport.id);
      } else {
        reportData.created_at = new Date().toISOString();
        await supabase
          .from('daily_reports')
          .insert([reportData]);
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    navigate('/dashboard');
  };

  // Insert task
  // Refresh tasks
  const refreshTasks = async () => {
    try {
      setTasksLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, priority, assignee:users!tasks_assignee_id_fkey(name)')
        .eq('assignee_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100);
      
      if (tasksError) {
        console.error('Tasks error:', tasksError);
      } else {
        console.log('Refreshed tasks:', tasks);
        setMyTasks(tasks || []);
        setMessage({ type: 'success', text: `Loaded ${tasks?.length || 0} tasks` });
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      setMessage({ type: 'error', text: 'Failed to load tasks' });
    } finally {
      setTasksLoading(false);
    }
  };

  const insertTask = (task) => {
    const editor = activeEditor || todayEditor;
    if (editor?.view) {
      try {
        editor.commands.insertContent(`[TASK:${task.id}|${task.title}] `);
        editor.commands.focus();
        setShowTaskPicker(false);
        setTaskSearch('');
      } catch (error) {
        console.warn('Insert task error:', error);
      }
    }
  };

  // Insert mention
  const insertMention = (member) => {
    const editor = activeEditor || todayEditor;
    if (editor?.view) {
      try {
        editor.commands.insertContent(`@${member.name}{id:${member.id}} `);
        editor.commands.focus();
        setShowMentionPicker(false);
      } catch (error) {
        console.warn('Insert mention error:', error);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className={`mx-auto ${isFullscreen ? 'max-w-full px-8' : 'max-w-[1600px] px-8'} py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {existingReport ? 'Update Report' : 'Daily Report'}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FiCalendar className="h-4 w-4" />
                  {format(new Date(date), 'MMMM d, yyyy')}
                  {selectedTeam && (
                    <>
                      <span>•</span>
                      <FiUsers className="h-4 w-4" />
                      {teams.find(t => t.id === selectedTeam)?.name}
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FiCheck className="h-3 w-3 text-green-500" />
                  Saved {format(lastSaved, 'HH:mm')}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <FiMinimize2 className="h-5 w-5" /> : <FiMaximize2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Quick Actions"
              >
                <FiZap className="h-5 w-5 text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`mx-auto ${isFullscreen ? 'max-w-full px-8' : 'max-w-[1600px] px-8'} py-8`}>
        <AnimatePresence>
          {message.text && (
            <motion.div 
              className={`mb-6 p-4 rounded-xl flex items-start shadow-md ${
                {
                  success: 'bg-green-50 text-green-700 border border-green-200',
                  error: 'bg-red-50 text-red-700 border border-red-200',
                  info: 'bg-blue-50 text-blue-700 border border-blue-200'
                }[message.type]
              }`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mr-3">
                {message.type === 'success' && <FiCheckCircle className="h-5 w-5" />}
                {message.type === 'error' && <FiAlertCircle className="h-5 w-5" />}
                {message.type === 'info' && <FiFileText className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Actions Bar */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={copyFromPreviousReport}
                    disabled={!previousReport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <FiCopy className="h-4 w-4" />
                    Copy from Yesterday's Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowTaskPicker(!showTaskPicker); setActiveEditor(todayEditor); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                  >
                    <FiList className="h-4 w-4" />
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowMentionPicker(!showMentionPicker); setActiveEditor(todayEditor); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <FiAtSign className="h-4 w-4" />
                    Mention
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      Auto-save
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Sections */}
          <div className={`grid ${isFullscreen ? 'grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
            {/* Yesterday */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Yesterday</h3>
                  </div>
                  {previousReport && (
                    <button
                      type="button"
                      onClick={copyFromPreviousReport}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Copy from yesterday's plan"
                    >
                      <FiCopy className="h-3 w-3 inline mr-1" />
                      Copy
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600">What you accomplished</p>
                <div className="text-xs text-gray-500 mt-1">{wordCount.yesterday} words</div>
              </div>
              <EditorToolbar 
                editor={yesterdayEditor} 
                onInsert={(type) => {
                  setActiveEditor(yesterdayEditor);
                  if (type === 'task') setShowTaskPicker(true);
                  if (type === 'mention') setShowMentionPicker(true);
                }}
              />
              <div className="bg-white min-h-[200px]">
                <EditorContent editor={yesterdayEditor} />
              </div>
            </div>

            {/* Today */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiTarget className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Today</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-600">What you plan to do</p>
                <div className="text-xs text-gray-500 mt-1">{wordCount.today} words</div>
              </div>
              <EditorToolbar 
                editor={todayEditor} 
                onInsert={(type) => {
                  setActiveEditor(todayEditor);
                  if (type === 'task') setShowTaskPicker(true);
                  if (type === 'mention') setShowMentionPicker(true);
                }}
              />
              <div className="bg-white min-h-[200px]">
                <EditorContent editor={todayEditor} />
              </div>
            </div>

            {/* Blockers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900">Blockers</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-600">What's blocking you</p>
                <div className="text-xs text-gray-500 mt-1">{wordCount.blockers} words</div>
              </div>
              <EditorToolbar 
                editor={blockersEditor} 
                onInsert={(type) => {
                  setActiveEditor(blockersEditor);
                  if (type === 'task') setShowTaskPicker(true);
                  if (type === 'mention') setShowMentionPicker(true);
                }}
              />
              <div className="bg-white min-h-[200px]">
                <EditorContent editor={blockersEditor} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="h-5 w-5" />
                  {existingReport ? 'Update Report' : 'Submit Report'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Task Picker Modal */}
      <AnimatePresence>
        {showTaskPicker && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowTaskPicker(false); setTaskSearch(''); }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[600px] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">Select Task</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{myTasks.length} tasks available</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={refreshTasks}
                      disabled={tasksLoading}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh tasks"
                    >
                      <FiRefreshCw className={`h-5 w-5 ${tasksLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => { setShowTaskPicker(false); setTaskSearch(''); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div className="p-4 overflow-y-auto max-h-[500px]">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading tasks...</span>
                  </div>
                ) : myTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <FiList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No tasks assigned to you</p>
                    <p className="text-gray-400 text-sm mt-1">Tasks will appear here once assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myTasks
                      .filter(task => {
                        if (!taskSearch) return true;
                        const searchLower = taskSearch.toLowerCase();
                        return task.title.toLowerCase().includes(searchLower) ||
                               task.status.toLowerCase().includes(searchLower);
                      })
                      .map(task => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => insertTask(task)}
                          className="w-full text-left p-4 rounded-lg hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-indigo-700">{task.title}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  task.status === 'todo' ? 'bg-gray-100 text-gray-700' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                                  task.status === 'done' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                                {task.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                            <FiPlus className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                          </div>
                        </button>
                      ))}
                    {myTasks.filter(task => {
                      if (!taskSearch) return true;
                      const searchLower = taskSearch.toLowerCase();
                      return task.title.toLowerCase().includes(searchLower) ||
                             task.status.toLowerCase().includes(searchLower);
                    }).length === 0 && (
                      <p className="text-center text-gray-500 py-8">No tasks match your search</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention Picker Modal */}
      <AnimatePresence>
        {showMentionPicker && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMentionPicker(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[600px] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mention Team Member</h3>
                <button
                  onClick={() => setShowMentionPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[500px]">
                {teamMembers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No team members found</p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => insertMention(member)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>
    </div>
  );
}
