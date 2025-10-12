import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiAlertCircle, FiClipboard, FiList, FiUsers, FiSend, FiArrowRight, FiStar, FiBold, FiItalic, FiCode, FiLink, FiAtSign, FiFileText, FiPlus, FiCheck, FiEdit, FiEye } from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import '../tiptap.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 35px -5px rgba(79, 70, 229, 0.2), 0 8px 15px -6px rgba(79, 70, 229, 0.15)",
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  }
};

const inputFocusVariants = {
  rest: { scale: 1, borderColor: 'rgba(165, 180, 252, 0.5)' },
  focus: { 
    scale: 1.01, 
    borderColor: 'rgba(99, 102, 241, 1)', 
    boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.2)"
  },
};

// Particle component for success animation
const Particle = ({ color }) => {
  const randomX = Math.random() * 200 - 100;
  const randomY = Math.random() * 200 - 100;
  const size = Math.random() * 8 + 4;
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ 
        backgroundColor: color,
        width: size,
        height: size,
      }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{
        x: randomX,
        y: randomY,
        opacity: 0,
        scale: 0
      }}
      transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
    />
  );
};

// Success animation component
const SuccessAnimation = ({ onComplete }) => {
  const particles = Array.from({ length: 50 });
  const colors = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#bae6fd', '#8b5cf6', '#ec4899'];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-indigo-900/70 to-purple-900/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative">
        <motion.div 
          className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-10 shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FiCheckCircle className="h-20 w-20 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted!</h3>
            <p className="text-gray-600">Your daily standup report has been successfully saved</p>
          </motion.div>
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {particles.map((_, i) => (
            <Particle key={i} color={colors[i % colors.length]} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Step indicator component
const StepIndicator = ({ step }) => {
  const steps = [
    { title: 'Yesterday', icon: <FiCheck className="h-5 w-5" />, description: 'What you accomplished' },
    { title: 'Today', icon: <FiEdit className="h-5 w-5" />, description: 'What you plan to do' },
    { title: 'Blockers', icon: <FiAlertCircle className="h-5 w-5" />, description: 'What is blocking you' }
  ];
  
  return (
    <div className="mb-10">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-full"></div>
          </div>
          <div className="relative flex justify-between">
            {steps.map((item, index) => (
              <motion.div 
                key={index}
                className="flex flex-col items-center z-10"
                initial={false}
                animate={index <= step ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div 
                  className={`h-12 w-12 flex items-center justify-center rounded-full mb-2 ${
                    index < step 
                      ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg' 
                      : index === step 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ring-4 ring-indigo-100 shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                  initial={false}
                  animate={
                    index < step 
                      ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff' } 
                      : index === step 
                        ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#ffffff', boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.2)' } 
                        : { background: '#e5e7eb', color: '#6b7280' }
                  }
                  transition={{ duration: 0.3 }}
                >
                  {index < step ? <FiCheck className="h-6 w-6" /> : item.icon}
                </motion.div>
                <motion.div 
                  className={`text-center px-3 py-1 rounded-full ${
                    index <= step ? 'bg-indigo-50 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-500'
                  }`}
                  initial={false}
                  animate={
                    index <= step 
                      ? { backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: 600 } 
                      : { backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 400 }
                  }
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-sm sm:text-base">{item.title}</div>
                </motion.div>
                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {steps[step].title}
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          {steps[step].description}
        </p>
      </motion.div>
    </div>
  );
};

// Formatting toolbar component
const FormattingToolbar = ({ onFormat, textRef }) => {
  const handleFormat = (type) => {
    const textarea = textRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    let newStart, newEnd;
    
    switch(type) {
      case 'bold':
        newText = `${text.substring(0, start)}**${selectedText}**${text.substring(end)}`;
        newStart = start + 2;
        newEnd = start + 2 + selectedText.length;
        break;
      case 'italic':
        newText = `${text.substring(0, start)}*${selectedText}*${text.substring(end)}`;
        newStart = start + 1;
        newEnd = start + 1 + selectedText.length;
        break;
      case 'list':
        newText = `${text.substring(0, start)}\n- ${selectedText.split('\n').join('\n- ')}${text.substring(end)}`;
        newStart = start + 3;
        newEnd = start + 3 + selectedText.length;
        break;
      case 'numberedList':
        newText = `${text.substring(0, start)}\n1. ${selectedText.split('\n').join('\n1. ')}${text.substring(end)}`;
        newStart = start + 4;
        newEnd = start + 4 + selectedText.length;
        break;
      case 'code':
        newText = `${text.substring(0, start)}\`${selectedText}\`${text.substring(end)}`;
        newStart = start + 1;
        newEnd = start + 1 + selectedText.length;
        break;
      default:
        return;
    }
    
    onFormat(newText, newStart, newEnd);
  };
  
  return (
    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <button 
        type="button" 
        onClick={() => handleFormat('bold')}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700"
        title="Bold"
      >
        <FiBold className="h-4 w-4" />
      </button>
      <button 
        type="button" 
        onClick={() => handleFormat('italic')}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700"
        title="Italic"
      >
        <FiItalic className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-gray-300"></div>
      <button 
        type="button" 
        onClick={() => handleFormat('list')}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700"
        title="Bulleted List"
      >
        <FiList className="h-4 w-4" />
      </button>
      <button 
        type="button" 
        onClick={() => handleFormat('numberedList')}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700"
        title="Numbered List"
      >
        <FiList className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-gray-300"></div>
      <button 
        type="button" 
        onClick={() => handleFormat('code')}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700"
        title="Inline Code"
      >
        <FiCode className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-gray-300"></div>
      <button 
        type="button" 
        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm"
        title="Add Task"
      >
        <FiPlus className="h-4 w-4 inline mr-1" />
        Task
      </button>
    </div>
  );
};

export default function ReportEntry() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingReport, setExistingReport] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFormattingOptions, setShowFormattingOptions] = useState({ yesterday: false, today: false, blockers: false });
  // Mentions and task updates
  const [teamMembers, setTeamMembers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [activeField, setActiveField] = useState('today');
  const [taskSearchId, setTaskSearchId] = useState('');
  const [taskUpdates, setTaskUpdates] = useState([]); // {id,title,status,update}
  const [taskLoading, setTaskLoading] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [myTaskQuery, setMyTaskQuery] = useState('');
  
  // Refs for form elements (Tiptap editors)
  const yesterdayRef = useRef(null);
  const todayRef = useRef(null);
  const blockersRef = useRef(null);

  // Tiptap editors
  const yesterdayEditor = useEditor({
    extensions: [StarterKit],
    content: yesterday,
    onUpdate: ({ editor }) => {
      setYesterday(editor.getHTML());
    },
  });

  const todayEditor = useEditor({
    extensions: [StarterKit],
    content: today,
    onUpdate: ({ editor }) => {
      setToday(editor.getHTML());
    },
  });

  const blockersEditor = useEditor({
    extensions: [StarterKit],
    content: blockers,
    onUpdate: ({ editor }) => {
      setBlockers(editor.getHTML());
    },
  });
  
  // Controls for animations
  const controls = useAnimation();
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has a report for the selected date and fetch teams
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');

        if (teamsError) {
          console.error('Error fetching teams:', teamsError);
        } else {
          setTeams(teamsData || []);
        }

        // Fetch user's team
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (!userDataError && userData?.team_id) {
          setSelectedTeam(userData.team_id);
          // Preload team members for mentions
          const { data: members } = await supabase
            .from('users')
            .select('id, name')
            .eq('team_id', userData.team_id)
            .order('name');
          setTeamMembers(members || []);
        }

        // Fetch tasks assigned to the current user for quick insertion
        setMyTasksLoading(true);
        try {
          const { data: assigned } = await supabase
            .from('tasks')
            .select('id, title, status, updated_at')
            .eq('assignee_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(100);
          setMyTasks(assigned || []);
        } catch (e) {
          console.error('Failed to load assigned tasks', e);
          setMyTasks([]);
        } finally {
          setMyTasksLoading(false);
        }

        // Check for existing report
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking for existing report:', error);
          return;
        }

        if (data) {
          // Found existing report, populate form
          setExistingReport(data);
          const yesterdayContent = data.yesterday || '';
          const todayContent = data.today || '';
          const blockersContent = data.blockers || '';
          setYesterday(yesterdayContent);
          setToday(todayContent);
          setBlockers(blockersContent);
          setMessage({ type: 'info', text: 'Editing existing report for this date.' });
        } else {
          // No existing report
          setExistingReport(null);
          setYesterday('');
          setToday('');
          setBlockers('');
          setMessage({ type: '', text: '' });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    initializeData();
    setCurrentStep(0);
  }, [date]);

  // Sync editor content when state changes from data loading
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'You must be assigned to a team by a manager to submit reports' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user data to check if profile exists
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If user doesn't exist in users table, create a profile for them
      if (userDataError && userDataError.code === 'PGRST116') { // Not found error
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0], // Default name from email
            role: 'member', // Default role
            team_id: selectedTeam // Add selected team
          }]);

        if (createUserError) {
          throw new Error(`Failed to create user profile: ${createUserError.message}`);
        }
      } else if (userDataError) {
        throw userDataError;
      } else if (userData && selectedTeam !== userData.team_id) {
        // Update user's team if it has changed
        const { error: updateTeamError } = await supabase
          .from('users')
          .update({ team_id: selectedTeam })
          .eq('id', user.id);
          
        if (updateTeamError) {
          console.error('Error updating team:', updateTeamError);
        }
      }

      // Append any pending task updates to 'today' before saving (as HTML paragraphs)
      let finalToday = today;
      if (taskUpdates.length > 0) {
        const block = taskUpdates
          .map(t => `<p>- [TASK:${t.id}|${t.title}] ${t.update ? String(t.update).replace(/</g,'&lt;') : ''}</p>`)
          .join('');
        finalToday = finalToday ? finalToday + block : block;
      }

      // Prepare report data
      const reportData = {
        user_id: user.id,
        date,
        yesterday,
        today: finalToday,
        blockers,
        updated_at: new Date().toISOString()
      };

      let result;

      if (existingReport) {
        // Update existing report
        result = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', existingReport.id);
      } else {
        // Insert new report
        reportData.created_at = new Date().toISOString();
        result = await supabase
          .from('daily_reports')
          .insert([reportData]);
      }

      const { error } = result;

      if (error) throw error;

      // Show success message and animation
      setMessage({
        type: 'success',
        text: existingReport 
          ? 'Your report has been updated successfully!' 
          : 'Your report has been submitted successfully!'
      });
      
      // Append any task updates not already inserted
      if (taskUpdates.length > 0) {
        const notInserted = taskUpdates
          .map(t => `- [TASK:${t.id}|${t.title}] ${t.update || ''}`)
          .join('\n');
        setToday(prev => (prev ? prev + '\n' + notInserted : notInserted));
      }

      // Show success animation and navigate back to dashboard
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
  
  // Focus correct field when step changes
  useEffect(() => {
    // Add a small delay to ensure editors are mounted
    const timeoutId = setTimeout(() => {
      try {
        if (currentStep === 0 && yesterdayEditor?.view) {
          yesterdayEditor.commands.focus();
        } else if (currentStep === 1 && todayEditor?.view) {
          todayEditor.commands.focus();
        } else if (currentStep === 2 && blockersEditor?.view) {
          blockersEditor.commands.focus();
        }
      } catch (error) {
        console.warn('Editor focus error:', error);
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [currentStep, yesterdayEditor, todayEditor, blockersEditor]);
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 2) {
      controls.start({
        x: [-5, 0],
        transition: { duration: 0.2 }
      });
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      // On final step, submit the form
      document.getElementById("report-form").requestSubmit();
    }
  };
  
  // Check if current step is valid and can proceed
  const canProceed = () => {
    try {
      if (currentStep === 0) {
        const text = yesterdayEditor?.getText() || '';
        return text.trim().length > 0;
      }
      if (currentStep === 1) {
        const text = todayEditor?.getText() || '';
        return text.trim().length > 0;
      }
      return true; // Blockers can be empty
    } catch (error) {
      console.warn('canProceed error:', error);
      // Fallback to checking state values
      if (currentStep === 0) return yesterday.trim().length > 0;
      if (currentStep === 1) return today.trim().length > 0;
      return true;
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // If shift+enter is pressed, move to next step or submit
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // Prevent default newline behavior
      if (canProceed()) {
        handleNextStep();
      }
    }
  };

  const toggleFormattingOptions = (field) => {
    setShowFormattingOptions(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Insert mention into active field
  const insertMention = (member) => {
    const token = `@${member.name}{id:${member.id}} `;
    const editor = activeField === 'yesterday' ? yesterdayEditor : activeField === 'blockers' ? blockersEditor : todayEditor;
    if (editor?.view) {
      try {
        editor.commands.insertContent(token);
        editor.commands.focus();
      } catch (error) {
        console.warn('Insert mention error:', error);
      }
    }
    setShowMentionPicker(false);
    setMentionQuery('');
  };

  // Fetch task by ID and add to updates list
  const addTaskById = async () => {
    if (!taskSearchId) return;
    setTaskLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('id', taskSearchId)
        .single();
      if (error) throw error;
      if (data) {
        setTaskUpdates(prev => {
          if (prev.some(t => t.id === data.id)) return prev;
          return [...prev, { id: data.id, title: data.title, status: data.status, update: '' }];
        });
        setTaskSearchId('');
      }
    } catch (err) {
      console.error('Task fetch failed', err);
      setMessage({ type: 'error', text: 'Task not found. Check Task ID.' });
    } finally {
      setTaskLoading(false);
    }
  };

  // Insert task token at cursor (no description)
  const insertTaskToken = (task) => {
    if (todayEditor?.view) {
      try {
        todayEditor.commands.insertContent(`[TASK:${task.id}|${task.title}] `);
        todayEditor.commands.focus();
      } catch (error) {
        console.warn('Insert task token error:', error);
      }
    }
  };

  // Insert all pending task updates
  const insertAllTaskUpdates = () => {
    const lines = taskUpdates.map(t => `<p>- [TASK:${t.id}|${t.title}] ${t.update || ''}</p>`).join('');
    if (todayEditor?.view) {
      try {
        todayEditor.commands.insertContent(lines);
        todayEditor.commands.focus();
      } catch (error) {
        console.warn('Insert task updates error:', error);
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-10"
          variants={itemVariants}
        >
          <motion.div 
            className="inline-flex items-center gap-3 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <FiClipboard className="h-6 w-6 text-white" />
            </div>
            <motion.div 
              className="text-left"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                {existingReport ? 'Update Your Daily Report' : 'Submit Daily Report'}
              </h1>
              <p className="text-gray-600 mt-1">Share your progress and plans with the team</p>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <AnimatePresence>
          {message.text && (
            <motion.div 
              className={`p-4 mb-6 rounded-xl flex items-start max-w-2xl mx-auto shadow-md ${
                {
                  success: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-100',
                  error: 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-100',
                  info: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100'
                }[message.type]
              }`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="mr-3 mt-0.5">
                {message.type === 'success' && <FiCheckCircle className="h-5 w-5 text-green-500" />}
                {message.type === 'error' && <FiAlertCircle className="h-5 w-5 text-red-500" />}
                {message.type === 'info' && <FiClipboard className="h-5 w-5 text-blue-500" />}
              </div>
              <span className="text-sm font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <StepIndicator step={currentStep} />
        
        <motion.form 
          id="report-form"
          onSubmit={handleSubmit} 
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50 overflow-hidden"
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div 
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <div className="flex bg-gradient-to-r from-indigo-100/50 to-purple-100/50 border border-indigo-200/50 rounded-xl p-1 max-w-md w-full shadow-inner">
              <motion.div 
                className="flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer"
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                animate={date === new Date().toISOString().split('T')[0] ? 
                  { backgroundColor: "rgba(99, 102, 241, 0.2)", color: "#4f46e5" } : 
                  { backgroundColor: "transparent", color: "#6b7280" }
                }
                transition={{ duration: 0.2 }}
              >
                Today
              </motion.div>
              
              <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm flex-1 flex relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-10 py-2.5 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium"
                  max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
                />
              </div>
            </div>
          </motion.div>
          
          {selectedTeam && (
            <motion.div 
              variants={itemVariants} 
              className="mb-6 flex justify-center"
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="p-1.5 bg-indigo-100 rounded-full">
                  <FiUsers className="h-4 w-4" />
                </div>
                <span>Team: {teams.find(team => team.id === selectedTeam)?.name || 'Assigned Team'}</span>
              </motion.div>
            </motion.div>
          )}
        
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="yesterday-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <motion.div 
                  variants={itemVariants}
                  className="mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg mr-3">
                        <FiCheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <label htmlFor="yesterday" className="block text-lg font-semibold text-gray-800">
                        What did you accomplish yesterday?
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">{yesterday.length} characters</span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">
                    Describe the tasks you completed yesterday. Be specific about what you accomplished.
                  </p>
                </motion.div>
                
                <div className="relative">
                  <motion.div
                    initial="rest"
                    whileFocus="focus"
                    variants={inputFocusVariants}
                    className="relative mt-2"
                  >
                    <div className="mt-2 border border-gray-300/50 rounded-xl overflow-hidden tiptap-editor">
                      <EditorContent editor={yesterdayEditor} ref={yesterdayRef} />
                    </div>
                    <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-indigo-500 opacity-0 focus-within:opacity-30 transition-opacity"></div>
                  </motion.div>
                </div>
                
                <div className="mt-3 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100/50 text-sm text-indigo-700 flex items-center">
                  <FiFileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Pro tip: Use **bold** for important highlights and - for bullet points</span>
                </div>
              </motion.div>
            )}
            
            {currentStep === 1 && (
              <motion.div
                key="today-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <motion.div 
                  variants={itemVariants}
                  className="mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg mr-3">
                        <FiEdit className="h-5 w-5 text-purple-600" />
                      </div>
                      <label htmlFor="today" className="block text-lg font-semibold text-gray-800">
                        What will you work on today?
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        className="px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold hover:bg-indigo-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setToday(yesterday)}
                        title="Copy yesterday → today"
                      >
                        Copy from Yesterday
                      </motion.button>
                      <span className="text-sm text-gray-500">{today.length} characters</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">
                    Outline your planned tasks for today. Be specific about your goals.
                  </p>
                </motion.div>
                
                <div className="relative">
                  <motion.div
                    initial="rest"
                    whileFocus="focus"
                    variants={inputFocusVariants}
                    className="relative mt-2"
                  >
                    <div className="mt-2 border border-gray-300/50 rounded-xl overflow-hidden tiptap-editor">
                      <EditorContent editor={todayEditor} ref={todayRef} />
                    </div>
                    <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-indigo-500 opacity-0 focus-within:opacity-30 transition-opacity"></div>
                  </motion.div>
                </div>

                {/* Task Updates panel */}
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiList className="h-4 w-4" /> Task Updates
                    </h5>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={taskSearchId}
                        onChange={(e) => setTaskSearchId(e.target.value)}
                        placeholder="Enter Task ID (UUID)"
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <motion.button
                        type="button"
                        onClick={addTaskById}
                        disabled={taskLoading || !taskSearchId}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-semibold disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {taskLoading ? 'Adding...' : 'Add'}
                      </motion.button>
                    </div>
                  </div>

                  {/* My Tasks quick picker */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-semibold text-gray-700">My Tasks</h6>
                      <input
                        type="text"
                        value={myTaskQuery}
                        onChange={(e) => setMyTaskQuery(e.target.value)}
                        placeholder="Search my tasks..."
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white divide-y">
                      {myTasksLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                      ) : (
                        (myTasks || [])
                          .filter(t => {
                            const q = (myTaskQuery || '').toLowerCase();
                            return !q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
                          })
                          .slice(0, 20)
                          .map(t => (
                            <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                              <div className="text-sm text-gray-800 truncate pr-3">{t.title}</div>
                              <button
                                type="button"
                                className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                                onClick={() => insertTaskToken(t)}
                              >
                                Insert token
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {taskUpdates.length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks added yet. Search by Task ID to add.</p>
                  ) : (
                    <div className="space-y-3">
                      {taskUpdates.map((t, idx) => (
                        <div key={t.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-800 truncate">{t.title}</div>
                            <button
                              type="button"
                              className="text-xs text-indigo-600 hover:underline"
                              onClick={() => insertTaskUpdate(t)}
                              title="Insert into Today"
                            >
                              Insert into Today
                            </button>
                          </div>
                          <div className="mt-2">
                            <input
                              type="text"
                              value={t.update}
                              onChange={(e) => setTaskUpdates(prev => prev.map((it,i) => i===idx ? { ...it, update: e.target.value } : it))}
                              placeholder="Write your update for this task..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={insertAllTaskUpdates}
                          className="text-xs font-semibold text-white bg-indigo-600 px-3 py-1.5 rounded-md"
                        >
                          Insert All Task Updates
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mentions helper */}
                <div className="mt-3 bg-purple-50/60 p-3 rounded-lg border border-purple-100/50 text-sm text-purple-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiAtSign className="h-4 w-4" />
                      <span>Insert @mention</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                      onClick={() => setShowMentionPicker(!showMentionPicker)}
                    >
                      {showMentionPicker ? 'Close' : 'Open'}
                    </button>
                  </div>
                  {showMentionPicker && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={mentionQuery}
                        onChange={(e) => setMentionQuery(e.target.value)}
                        placeholder="Search team members..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="max-h-40 overflow-y-auto mt-2 border border-gray-200 rounded-md bg-white">
                        {(teamMembers || []).filter(m => m.name.toLowerCase().includes((mentionQuery||'').toLowerCase())).map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => insertMention(m)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            @{m.name}
                          </button>
                        ))}
                        {teamMembers.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">No team members found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 bg-purple-50/60 p-3 rounded-lg border border-purple-100/50 text-sm text-purple-700 flex items-center">
                  <FiFileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Pro tip: Use **bold** for important highlights and - for bullet points</span>
                </div>
              </motion.div>
            )}
            
            {currentStep === 2 && (
              <motion.div
                key="blockers-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <motion.div 
                  variants={itemVariants}
                  className="mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg mr-3">
                        <FiAlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <label htmlFor="blockers" className="block text-lg font-semibold text-gray-800">
                        Any blockers or impediments?
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">{blockers.length} characters</span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">
                    Describe any blockers or issues preventing your progress. Leave empty if none.
                  </p>
                </motion.div>
                
                <div className="relative">
                  <motion.div
                    initial="rest"
                    whileFocus="focus"
                    variants={inputFocusVariants}
                    className="relative mt-2"
                  >
                    <div className="mt-2 border border-gray-300/50 rounded-xl overflow-hidden tiptap-editor">
                      <EditorContent editor={blockersEditor} ref={blockersRef} />
                    </div>
                    <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-indigo-500 opacity-0 focus-within:opacity-30 transition-opacity"></div>
                  </motion.div>
                </div>
                
                <div className="mt-3 bg-red-50/60 p-3 rounded-lg border border-red-100/50 text-sm text-red-700 flex items-center">
                  <FiFileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Pro tip: Press Shift+Enter to submit your report</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div 
            variants={itemVariants} 
            className="flex justify-between gap-4 mt-8"
            animate={controls}
          >
            <motion.button
              type="button"
              className={`px-5 py-3 border border-gray-300 rounded-lg flex items-center ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'}`}
              onClick={() => currentStep > 0 && setCurrentStep(prevStep => prevStep - 1)}
              disabled={currentStep === 0}
              whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
              whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
            >
              <FiArrowRight className="h-4 w-4 mr-1 transform rotate-180" />
              Back
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleNextStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white shadow-lg ${
                canProceed() 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canProceed() || loading}
              whileHover={canProceed() ? { scale: 1.03, y: -2 } : {}}
              whileTap={canProceed() ? { scale: 0.97 } : {}}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <>
                  {currentStep < 2 ? 'Continue' : (existingReport ? 'Update Report' : 'Submit Report')}
                  {currentStep < 2 ? <FiArrowRight className="h-5 w-5" /> : <FiSend className="h-5 w-5" />}
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Your daily standup reports help keep the team aligned and focused on shared goals</p>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>
    </motion.div>
  );
}
