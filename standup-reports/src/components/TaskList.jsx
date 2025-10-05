import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, isToday, isTomorrow } from 'date-fns';
import { 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical, 
  FiCalendar, 
  FiUser, 
  FiUsers, 
  FiChevronUp, 
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiStar
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const getStatusColor = (status) => {
  switch (status) {
    case 'To Do':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Review':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getDueDateStatus = (dueDate) => {
  if (!dueDate) return { status: 'no-due-date', color: 'text-gray-400', icon: FiClock };
  
  const due = parseISO(dueDate);
  const now = new Date();
  
  if (isAfter(now, due)) {
    return { status: 'overdue', color: 'text-red-600', icon: FiAlertCircle };
  } else if (isToday(due)) {
    return { status: 'due-today', color: 'text-orange-600', icon: FiAlertCircle };
  } else if (isTomorrow(due)) {
    return { status: 'due-tomorrow', color: 'text-yellow-600', icon: FiClock };
  } else {
    return { status: 'upcoming', color: 'text-green-600', icon: FiCheckCircle };
  }
};

export default function TaskList({ 
  tasks, 
  onTaskUpdate, 
  onTaskEdit, 
  onTaskDelete,
  onTaskView
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Sort and filter tasks
  const processedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignee?.id === assigneeFilter;
      
      return matchesSearch && matchesStatus && matchesAssignee;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'assignee') {
        aValue = a.assignee?.name || '';
        bValue = b.assignee?.name || '';
      } else if (sortConfig.key === 'team') {
        aValue = a.team?.name || '';
        bValue = b.team?.name || '';
      }

      // Handle dates
      if (aValue && bValue && (sortConfig.key === 'due_date' || sortConfig.key === 'created_at')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [tasks, sortConfig, searchTerm, statusFilter, assigneeFilter]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === processedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(processedTasks.map(task => task.id)));
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    const updates = Array.from(selectedTasks).map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return onTaskUpdate({ ...task, status: newStatus });
    });

    try {
      await Promise.all(updates);
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error updating tasks:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.size} tasks?`)) {
      const deletions = Array.from(selectedTasks).map(taskId => {
        const task = tasks.find(t => t.id === taskId);
        return onTaskDelete(task);
      });

      try {
        await Promise.all(deletions);
        setSelectedTasks(new Set());
        setShowBulkActions(false);
      } catch (error) {
        console.error('Error deleting tasks:', error);
      }
    }
  };

  const SortableHeader = ({ column, label, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortConfig.key === column && (
          sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
        )}
      </div>
      {children}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {/* Removed status and assignee filter dropdowns */}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                className="px-3 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Update Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === processedTasks.length && processedTasks.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <SortableHeader column="title" label="Task">
                  <div className="text-xs text-gray-400 mt-1">Title & Description</div>
                </SortableHeader>
                <SortableHeader column="status" label="Status">
                  <div className="text-xs text-gray-400 mt-1">Current Status</div>
                </SortableHeader>
                <SortableHeader column="assignee" label="Assignee">
                  <div className="text-xs text-gray-400 mt-1">Assigned To</div>
                </SortableHeader>
                <SortableHeader column="team" label="Team">
                  <div className="text-xs text-gray-400 mt-1">Team</div>
                </SortableHeader>
                <SortableHeader column="due_date" label="Due Date">
                  <div className="text-xs text-gray-400 mt-1">Deadline</div>
                </SortableHeader>
                <SortableHeader column="created_at" label="Created">
                  <div className="text-xs text-gray-400 mt-1">Date Created</div>
                </SortableHeader>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {processedTasks.map((task, index) => {
                  const dueDateStatus = getDueDateStatus(task.due_date);
                  const DueDateIcon = dueDateStatus.icon;
                  
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      
                      {/* Task Title & Description */}
                      <td className="px-4 py-4 cursor-pointer hover:bg-gray-50" onClick={() => onTaskView?.(task)}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate hover:text-emerald-600 transition-colors">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {task.assignee.avatar_url ? (
                                <img 
                                  src={task.assignee.avatar_url} 
                                  alt={task.assignee.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <FiUser className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{task.assignee.name}</p>
                              <p className="text-xs text-gray-500">{task.assignee.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>

                      {/* Team */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {task.team ? (
                          <div className="flex items-center space-x-2">
                            <FiUsers className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{task.team.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No team</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {task.due_date ? (
                          <div className="flex items-center space-x-2">
                            <DueDateIcon className={`w-4 h-4 ${dueDateStatus.color}`} />
                            <span className={`text-sm ${dueDateStatus.color}`}>
                              {format(parseISO(task.due_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No due date</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(task.created_at), 'MMM dd, yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onTaskView?.(task)}
                            className="text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                            title="View task details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onTaskEdit(task)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            title="Edit task"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onTaskDelete(task)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
                            title="Delete task"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {processedTasks.length === 0 && (
          <div className="text-center py-12">
            <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || assigneeFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating a new task.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {processedTasks.length} of {tasks.length} tasks
          </span>
          <div className="flex items-center space-x-4">
            <span>To Do: {tasks.filter(t => t.status === 'To Do').length}</span>
            <span>In Progress: {tasks.filter(t => t.status === 'In Progress').length}</span>
            <span>Review: {tasks.filter(t => t.status === 'Review').length}</span>
            <span>Completed: {tasks.filter(t => t.status === 'Completed').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 