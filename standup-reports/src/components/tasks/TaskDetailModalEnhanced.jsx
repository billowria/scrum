import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiEdit2,
  FiSave,
  FiTrash2,
  FiClock,
  FiCalendar,
  FiUser,
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
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../../supabaseClient';
import Badge from '../shared/Badge';
import Avatar, { AvatarGroup } from '../shared/Avatar';
import LoadingSkeleton from '../shared/LoadingSkeleton';

/**
 * TaskDetailModalEnhanced - Complete task management with subtasks and dependencies
 */
const TaskDetailModalEnhanced = ({ 
  isOpen, 
  onClose, 
  taskId, 
  onUpdate,
  currentUser,
  userRole 
}) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Related data
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  
  // Subtask creation
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'Medium',
  });
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  
  // Dependency management
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [dependencySearch, setDependencySearch] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [addingDependency, setAddingDependency] = useState(false);
  
  // Comment state
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  // Notification state
  const [watchingTask, setWatchingTask] = useState(false);
  
  // Options
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'subtasks', label: 'Subtasks', icon: FiCheckSquare, count: subtasks.length },
    { id: 'dependencies', label: 'Dependencies', icon: FiGitBranch, count: dependencies.length },
    { id: 'comments', label: 'Comments', icon: FiMessageSquare, count: comments.length },
    { id: 'activity', label: 'Activity', icon: FiClock, count: activities.length },
  ];

  // Fetch task data on mount
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskData();
    }
  }, [isOpen, taskId]);

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
          sprint:sprints(id, name, status),
          parent:tasks!parent_task_id(id, title, type),
          depends_on:tasks!depends_on_task_id(id, title, status)
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
        fetchMentions(taskId),
        fetchTimeEntries(taskId),
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

  const fetchMentions = async (taskId) => {
    const { data } = await supabase
      .from('task_mentions')
      .select('*, user:users(id, name, avatar_url)')
      .eq('task_id', taskId);
    setMentions(data || []);
  };

  const fetchTimeEntries = async (taskId) => {
    const { data } = await supabase
      .from('time_entries')
      .select('*, user:users(id, name, avatar_url)')
      .eq('task_id', taskId)
      .order('logged_at', { ascending: false });
    setTimeEntries(data || []);
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

  // Add dependency
  const handleAddDependency = async (dependsOnTaskId) => {
    setAddingDependency(true);
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert({
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: 'blocks',
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
    if (timeEntries.length === 0) return '0h';
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const copyTaskLink = () => {
    const url = `${window.location.origin}/tasks/${taskId}`;
    navigator.clipboard.writeText(url);
    alert('Task link copied to clipboard!');
  };

  const filteredAvailableTasks = availableTasks.filter(t => 
    t.title.toLowerCase().includes(dependencySearch.toLowerCase()) &&
    !dependencies.some(d => d.depends_on_task_id === t.id)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
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
              <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
              {/* Header with indigo gradient */}
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge type="type" value={task.type} size="md" />
                      <span className="text-sm text-gray-500">Task-{task.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full text-2xl font-bold text-gray-900 border-2 border-indigo-500 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleWatch}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title={watchingTask ? 'Stop watching' : 'Watch task'}
                    >
                      {watchingTask ? (
                        <FiBell className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <FiBellOff className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    <button
                      onClick={copyTaskLink}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Copy task link"
                    >
                      <FiCopy className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {editMode ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <FiX className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge type="status" value={editMode ? editData.status : task.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge type="priority" value={editMode ? editData.priority : task.priority} size="sm" />
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      <Avatar user={task.assignee} size="xs" />
                      <span className="text-gray-700">{task.assignee.name}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 px-6 bg-gray-50">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          px-4 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap
                          ${
                            activeTab === tab.id
                              ? 'border-indigo-600 text-indigo-600 bg-white'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        <TabIcon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-6 p-6">
                  {/* Main content (2/3) */}
                  <div className="col-span-2 space-y-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Description */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                          {editMode ? (
                            <textarea
                              value={editData.description}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              rows="6"
                              className="w-full px-4 py-3 border-2 border-indigo-500 rounded-lg focus:outline-none resize-none"
                            />
                          ) : (
                            <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
                              {task.description || (
                                <span className="text-gray-400 italic">No description provided</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Time tracking */}
                        {timeEntries.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FiClock className="w-5 h-5" />
                              Time Tracking
                            </h3>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                              <div className="text-3xl font-bold text-indigo-700 mb-2">
                                {calculateTimeSpent()}
                              </div>
                              <div className="text-sm text-gray-600">Total time logged</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'subtasks' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FiCheckSquare className="w-5 h-5 text-indigo-600" />
                            Subtasks
                            {subtasks.length > 0 && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                                {subtasks.filter(s => s.status === 'Completed').length}/{subtasks.length}
                              </span>
                            )}
                          </h3>
                          <button 
                            onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" />
                            Add Subtask
                          </button>
                        </div>

                        {/* Subtask creation form */}
                        {showSubtaskForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-4"
                          >
                            <h4 className="font-semibold text-indigo-900 mb-3">Create New Subtask</h4>
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                placeholder="Subtask title..."
                                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                autoFocus
                              />
                              <textarea
                                value={newSubtask.description}
                                onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                                placeholder="Description (optional)..."
                                rows="2"
                                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                              />
                              <div className="flex items-center gap-3">
                                <select
                                  value={newSubtask.assignee_id}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, assignee_id: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                >
                                  <option value="">Unassigned</option>
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={newSubtask.priority}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                                  className="px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Critical">Critical</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCreateSubtask}
                                  disabled={creatingSubtask || !newSubtask.title.trim()}
                                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {creatingSubtask ? (
                                    <>
                                      <FiLoader className="w-4 h-4 animate-spin" />
                                      Creating...
                                    </>
                                  ) : (
                                    <>
                                      <FiCheck className="w-4 h-4" />
                                      Create Subtask
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSubtaskForm(false);
                                    setNewSubtask({ title: '', description: '', assignee_id: '', priority: 'Medium' });
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        {subtasks.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiCheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No subtasks yet</p>
                            <p className="text-sm mt-1">Click "Add Subtask" to create one</p>
                          </div>
                        ) : (
                          subtasks.map((subtask) => (
                            <motion.div
                              key={subtask.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={subtask.status === 'Completed'}
                                    onChange={() => handleToggleSubtask(subtask)}
                                    className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                  />
                                  <div className="flex-1">
                                    <h4 className={`font-medium text-gray-900 ${subtask.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                                      {subtask.title}
                                    </h4>
                                    {subtask.description && (
                                      <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge type="status" value={subtask.status} size="xs" />
                                      <Badge type="priority" value={subtask.priority} size="xs" />
                                      {subtask.assignee && (
                                        <div className="flex items-center gap-1">
                                          <Avatar user={subtask.assignee} size="xs" />
                                          <span className="text-xs text-gray-600">{subtask.assignee.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteSubtask(subtask.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete subtask"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'dependencies' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FiGitBranch className="w-5 h-5 text-indigo-600" />
                            Dependencies
                          </h3>
                          <button
                            onClick={() => setShowDependencyForm(!showDependencyForm)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" />
                            Add Dependency
                          </button>
                        </div>

                        {/* Dependency form */}
                        {showDependencyForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-4"
                          >
                            <h4 className="font-semibold text-indigo-900 mb-3">Add Task Dependency</h4>
                            <div className="relative mb-3">
                              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                value={dependencySearch}
                                onChange={(e) => setDependencySearch(e.target.value)}
                                placeholder="Search for tasks..."
                                className="w-full pl-10 pr-4 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {filteredAvailableTasks.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  {dependencySearch ? 'No tasks found' : 'Start typing to search tasks'}
                                </p>
                              ) : (
                                filteredAvailableTasks.map((availableTask) => (
                                  <button
                                    key={availableTask.id}
                                    onClick={() => handleAddDependency(availableTask.id)}
                                    disabled={addingDependency}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left disabled:opacity-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
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
                                ))
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setShowDependencyForm(false);
                                setDependencySearch('');
                              }}
                              className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </motion.div>
                        )}

                        {dependencies.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiGitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No dependencies yet</p>
                            <p className="text-sm mt-1">Click "Add Dependency" to link a blocking task</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dependencies.map((dep) => (
                              <motion.div
                                key={dep.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between hover:bg-amber-100 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <FiLink className="w-4 h-4 text-amber-600" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge type="type" value={dep.depends_on_task.type} size="xs" />
                                      <span className="font-medium text-gray-900">{dep.depends_on_task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge type="status" value={dep.depends_on_task.status} size="xs" />
                                      <Badge type="priority" value={dep.depends_on_task.priority} size="xs" />
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveDependency(dep.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Remove dependency"
                                >
                                  <FiXCircle className="w-5 h-5" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'comments' && (
                      <div className="space-y-4">
                        {/* Add comment */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim() || addingComment}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {addingComment ? (
                                <>
                                  <FiLoader className="w-4 h-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <FiMessageSquare className="w-4 h-4" />
                                  Comment
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Comments list */}
                        {comments.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No comments yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar user={comment.user} size="sm" />
                                <div className="flex-1">
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">{comment.user?.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'activity' && (
                      <div className="space-y-3">
                        {activities.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiActivity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No activity yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities.map((activity) => (
                              <div key={activity.id} className="flex gap-3">
                                <Avatar user={activity.user} size="sm" />
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">{activity.user?.name}</span>
                                    <span className="text-gray-600 ml-1">{activity.description}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sidebar (1/3) */}
                  <div className="space-y-6">
                    {/* Details card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                      <h3 className="font-semibold text-indigo-900 mb-4">Details</h3>
                      
                      <div className="space-y-4">
                        {/* Assignee */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
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
                              <span className="text-sm text-gray-900">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unassigned</span>
                          )}
                        </div>

                        {/* Reporter */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
                            Reporter
                          </label>
                          {task.reporter && (
                            <div className="flex items-center gap-2">
                              <Avatar user={task.reporter} size="sm" />
                              <span className="text-sm text-gray-900">{task.reporter.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Team */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
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
                            <span className="text-sm text-gray-900">{task.team.name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">No team</span>
                          )}
                        </div>

                        {/* Due date */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
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
                            <span className="text-sm text-gray-900">
                              {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">No due date</span>
                          )}
                        </div>

                        {/* Project */}
                        {task.project && (
                          <div>
                            <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
                              Project
                            </label>
                            <span className="text-sm text-gray-900">{task.project.name}</span>
                          </div>
                        )}

                        {/* Sprint */}
                        {task.sprint && (
                          <div>
                            <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
                              Sprint
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{task.sprint.name}</span>
                              <Badge type="status" value={task.sprint.status} size="xs" />
                            </div>
                          </div>
                        )}

                        {/* Created */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
                            Created
                          </label>
                          <span className="text-sm text-gray-900">
                            {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>

                        {/* Updated */}
                        <div>
                          <label className="text-xs font-medium text-indigo-700 uppercase mb-1 block">
                            Updated
                          </label>
                          <span className="text-sm text-gray-900">
                            {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2">
                          <FiShare2 className="w-4 h-4" />
                          Share
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2">
                          <FiLink className="w-4 h-4" />
                          Link Issue
                        </button>
                        <button
                          onClick={handleDeleteTask}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete Task
                        </button>
                      </div>
                    </div>
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

export default TaskDetailModalEnhanced;
