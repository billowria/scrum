import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiEdit2, FiSave, FiTrash2, FiClock, FiCalendar,
  FiUser, FiUserPlus, FiArrowLeft, FiUsers, FiLink, FiMessageSquare,
  FiCheckSquare, FiActivity, FiPaperclip, FiFolder, FiCopy,
  FiExternalLink, FiAlertCircle, FiCheck, FiLoader, FiPlus,
  FiMinus, FiMoreVertical, FiShare2, FiBell, FiBellOff,
  FiGitBranch, FiXCircle, FiSearch, FiTrendingUp, FiBarChart2,
  FiLayers, FiFileText, FiChevronDown, FiChevronUp, FiSend,
  FiDownload, FiTarget, FiHash, FiBold, FiItalic, FiList,
  FiCode, FiUnderline
} from 'react-icons/fi';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { uuidToShortId } from '../../utils/taskIdUtils';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { getOrCreateDirectConversation, sendMessage } from '../../services/chatService';

// --- EINSTEIN DESIGN SYSTEM ---
// "Precision" Color Palette & Utilities

const THEME = {
  colors: {
    primary: 'blue',
    people: 'indigo',
    date: 'orange',
    project: 'teal',
    sprint: 'purple',
    dependency: 'rose',
    success: 'emerald'
  },
  glass: "backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800 shadow-xl",
  input: "transition-all duration-200 outline-none focus:ring-2 ring-offset-1 focus:ring-blue-500/50 rounded-lg dark:ring-offset-slate-900",
};

// --- SMART FIELDS (Modular Inline Editing) ---

const EditTrigger = ({ onClick, color = 'gray' }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-${color}-100 dark:hover:bg-${color}-900/30 text-${color}-500 dark:text-${color}-400 hover:text-${color}-700 dark:hover:text-${color}-300`}
  >
    <FiEdit2 className="w-3 h-3" />
  </button>
);

const SmartField = ({ label, icon: Icon, children, onEdit, color = 'gray', className = '' }) => (
  <div className={`group relative p-3 rounded-xl border border-transparent hover:bg-white dark:hover:bg-slate-800/50 hover:border-${color}-100 dark:hover:border-${color}-900/30 hover:shadow-sm transition-all ${className}`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-950/30 text-${color}-600 dark:text-${color}-400`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider text-${color}-400 dark:text-${color}-500`}>{label}</p>
          {onEdit && <EditTrigger onClick={onEdit} color={color} />}
        </div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{children}</div>
      </div>
    </div>
  </div>
);

const SmartUserSelect = ({ label, icon, user, onSave, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase.from('users').select('id, name, avatar_url, email').ilike('name', `%${search}%`).limit(10);
        setUsers(data || []);
        setLoading(false);
      };
      fetchUsers();
    }
  }, [isEditing, search]);

  return (
    <div className="relative">
      <SmartField label={label} icon={icon} color={color} onEdit={() => setIsEditing(!isEditing)}>
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar user={user} size="xs" />
            <span className="truncate text-gray-900 dark:text-gray-100">{user.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">Unassigned</span>
        )}
      </SmartField>

      {isEditing && (
        <div className="absolute top-full left-0 z-50 w-full min-w-[200px] mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <input
            autoFocus
            placeholder="Search users..."
            className="w-full p-2 text-sm border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { onSave(u.id); setIsEditing(false); }}
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm text-left transition-colors"
              >
                <Avatar user={u} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-gray-900 dark:text-gray-100">{u.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const TaskDetailView = ({
  isOpen,
  onClose,
  taskId,
  onUpdate,
  currentUser,
  onNavigateToTask,
  parentTaskId
}) => {
  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Relations
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('comments');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingEffort, setIsEditingEffort] = useState(false);
  const [effortValue, setEffortValue] = useState('');

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [shareSending, setShareSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastUser, setToastUser] = useState(null);

  // Navigation & Theme
  const navigate = useNavigate();
  const { isAnimatedTheme } = useTheme();
  const location = useLocation();

  // Inputs
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [depSearch, setDepSearch] = useState('');
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);

  // Status/Priority Design Configs
  const STATUS_CONFIG = {
    'To Do': { bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', icon: '📋', gradient: 'from-slate-400 to-slate-600' },
    'In Progress': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: '🚀', gradient: 'from-blue-400 to-blue-600' },
    'Review': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: '👀', gradient: 'from-amber-400 to-amber-600' },
    'Completed': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: '✅', gradient: 'from-emerald-400 to-emerald-600' }
  };
  const PRIORITY_CONFIG = {
    'Low': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', icon: '⬇️', gradient: 'from-green-400 to-green-600' },
    'Medium': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: '➡️', gradient: 'from-amber-400 to-amber-600' },
    'High': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: '⬆️', gradient: 'from-orange-400 to-orange-600' },
    'Critical': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', icon: '🔥', gradient: 'from-red-400 to-red-600' }
  };

  // Refs
  const modalRef = useRef(null);

  // --- Initial Fetch ---
  useEffect(() => {
    if (isOpen && taskId) fetchAllData();
  }, [isOpen, taskId]);

  // --- Scoped Dependency Search ---
  useEffect(() => {
    if (isAddingDep && task?.project_id) {
      const search = async () => {
        let query = supabase
          .from('tasks')
          .select('id, title, status, project_id')
          .eq('project_id', task.project_id) // SCOPED to project
          .neq('id', taskId);

        if (depSearch) query = query.ilike('title', `%${depSearch}%`);

        const { data } = await query.limit(10);
        setAvailableTasks(data || []);
      };
      search();
    }
  }, [isAddingDep, depSearch, task?.project_id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: t, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!assignee_id(id, name, avatar_url, email),
          reporter:users!reporter_id(id, name, avatar_url, email),
          team:teams(id, name),
          project:projects(id, name),
          sprint:sprints(id, name)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(t);

      // Parallel fetch for relations
      await Promise.all([
        fetchSubtasks(t.id),
        fetchComments(t.id),
        fetchActivities(t.id),
        fetchDependencies(t.id),
        fetchProjects(),
        fetchSprints(t.project_id)
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async (id) => {
    const { data } = await supabase.from('tasks').select('*, assignee:users!assignee_id(id,name,avatar_url)').eq('parent_task_id', id).order('created_at', { ascending: true });
    setSubtasks(data || []);
  };
  const fetchComments = async (id) => {
    const { data } = await supabase.from('comments').select('*, user:users(id,name,avatar_url)').eq('task_id', id).order('created_at', { ascending: false });
    setComments(data || []);
  };
  const fetchActivities = async (id) => {
    const { data } = await supabase.from('task_activities').select('*, user:users(id,name)').eq('task_id', id).order('created_at', { ascending: false }).limit(20);
    setActivities(data || []);
  };
  const fetchDependencies = async (id) => {
    const { data } = await supabase.from('task_dependencies').select('*, depends_on_task:tasks!depends_on_task_id(id,title,status)').eq('task_id', id);
    setDependencies(data || []);
  };
  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    setProjects(data || []);
  };
  const fetchSprints = async (projectId) => {
    if (!projectId) { setSprints([]); return; }
    const { data } = await supabase.from('sprints').select('id, name, status').eq('project_id', projectId).order('created_at', { ascending: false });
    setSprints(data || []);
  };

  // --- Auto-Save Actions ---

  const updateTask = async (updates) => {
    // Optimistic UI interaction could be added here for even faster feel
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (!error) {
      setTask(prev => ({ ...prev, ...updates }));
      if (onUpdate) onUpdate();
      // Refetch if complex relational changes
      if (updates.project_id || updates.assignee_id) fetchAllData();
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const { error } = await supabase.from('tasks').insert({
      title: newSubtask,
      parent_task_id: taskId,
      project_id: task.project_id,
      team_id: task.team_id,
      status: 'To Do',
      reporter_id: currentUser.id,
      type: 'Task'
    });
    if (!error) {
      setNewSubtask('');
      fetchSubtasks(taskId);
    }
  };

  const addDependency = async (depId) => {
    const { error } = await supabase.from('task_dependencies').insert({
      task_id: taskId,
      depends_on_task_id: depId,
      dependency_type: 'blocks'
    });
    if (!error) {
      setIsAddingDep(false);
      fetchDependencies(taskId);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: currentUser.id,
      content: newComment
    });
    if (!error) {
      setNewComment('');
      fetchComments(taskId);
    }
  };

  // --- Tiptap Description Editor ---
  const descriptionEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Add a detailed description...',
      }),
    ],
    content: task?.description || '',
    editable: isEditingDescription,
    onUpdate: ({ editor }) => {
      setTask(prev => ({ ...prev, description: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 min-h-[150px]',
      }
    }
  });

  // Update editor content when task loads
  useEffect(() => {
    if (descriptionEditor && task?.description !== undefined) {
      const currentContent = descriptionEditor.getHTML();
      if (currentContent !== task.description && !isEditingDescription) {
        descriptionEditor.commands.setContent(task.description || '');
      }
    }
  }, [task?.description, descriptionEditor, isEditingDescription]);

  // Update editable state when editing mode changes
  useEffect(() => {
    if (descriptionEditor) {
      descriptionEditor.setEditable(isEditingDescription);
    }
  }, [isEditingDescription, descriptionEditor]);

  // Save description when editing mode is turned off
  const handleDescriptionSave = useCallback(() => {
    if (descriptionEditor) {
      updateTask({ description: descriptionEditor.getHTML() });
    }
    setIsEditingDescription(false);
  }, [descriptionEditor]);

  // --- Share Modal Functions ---
  const fetchShareUsers = useCallback(async () => {
    setShareLoading(true);
    try {
      let query = supabase.from('users').select('id, name, avatar_url, email');
      if (shareSearch) {
        query = query.ilike('name', `%${shareSearch}%`);
      }
      if (currentUser?.id) {
        query = query.neq('id', currentUser.id);
      }
      const { data } = await query.limit(10);
      setShareUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setShareLoading(false);
  }, [shareSearch, currentUser?.id]);

  useEffect(() => {
    if (showShareModal) {
      fetchShareUsers();
    }
  }, [showShareModal, fetchShareUsers]);

  const handleShareTask = async (userId, userName) => {
    if (!task || shareSending) return;
    setShareSending(true);
    try {
      // Get or create a direct conversation with the user
      const conversation = await getOrCreateDirectConversation(userId);

      // Build the task URL with Short ID
      const shortId = uuidToShortId(task.id);
      const taskUrl = `${window.location.origin}/tasks?taskId=${shortId}`;

      // Format professional task share message with better visual hierarchy
      const statusEmoji = task.status === 'Completed' ? '✅' : task.status === 'In Progress' ? '🔄' : task.status === 'Review' ? '👀' : '📝';
      const priorityEmoji = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : '🟢';

      const taskMessage = `╔═══════════════════════════════════╗
📋 **TASK SHARED WITH YOU**
╚═══════════════════════════════════╝

**${task.title}**
**ID:** #${shortId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📊 Details**
${statusEmoji} Status: **${task.status}**
${priorityEmoji} Priority: **${task.priority}**${task.project?.name ? `\n📁 Project: **${task.project.name}**` : ''}${task.due_date ? `\n📅 Due Date: **${format(new Date(task.due_date), 'MMM d, yyyy')}**` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Quick Access**
Click to open: ${taskUrl}

_Shared from Task Management System_`;

      // Send the message
      await sendMessage(conversation.id, taskMessage);

      // Close the modal and show success toast
      setShowShareModal(false);
      setShareSearch('');

      // Show success toast
      setToastUser(userName);
      setToastMessage(`Task shared with ${userName}`);
      setShowToast(true);

      // Auto-hide toast after 4 seconds
      setTimeout(() => setShowToast(false), 4000);
    } catch (error) {
      console.error('Error sharing task:', error);
      setToastMessage('Failed to share task');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
    setShareSending(false);
  };

  const removeDependency = async (depId) => {
    const { error } = await supabase.from('task_dependencies').delete().eq('id', depId);
    if (!error) {
      fetchDependencies(taskId);
    }
  };

  // --- Render Helpers ---

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          layoutId={`task-${taskId}`}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`relative w-full max-w-[95vw] h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border ${isAnimatedTheme ? 'bg-slate-900 border-slate-700' : 'bg-white dark:bg-slate-900 border-white/50 dark:border-slate-800'}`}
        >
          {loading ? (
            <LoadingContent />
          ) : (
            <>
              {/* --- HEADER: The "Control Deck" --- */}
              <div className={`border-b p-6 flex flex-col gap-6 z-20 ${isAnimatedTheme ? 'bg-slate-900 border-slate-800' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>

                {/* Top Row: Breadcrumbs & Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2 font-mono">
                    <FiHash className="text-gray-400 dark:text-gray-500" />
                    <span>{uuidToShortId(task.id)}</span>
                    <span className="text-gray-300">|</span>
                    <div className="relative group">
                      <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        <FiBarChart2 className="text-teal-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-teal-700 dark:group-hover:text-teal-400">{task.project?.name || 'No Project'}</span>
                        <FiChevronDown className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 z-50">
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => updateTask({ project_id: p.id })}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 text-sm font-medium transition-colors text-gray-700 dark:text-gray-300"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-300">/</span>
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">TASK-{task.id.slice(0, 4)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Go to Tasks Page button */}
                    <button
                      onClick={() => navigate(`/tasks?taskId=${uuidToShortId(task.id)}`)}
                      className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Open in Tasks Page"
                    >
                      <FiExternalLink />
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Share Task"
                    >
                      <FiShare2 />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><FiMoreVertical /></button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"><FiX className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Hero Row: Title & Status */}
                <div className="flex items-start gap-8">
                  <div className="flex-1 group">
                    {/* Inline Title Edit (Auto-growing, blur to save) */}
                    <input
                      className="w-full text-4xl font-bold text-gray-900 dark:text-white bg-transparent outline-none border-b-2 border-transparent focus:border-blue-500 placeholder-gray-300 dark:placeholder-gray-600 transition-all font-display"
                      value={task.title}
                      onChange={(e) => setTask({ ...task, title: e.target.value })}
                      onBlur={(e) => updateTask({ title: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    {/* Status Dropdown - Professional Glassmorphic */}
                    <div className="relative">
                      <motion.button
                        onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative h-11 px-5 rounded-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-300 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 shadow-lg shadow-gray-200/20 dark:shadow-slate-950/20 hover:shadow-xl hover:shadow-gray-200/30 dark:hover:shadow-slate-950/30 hover:border-gray-300/60 dark:hover:border-slate-600"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${STATUS_CONFIG[task.status]?.gradient} shadow-sm`} />
                        <span className="text-gray-900 dark:text-white font-medium">{task.status}</span>
                        <motion.div animate={{ rotate: statusOpen ? 180 : 0 }} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                          <FiChevronDown className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {statusOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute right-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-2xl shadow-gray-300/30 dark:shadow-slate-950/30 border border-gray-200/60 dark:border-slate-700 p-2 z-50 overflow-hidden"
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 py-2">Status</div>
                            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                              <motion.button
                                key={s}
                                whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.03)' }}
                                onClick={() => { updateTask({ status: s }); setStatusOpen(false); }}
                                className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${task.status === s ? 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-750' : ''}`}
                              >
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cfg.gradient} shadow-sm`} />
                                <span className={task.status === s ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'}>{s}</span>
                                {task.status === s && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto"
                                  >
                                    <FiCheck className="w-4 h-4 text-emerald-500" />
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Priority Dropdown - Professional Glassmorphic */}
                    <div className="relative">
                      <motion.button
                        onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative h-11 px-5 rounded-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-300 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 shadow-lg shadow-gray-200/20 dark:shadow-slate-950/20 hover:shadow-xl hover:shadow-gray-200/30 dark:hover:shadow-slate-950/30 hover:border-gray-300/60 dark:hover:border-slate-600"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${PRIORITY_CONFIG[task.priority]?.gradient} shadow-sm`} />
                        <span className="text-gray-900 dark:text-white font-medium">{task.priority}</span>
                        <motion.div animate={{ rotate: priorityOpen ? 180 : 0 }} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                          <FiChevronDown className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {priorityOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute right-0 top-full mt-2 w-52 backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-2xl shadow-gray-300/30 dark:shadow-slate-950/30 border border-gray-200/60 dark:border-slate-700 p-2 z-50 overflow-hidden"
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 py-2">Priority</div>
                            {Object.entries(PRIORITY_CONFIG).map(([p, cfg]) => (
                              <motion.button
                                key={p}
                                whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.03)' }}
                                onClick={() => { updateTask({ priority: p }); setPriorityOpen(false); }}
                                className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${task.priority === p ? 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-750' : ''}`}
                              >
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cfg.gradient} shadow-sm`} />
                                <span className={task.priority === p ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'}>{p}</span>
                                {task.priority === p && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto"
                                  >
                                    <FiCheck className="w-4 h-4 text-emerald-500" />
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- MAIN GRID: "The Lab" Workspace --- */}
              <div className={`flex-1 overflow-hidden flex flex-col md:flex-row ${isAnimatedTheme ? 'bg-slate-950' : 'bg-gray-50/30 dark:bg-slate-950/30'}`}>

                {/* COL 1: Content (Description, Tasks, Activity) - WIDER */}
                <div className={`w-full md:w-[80%] overflow-y-auto px-8 py-8 border-r ${isAnimatedTheme ? 'bg-slate-900 border-slate-800' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>
                  <div className="space-y-12">

                    {/* Description - Rich Text Editor */}
                    <section className="group">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                          <FiFileText className="text-gray-300 dark:text-gray-600" /> Description
                        </h3>
                        <div className="flex items-center gap-3">
                          {task.description && task.description.length > 100 && (
                            <button
                              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                            >
                              {isDescriptionExpanded ? <><FiChevronUp className="w-3 h-3" /> Collapse</> : <><FiChevronDown className="w-3 h-3" /> Expand</>}
                            </button>
                          )}
                          <button
                            onClick={() => isEditingDescription ? handleDescriptionSave() : setIsEditingDescription(true)}
                            className={`text-xs font-bold flex items-center gap-1 transition-colors ${isEditingDescription ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                          >
                            {isEditingDescription ? <><FiCheck className="w-3 h-3" /> Save</> : <><FiEdit2 className="w-3 h-3" /> Edit</>}
                          </button>
                        </div>
                      </div>

                      {/* Rich Text Editor with Toolbar */}
                      <div className={`rounded-xl border-2 transition-all overflow-hidden ${isEditingDescription ? 'border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 shadow-sm' : 'border-transparent bg-gray-50 dark:bg-slate-800/30'}`}>
                        {/* Formatting Toolbar - Only show when editing */}
                        {isEditingDescription && descriptionEditor && (
                          <div className="flex items-center gap-1 p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-850 border-b border-gray-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleBold().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('bold') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Bold (Ctrl+B)"
                            >
                              <FiBold className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleItalic().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('italic') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Italic (Ctrl+I)"
                            >
                              <FiItalic className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleUnderline().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('underline') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Underline (Ctrl+U)"
                            >
                              <FiUnderline className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-gray-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleBulletList().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('bulletList') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Bullet List"
                            >
                              <FiList className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleOrderedList().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('orderedList') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Numbered List"
                            >
                              <FiHash className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-gray-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => descriptionEditor.chain().focus().toggleCodeBlock().run()}
                              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${descriptionEditor.isActive('codeBlock') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}
                              title="Code Block"
                            >
                              <FiCode className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Editor Content */}
                        <div
                          className={`${isDescriptionExpanded ? '' : 'max-h-[300px] overflow-y-auto'}`}
                          style={{ minHeight: '150px' }}
                        >
                          {descriptionEditor ? (
                            <EditorContent
                              editor={descriptionEditor}
                              className={`prose prose-sm max-w-none ${!isEditingDescription ? 'cursor-default' : ''}`}
                            />
                          ) : (
                            <div className="p-4 text-gray-400 italic">Loading editor...</div>
                          )}
                          {!task.description && !isEditingDescription && (
                            <div className="p-4 text-gray-400 italic">No description added. Click Edit to add one.</div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Subtasks */}
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2 mb-4">
                        <FiCheckSquare className="text-gray-300 dark:text-gray-600" /> Subtasks
                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 rounded-full font-bold">{subtasks.filter(s => s.status === 'Completed').length}/{subtasks.length}</span>
                      </h3>

                      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {subtasks.map(sub => (
                          <div key={sub.id} className="group flex items-center gap-4 p-4 border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <button
                              onClick={() => {
                                const ns = sub.status === 'Completed' ? 'To Do' : 'Completed';
                                supabase.from('tasks').update({ status: ns }).eq('id', sub.id).then(() => fetchSubtasks(taskId));
                              }}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${sub.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 dark:border-slate-700 text-transparent hover:border-emerald-400'}`}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <span className={`flex-1 font-medium ${sub.status === 'Completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>{sub.title}</span>
                            {sub.assignee && <Avatar user={sub.assignee} size="xs" />}
                          </div>
                        ))}
                        <div className="p-4 bg-gray-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                          <FiPlus className="text-gray-400 dark:text-gray-500" />
                          <input
                            className="flex-1 bg-transparent font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                            placeholder="Add a subtask..."
                            value={newSubtask}
                            onChange={e => setNewSubtask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSubtask()}
                          />
                          <button onClick={addSubtask} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">ADD</button>
                        </div>
                      </div>
                    </section>

                    {/* Dependencies Section - Moved from sidebar */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                          <FiGitBranch className="text-gray-300 dark:text-gray-600" /> Dependencies
                          <span className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 rounded-full font-bold text-[10px]">{dependencies.length}</span>
                        </h3>
                        <button
                          onClick={() => setIsAddingDep(!isAddingDep)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAddingDep ? 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50'}`}
                        >
                          {isAddingDep ? 'Cancel' : '+ Add Dependency'}
                        </button>
                      </div>

                      {/* Add Dependency Search */}
                      {isAddingDep && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-rose-200 dark:border-rose-900/50 shadow-lg overflow-hidden"
                        >
                          <div className="p-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <FiSearch className="text-gray-400 dark:text-gray-500" />
                              <input
                                autoFocus
                                className="flex-1 text-sm p-1 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
                                placeholder="Search tasks in this project..."
                                value={depSearch}
                                onChange={e => setDepSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {availableTasks.map(t => (
                              <button
                                key={t.id}
                                onClick={() => addDependency(t.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 text-left border-b border-gray-50 dark:border-slate-800 last:border-0 transition-colors"
                              >
                                <div className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-emerald-400' : t.status === 'In Progress' ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.title}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : t.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}>
                                  {t.status}
                                </span>
                              </button>
                            ))}
                            {availableTasks.length === 0 && (
                              <div className="p-4 text-center text-sm text-gray-400 italic">No tasks found</div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Dependency List */}
                      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {dependencies.length > 0 ? (
                          <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {dependencies.map(d => (
                              <motion.div
                                key={d.id}
                                className="group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${d.depends_on_task?.status === 'Completed' ? 'bg-emerald-400' : d.depends_on_task?.status === 'In Progress' ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() => onNavigateToTask && onNavigateToTask(d.depends_on_task?.id)}
                                >
                                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                    {d.depends_on_task?.title}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase">Blocks</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{d.depends_on_task?.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onNavigateToTask && onNavigateToTask(d.depends_on_task?.id)}
                                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Open Task"
                                  >
                                    <FiExternalLink className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeDependency(d.id); }}
                                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove Dependency"
                                  >
                                    <FiXCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <FiGitBranch className="w-8 h-8 text-gray-200 dark:text-slate-800 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">No dependencies linked</p>
                            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Click "+ Add Dependency" to link related tasks</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Activity / Comments */}
                    <section>
                      <div className="flex items-center gap-6 mb-6">
                        {['comments', 'history'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {activeTab === 'comments' ? (
                        <div className="space-y-6">
                          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <Avatar user={currentUser} size="sm" />
                            <div className="flex-1">
                              <textarea
                                className="w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                                rows={2}
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={addComment}
                                  disabled={!newComment.trim()}
                                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  <FiSend className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {comments.map(c => (
                              <div key={c.id} className="flex gap-4 group">
                                <Avatar user={c.user} size="sm" />
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{c.user?.name}</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3 rounded-r-xl rounded-bl-xl border border-gray-100 dark:border-slate-700 shadow-sm">{c.content}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pl-4 border-l-2 border-gray-100 dark:border-slate-800 space-y-6">
                          {activities.map(a => (
                            <div key={a.id} className="relative text-sm">
                              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                              <p className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-gray-200">{a.user?.name}</span> {a.description}</p>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(a.created_at), 'MMM d, h:mm a')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>

                {/* COL 2: Sidebar (Properties Panel) - NARROWER */}
                <div className={`w-full md:w-[20%] p-4 overflow-y-auto border-l ${isAnimatedTheme ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 dark:bg-slate-950/50 border-gray-100 dark:border-slate-800'}`}>
                  <div className="space-y-8">

                    {/* DETAILS GROUP */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Details</h4>
                      <SmartField label="Project" icon={FiFolder} color={THEME.colors.project}>
                        {task.project?.name || <span className="text-gray-400 dark:text-gray-500 italic">No Project</span>}
                      </SmartField>
                      <SmartField label="Team" icon={FiUsers} color="blue">
                        {task.team?.name || <span className="text-gray-400 dark:text-gray-500 italic">No Team</span>}
                      </SmartField>
                    </div>

                    {/* PEOPLE GROUP */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">People</h4>
                      <SmartUserSelect
                        label="Assignee"
                        icon={FiUser}
                        user={task.assignee}
                        color={THEME.colors.people}
                        onSave={(uid) => updateTask({ assignee_id: uid })}
                      />
                      <SmartUserSelect
                        label="Reporter"
                        icon={FiUsers}
                        user={task.reporter}
                        color={THEME.colors.people}
                        onSave={(uid) => updateTask({ reporter_id: uid })}
                      />
                    </div>

                    {/* PLANNING GROUP */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Planning</h4>
                      <SmartField label="Due Date" icon={FiCalendar} color={THEME.colors.date} onEdit={() => {/* Date picker logic */ }}>
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : <span className="text-gray-400 dark:text-gray-500 italic">No Date</span>}
                      </SmartField>
                      {/* Sprint Picker */}
                      <div className="relative">
                        <SmartField label="Sprint" icon={FiTarget} color={THEME.colors.sprint} onEdit={() => setSprintOpen(!sprintOpen)}>
                          {task.sprint?.name || <span className="text-gray-400 dark:text-gray-500 italic">Backlog</span>}
                        </SmartField>
                        <AnimatePresence>
                          {sprintOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-0 z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                            >
                              <button
                                onClick={() => { updateTask({ sprint_id: null }); setSprintOpen(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-500 dark:text-gray-400 italic border-b border-gray-100 dark:border-slate-700"
                              >
                                Backlog (No Sprint)
                              </button>
                              <div className="max-h-40 overflow-y-auto">
                                {sprints.map(sp => (
                                  <button
                                    key={sp.id}
                                    onClick={() => { updateTask({ sprint_id: sp.id }); setSprintOpen(false); fetchSprints(task.project_id); }}
                                    className={`w-full text-left px-3 py-2 hover:bg-purple-50 text-sm font-medium flex items-center justify-between ${task.sprint_id === sp.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                                  >
                                    <span>{sp.name}</span>
                                    <span className="text-xs text-gray-400 capitalize">{sp.status}</span>
                                  </button>
                                ))}
                                {sprints.length === 0 && <div className="text-xs text-gray-400 italic p-3 text-center">No sprints for this project</div>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Effort Field */}
                      <div className="relative">
                        <SmartField
                          label="Effort (Days)"
                          icon={FiClock}
                          color="rose"
                          onEdit={() => {
                            setEffortValue(task.efforts_in_days || '');
                            setIsEditingEffort(true);
                          }}
                        >
                          {task.efforts_in_days ? `${task.efforts_in_days} Days` : <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                        </SmartField>
                        <AnimatePresence>
                          {isEditingEffort && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-0 z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 p-3 overflow-hidden"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  className="flex-1 text-sm p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500/50 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                  placeholder="e.g. 2.5"
                                  value={effortValue}
                                  onChange={e => setEffortValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      updateTask({ efforts_in_days: effortValue ? parseFloat(effortValue) : null });
                                      setIsEditingEffort(false);
                                    }
                                    if (e.key === 'Escape') setIsEditingEffort(false);
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    updateTask({ efforts_in_days: effortValue ? parseFloat(effortValue) : null });
                                    setIsEditingEffort(false);
                                  }}
                                  className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setIsEditingEffort(false)}
                                  className="p-1.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* DATES - Properly Sized */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <div
                        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                        title={format(new Date(task.created_at), 'PPpp')}
                      >
                        <FiClock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span>Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                      <div
                        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                        title={format(new Date(task.updated_at), 'PPpp')}
                      >
                        <span>Updated {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Share Task Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowShareModal(false); setShareSearch(''); }}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-slate-800"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                      <FiShare2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Share Task</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Send this task to a team member via chat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowShareModal(false); setShareSearch(''); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Task Preview */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                    <FiCheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{task?.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[task?.status]?.bg} ${STATUS_CONFIG[task?.status]?.text}`}>
                        {task?.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[task?.priority]?.bg} ${PRIORITY_CONFIG[task?.priority]?.text}`}>
                        {task?.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Search */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <FiSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={shareSearch}
                    onChange={(e) => setShareSearch(e.target.value)}
                    placeholder="Search users..."
                    className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto">
                {shareLoading ? (
                  <div className="p-8 text-center">
                    <FiLoader className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin mx-auto" />
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : shareUsers.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {shareUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleShareTask(user.id, user.name)}
                        disabled={shareSending}
                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 text-left transition-colors disabled:opacity-50 group"
                      >
                        <Avatar user={user} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{user.name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</div>
                        </div>
                        {shareSending ? (
                          <FiLoader className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <FiSend className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FiUsers className="w-8 h-8 text-gray-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No users found</p>
                    {shareSearch && (
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try a different search term</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Select a user to share this task via direct message
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence >

      {/* Glassmorphic Success Toast */}
      < AnimatePresence >
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[200]"
          >
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/60 dark:border-slate-700 shadow-2xl shadow-gray-300/30 dark:shadow-slate-950/50">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl">
                <FiCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{toastMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Task link sent via chat</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence >
    </AnimatePresence >
  );
};

const LoadingContent = () => (
  <div className="w-full h-full p-8 flex items-start gap-8 bg-white dark:bg-slate-900">
    <div className="flex-1 space-y-8">
      <div className="space-y-4">
        <LoadingSkeleton variant="text" width="200px" />
        <LoadingSkeleton variant="title" width="70%" />
      </div>
      <div className="flex gap-4">
        <LoadingSkeleton variant="rectangle" width="100px" height="40px" />
        <LoadingSkeleton variant="rectangle" width="100px" height="40px" />
      </div>
      <div className="space-y-4 mt-12">
        <LoadingSkeleton variant="text" width="100px" />
        <LoadingSkeleton variant="text" count={5} />
      </div>
    </div>
    <div className="w-96 space-y-6">
      <LoadingSkeleton variant="card" height="100px" />
      <LoadingSkeleton variant="card" height="100px" />
      <LoadingSkeleton variant="card" height="100px" />
    </div>
  </div>
);

export default TaskDetailView;