import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCalendar,
  FiTarget,
  FiPlay,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiBarChart2,
  FiClock,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import {
  getSprintStatus,
  getSprintMetrics,
  formatSprintDates,
  getRemainingDays,
  canStartSprint,
  canCompleteSprint,
  getHealthColor
} from '../../utils/sprintUtils';
import SprintAnalytics from './SprintAnalytics';
import TaskCard from '../TaskCard';

const statusColumns = [
  {
    id: 'To Do',
    label: 'To Do',
    color: 'gray',
    icon: FiClock,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  {
    id: 'In Progress',
    label: 'In Progress',
    color: 'blue',
    icon: FiTrendingUp,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'Review',
    label: 'Review',
    color: 'amber',
    icon: FiAlertCircle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    id: 'Completed',
    label: 'Completed',
    color: 'green',
    icon: FiCheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
];

const SprintDetailView = ({
  sprint,
  isOpen,
  onClose,
  onUpdate,
  onEdit,
  onStart,
  onComplete,
  onAddTasks,
  userRole
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board'); // 'board' or 'analytics'
  const [draggingTask, setDraggingTask] = useState(null);

  const sprintStatus = getSprintStatus(sprint);
  const metrics = getSprintMetrics(sprint, tasks);
  const healthColor = getHealthColor(metrics.health);

  // Fetch tasks for this sprint
  useEffect(() => {
    if (sprint && isOpen) {
      fetchSprintTasks();
    }
  }, [sprint, isOpen]);

  const fetchSprintTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, due_date, created_at, updated_at,
          assignee:team_members_view!assignee_id(
            id, name, email
          ),
          reporter:team_members_view!reporter_id(
            id, name
          )
        `)
        .eq('sprint_id', sprint.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching sprint tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // Notify parent to refresh
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      'Planning': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      'Active': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      'Completed': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
      'Overdue': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    };
    return badges[status] || badges['Planning'];
  };

  const statusBadge = getStatusBadge(sprintStatus);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={onClose}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-colors"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">{sprint.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                    {sprintStatus}
                  </span>
                </div>
                <p className="text-white text-opacity-90 text-sm ml-11">{sprint.goal || 'No goal set'}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Sprint Info Bar */}
            <div className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white">
                  <FiCalendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{formatSprintDates(sprint)}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <FiClock className="w-4 h-4" />
                  <span className="text-sm font-medium">{getRemainingDays(sprint)} days left</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <FiTarget className="w-4 h-4" />
                  <span className="text-sm font-medium">{metrics.totalTasks} tasks</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{Math.round(metrics.completionRate)}% complete</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {userRole === 'manager' && (
                  <>
                    {canStartSprint(sprint, tasks) && onStart && (
                      <motion.button
                        onClick={() => onStart(sprint.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiPlay className="w-4 h-4" />
                        Start Sprint
                      </motion.button>
                    )}
                    {canCompleteSprint(sprint, tasks) && onComplete && (
                      <motion.button
                        onClick={() => onComplete(sprint.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiCheck className="w-4 h-4" />
                        Complete Sprint
                      </motion.button>
                    )}
                    {onEdit && (
                      <motion.button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 text-white rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setView('board')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'board'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiTarget className="w-4 h-4" />
                    Task Board
                  </div>
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiBarChart2 className="w-4 h-4" />
                    Analytics
                  </div>
                </button>
              </div>

              {view === 'board' && userRole === 'manager' && onAddTasks && (
                <motion.button
                  onClick={onAddTasks}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus className="w-4 h-4" />
                  Add Tasks
                </motion.button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading sprint data...</span>
                </div>
              </div>
            ) : view === 'board' ? (
              tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <FiTarget className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">No tasks in this sprint</h3>
                  <p className="text-sm mb-4">Add tasks to get started with your sprint</p>
                  {userRole === 'manager' && onAddTasks && (
                    <motion.button
                      onClick={onAddTasks}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Tasks to Sprint
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statusColumns.map((column) => {
                    const columnTasks = tasks.filter(task => task.status === column.id);
                    const Icon = column.icon;

                    return (
                      <div key={column.id} className="flex flex-col">
                        <div className={`${column.bgColor} border ${column.borderColor} rounded-lg p-3 mb-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 text-${column.color}-600`} />
                              <h3 className="font-semibold text-gray-900">{column.label}</h3>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-${column.color}-700 bg-${column.color}-100`}>
                              {columnTasks.length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          {columnTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                              draggable
                              onDragStart={() => setDraggingTask(task)}
                              onDragEnd={() => setDraggingTask(null)}
                            >
                              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>
                              {task.assignee && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                                    {task.assignee.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{task.assignee.name}</span>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                  <FiCalendar className="w-3 h-3" />
                                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </motion.div>
                          ))}

                          {/* Drop zone for drag and drop */}
                          {draggingTask && draggingTask.status !== column.id && (
                            <div
                              className={`border-2 border-dashed ${column.borderColor} rounded-lg p-4 text-center text-gray-400 text-sm`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggingTask) {
                                  handleTaskStatusChange(draggingTask.id, column.id);
                                  setDraggingTask(null);
                                }
                              }}
                            >
                              Drop here to move to {column.label}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <SprintAnalytics sprint={sprint} tasks={tasks} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SprintDetailView;
