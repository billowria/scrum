import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiEdit2,
  FiSave,
  FiEye,
  FiTrash2,
  FiClock,
  FiCalendar,
  FiUser,
  FiUserPlus,
  FiArrowLeft,
  FiUsers,
  FiLink,
  FiMessageSquare,
  FiCheckSquare,
  FiActivity,
  FiPaperclip,
  FiFolder,
  FiCopy,
  FiExternalLink,
  FiAlertCircle,
  FiCheck,
  FiLoader,
  FiPlus,
  FiMinus,
  FiMoreVertical,
  FiShare2,
  FiBell,
  FiBellOff,
  FiGitBranch,
  FiXCircle,
  FiSearch,
  FiTrendingUp,
  FiBarChart2,
  FiLayers,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiDownload,
  FiThumbsUp,
  FiCheckCircle,
  FiXOctagon,
  FiPause,
  FiPlay,
  FiStopCircle
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../../supabaseClient';
import Badge from '../shared/Badge';
import Avatar, { AvatarGroup } from '../shared/Avatar';
import LoadingSkeleton from '../shared/LoadingSkeleton';

/**
 * TaskDetailView - Completely redesigned task detail with vertical navigation
 */
const TaskDetailView = ({ 
  isOpen, 
  onClose, 
  taskId, 
  onUpdate,
  currentUser,
  userRole,
  onNavigateToTask, // New prop to handle navigation to another task
  parentTaskId // ID of the parent task to navigate back to
}) => {
  // Navigation state
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    details: true
  });
  
  // Data states
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Status update
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // Status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Related data
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  
  // Form states
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'Medium',
  });
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [dependencySearch, setDependencySearch] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [addingDependency, setAddingDependency] = useState(false);
  const [selectedDependencyType, setSelectedDependencyType] = useState('blocks');
  
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  // Options
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [watchingTask, setWatchingTask] = useState(false);

  // Navigation sections
  const sections = [
    { id: 'overview', label: 'Overview', icon: FiFileText },
    { id: 'dependencies', label: 'Dependencies', icon: FiGitBranch, count: dependencies.length },
    { id: 'comments', label: 'Comments', icon: FiMessageSquare, count: comments.length },
    { id: 'activity', label: 'Activity Feed', icon: FiActivity, count: activities.length },
  ];

  // Status options with colors and icons
  const statusOptions = [
    { value: 'To Do', label: 'To Do', color: 'bg-gray-100 text-gray-800', icon: FiPause },
    { value: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: FiPlay },
    { value: 'Review', label: 'Review', color: 'bg-amber-100 text-amber-800', icon: FiEye },
    { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
    { value: 'Blocked', label: 'Blocked', color: 'bg-red-100 text-red-800', icon: FiXOctagon },
  ];

  // Priority options
  const priorityOptions = [
    { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ];

  // Fetch task data on mount
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskData();
    }
  }, [isOpen, taskId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown) {
        const dropdown = document.querySelector('.status-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setShowStatusDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  const fetchTaskData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch main task with relations
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!assignee_id(id, name, avatar_url, email),
          reporter:users!reporter_id(id, name, avatar_url, email),
          team:teams(id, name),
          project:projects(id, name),
          sprint:sprints(id, name, status)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      
      setTask(taskData);
      setEditData(taskData);
      
      // Fetch related data in parallel
      await Promise.all([
        fetchSubtasks(taskId),
        fetchComments(taskId),
        fetchActivities(taskId),
        fetchAttachments(taskId),
        fetchDependencies(taskId),
        fetchUsers(),
        fetchTeams(),
        fetchAvailableTasks(taskId),
        checkWatchStatus(taskId),
      ]);
      
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async (parentId) => {
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:users!assignee_id(id, name, avatar_url)')
      .eq('parent_task_id', parentId)
      .order('created_at', { ascending: false });
    setSubtasks(data || []);
  };

  const fetchComments = async (taskId) => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users(id, name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  const fetchActivities = async (taskId) => {
    const { data } = await supabase
      .from('task_activities')
      .select('*, user:users(id, name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(50);
    setActivities(data || []);
  };

  const fetchStatusHistory = async (taskId) => {
    const { data } = await supabase
      .from('task_activities')
      .select('*, user:users(id, name, avatar_url)')
      .eq('task_id', taskId)
      .ilike('action', '%status%')
      .order('created_at', { ascending: false });
    return data || [];
  };

  const fetchAttachments = async (taskId) => {
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    setAttachments(data || []);
  };

  const fetchDependencies = async (taskId) => {
    const { data } = await supabase
      .from('task_dependencies')
      .select('*, depends_on_task:tasks!depends_on_task_id(id, title, status, type, priority)')
      .eq('task_id', taskId);
    setDependencies(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, avatar_url, email')
      .order('name');
    setUsers(data || []);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .order('name');
    setTeams(data || []);
  };

  const fetchAvailableTasks = async (currentTaskId) => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, type, status, priority')
      .neq('id', currentTaskId)
      .order('created_at', { ascending: false })
      .limit(100);
    setAvailableTasks(data || []);
  };

  const checkWatchStatus = async (taskId) => {
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', currentUser?.id)
      .eq('type', 'watch')
      .single();
    setWatchingTask(!!data);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditData(task);
    }
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        title: editData.title,
        description: editData.description,
        type: editData.type,
        priority: editData.priority,
        status: editData.status,
        assignee_id: editData.assignee_id,
        team_id: editData.team_id,
        due_date: editData.due_date,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      await logActivity('updated', `Updated task details`);
      await fetchTaskData();
      setEditMode(false);
      
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setUpdatingStatus(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Add comment if provided
      if (statusComment.trim()) {
        await supabase
          .from('task_activities')
          .insert({
            task_id: taskId,
            user_id: currentUser.id,
            action: 'status_changed',
            description: `Updated status to ${newStatus}`,
            comment: statusComment.trim()
          });
      }

      await logActivity('status_updated', `Updated status to ${newStatus}`);
      await fetchTaskData();
      setShowStatusModal(false);
      setNewStatus('');
      setStatusComment('');
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Create subtask
  const handleCreateSubtask = async () => {
    if (!newSubtask.title.trim()) {
      setError('Subtask title is required');
      return;
    }

    setCreatingSubtask(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newSubtask.title.trim(),
          description: newSubtask.description.trim(),
          priority: newSubtask.priority,
          status: 'To Do',
          parent_task_id: taskId,
          assignee_id: newSubtask.assignee_id || null,
          reporter_id: user.id,
          team_id: task.team_id,
          project_id: task.project_id,
          type: 'Task',
        });

      if (error) throw error;

      await logActivity('created_subtask', `Created subtask: ${newSubtask.title}`);
      await fetchSubtasks(taskId);
      setNewSubtask({ title: '', description: '', assignee_id: '', priority: 'Medium' });
      setShowSubtaskForm(false);
    } catch (err) {
      console.error('Error creating subtask:', err);
      setError(err.message || 'Failed to create subtask');
    } finally {
      setCreatingSubtask(false);
    }
  };

  // Toggle subtask status
  const handleToggleSubtask = async (subtask) => {
    const newStatus = subtask.status === 'Completed' ? 'To Do' : 'Completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', subtask.id);

      if (error) throw error;

      await fetchSubtasks(taskId);
    } catch (err) {
      console.error('Error updating subtask:', err);
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      await logActivity('deleted_subtask', `Deleted a subtask`);
      await fetchSubtasks(taskId);
    } catch (err) {
      console.error('Error deleting subtask:', err);
      setError(err.message || 'Failed to delete subtask');
    }
  };

  // Add dependency
  const handleAddDependency = async (dependsOnTaskId, dependencyType = 'blocks') => {
    setAddingDependency(true);
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert({
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: dependencyType,
        });

      if (error) throw error;

      await logActivity('added_dependency', `Added a task dependency`);
      await fetchDependencies(taskId);
      setShowDependencyForm(false);
      setDependencySearch('');
    } catch (err) {
      console.error('Error adding dependency:', err);
      setError(err.message || 'Failed to add dependency');
    } finally {
      setAddingDependency(false);
    }
  };

  // Remove dependency
  const handleRemoveDependency = async (dependencyId) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;

      await logActivity('removed_dependency', `Removed a task dependency`);
      await fetchDependencies(taskId);
    } catch (err) {
      console.error('Error removing dependency:', err);
      setError(err.message || 'Failed to remove dependency');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setAddingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments(taskId);
      await logActivity('commented', 'Added a comment');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleToggleWatch = async () => {
    try {
      if (watchingTask) {
        await supabase
          .from('notifications')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', currentUser.id)
          .eq('type', 'watch');
      } else {
        await supabase
          .from('notifications')
          .insert({
            task_id: taskId,
            user_id: currentUser.id,
            type: 'watch',
            is_read: true,
          });
      }
      setWatchingTask(!watchingTask);
    } catch (err) {
      console.error('Error toggling watch:', err);
    }
  };

  const logActivity = async (action, description) => {
    try {
      await supabase
        .from('task_activities')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          action,
          description,
        });
      await fetchActivities(taskId);
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const calculateTimeSpent = () => {
    // Placeholder for time tracking calculation
    return '2h 15m';
  };

  const navigateToTask = (taskID) => {
    // If there's a parent navigation mechanism, call it with the new task ID
    if (onNavigateToTask) {
      onNavigateToTask(taskID);
    } else {
      // Fallback: close current modal
      if (onClose) onClose();
      console.log(`Navigating to task: ${taskID}`);
    }
  };

  const copyTaskLink = () => {
    const url = `${window.location.origin}/tasks/${taskId}`;
    navigator.clipboard.writeText(url);
    // In a real app, you'd show a toast notification
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-amber-100 text-amber-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (status) => {
    if (!status || status === task.status) return;
    
    setUpdatingStatus(true);
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      await logActivity('status_updated', `Updated status to ${status}`);
      await fetchTaskData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredAvailableTasks = availableTasks.filter(t => 
    t.title.toLowerCase().includes(dependencySearch.toLowerCase()) &&
    !dependencies.some(d => d.depends_on_task_id === t.id)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <LoadingSkeleton variant="card" />
          ) : error ? (
            <div className="p-8 text-center">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : task ? (
            <>
              {/* Vertical Navigation Sidebar */}
              <div className="w-80 bg-gradient-to-b from-indigo-900 to-purple-900 text-white flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-indigo-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Task Details</h2>
                      <p className="text-indigo-200 text-sm">Manage your task efficiently</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-indigo-800 transition-colors"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge type="type" value={task.type} size="md" />
                    <span className="text-sm opacity-80">Task-{task.id?.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>

                {/* Task Title */}
                <div className="p-6 border-b border-indigo-700">
                  <h1 className="text-xl font-bold mb-3 line-clamp-3">{task.title}</h1>
                  <div className="flex items-center gap-2">
                    <Badge type="status" value={task.status} size="sm" />
                    <Badge type="priority" value={task.priority} size="sm" />
                  </div>
                </div>

                {/* Status Summary */}
                <div className="p-6 border-b border-indigo-700">
                  <div className="mb-4">
                    <div className="text-xs uppercase font-semibold opacity-80 mb-1">Status</div>
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${getStatusColorClass(task.status)} hover:opacity-90 transition-opacity`}
                      >
                        <span className="font-medium">{task.status}</span>
                        <FiChevronDown className="w-4 h-4" />
                      </button>
                      
                      {showStatusDropdown && (
                        <div className="status-dropdown absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                          {statusOptions.map((status) => (
                            <button
                              key={status.value}
                              onClick={() => {
                                handleStatusChange(status.value);
                                setShowStatusDropdown(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-gray-50 ${status.color} ${task.status === status.value ? 'font-bold' : ''}`}
                            >
                              {React.createElement(status.icon, { className: "w-4 h-4" })}
                              <span>{status.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs uppercase font-semibold opacity-80 mb-1">Priority</div>
                    <div className="font-medium">{task.priority}</div>
                  </div>
                  
                  {task.assignee && (
                    <div>
                      <div className="text-xs uppercase font-semibold opacity-80 mb-1">Assignee</div>
                      <div className="flex items-center gap-2">
                        <Avatar user={task.assignee} size="sm" />
                        <span className="font-medium">{task.assignee.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 py-4 overflow-y-auto">
                  <nav className="px-4 space-y-1">
                    {sections.map((section) => {
                      const SectionIcon = section.icon;
                      return (
                        <motion.button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all ${
                            activeSection === section.id
                              ? 'bg-white/20 text-white shadow-lg'
                              : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                          }`}
                          whileHover={{ x: 4, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <SectionIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium flex-1">{section.label}</span>
                          {section.count !== undefined && section.count > 0 && (
                            <span className="bg-white/20 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                              {section.count}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-indigo-700 space-y-3">
                  {editMode ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                      >
                        {saving ? (
                          <>
                            <FiLoader className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditToggle}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={handleToggleWatch}
                        className="p-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                        title={watchingTask ? 'Stop watching' : 'Watch task'}
                      >
                        {watchingTask ? (
                          <FiBell className="w-5 h-5" />
                        ) : (
                          <FiBellOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={copyTaskLink}
                        className="p-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                        title="Copy task link"
                      >
                        <FiCopy className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={handleDeleteTask}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg hover:from-rose-700 hover:to-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Task
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Enhanced Header with Status Update Button */}
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {parentTaskId && (
                        <motion.button
                          onClick={() => onNavigateToTask && onNavigateToTask(parentTaskId)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          title="Go back to parent task"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiArrowLeft className="w-5 h-5" />
                        </motion.button>
                      )}
                      <div className="flex-1">
                        {editMode ? (
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            className="w-full text-3xl font-bold text-gray-900 border-2 border-indigo-500 rounded-lg px-4 py-2 focus:outline-none"
                          />
                        ) : (
                          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {!editMode && (
                        <div className="relative">
                          <motion.button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-md ${getStatusColorClass(task.status)}`}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="font-medium text-gray-900">{task.status}</span>
                            <FiChevronDown className="w-5 h-5" />
                          </motion.button>
                          
                          {showStatusDropdown && (
                            <div className="status-dropdown absolute z-20 right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                              {statusOptions.map((status) => {
                                const StatusIcon = status.icon;
                                return (
                                  <button
                                    key={status.value}
                                    onClick={() => {
                                      handleStatusChange(status.value);
                                      setShowStatusDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${status.color} ${task.status === status.value ? 'font-bold' : ''}`}
                                  >
                                    <StatusIcon className="w-5 h-5" />
                                    <span>{status.label}</span>
                                    {task.status === status.value && (
                                      <FiCheck className="w-4 h-4 ml-auto text-green-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-4">
                    <Badge type="status" value={editMode ? editData.status : task.status} size="lg" />
                    <Badge type="priority" value={editMode ? editData.priority : task.priority} size="lg" />
                    {task.team && (
                      <Badge type="team" value={task.team.name} size="lg" />
                    )}
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <Avatar user={task.assignee} size="sm" />
                        <span className="text-gray-700 font-medium">{task.assignee.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Date Information */}
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    {task.due_date && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Update Modal */}
                <AnimatePresence>
                  {showStatusModal && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowStatusModal(false)}
                    >
                      <motion.div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Update Task Status</h3>
                            <button
                              onClick={() => {
                                setShowStatusModal(false);
                                setNewStatus('');
                                setStatusComment('');
                              }}
                              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-gray-600 mt-1">Change the status of "{task.title}"</p>
                        </div>
                        
                        <div className="p-6">
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select New Status
                              </label>
                              <div className="grid grid-cols-1 gap-3">
                                {statusOptions.map((status) => {
                                  const StatusIcon = status.icon;
                                  return (
                                    <motion.button
                                      key={status.value}
                                      onClick={() => setNewStatus(status.value)}
                                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        newStatus === status.value
                                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                      } ${status.color}`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <StatusIcon className="w-5 h-5" />
                                        <span className="font-medium">{status.label}</span>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Comment (Optional)
                              </label>
                              <textarea
                                value={statusComment}
                                onChange={(e) => setStatusComment(e.target.value)}
                                placeholder="Add a comment about this status change..."
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setShowStatusModal(false);
                                  setNewStatus('');
                                  setStatusComment('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleStatusUpdate}
                                disabled={!newStatus || updatingStatus}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {updatingStatus ? (
                                  <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="w-4 h-4" />
                                    Update
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* Overview Section */}
                    {activeSection === 'overview' && (
                      <div className="space-y-6">
                        {/* Description Card */}
                        <motion.div 
                          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div 
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer"
                            onClick={() => toggleSection('description')}
                          >
                            <div className="flex items-center gap-3">
                              <FiFileText className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedSections.description ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FiChevronDown className="w-5 h-5 text-gray-500" />
                            </motion.div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedSections.description && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="p-5">
                                  {editMode ? (
                                    <textarea
                                      value={editData.description}
                                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                      rows="8"
                                      className="w-full px-4 py-3 border-2 border-indigo-500 rounded-lg focus:outline-none resize-none"
                                      placeholder="Add a detailed description of the task..."
                                    />
                                  ) : (
                                    <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg min-h-[120px]">
                                      {task.description || (
                                        <span className="text-gray-400 italic">No description provided</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>



                        {/* Comments Preview Card */}
                        <motion.div 
                          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div 
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <FiMessageSquare className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                              {comments.length > 0 && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                                  {comments.length}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => setActiveSection('comments')}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View All Comments →
                            </button>
                          </div>
                          
                          <div className="p-5">
                            {comments.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                <FiMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No comments yet</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {comments.slice(0, 5).map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar user={comment.user} size="sm" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">{comment.user?.name}</span>
                                        <span className="text-xs text-gray-500">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 text-sm">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Dependencies Preview Card */}
                        <motion.div 
                          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div 
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <FiGitBranch className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">Dependencies</h3>
                              {dependencies.length > 0 && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                  {dependencies.length}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => setActiveSection('dependencies')}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View All Dependencies →
                            </button>
                          </div>
                          
                          <div className="p-5">
                            {dependencies.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                <FiGitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No dependencies</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {dependencies.slice(0, 5).map((dep) => (
                                  <div 
                                    key={dep.id} 
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigateToTask(dep.depends_on_task.id)}
                                  >
                                    <FiLink className="w-4 h-4 text-amber-600" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Badge type="type" value={dep.depends_on_task.type} size="xs" />
                                        <span className="font-medium text-gray-900 truncate hover:text-indigo-600">{dep.depends_on_task.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge type="status" value={dep.depends_on_task.status} size="xs" />
                                        <Badge type="priority" value={dep.depends_on_task.priority} size="xs" />
                                        <Badge 
                                          type="dependency" 
                                          value={dep.dependency_type || 'related'} 
                                          size="xs" 
                                          className={`text-xs px-1.5 py-0.5 rounded ${dep.dependency_type === 'blocks' ? 'bg-red-100 text-red-800' : dep.dependency_type === 'blocked_by' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}
                                        />
                                      </div>
                                    </div>
                                    <FiExternalLink className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Details Card */}
                        <motion.div 
                          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div 
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer"
                            onClick={() => toggleSection('details')}
                          >
                            <div className="flex items-center gap-3">
                              <FiFolder className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedSections.details ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FiChevronDown className="w-5 h-5 text-gray-500" />
                            </motion.div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedSections.details && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="p-5 space-y-4">
                                  {/* Assignee */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                      Assignee
                                    </label>
                                    {editMode ? (
                                      <select
                                        value={editData.assignee_id || ''}
                                        onChange={(e) => setEditData({ ...editData, assignee_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                      >
                                        <option value="">Unassigned</option>
                                        {users.map((user) => (
                                          <option key={user.id} value={user.id}>
                                            {user.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : task.assignee ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar user={task.assignee} size="sm" />
                                        <span className="text-gray-900">{task.assignee.name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">Unassigned</span>
                                    )}
                                  </div>

                                  {/* Reporter */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                      Reporter
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Avatar user={task.reporter} size="sm" />
                                      <span className="text-gray-900">{task.reporter?.name}</span>
                                    </div>
                                  </div>

                                  {/* Team */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                      Team
                                    </label>
                                    {editMode ? (
                                      <select
                                        value={editData.team_id || ''}
                                        onChange={(e) => setEditData({ ...editData, team_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                      >
                                        <option value="">No team</option>
                                        {teams.map((team) => (
                                          <option key={team.id} value={team.id}>
                                            {team.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : task.team ? (
                                      <span className="text-gray-900">{task.team.name}</span>
                                    ) : (
                                      <span className="text-gray-500">No team</span>
                                    )}
                                  </div>

                                  {/* Due date */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                      Due Date
                                    </label>
                                    {editMode ? (
                                      <input
                                        type="date"
                                        value={editData.due_date || ''}
                                        onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                      />
                                    ) : task.due_date ? (
                                      <span className="text-gray-900">
                                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">No due date</span>
                                    )}
                                  </div>

                                  {/* Project */}
                                  {task.project && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                        Project
                                      </label>
                                      <span className="text-gray-900">{task.project.name}</span>
                                    </div>
                                  )}

                                  {/* Sprint */}
                                  {task.sprint && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                        Sprint
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-900">{task.sprint.name}</span>
                                        <Badge type="status" value={task.sprint.status} size="xs" />
                                      </div>
                                    </div>
                                  )}

                                  {/* Created & Updated Dates */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                        Created
                                      </label>
                                      <span className="text-gray-900">
                                        {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                                      </span>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                        Last Updated
                                      </label>
                                      <span className="text-gray-900">
                                        {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Status History */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                                      Status History
                                    </label>
                                    <div className="space-y-2">
                                      {activities
                                        .filter(activity => activity.action === 'status_updated' || activity.description.includes('status'))
                                        .slice(0, 5)
                                        .map((activity, index) => {
                                          const StatusIcon = statusOptions.find(opt => opt.label === activity.description.replace('Updated status to ', ''))?.icon || FiClock;
                                          return (
                                            <div key={activity.id} className="flex items-center gap-2 text-sm">
                                              <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${getStatusColorClass(activity.description.replace('Updated status to ', ''))}`}></div>
                                                {index < activities.filter(a => a.action === 'status_updated' || a.description.includes('status')).length - 1 && (
                                                  <div className="h-6 w-0.5 bg-gray-200 mt-1"></div>
                                                )}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center gap-1">
                                                  <span className="font-medium">{activity.user?.name}</span>
                                                  <span>updated status to</span>
                                                  <Badge type="status" value={activity.description.replace('Updated status to ', '')} size="xs" />
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      {activities.filter(activity => activity.action === 'status_updated' || activity.description.includes('status')).length === 0 && (
                                        <p className="text-xs text-gray-500 italic">No status changes yet</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}

                    {/* Checklist Section */}
                    {activeSection === 'subtasks' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiCheckSquare className="w-6 h-6 text-indigo-600" />
                            Checklist
                            {subtasks.length > 0 && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
                                {subtasks.filter(s => s.status === 'Completed').length}/{subtasks.length} completed
                              </span>
                            )}
                          </h3>
                          <button
                            onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md"
                          >
                            <FiPlus className="w-4 h-4" />
                            <span>Add Item</span>
                          </button>
                        </div>
                        
                        {/* Subtask creation form */}
                        {showSubtaskForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 mb-4"
                          >
                            <h4 className="font-semibold text-indigo-900 mb-4">Create New Checklist Item</h4>
                            <div className="space-y-4">
                              <input
                                type="text"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                placeholder="Checklist item title..."
                                className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                autoFocus
                              />
                              <textarea
                                value={newSubtask.description}
                                onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                                placeholder="Description (optional)..."
                                rows="2"
                                className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                              />
                              <div className="flex items-center gap-3">
                                <select
                                  value={newSubtask.assignee_id}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, assignee_id: e.target.value })}
                                  className="flex-1 px-4 py-3 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none"
                                >
                                  <option value="">Unassigned</option>
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={newSubtask.priority}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                                  className="px-4 py-3 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Critical">Critical</option>
                                </select>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={handleCreateSubtask}
                                  disabled={creatingSubtask || !newSubtask.title.trim()}
                                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                                >
                                  {creatingSubtask ? (
                                    <>
                                      <FiLoader className="w-4 h-4 animate-spin" />
                                      Creating...
                                    </>
                                  ) : (
                                    <>
                                      <FiCheck className="w-4 h-4" />
                                      Create Item
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSubtaskForm(false);
                                    setNewSubtask({ title: '', description: '', assignee_id: '', priority: 'Medium' });
                                  }}
                                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        {subtasks.length === 0 ? (
                          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <FiCheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">No checklist items yet</p>
                            <p className="mb-6">Add your first checklist item to break down this task</p>
                            <button
                              onClick={() => setShowSubtaskForm(true)}
                              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                            >
                              <FiPlus className="w-5 h-5" />
                              <span>Create Checklist Item</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {subtasks.map((subtask) => (
                              <motion.div
                                key={subtask.id}
                                className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: subtasks.indexOf(subtask) * 0.05 }}
                              >
                                <div className="flex items-start gap-4">
                                  <input
                                    type="checkbox"
                                    checked={subtask.status === 'Completed'}
                                    onChange={() => handleToggleSubtask(subtask)}
                                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className={`font-medium text-gray-900 ${subtask.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                                        {subtask.title}
                                      </h4>
                                      <Badge type="status" value={subtask.status} size="xs" />
                                    </div>
                                    {subtask.description && (
                                      <p className="text-gray-600 mb-3">{subtask.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      {subtask.assignee && (
                                        <div className="flex items-center gap-1">
                                          <Avatar user={subtask.assignee} size="xs" />
                                          <span>{subtask.assignee.name}</span>
                                        </div>
                                      )}
                                      <span>{subtask.priority}</span>
                                      <span>Created {formatDistanceToNow(new Date(subtask.created_at), { addSuffix: true })}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSubtask(subtask.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete subtask"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dependencies Section */}
                    {activeSection === 'dependencies' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiGitBranch className="w-6 h-6 text-indigo-600" />
                            Dependencies
                          </h3>
                          <button
                            onClick={() => setShowDependencyForm(!showDependencyForm)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md"
                          >
                            <FiPlus className="w-4 h-4" />
                            <span>Add Dependency</span>
                          </button>
                        </div>
                        
                        {/* Dependency form */}
                        {showDependencyForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 mb-4"
                          >
                            <h4 className="font-semibold text-indigo-900 mb-4">Add Task Dependency</h4>
                            <div className="relative mb-4">
                              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="text"
                                value={dependencySearch}
                                onChange={(e) => setDependencySearch(e.target.value)}
                                placeholder="Search for tasks..."
                                className="w-full pl-10 pr-4 py-3 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Dependency Type</label>
                              <div className="flex gap-2">
                                {['blocks', 'blocked_by', 'related'].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedDependencyType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                      selectedDependencyType === type
                                        ? type === 'blocks' 
                                          ? 'bg-red-100 text-red-800 border border-red-300'
                                          : type === 'blocked_by'
                                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                              {filteredAvailableTasks.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-4">
                                  {dependencySearch ? 'No tasks found' : 'Start typing to search tasks'}
                                </p>
                              ) : (
                                <ul className="space-y-2">
                                  {filteredAvailableTasks.map((availableTask) => (
                                    <li key={availableTask.id}>
                                      <button
                                        onClick={() => handleAddDependency(availableTask.id, selectedDependencyType)}
                                        disabled={addingDependency}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left disabled:opacity-50"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge type="type" value={availableTask.type} size="xs" />
                                              <span className="text-sm font-medium text-gray-900">{availableTask.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Badge type="status" value={availableTask.status} size="xs" />
                                              <Badge type="priority" value={availableTask.priority} size="xs" />
                                            </div>
                                          </div>
                                          <FiPlus className="w-4 h-4 text-indigo-600" />
                                        </div>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setShowDependencyForm(false);
                                setDependencySearch('');
                              }}
                              className="w-full mt-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </motion.div>
                        )}

                        {dependencies.length === 0 ? (
                          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <FiGitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">No dependencies yet</p>
                            <p className="mb-6">Add dependencies to show which tasks block or are blocked by this one</p>
                            <button
                              onClick={() => setShowDependencyForm(true)}
                              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                            >
                              <FiPlus className="w-5 h-5" />
                              <span>Add Dependency</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {dependencies.map((dep) => (
                              <motion.div
                                key={dep.id}
                                className="p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: dependencies.indexOf(dep) * 0.05 }}
                                onClick={() => navigateToTask(dep.depends_on_task.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FiLink className="w-5 h-5 text-amber-600" />
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge type="type" value={dep.depends_on_task.type} size="sm" />
                                        <span className="font-medium text-gray-900 hover:text-indigo-700">{dep.depends_on_task.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge type="status" value={dep.depends_on_task.status} size="sm" />
                                        <Badge type="priority" value={dep.depends_on_task.priority} size="sm" />
                                        <Badge 
                                          type="dependency" 
                                          value={dep.dependency_type || 'related'} 
                                          size="sm" 
                                          className={`text-xs px-2 py-1 rounded ${dep.dependency_type === 'blocks' ? 'bg-red-100 text-red-800' : dep.dependency_type === 'blocked_by' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FiExternalLink className="w-4 h-4 text-amber-600" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDependency(dep.id);
                                      }}
                                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                      title="Remove dependency"
                                    >
                                      <FiXCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comments Section */}
                    {activeSection === 'comments' && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <FiMessageSquare className="w-6 h-6 text-indigo-600" />
                          Comments
                          {comments.length > 0 && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
                              {comments.length}
                            </span>
                          )}
                        </h3>
                        
                        {/* Add comment */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                          <div className="flex gap-4">
                            <Avatar user={currentUser} size="sm" />
                            <div className="flex-1">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                              />
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim() || addingComment}
                                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                                >
                                  {addingComment ? (
                                    <>
                                      <FiLoader className="w-4 h-4 animate-spin" />
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <FiSend className="w-4 h-4" />
                                      Post Comment
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Comments list */}
                        {comments.length === 0 ? (
                          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <FiMessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">No comments yet</p>
                            <p className="mb-6">Be the first to comment on this task</p>
                            <button
                              onClick={() => document.querySelector('textarea')?.focus()}
                              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                            >
                              <FiPlus className="w-5 h-5" />
                              <span>Add Comment</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <motion.div
                                key={comment.id}
                                className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: comments.indexOf(comment) * 0.05 }}
                              >
                                <div className="flex gap-4">
                                  <Avatar user={comment.user} size="sm" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-gray-900">{comment.user?.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-gray-700">{comment.content}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                      <motion.button 
                                        className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FiThumbsUp className="w-3 h-3" />
                                        Like
                                      </motion.button>
                                      <motion.button 
                                        className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FiUserPlus className="w-3 h-3" />
                                        Reply
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activity Section */}
                    {activeSection === 'activity' && (
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <FiActivity className="w-6 h-6 text-indigo-600" />
                          Activity Feed
                          {activities.length > 0 && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
                              {activities.length}
                            </span>
                          )}
                        </h3>
                        
                        {activities.length === 0 ? (
                          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">No activity yet</p>
                            <p>Activity will appear as changes are made to this task</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activities.map((activity) => (
                              <motion.div
                                key={activity.id}
                                className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: activities.indexOf(activity) * 0.05 }}
                              >
                                <div className="flex gap-4">
                                  <Avatar user={activity.user} size="sm" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">{activity.user?.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-gray-700">{activity.description}</p>
                                    {activity.comment && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-700 italic">"{activity.comment}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskDetailView;