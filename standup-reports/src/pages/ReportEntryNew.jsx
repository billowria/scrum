import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
// import TaskDetailView from '../components/tasks/TaskDetailView';
import { 
  FiCalendar, FiCheckCircle, FiAlertCircle, FiClipboard, FiList, FiUsers, 
  FiSend, FiCopy, FiStar, FiBold, FiItalic, FiCode, FiAtSign, FiFileText, 
  FiPlus, FiCheck, FiEdit, FiX, FiClock, FiTarget, FiTrendingUp, FiZap,
  FiBookmark, FiHash, FiLink, FiSave, FiRefreshCw, FiArrowLeft, FiChevronDown,
  FiChevronUp, FiMaximize2, FiMinimize2, FiTag, FiUser, FiFlag, FiPaperclip,
  FiThumbsUp, FiMessageSquare, FiBarChart2, FiAward, FiCoffee, FiShield,
  FiCompass, FiDatabase, FiGitBranch, FiSettings, FiTool, FiFilter,
  FiNavigation, FiPackage, FiLayers, FiMapPin, FiHome, FiMonitor,
  FiSmartphone, FiTablet, FiHeadphones, FiCamera, FiVideo,
  FiMic, FiSpeaker, FiPrinter, FiServer, FiCloud, FiWifi,
  FiBluetooth, FiBattery, FiPower, FiLock, FiUnlock,
  FiKey, FiEye, FiEyeOff, FiHeart, FiSmile, FiFrown,
  FiMeh, FiThumbsDown, FiShare2, FiDownload, FiUpload,
  FiTrash2, FiArchive, FiInbox, FiMail, FiPhone,
  FiGlobe, FiMap, FiNavigation2, FiCompass as FiCompass2,
  FiAnchor, FiLifeBuoy, FiTool as FiTool2, FiSettings as FiSettings2
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
    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <motion.button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
          editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
        }`}
        title="Bold (Ctrl+B)"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiBold className="h-4 w-4" />
      </motion.button>
      <motion.button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
          editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
        }`}
        title="Italic (Ctrl+I)"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiItalic className="h-4 w-4" />
      </motion.button>
      <motion.button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
          editor.isActive('code') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
        }`}
        title="Code"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiCode className="h-4 w-4" />
      </motion.button>
      <div className="h-5 w-px bg-gray-300 mx-1"></div>
      <motion.button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
          editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
        }`}
        title="Bullet List"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiList className="h-4 w-4" />
      </motion.button>
      <motion.button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
          editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
        }`}
        title="Numbered List"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiFileText className="h-4 w-4" />
      </motion.button>
      <div className="h-5 w-px bg-gray-300 mx-1"></div>
      <motion.button
        type="button"
        onClick={() => onInsert?.('task')}
        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center gap-1 shadow-sm hover:shadow-md"
        title="Insert Task"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiPlus className="h-3 w-3" />
        Task
      </motion.button>
      <motion.button
        type="button"
        onClick={() => onInsert?.('mention')}
        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-1 shadow-sm hover:shadow-md"
        title="Mention User"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiAtSign className="h-3 w-3" />
        Mention
      </motion.button>
    </div>
  );
};

export default function ReportEntryNew() {
  // Company context
  const { currentCompany } = useCompany();

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
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();

  // Utility function to parse task references from text with positions
  const parseTaskReferences = (text) => {
    // Match patterns like [TASK:id|title] or TASK:id
    const taskPattern = /\[TASK:([^\]|]+)\|([^\]]+)\]|\bTASK:([A-Z0-9]{8,})\b/g;
    const matches = [];
    let match;
    
    while ((match = taskPattern.exec(text)) !== null) {
      const taskId = match[1] || match[3];
      const taskTitle = match[2] || taskId;
      
      if (taskId) {
        matches.push({
          id: taskId,
          title: taskTitle,
          index: match.index,
          length: match[0].length,
          fullMatch: match[0]
        });
      }
    }
    
    return matches;
  };

  // Utility function to parse mentions from text with positions
  const parseMentions = (text) => {
    // Match patterns like @name{id:uuid}
    const mentionPattern = /@([^\{\s]+)\{id:([a-f0-9\-]+)\}/g;
    const mentions = [];
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
      mentions.push({
        name: match[1],
        id: match[2],
        index: match.index,
        length: match[0].length,
        fullMatch: match[0]
      });
    }
    
    return mentions;
  };

  // Custom component to render content with clickable task references and mentions
  const ContentRenderer = ({ content, onTaskClick, onMentionClick }) => {
    // Parse task references and mentions from the content
    const taskReferences = parseTaskReferences(content);
    const mentions = parseMentions(content);
    
    // Create an array of all clickable elements with their positions
    const clickableElements = [
      ...taskReferences.map(ref => ({ ...ref, type: 'task' })),
      ...mentions.map(mention => ({ ...mention, type: 'mention' }))
    ].sort((a, b) => a.index - b.index);
    
    // If no clickable elements, just render the content as plain text
    if (clickableElements.length === 0) {
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      );
    }
    
    // Split the content by clickable elements
    const elements = [];
    let lastIndex = 0;
    
    clickableElements.forEach((element, index) => {
      // Add text before the clickable element
      if (element.index > lastIndex) {
        const text = content.substring(lastIndex, element.index);
        elements.push(
          <span 
            key={`text-${index}`} 
            dangerouslySetInnerHTML={{ __html: text }} 
          />
        );
      }
      
      // Add the clickable element
      if (element.type === 'task') {
        elements.push(
          <motion.button
            key={`task-${element.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors shadow-sm cursor-pointer"
            onClick={() => onTaskClick(element.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTag className="w-3 h-3" />
            <span>{element.id}</span>
          </motion.button>
        );
      } else if (element.type === 'mention') {
        elements.push(
          <motion.button
            key={`mention-${element.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors shadow-sm cursor-pointer"
            onClick={() => onMentionClick(element.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiUser className="w-3 h-3" />
            <span>{element.name}</span>
          </motion.button>
        );
      }
      
      lastIndex = element.index + element.length;
    });
    
    // Add remaining text after the last clickable element
    if (lastIndex < content.length) {
      const text = content.substring(lastIndex);
      elements.push(
        <span 
          key="text-end" 
          dangerouslySetInnerHTML={{ __html: text }} 
        />
      );
    }
    
    return (
      <div className="prose prose-sm max-w-none">
        {elements}
      </div>
    );
  };

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
      if (!currentCompany?.id) return;

      const previousDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_reports')
        .select('today')
        .eq('user_id', userId)
        .eq('date', previousDate)
        .eq('company_id', currentCompany.id) // Company filter
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
        // Wait for company context to be available
        if (!currentCompany?.id) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUser(user);

        // Fetch teams with company filtering
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name')
          .eq('company_id', currentCompany.id);
        setTeams(teamsData || []);

        // Fetch user's team and role with company filtering
        const { data: userData } = await supabase
          .from('users')
          .select('team_id, role')
          .eq('id', user.id)
          .eq('company_id', currentCompany.id) // Company filter
          .single();

        if (userData?.team_id) {
          setSelectedTeam(userData.team_id);

          // Fetch team members with company filtering
          const { data: members } = await supabase
            .from('users')
            .select('id, name')
            .eq('team_id', userData.team_id)
            .eq('company_id', currentCompany.id) // Company filter
            .order('name');
          setTeamMembers(members || []);
        }

        if (userData?.role) {
          setUserRole(userData.role);
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
          .eq('company_id', currentCompany.id) // Company filter
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
  }, [date, currentCompany]);

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
        if (!user || !selectedTeam || !currentCompany?.id) return;

        const reportData = {
          user_id: user.id,
          date,
          yesterday,
          today,
          blockers,
          company_id: currentCompany.id, // Add company_id
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

  // Handle task click to open task modal
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  // Handle mention click to navigate to profile
  const handleMentionClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Close task modal
  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTaskId(null);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'You must be assigned to a team to submit reports' });
      return;
    }

    if (!currentCompany?.id) {
      setMessage({ type: 'error', text: 'Company context not available' });
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
        company_id: currentCompany.id, // Add company_id
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
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors shadow-sm hover:shadow-md"
                title="Back to Dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowLeft className="h-5 w-5 text-gray-700" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  {existingReport ? 'Update Daily Report' : 'Create Daily Report'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <motion.div 
                      className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600"
                      whileHover={{ scale: 1.1 }}
                    >
                      <FiCalendar className="h-4 w-4" />
                    </motion.div>
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  {selectedTeam && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <motion.div 
                        className="p-1.5 rounded-lg bg-purple-100 text-purple-600"
                        whileHover={{ scale: 1.1 }}
                      >
                        <FiUsers className="h-4 w-4" />
                      </motion.div>
                      {teams.find(t => t.id === selectedTeam)?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastSaved && (
                <motion.span 
                  className="text-xs text-gray-500 flex items-center gap-1 bg-green-50 px-2.5 py-1.5 rounded-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="p-1 rounded-full bg-green-100 text-green-600"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <FiCheck className="h-3 w-3" />
                  </motion.div>
                  Saved {format(lastSaved, 'HH:mm')}
                </motion.span>
              )}
              <motion.button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors shadow-sm hover:shadow-md"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullscreen ? 
                  <motion.div
                    initial={{ rotate: -90 }}
                    animate={{ rotate: 0 }}
                  >
                    <FiMinimize2 className="h-5 w-5 text-gray-700" />
                  </motion.div> : 
                  <FiMaximize2 className="h-5 w-5 text-gray-700" />
                }
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-3 hover:bg-indigo-100 rounded-xl transition-colors shadow-sm hover:shadow-md text-indigo-600"
                title="Quick Actions"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiZap className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            className="fixed top-20 right-8 z-30 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`mx-auto ${isFullscreen ? 'max-w-full px-8' : 'max-w-[1600px] px-8'} py-8`}>
        <AnimatePresence>
          {message.text && (
            <motion.div 
              className={`mb-6 p-4 rounded-xl flex items-start shadow-lg ${
                {
                  success: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200',
                  error: 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200',
                  info: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                }[message.type]
              }`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
         

          {/* Editor Sections */}
          <div className={`grid ${isFullscreen ? 'grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
            {/* Yesterday */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiCheckCircle className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-xl">Yesterday</h3>
                      <p className="text-emerald-100 text-sm">What you accomplished</p>
                    </div>
                  </div>
                  {previousReport && (
                    <motion.button
                      type="button"
                      onClick={copyFromPreviousReport}
                      className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-1.5 shadow-sm"
                      title="Copy from yesterday's plan"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiCopy className="h-3.5 w-3.5" />
                      Copy
                    </motion.button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-emerald-100">
                    <FiFileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{wordCount.yesterday} words</span>
                  </div>
                  <div className="h-4 w-px bg-emerald-300/50"></div>
                  <div className="flex items-center gap-1.5 text-emerald-100">
                    <FiClock className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                </div>
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
            </motion.div>

            {/* Today */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiTarget className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-xl">Today</h3>
                      <p className="text-indigo-100 text-sm">What you plan to do</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-indigo-100">
                    <FiFileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{wordCount.today} words</span>
                  </div>
                  <div className="h-4 w-px bg-indigo-300/50"></div>
                  <div className="flex items-center gap-1.5 text-indigo-100">
                    <FiTrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Planned</span>
                  </div>
                </div>
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
            </motion.div>

            {/* Blockers */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiAlertCircle className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-xl">Blockers</h3>
                      <p className="text-amber-100 text-sm">What's blocking you</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-amber-100">
                    <FiFileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{wordCount.blockers} words</span>
                  </div>
                  <div className="h-4 w-px bg-amber-300/50"></div>
                  <div className="flex items-center gap-1.5 text-amber-100">
                    <FiShield className="h-4 w-4" />
                    <span className="text-sm font-medium">Issues</span>
                  </div>
                </div>
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
            </motion.div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-8">
            <motion.button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiX className="h-5 w-5" />
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2.5 relative overflow-hidden"
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loading ? (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <FiRefreshCw className="h-5 w-5 animate-spin" />
                    Submitting Report...
                  </span>
                </>
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  <FiSend className="h-5 w-5" />
                  {existingReport ? 'Update Report' : 'Submit Report'}
                </span>
              )}
            </motion.button>
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

      {/* Task Detail Modal */}
      <AnimatePresence>
        {/* TaskDetailView temporarily removed - needs to be re-implemented */}
        {/* {showTaskModal && selectedTaskId && (
          <TaskDetailView
            isOpen={showTaskModal}
            onClose={handleCloseTaskModal}
            taskId={selectedTaskId}
            currentUser={currentUser}
            userRole={userRole}
          />
        )} */}
      </AnimatePresence>
    </div>
  );
}
