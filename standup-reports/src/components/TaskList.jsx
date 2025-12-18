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
  FiStar,
  FiActivity
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

      if (aValue && bValue && (sortConfig.key === 'due_date' || sortConfig.key === 'created_at')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numbers (efforts)
      if (sortConfig.key === 'efforts_in_days') {
        aValue = aValue || 0;
        bValue = bValue || 0;
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
      className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors group"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-2">
        <span>{label}</span>
        {sortConfig.key === column && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            {sortConfig.direction === 'asc' ? <FiChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <FiChevronDown className="w-3.5 h-3.5 text-indigo-500" />}
          </motion.div>
        )}
      </div>
      {children}
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Search & Bulk Actions Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Bulk Actions (Left) */}
        <AnimatePresence>
          {selectedTasks.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-4"
            >
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {selectedTasks.size} Selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                  className="bg-white/80 dark:bg-slate-800/80 border border-indigo-500/20 dark:border-indigo-400/20 text-xs font-bold py-1.5 px-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-slate-200"
                >
                  <option value="">Status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Selected"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>

      {/* Tasks Table Container */}
      <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50/50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800/60">
              <tr>
                <th className="px-6 py-5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === processedTasks.length && processedTasks.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-indigo-500 focus:ring-indigo-500/20"
                  />
                </th>
                <SortableHeader column="title" label="Task">
                  <span className="block text-[10px] opacity-40 lowercase font-medium">title & description</span>
                </SortableHeader>
                <SortableHeader column="status" label="Status" />
                <SortableHeader column="assignee" label="Assignee" />
                <SortableHeader column="team" label="Team" />
                <SortableHeader column="due_date" label="Due Date" />
                <SortableHeader column="efforts_in_days" label="Effort" />
                <SortableHeader column="created_at" label="Created" />
                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
              <AnimatePresence>
                {processedTasks.map((task, index) => {
                  const dueDateStatus = getDueDateStatus(task.due_date);
                  const DueDateIcon = dueDateStatus.icon;

                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-300"
                    >
                      <td className="px-6 py-5">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-indigo-500 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Task Title & Description */}
                      <td className="px-6 py-5 cursor-pointer max-w-md" onClick={() => onTaskView?.(task)}>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-slate-500 line-clamp-1 italic">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(task.status)} dark:bg-white/5`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${task.status === 'Completed' ? 'bg-emerald-500' :
                            task.status === 'In Progress' ? 'bg-blue-500' :
                              task.status === 'Review' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                          {task.status}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-indigo-500 rounded-lg blur-md opacity-20" />
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                                {task.assignee.avatar_url ? (
                                  <img
                                    src={task.assignee.avatar_url}
                                    alt={task.assignee.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiUser className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{task.assignee.name}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-medium">{task.assignee.role || 'Member'}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 dark:text-slate-600 uppercase italic">Unassigned</span>
                        )}
                      </td>

                      {/* Team */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {task.team ? (
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                              <FiUsers className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{task.team.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">---</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {task.due_date ? (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${dueDateStatus.status === 'overdue' ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/50 dark:border-rose-500/20' :
                            'bg-gray-50/50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-700/50'
                            }`}>
                            <DueDateIcon className={`w-3.5 h-3.5 ${dueDateStatus.color}`} />
                            <span className={`text-[11px] font-bold ${dueDateStatus.color} uppercase tracking-tighter`}>
                              {format(parseISO(task.due_date), 'MMM dd')}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-[11px] font-bold text-gray-400 dark:text-slate-600 uppercase`}>no deadline</span>
                        )}
                      </td>

                      {/* Effort */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {task.efforts_in_days ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
                            <FiActivity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                              {task.efforts_in_days}d
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-600 uppercase">--</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-5 whitespace-nowrap text-[11px] font-medium text-gray-400 dark:text-slate-500 tabular-nums">
                        {format(parseISO(task.created_at), 'MMM dd, yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onTaskView?.(task)}
                            className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onTaskEdit(task)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onTaskDelete(task)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </motion.button>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white/5 dark:bg-transparent"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse" />
              <div className="relative p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-white/20 shadow-inner">
                <FiSearch className="h-10 w-10 text-slate-400" />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">No tasks matched your search</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
              We couldn't find any tasks with those filters. Try searching for a different title or task ID.
            </p>
          </motion.div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-10 py-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
            {processedTasks.length} {processedTasks.length === 1 ? 'Task' : 'Tasks'} tracked
          </span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { label: 'To Do', count: tasks.filter(t => t.status === 'To Do').length, color: 'bg-slate-400' },
            { label: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, color: 'bg-blue-500' },
            { label: 'Review', count: tasks.filter(t => t.status === 'Review').length, color: 'bg-amber-500' },
            { label: 'Done', count: tasks.filter(t => t.status === 'Completed').length, color: 'bg-emerald-500' }
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${stat.color}`} />
              <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-tighter">
                {stat.label}: <span className="text-gray-900 dark:text-white ml-0.5">{stat.count}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
