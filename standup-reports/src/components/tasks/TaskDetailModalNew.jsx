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
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../../supabaseClient';
import Badge from '../shared/Badge';
import Avatar, { AvatarGroup } from '../shared/Avatar';
import LoadingSkeleton from '../shared/LoadingSkeleton';

/**
 * TaskDetailModalNew - Professional task detail view with comprehensive features
 * Inspired by Jira with modern UX
 */
const TaskDetailModalNew = ({ 
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
    { id: 'comments', label: 'Comments', icon: FiMessageSquare, count: comments.length },
    { id: 'activity', label: 'Activity', icon: FiClock, count: activities.length },
    { id: 'attachments', label: 'Attachments', icon: FiPaperclip, count: attachments.length },
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
      .select('*, depends_on_task:tasks!depends_on_task_id(id, title, status, type)')
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
      // Cancel edit - reset data
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

      // Log activity
      await logActivity('updated', `Updated task details`);

      // Refresh data
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
        // Unwatch
        await supabase
          .from('notifications')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', currentUser.id)
          .eq('type', 'watch');
      } else {
        // Watch
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
    // Show toast notification (implement toast system)
    alert('Task link copied to clipboard!');
  };

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
              {/* Header */}
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
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
                        className="w-full text-2xl font-bold text-gray-900 border-2 border-emerald-500 rounded-lg px-3 py-2 focus:outline-none"
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
                        <FiBell className="w-5 h-5 text-emerald-600" />
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
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
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
                              ? 'border-emerald-600 text-emerald-600 bg-white'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        <TabIcon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
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
                              className="w-full px-4 py-3 border-2 border-emerald-500 rounded-lg focus:outline-none resize-none"
                            />
                          ) : (
                            <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
                              {task.description || (
                                <span className="text-gray-400 italic">No description provided</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Dependencies */}
                        {dependencies.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FiGitBranch className="w-5 h-5" />
                              Dependencies
                            </h3>
                            <div className="space-y-2">
                              {dependencies.map((dep) => (
                                <div
                                  key={dep.id}
                                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge type="type" value={dep.depends_on_task.type} size="sm" />
                                    <span className="font-medium text-gray-900">
                                      {dep.depends_on_task.title}
                                    </span>
                                  </div>
                                  <Badge type="status" value={dep.depends_on_task.status} size="sm" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Time tracking */}
                        {timeEntries.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FiClock className="w-5 h-5" />
                              Time Tracking
                            </h3>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                              <div className="text-3xl font-bold text-emerald-700 mb-2">
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
                          <h3 className="text-lg font-semibold text-gray-900">Subtasks</h3>
                          <button className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                            <FiPlus className="w-4 h-4" />
                            Add Subtask
                          </button>
                        </div>
                        
                        {subtasks.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiCheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No subtasks yet</p>
                          </div>
                        ) : (
                          subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={subtask.status === 'Completed'}
                                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{subtask.title}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge type="status" value={subtask.status} size="xs" />
                                      {subtask.assignee && (
                                        <Avatar user={subtask.assignee} size="xs" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim() || addingComment}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

                    {activeTab === 'attachments' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                          <button className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                            <FiPlus className="w-4 h-4" />
                            Upload
                          </button>
                        </div>

                        {attachments.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FiPaperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No attachments yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <FiPaperclip className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.file_name}
                                  </span>
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
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
                      
                      <div className="space-y-4">
                        {/* Assignee */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Assignee
                          </label>
                          {editMode ? (
                            <select
                              value={editData.assignee_id || ''}
                              onChange={(e) => setEditData({ ...editData, assignee_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none text-sm"
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
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
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
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Team
                          </label>
                          {editMode ? (
                            <select
                              value={editData.team_id || ''}
                              onChange={(e) => setEditData({ ...editData, team_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none text-sm"
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
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Due Date
                          </label>
                          {editMode ? (
                            <input
                              type="date"
                              value={editData.due_date || ''}
                              onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none text-sm"
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
                            <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                              Project
                            </label>
                            <span className="text-sm text-gray-900">{task.project.name}</span>
                          </div>
                        )}

                        {/* Sprint */}
                        {task.sprint && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
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
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Created
                          </label>
                          <span className="text-sm text-gray-900">
                            {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>

                        {/* Updated */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
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

export default TaskDetailModalNew;
