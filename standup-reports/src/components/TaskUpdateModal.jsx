import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMessageSquare, FiClock, FiUser, FiUsers, FiCalendar, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiEdit2, FiSave, FiRotateCcw } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';
import { createTaskNotification } from '../utils/notificationHelper';

// Main Component
export default function TaskUpdateModal({
  isOpen,
  onClose,
  task,
  onSuccess
}) {
  const [selectedStatus, setSelectedStatus] = useState(task?.status || 'To Do');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const statusOptions = [
    {
      value: 'To Do',
      label: 'To Do',
      icon: FiClock,
      description: 'Task is ready to be started'
    },
    {
      value: 'In Progress',
      label: 'In Progress',
      icon: FiTrendingUp,
      description: 'Task is currently being worked on'
    },
    {
      value: 'Review',
      label: 'Review',
      icon: FiAlertCircle,
      description: 'Task is ready for review'
    },
    {
      value: 'Completed',
      label: 'Completed',
      icon: FiCheckCircle,
      description: 'Task has been completed'
    }
  ];

  useEffect(() => {
    if (task && isOpen) {
      setSelectedStatus(task.status || 'To Do');
      setComment('');
      setError(null);
      fetchTaskHistory();
      fetchCurrentUser();
    }
  }, [task, isOpen]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTaskHistory = async () => {
    if (!task) return;

    try {
      const { data, error } = await supabase
        .rpc('get_task_history', { task_uuid: task.id });

      if (error) throw error;

      setTaskHistory(data || []);
    } catch (error) {
      console.error('Error fetching task history:', error);
      // Fallback to empty array if there's an error
      setTaskHistory([]);
    }
  };

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      setError('Please add a comment explaining the status change');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update task status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Save comment to task_activities table
      const { error: activityError } = await supabase
        .from('task_activities')
        .insert({
          task_id: task.id,
          user_id: user.id,
          action: 'status_changed',
          from_status: task.status,
          to_status: selectedStatus,
          comment: comment.trim()
        });

      if (activityError) {
        console.error('Error saving activity:', activityError);
        // Don't throw error here as the task update was successful
      }

      // Create notification for the task assignee (if different from current user)
      if (task.assignee_id && task.assignee_id !== user.id) {
        try {
          const actionText = selectedStatus === 'Completed' ? 'completed' :
            selectedStatus === 'In Progress' ? 'started working on' :
              selectedStatus === 'Review' ? 'sent for review' :
                'updated';

          await createTaskNotification(
            task.assignee_id,
            task.id,
            task.title,
            'status_changed',
            `${user.user_metadata?.name || 'Someone'} ${actionText} the task "${task.title}"`,
            {
              new_status: selectedStatus,
              previous_status: task.status,
              updater_id: user.id,
              comment: comment.trim()
            }
          );
        } catch (notificationError) {
          console.error('Error creating task notification:', notificationError);
          // Continue even if notification fails
        }
      }

      onSuccess();
      onClose();

    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.icon : FiClock;
  };

  const StatusIcon = getStatusIcon(selectedStatus);

  if (!isOpen || !task) return null;

  // Safety check to prevent rendering issues
  if (!task.id || !task.title) {
    console.error('Invalid task data:', task);
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9998] pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-[9999] pointer-events-auto border dark:border-slate-800"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FiEdit2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Update Task</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modify task status and add comments</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-gray-400 dark:hover:text-white"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
            {/* Left Panel - Task Details & Status */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
              {/* Task Information */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h4>
                {task.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {task.assignee?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiUsers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {task.team?.name || 'No team'}
                    </span>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {format(parseISO(task.due_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Current: {task.status}</span>
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {statusOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isSelected = selectedStatus === option.value;

                    const getButtonClasses = () => {
                      if (isSelected) {
                        switch (option.value) {
                          case 'To Do': return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-700 dark:border-slate-500 shadow-lg';
                          case 'In Progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-700 dark:border-blue-500 shadow-lg';
                          case 'Review': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-700 dark:border-amber-500 shadow-lg';
                          case 'Completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-700 dark:border-green-500 shadow-lg';
                          default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-700 dark:border-slate-500 shadow-lg';
                        }
                      }
                      return 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md bg-white dark:bg-slate-900';
                    };

                    return (
                      <button
                        key={option.value}
                        className={`p-4 rounded-xl border-2 transition-all ${getButtonClasses()}`}
                        onClick={() => handleStatusChange(option.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <OptionIcon className={`w-5 h-5 ${isSelected ? 'text-current' : 'text-gray-400 dark:text-gray-500'}`} />
                          <div className="text-left">
                            <div className={`font-medium ${isSelected ? 'text-current' : 'text-gray-900 dark:text-white'}`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FiMessageSquare className="w-5 h-5 mr-2" />
                  Add Comment
                </h4>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain why you're changing the status..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-900/50 resize-none transition-all placeholder-gray-400"
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  <span>View History</span>
                </button>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" />
                        <span>Update Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Status Visualization */}
            <div className="w-full lg:w-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-t lg:border-l lg:border-t-0 border-gray-200 dark:border-slate-800">
              <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Preview</h4>

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg mb-4 border dark:border-slate-800">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selectedStatus === 'To Do' ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300' :
                      selectedStatus === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        selectedStatus === 'Review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          selectedStatus === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                      }`}>
                      <StatusIcon className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h5 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{selectedStatus}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {statusOptions.find(option => option.value === selectedStatus)?.description}
                    </p>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border dark:border-slate-800">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Workflow Progress</h5>
                  <div className="space-y-2">
                    {statusOptions.map((option, index) => {
                      const isCompleted = statusOptions.findIndex(opt => opt.value === selectedStatus) >= index;
                      const isCurrent = selectedStatus === option.value;
                      const OptionIcon = option.icon;

                      return (
                        <div key={option.value} className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                            ? isCurrent
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                              : 'bg-green-500 dark:bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 border dark:border-slate-700'
                            }`}>
                            {isCompleted ? (
                              isCurrent ? (
                                <OptionIcon className="w-4 h-4" />
                              ) : (
                                <FiCheckCircle className="w-4 h-4" />
                              )
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-sm ${isCurrent ? 'font-medium text-blue-600 dark:text-blue-400' :
                            isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
                            }`}>
                            {option.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task History Panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="absolute inset-0 bg-white dark:bg-slate-900 z-[10000]"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Task History</h3>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {taskHistory.map((history, index) => (
                      <div
                        key={history.id}
                        className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500 dark:border-blue-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{history.action}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(parseISO(history.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {history.from_status && history.to_status && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {history.from_status} → {history.to_status}
                          </div>
                        )}
                        {history.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{history.comment}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          by {history.user_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 