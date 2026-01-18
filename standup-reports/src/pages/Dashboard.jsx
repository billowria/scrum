import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import notificationService from '../services/notificationService';
import {
  FiBriefcase, FiActivity, FiUsers, FiPlus,
  FiArrowRight, FiTarget, FiLayers, FiExternalLink,
  FiUserPlus, FiClock,
  FiCalendar, FiFileText, FiAward, FiBarChart2, FiMessageSquare,
  FiCheckCircle, FiStar, FiAlertCircle, FiEdit3, FiBell
} from 'react-icons/fi';
import UserProfileInfoModal from '../components/UserProfileInfoModal';
import UserListModal from '../components/UserListModal';
import TaskDetailView from '../components/tasks/TaskDetailView';
import HolidaysWidget from '../components/dashboard/HolidaysWidget';
import LoadingSpinner from '../components/shared/LoadingSpinner';


// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

// --- Reusable Components ---

// 1. Compact Projects Widget - Simplified for 1-column layout
const CompactProjectsWidget = ({ projects, loading, navigate }) => {
  const activeProjects = projects.filter(p => p.status === 'active');

  const getPriorityConfig = (idx) => {
    const priorities = [
      { label: 'Critical', color: 'red', gradient: 'from-red-500 to-rose-500' },
      { label: 'High', color: 'orange', gradient: 'from-orange-500 to-amber-500' },
      { label: 'Medium', color: 'blue', gradient: 'from-blue-500 to-indigo-500' },
      { label: 'Low', color: 'gray', gradient: 'from-gray-500 to-slate-500' }
    ];
    return priorities[idx % priorities.length];
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30"
    >
      {/* Compact Header */}
      <div className="p-5 border-b border-indigo-100/50 dark:border-slate-700 bg-gradient-to-r from-indigo-50/30 via-white to-transparent dark:from-slate-800/50 dark:via-slate-800 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Projects</h3>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{activeProjects.length} active</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            aria-label="View all projects"
            className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-all"
          >
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner scale={0.6} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeProjects.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeProjects.slice(0, 5).map((project, idx) => {
                  const priority = getPriorityConfig(idx);
                  const progress = Math.floor(Math.random() * 40) + 30;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group p-4 hover:bg-indigo-50/50 cursor-pointer transition-all relative"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${priority.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${priority.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {project.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                              {project.name}
                            </h4>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${priority.color}-50 text-${priority.color}-700 ml-2`}>
                              {priority.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span>Progress: {progress}%</span>
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {Math.floor(Math.random() * 15) + 5}d
                            </span>
                          </div>

                          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${priority.gradient} rounded-full`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <FiBriefcase className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No active projects</p>
              </div>
            )}
          </div>
        )
      }
    </motion.div >
  );
};

// 1A. Assigned Tasks Widget - Show user's incomplete tasks
const AssignedTasksWidget = ({ tasks = [], loading, currentUserId, onTaskClick, navigate }) => {
  const incompleteTasks = tasks.filter(t => t.status !== 'Completed');

  const getStatusStyle = (status) => {
    switch (status) {
      case 'To Do': return { border: 'border-l-gray-400', bg: 'bg-gray-50/30', dot: 'bg-gray-400', text: 'text-gray-600' };
      case 'In Progress': return { border: 'border-l-blue-400', bg: 'bg-blue-50/30', dot: 'bg-blue-400', text: 'text-blue-600' };
      case 'Review': return { border: 'border-l-amber-400', bg: 'bg-amber-50/30', dot: 'bg-amber-400', text: 'text-amber-600' };
      default: return { border: 'border-l-gray-400', bg: 'bg-gray-50/30', dot: 'bg-gray-400', text: 'text-gray-600' };
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return { icon: '🔴', color: 'text-red-600' };
      case 'high': return { icon: '🟠', color: 'text-orange-600' };
      case 'medium': return { icon: '🟡', color: 'text-yellow-600' };
      default: return { icon: null, color: 'text-gray-600' };
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/30"
    >
      {/* Header */}
      {/* Header */}
      <div className="p-5 border-b border-amber-100/50 dark:border-slate-700 bg-gradient-to-r from-amber-50/30 via-white to-transparent dark:from-slate-800/50 dark:via-slate-800 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-500/20">
              <FiTarget className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">My Tasks</h3>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {incompleteTasks.length} pending
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate ? navigate('/tasks') : window.location.href = '/tasks'}
            aria-label="View all tasks"
            className="w-8 h-8 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 transition-all"
          >
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner scale={0.6} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {incompleteTasks.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {incompleteTasks.slice(0, 8).map((task, idx) => {
                  const statusStyle = getStatusStyle(task.status);
                  const priorityInfo = getPriorityIcon(task.priority);

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group p-4 hover:bg-gray-100/70 cursor-pointer transition-all relative border-l-2 rounded-r-lg mb-2 mx-2 ${statusStyle.border}`}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 pr-2">
                              {task.title}
                            </h4>
                            <span className="text-xs flex-shrink-0">{priorityInfo.icon}</span>
                          </div>

                          {/* Project Name */}
                          {task.project_name && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <FiBriefcase className="w-3 h-3 mr-1" />
                                {task.project_name}
                              </span>
                            </div>
                          )}

                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}

                          {/* Status, Comments, and Due Date */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                {task.status}
                              </span>

                              {/* Comments indicator */}
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <FiMessageSquare className="w-3 h-3" />
                                <span>{task.comments_count}</span>
                              </div>
                            </div>

                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <FiClock className="w-3 h-3" />
                                <span>{formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Professional icon on hover */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <FiTarget className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No pending tasks</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        )
      }
    </motion.div >
  );
};


// 2. Modern Task Progress - Donut Chart with Rich Stats
const TaskAnalyticsWidget = ({ taskStats, loading, navigate }) => {
  const total = taskStats.total || 1;
  const completionRate = Math.round((taskStats.completed / total) * 100) || 0;

  // Calculate percentages for each status
  const completedPercent = Math.round((taskStats.completed / total) * 100);
  const inProgressPercent = Math.round((taskStats.inProgress / total) * 100);
  const todoPercent = Math.round((taskStats.todo / total) * 100);

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30"
    >
      {/* Header */}
      <div className="p-5 border-b border-emerald-100/50 dark:border-slate-700 bg-gradient-to-r from-emerald-50/30 via-white to-transparent dark:from-slate-800/50 dark:via-slate-800 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur opacity-20"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Analytics</h3>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Monthly breakdown</p>
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner scale={0.6} />
          </div>
        ) : (
          <div className="flex-1 p-5 flex flex-col">
            {/* Donut Chart with Center Stats */}
            <div className="flex justify-center mb-5">
              <div className="relative w-40 h-40">
                {/* SVG Donut Chart */}
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  {/* Completed segment (green) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#gradient-completed)"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={439.82}
                    strokeDashoffset={439.82 - (439.82 * completionRate) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="gradient-completed" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative">
                    <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {completionRate}%
                    </span>
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-30"></div>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mt-1">Complete</span>
                </div>
              </div>
            </div>

            {/* Detailed Stats Cards */}
            <div className="space-y-2 mb-4 flex-1">
              {/* Completed */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 block">Completed</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{completedPercent}% of total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{taskStats.completed}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 block">tasks</span>
                  </div>
                </div>
              </motion.div>

              {/* In Progress */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                      <FiActivity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 block">In Progress</span>
                      <span className="text-[10px] text-blue-600 font-bold">{inProgressPercent}% of total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{taskStats.inProgress}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 block">tasks</span>
                  </div>
                </div>
              </motion.div>

              {/* To Do */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-slate-400 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-slate-400 flex items-center justify-center shadow-md">
                      <FiLayers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 block">To Do</span>
                      <span className="text-[10px] text-gray-600 dark:text-slate-400 font-bold">{todoPercent}% of total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{taskStats.todo}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 block">tasks</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/tasks')}
              className="group w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="text-sm">Open Task Board</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )
      }
    </motion.div >
  );
};

const TeamPulseWidget = ({ teamMembers, loading, navigate, userTeamId, onAvatarClick, onStartChat, missingReportIds = [] }) => {
  const myTeamMembers = teamMembers.filter(member => member.team_id === userTeamId);
  const [leaveStatus, setLeaveStatus] = useState({});
  const [loadingLeave, setLoadingLeave] = useState(true);

  useEffect(() => {
    fetchLeaveStatus();
  }, [myTeamMembers]);

  const fetchLeaveStatus = async () => {
    if (myTeamMembers.length === 0) {
      setLoadingLeave(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: leaveData, error } = await supabase
        .from('leave_plans')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) throw error;

      const onLeaveIds = (leaveData || []).map(l => l.user_id);
      const statusMap = {};
      myTeamMembers.forEach(member => {
        statusMap[member.id] = onLeaveIds.includes(member.id);
      });
      setLeaveStatus(statusMap);
    } catch (error) {
      console.error('Error fetching leave status:', error);
    } finally {
      setLoadingLeave(false);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-200 dark:hover:border-purple-500/30"
    >
      <div className="p-5 border-b border-purple-100/50 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-purple-50/30 to-white dark:from-slate-800/50 dark:to-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100 dark:border-purple-500/20">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Team Pulse</h3>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{myTeamMembers.length} members</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/team-management')}
          aria-label="Manage team"
          className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 transition-all"
        >
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading || loadingLeave ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner scale={0.6} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-2">
            {myTeamMembers.map((member, idx) => {
              const isOnLeave = leaveStatus[member.id] || false;
              const hasMissingReport = missingReportIds.includes(member.id) && !isOnLeave;

              const roleColors = {
                manager: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                admin: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
                member: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700'
              };

              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all border border-transparent hover:border-purple-100 group">
                  {/* Clickable Avatar */}
                  <motion.div
                    className="relative cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAvatarClick?.(member.id)}
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 flex items-center justify-center font-bold border border-purple-200 shadow-sm text-sm">
                        {member.name?.[0]}
                      </div>
                    )}
                    {/* Leave Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isOnLeave ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  </motion.div>

                  {/* Clickable Name */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onAvatarClick?.(member.id)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{member.name}</h4>
                      {/* Missing Report Indicator - Expandable on hover */}
                      {hasMissingReport && (
                        <motion.div
                          className="relative px-1 py-0.5 rounded-full cursor-default overflow-hidden"
                          variants={{
                            idle: { backgroundColor: 'transparent' },
                            hover: { backgroundColor: 'transparent' }
                          }}
                          initial="idle"
                          animate="idle"
                          whileHover="hover"
                          title="Report Missing"
                        >
                          {/* Background that appears on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 rounded-full"
                            variants={{
                              idle: { opacity: 0, scale: 0.8 },
                              hover: { opacity: 1, scale: 1 }
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          />
                          {/* Shimmer effect - only on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                            variants={{
                              idle: { opacity: 0 },
                              hover: { opacity: 1, x: ['-100%', '100%'] }
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <div className="relative flex items-center gap-0.5">
                            <motion.div
                              variants={{
                                idle: { color: '#ef4444' },
                                hover: { color: '#ffffff' }
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            </motion.div>
                            {/* Expandable label on hover */}
                            <motion.span
                              className="overflow-hidden whitespace-nowrap text-[9px] font-semibold text-white inline-block align-middle"
                              variants={{
                                idle: { width: 0, opacity: 0, marginLeft: 0 },
                                hover: { width: 'auto', opacity: 1, marginLeft: 2, marginRight: 2 }
                              }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                              Missing
                            </motion.span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${roleColors[member.role || 'member']}`}>
                        {member.role || 'member'}
                      </span>
                      {/* Status Indicator - Expandable on hover */}
                      <motion.div
                        className="relative px-1 py-0.5 rounded-full cursor-default overflow-hidden"
                        variants={{
                          idle: { backgroundColor: 'transparent' },
                          hover: { backgroundColor: 'transparent' }
                        }}
                        initial="idle"
                        animate="idle"
                        whileHover="hover"
                        title={isOnLeave ? 'On Leave' : 'Available'}
                      >
                        {/* Background that appears on hover */}
                        <motion.div
                          className={`absolute inset-0 rounded-full ${isOnLeave
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                            : 'bg-gradient-to-r from-emerald-400 to-green-400'
                            }`}
                          variants={{
                            idle: { opacity: 0, scale: 0.8 },
                            hover: { opacity: 1, scale: 1 }
                          }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        />
                        {/* Shimmer effect - only on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                          variants={{
                            idle: { opacity: 0 },
                            hover: { opacity: 1, x: ['-100%', '100%'] }
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                        />
                        <div className="relative flex items-center gap-0.5">
                          <motion.div
                            variants={{
                              idle: { color: isOnLeave ? '#f59e0b' : '#10b981' },
                              hover: { color: '#ffffff' }
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            {isOnLeave ? (
                              <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                          </motion.div>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[9px] font-semibold text-white inline-block align-middle"
                            variants={{
                              idle: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 2, marginRight: 2 }
                            }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                          >
                            {isOnLeave ? 'Leave' : 'Available'}
                          </motion.span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Chat Button */}
                  <motion.button
                    className="p-2 hover:bg-white rounded-lg text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:shadow-sm border border-transparent hover:border-purple-100 opacity-0 group-hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartChat?.(member)}
                    aria-label={`Start chat with ${member.name}`}
                  >
                    <FiMessageSquare className="w-4 h-4" />
                  </motion.button>
                </div>
              );
            })}
            {myTeamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-xs">No team members in your team</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Simplified Clock Component ---
const LiveClock = React.memo(({ theme }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white';
  const subTextColor = theme === 'light' ? 'text-slate-500' : 'text-white/60';

  return (
    <div className="text-right">
      <div className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${textColor}`}>
        {format(time, 'HH:mm')}
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-wide ${subTextColor}`}>
        {format(time, 'EEE, MMM d')}
      </div>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// --- Theme-Aware Glassmorphic Header ---
const DashboardHeader = ({
  userName,
  userAvatarUrl,
  isUserOnLeave = false,
  teamName,
  availableMembers = [],
  onLeaveMembers = [],
  onOpenUserList,
  onCreateReport,
  hasSubmittedToday,
  subscription = null,
  navigate,
  theme = 'dark',
  themeMode = 'dark'
}) => {
  // Theme-aware glassmorphic styles
  const getGlassStyles = () => {
    const baseGlass = 'backdrop-blur-xl border-b';

    const themeStyles = {
      light: `${baseGlass} bg-white/80 border-slate-200/60`,
      dark: `${baseGlass} bg-slate-900/70 border-white/10`,
      space: `${baseGlass} bg-slate-900/60 border-purple-500/20`,
      ocean: `${baseGlass} bg-slate-900/60 border-cyan-500/20`,
      forest: `${baseGlass} bg-slate-900/60 border-emerald-500/20`,
    };

    return themeStyles[themeMode] || themeStyles.dark;
  };

  // Theme accent colors
  const getAccentColor = () => {
    const accents = {
      light: 'from-indigo-500 to-purple-600',
      dark: 'from-indigo-400 to-purple-500',
      space: 'from-purple-400 to-fuchsia-500',
      ocean: 'from-cyan-400 to-blue-500',
      forest: 'from-emerald-400 to-green-500',
    };
    return accents[themeMode] || accents.dark;
  };

  const isLight = theme === 'light';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-600' : 'text-white/70';
  const textMuted = isLight ? 'text-slate-500' : 'text-white/50';

  return (
    <header className={`sticky top-0 z-40 w-full ${getGlassStyles()}`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px] gap-4">

          {/* Left Section: User Identity */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            {/* Avatar with Status */}
            <div className="relative">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  className={`w-11 h-11 rounded-xl object-cover ring-2 shadow-lg ${isLight ? 'ring-slate-200' : 'ring-white/20'
                    }`}
                />
              ) : (
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAccentColor()} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {userName?.charAt(0) || 'U'}
                </div>
              )}
              {/* Status Indicator */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 shadow-sm ${isLight ? 'border-white' : 'border-slate-900'
                  } ${isUserOnLeave ? 'bg-amber-500' : 'bg-emerald-500'}`}
              />
            </div>

            {/* Name & Team */}
            <div className="hidden sm:flex flex-col min-w-0">
              <h2 className={`text-base font-bold truncate ${textPrimary}`}>
                {userName}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium truncate ${textSecondary}`}>
                  {teamName || 'No Team'}
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${isUserOnLeave
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                  {isUserOnLeave ? 'Away' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Center Section: Team Stats (Desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => onOpenUserList?.('available')}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isLight
                ? 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'
                : 'hover:bg-emerald-500/10 text-white/70 hover:text-emerald-400'
                }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold">{availableMembers.length}</span>
              <span className="text-xs font-medium">Online</span>
            </button>

            <div className={`w-px h-5 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

            <button
              onClick={() => onOpenUserList?.('onLeave')}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isLight
                ? 'hover:bg-amber-50 text-slate-600 hover:text-amber-600'
                : 'hover:bg-amber-500/10 text-white/70 hover:text-amber-400'
                }`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold">{onLeaveMembers.length}</span>
              <span className="text-xs font-medium">Away</span>
            </button>
          </div>

          {/* Right Section: Clock, Subscription & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">

            {/* Subscription Badge */}
            <button
              onClick={() => navigate?.('/subscription')}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isLight
                ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
            >
              <FiStar className={`w-4 h-4 ${subscription?.plan?.name === 'Pro'
                ? 'text-amber-500 fill-amber-500'
                : textMuted
                }`} />
              <span className={`text-xs font-bold ${textSecondary}`}>
                {subscription?.plan?.name || 'Free'}
              </span>
            </button>

            {/* Live Clock */}
            <div className="hidden sm:block">
              <LiveClock theme={theme} />
            </div>

            {/* Create Report Button */}
            {!hasSubmittedToday && (
              <motion.button
                onClick={onCreateReport}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all ${themeMode === 'ocean'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/25'
                  : themeMode === 'forest'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-emerald-500/25'
                    : themeMode === 'space'
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:shadow-purple-500/25'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/25'
                  } text-white`}
              >
                <FiEdit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
              </motion.button>
            )}

            {/* Mobile: Team count button */}
            <button
              onClick={() => onOpenUserList?.('available')}
              className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${isLight
                ? 'bg-slate-100 text-slate-600'
                : 'bg-white/10 text-white/70'
                }`}
            >
              <FiUsers className="w-4 h-4" />
              <span className="text-xs font-bold">{availableMembers.length + onLeaveMembers.length}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};









const HeroActionTile = ({ action, index }) => {
  const { isAnimatedTheme } = useTheme();

  // Map theme colors to specific Tailwind classes - using gradient colors for text
  const themeStyles = {
    violet: {
      hoverBg: 'hover:bg-violet-50',
      hoverBorder: 'hover:border-violet-200 dark:hover:border-violet-400',
      titleColor: 'group-hover:!text-violet-600 dark:group-hover:!text-violet-400',
      descColor: 'group-hover:!text-violet-500 dark:group-hover:!text-violet-300',
      arrowBg: 'group-hover:bg-violet-100 dark:group-hover:bg-violet-900',
      arrowColor: 'group-hover:text-violet-600 dark:group-hover:text-violet-300',
      premiumBorder: 'border-violet-500/20'
    },
    amber: {
      hoverBg: 'hover:bg-amber-50',
      hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-400',
      titleColor: 'group-hover:!text-amber-600 dark:group-hover:!text-amber-400',
      descColor: 'group-hover:!text-amber-500 dark:group-hover:!text-amber-300',
      arrowBg: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900',
      arrowColor: 'group-hover:text-amber-600 dark:group-hover:text-amber-300',
      premiumBorder: 'border-amber-500/20'
    },
    blue: {
      hoverBg: 'hover:bg-blue-50',
      hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-400',
      titleColor: 'group-hover:!text-blue-600 dark:group-hover:!text-blue-400',
      descColor: 'group-hover:!text-blue-500 dark:group-hover:!text-blue-300',
      arrowBg: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900',
      arrowColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-300',
      premiumBorder: 'border-blue-500/20'
    },
    emerald: {
      hoverBg: 'hover:bg-emerald-50',
      hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-400',
      titleColor: 'group-hover:!text-emerald-600 dark:group-hover:!text-emerald-400',
      descColor: 'group-hover:!text-emerald-500 dark:group-hover:!text-emerald-300',
      arrowBg: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900',
      arrowColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
      premiumBorder: 'border-emerald-500/20'
    },
    cyan: {
      hoverBg: 'hover:bg-cyan-50',
      hoverBorder: 'hover:border-cyan-200 dark:hover:border-cyan-400',
      titleColor: 'group-hover:!text-cyan-600 dark:group-hover:!text-cyan-400',
      descColor: 'group-hover:!text-cyan-500 dark:group-hover:!text-cyan-300',
      arrowBg: 'group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900',
      arrowColor: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-300',
      premiumBorder: 'border-cyan-500/20'
    },
    pink: {
      hoverBg: 'hover:bg-pink-50',
      hoverBorder: 'hover:border-pink-200 dark:hover:border-pink-400',
      titleColor: 'group-hover:!text-pink-600 dark:group-hover:!text-pink-400',
      descColor: 'group-hover:!text-pink-500 dark:group-hover:!text-pink-300',
      arrowBg: 'group-hover:bg-pink-100 dark:group-hover:bg-pink-900',
      arrowColor: 'group-hover:text-pink-600 dark:group-hover:text-pink-300',
      premiumBorder: 'border-pink-500/20'
    },
    red: {
      hoverBg: 'hover:bg-red-50',
      hoverBorder: 'hover:border-red-200 dark:hover:border-red-400',
      titleColor: 'group-hover:!text-red-600 dark:group-hover:!text-red-400',
      descColor: 'group-hover:!text-red-500 dark:group-hover:!text-red-300',
      arrowBg: 'group-hover:bg-red-100 dark:group-hover:bg-red-900',
      arrowColor: 'group-hover:text-red-600 dark:group-hover:text-red-300',
      premiumBorder: 'border-red-500/20'
    }
  };

  const style = themeStyles[action.theme] || themeStyles.blue;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={action.onClick}
      className={`group relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 ${isAnimatedTheme ? style.premiumBorder : 'border-transparent'} shadow-sm transition-all duration-300 text-left h-full flex flex-col justify-between ${style.hoverBg} dark:hover:bg-slate-700 ${style.hoverBorder}`}
    >
      <div className="flex justify-between items-start mb-4">
        {/* Animated Icon Container */}
        <motion.div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg relative z-10`}
          variants={{
            hover: {
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.4 }
            }
          }}
        >
          <action.icon className="w-7 h-7" />
        </motion.div>

        {/* Arrow Icon */}
        <motion.div
          className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-300 dark:text-slate-400 transition-colors duration-300 ${style.arrowBg} ${style.arrowColor}`}
          variants={{
            hover: { x: 5 }
          }}
        >
          <FiArrowRight className="w-4 h-4 transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <h3 className={`text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300 ${style.titleColor}`}>
          {action.label}
        </h3>
        <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 ${style.descColor}`}>
          {action.desc}
        </p>
      </div>

      {/* Decorative Background Blob */}
      <motion.div
        className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20 ${style.titleColor.replace('text-', 'bg-')}`}
        variants={{
          hover: { scale: 1.5 }
        }}
      />
    </motion.button>
  );
};
const QuickActionsHero = ({ navigate, userRole }) => {
  const { isAnimatedTheme } = useTheme();

  const actions = [
    {
      label: 'Team Chat',
      icon: FiMessageSquare,
      gradient: 'from-violet-500 to-purple-600',
      theme: 'violet',
      onClick: () => navigate('/chat'),
      desc: 'Direct messages & groups'
    },
    {
      label: 'My Notes',
      icon: FiFileText,
      gradient: 'from-amber-400 to-orange-500',
      theme: 'amber',
      onClick: () => navigate('/notes'),
      desc: 'Personal scratchpad'
    },
    {
      label: 'Sprint Board',
      icon: FiLayers,
      gradient: 'from-blue-500 to-indigo-600',
      theme: 'blue',
      onClick: () => navigate('/tasks'),
      desc: 'Track sprint tasks'
    },
    {
      label: 'Standup Reports',
      icon: FiEdit3,
      gradient: 'from-emerald-400 to-teal-500',
      theme: 'emerald',
      onClick: () => navigate('/standup-reports'),
      desc: 'Daily status updates'
    },
    {
      label: 'Holidays',
      icon: FiCalendar,
      gradient: 'from-pink-500 to-rose-500',
      theme: 'pink',
      onClick: () => navigate('/leave-calendar'),
      desc: 'View team calendar'
    },
    {
      label: 'Projects',
      icon: FiBriefcase,
      gradient: 'from-cyan-400 to-blue-500',
      theme: 'cyan',
      onClick: () => navigate('/projects'),
      desc: 'Manage initiatives'
    },
    {
      label: 'Analytics',
      icon: FiBarChart2,
      gradient: 'from-indigo-400 to-purple-500',
      theme: 'violet',
      onClick: () => navigate('/analytics-dashboard'),
      desc: 'Performance metrics'
    },
    {
      label: 'Achievements',
      icon: FiAward,
      gradient: 'from-orange-400 to-red-500',
      theme: 'red',
      onClick: () => navigate('/achievements'),
      desc: 'Badges & rewards'
    }
  ];

  if (userRole === 'manager' || userRole === 'admin') {
    actions.splice(4, 0, { // Insert after Holidays
      label: 'Manage Users',
      icon: FiUserPlus,
      gradient: 'from-red-500 to-orange-600',
      theme: 'red',
      onClick: () => navigate('/team-management'),
      desc: 'Administer team'
    });
  }

  const scrollRef = React.useRef(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 relative">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
        <h2 className={`text-xl font-bold ${isAnimatedTheme ? '!text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>Quick Actions</h2>
      </div>

      {/* Scrollable Container with CSS Mask for Glassmorphism */}
      <div
        className="relative group/scroll-container w-full max-w-[90vw] overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
        }}
      >
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-8 pt-4 px-4 snap-x scroll-smooth hide-scrollbar w-full"
        >
          {actions.map((action, index) => (
            <div key={index} className="flex-none w-[200px] md:w-[220px] snap-start">
              <HeroActionTile action={action} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Sleek Scroll Indicator */}
      <div className="flex justify-center mt-2 mb-8">
        <motion.button
          onClick={scrollRight}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover="hover"
          className="flex items-center gap-4 group cursor-pointer"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 group-hover:text-indigo-400 transition-colors duration-300">
            Scroll for more
          </span>

          <div className="flex items-center">
            <div className="w-8 h-[1px] bg-indigo-500/40 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <motion.div
              className="text-indigo-400/80 group-hover:text-indigo-400 ml-2"
              variants={{
                hover: { x: [0, 5, 0], transition: { duration: 0.8, repeat: Infinity } }
              }}
            >
              <FiArrowRight size={14} />
            </motion.div>
          </div>
        </motion.button>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};


// --- Main Dashboard Component ---

export default function Dashboard({ sidebarOpen, sidebarMode }) {
  const navigate = useNavigate();
  const { theme, themeMode, isAnimatedTheme } = useTheme();
  const { currentCompany, loading: companyLoading } = useCompany();

  // State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState('');
  const [isUserOnLeave, setIsUserOnLeave] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [userTeamId, setUserTeamId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [onLeaveMembers, setOnLeaveMembers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(null); // null means not checked yet

  // User List Modal State
  const [userListModal, setUserListModal] = useState({
    isOpen: false,
    type: 'onLeave', // or available
    title: 'Team Members',
    subtitle: ''
  });

  // Subscription State
  const [subscription, setSubscription] = useState(null);

  // Missing Reports Logic
  const [missingReportIds, setMissingReportIds] = useState([]);

  // Assigned Tasks State
  const [assignedTasks, setAssignedTasks] = useState([]);

  // Task Modal State
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  // Holidays State
  const [holidays, setHolidays] = useState([]);

  // Derived Stats
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamSize: 0
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (companyLoading || !currentCompany?.id) return;

      try {
        setLoading(true);

        // 1. Get User Info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data: userData } = await supabase
            .from('users')
            .select('name, role, team_id, avatar_url, teams(name)')
            .eq('id', user.id)
            .single();

          setUserName(userData?.name || user.email?.split('@')[0] || 'User');
          setUserRole(userData?.role || '');
          setTeamName(userData?.teams?.name || '');
          setUserTeamId(userData?.team_id || null);
          setUserAvatarUrl(userData?.avatar_url || '');

          // Check report submission
          checkTodayReport(user.id, currentCompany.id);
        }

        // 2. Fetch Projects (Only Assigned)
        let projectsData = [];
        if (user) {
          const { data } = await supabase
            .from('projects')
            .select('*, project_assignments!inner(user_id)')
            .eq('company_id', currentCompany.id)
            .eq('project_assignments.user_id', user.id)
            .order('created_at', { ascending: false });
          projectsData = data;
        }

        setProjects(projectsData || []);

        // 3. Fetch Tasks (for analytics)
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('company_id', currentCompany.id);

        setTasks(tasksData || []);

        // 4. Fetch Team Members (include team_id)
        const { data: teamData } = await supabase
          .from('users')
          .select('id, name, role, avatar_url, team_id, company_id')
          .eq('company_id', currentCompany.id);

        setTeamMembers(teamData || []);

        // 5. Fetch Leave Data (Today's status)
        const today = new Date().toISOString().split('T')[0];
        const { data: leaveData } = await supabase
          .from('leave_plans')
          .select('user_id')
          .eq('status', 'approved')
          .lte('start_date', today)
          .gte('end_date', today);

        const onLeaveIds = (leaveData || []).map(l => l.user_id);
        const onLeave = (teamData || []).filter(m => onLeaveIds.includes(m.id));
        const available = (teamData || []).filter(m => !onLeaveIds.includes(m.id));

        setOnLeaveMembers(onLeave);
        setAvailableMembers(available);

        // Check if current user is on leave
        if (user) {
          setIsUserOnLeave(onLeaveIds.includes(user.id));
        }

        // 6. Fetch Missing Reports (For Team Pulse)
        // Only if user has a team
        if (user && teamData) {
          const { data: reports } = await supabase
            .from('daily_reports')
            .select('user_id')
            .eq('date', today)
            .eq('company_id', currentCompany.id);

          const submittedIds = (reports || []).map(r => r.user_id);
          const missingIds = teamData
            .filter(m => !submittedIds.includes(m.id) && !onLeaveIds.includes(m.id))
            .map(m => m.id);
          setMissingReportIds(missingIds);
        }

        // 7. Fetch Assigned Tasks for Current User
        if (user) {
          try {
            const { data: userTasks, error: tasksError } = await supabase
              .from('tasks')
              .select(`
      *,
      project:projects(name)
      `)
              .eq('assignee_id', user.id)
              .neq('status', 'Completed')
              .order('due_date', { ascending: true });

            if (tasksError) throw tasksError;

            // Process the data to include project name
            let processedTasks = (userTasks || []).map(task => ({
              ...task,
              project_name: task.project?.name || 'No Project'
            }));

            // Get comments count for each task
            if (processedTasks.length > 0) {
              const taskIds = processedTasks.map(task => task.id);

              // Query to count comments for each task
              const { data: commentsCountData, error: commentsError } = await supabase
                .from('comments')
                .select('task_id')
                .in('task_id', taskIds);

              if (!commentsError && commentsCountData) {
                // Count occurrences of each task_id in the comments
                const commentsCountMap = {};
                commentsCountData.forEach(comment => {
                  commentsCountMap[comment.task_id] = (commentsCountMap[comment.task_id] || 0) + 1;
                });

                // Update tasks with comments count
                processedTasks = processedTasks.map(task => ({
                  ...task,
                  comments_count: commentsCountMap[task.id] || 0
                }));
              } else {
                // If there's an error with comments, set all to 0
                processedTasks = processedTasks.map(task => ({
                  ...task,
                  comments_count: 0
                }));
              }
            } else {
              processedTasks = [];
            }

            setAssignedTasks(processedTasks);
          } catch (err) {
            console.error('Error fetching assigned tasks:', err);
            setAssignedTasks([]);
          }
        }

        // 8. Fetch Holidays for Current Month - create a fresh Date object
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        console.log('DEBUG: Fetching holidays for company_id:', currentCompany.id);
        console.log('DEBUG: Date range:', startOfMonth, 'to', endOfMonth);

        const { data: holidaysData, error: holidaysError } = await supabase
          .from('holidays')
          .select('*')
          .eq('company_id', currentCompany.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        if (holidaysError) {
          console.error('Error fetching holidays:', holidaysError);
        } else {
          console.log('DEBUG: Holidays fetched successfully:', holidaysData);
        }

        setHolidays(holidaysData || []);

        // 9. Fetch Current Subscription
        try {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('company_id', currentCompany.id)
            .eq('status', 'active')
            .maybeSingle();

          if (subData) {
            setSubscription(subData);
          } else {
            // Fetch free plan if no active subscription
            const { data: freePlan } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('name', 'Free')
              .maybeSingle();

            if (freePlan) {
              setSubscription({ plan: freePlan });
            }
          }
        } catch (subErr) {
          console.error('Error fetching subscription:', subErr);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompany, companyLoading]);

  const checkTodayReport = async (userId, companyId) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('company_id', companyId)
        .maybeSingle();

      setHasSubmittedToday(!!data);
    } catch (err) {
      console.error('Check report error', err);
    }
  };

  const handleOpenUserList = (type) => {
    const today = format(new Date(), 'MMMM d, yyyy');
    if (type === 'onLeave') {
      setUserListModal({
        isOpen: true,
        type: 'onLeave',
        title: 'Team Members On Leave',
        subtitle: `Out of office for ${today}`,
        users: onLeaveMembers
      });
    } else {
      setUserListModal({
        isOpen: true,
        type: 'available',
        title: 'Available Team Members',
        subtitle: `Online on ${today}`,
        users: availableMembers
      });
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setShowTaskDetailModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskDetailModal(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdate = () => {
    // Refresh tasks after update
    const fetchData = async () => {
      if (!currentUserId) return;
      try {
        const { data: userTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('assignee_id', currentUserId)
          .neq('status', 'Completed')
          .order('due_date', { ascending: true });
        setAssignedTasks(userTasks || []);
      } catch (err) {
        console.error('Error refreshing tasks:', err);
      }
    };
    fetchData();
  };

  // Calculate Stats when data changes
  useEffect(() => {
    if (loading) return;

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = totalTasks - completedTasks;

    const teamSize = teamMembers.length;

    setStats({
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      teamSize
    });
  }, [projects, tasks, teamMembers, loading]);

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'To Do').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    review: tasks.filter(t => t.status === 'Review').length,
    completed: tasks.filter(t => t.status === 'Completed').length
  };

  return (
    <div className="w-full h-full pb-8">
      <DashboardHeader
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        isUserOnLeave={isUserOnLeave}
        teamName={teamName}
        navigate={navigate}
        userRole={userRole}
        availableMembers={availableMembers}
        onLeaveMembers={onLeaveMembers}
        onOpenUserList={handleOpenUserList}
        onCreateReport={() => navigate('/report')}
        hasSubmittedToday={hasSubmittedToday}
        subscription={subscription}
        theme={theme}
        themeMode={themeMode}
      />



      <div className="px-4 sm:px-6 lg:px-8 pt-12">
        {/* Hero Quick Actions */}
        <QuickActionsHero navigate={navigate} userRole={userRole} />

        {/* Dashboard Section Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
          <h2 className={`text-xl font-bold ${isAnimatedTheme ? '!text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>Dashboard</h2>
        </div>

        {/* Main Content Grid - 4 Equal Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {/* Column 1: Team Pulse */}
          <div className="lg:col-span-1 h-[700px]">
            <TeamPulseWidget
              teamMembers={teamMembers}
              loading={loading}
              navigate={navigate}
              userTeamId={userTeamId}
              missingReportIds={missingReportIds}
              onAvatarClick={(userId) => {
                setSelectedUserId(userId);
                setShowProfileModal(true);
              }}
              onStartChat={(member) => {
                navigate('/chat', { state: { startChatWithUserId: member.id } });
              }}
            />
          </div>

          {/* Column 2: Projects & Holidays */}
          <div className="lg:col-span-1 h-[700px] flex flex-col gap-4 py-2">
            <div className="flex-1 min-h-0">
              <CompactProjectsWidget projects={projects} loading={loading} navigate={navigate} />
            </div>
            <div className="flex-1 min-h-0">
              <HolidaysWidget holidays={holidays} loading={loading} navigate={navigate} />
            </div>
          </div>

          {/* Column 3: Assigned Tasks */}
          <div className="lg:col-span-1 h-[700px]">
            <AssignedTasksWidget
              tasks={assignedTasks}
              loading={loading}
              currentUserId={currentUserId}
              onTaskClick={handleTaskClick}
              navigate={navigate}
            />
          </div>

          {/* Column 4: Task Progress */}
          <div className="lg:col-span-1 h-[700px]">
            <TaskAnalyticsWidget taskStats={taskStats} loading={loading} navigate={navigate} />
          </div>
        </div>
      </div>


      {/* User Profile Modal */}
      <UserProfileInfoModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
        onStartChat={(member) => {
          setShowProfileModal(false);
          navigate('/chat', { state: { startChatWithUserId: member.id } });
        }}
      />

      {/* User List Modal (Correct Modal) */}
      <UserListModal
        isOpen={userListModal.isOpen}
        onClose={() => setUserListModal(prev => ({ ...prev, isOpen: false }))}
        title={userListModal.title}
        subtitle={userListModal.subtitle}
        type={userListModal.type}
        users={userListModal.users}
      />

      {/* Task Detail Modal */}
      {
        selectedTaskId && (
          <TaskDetailView
            isOpen={showTaskDetailModal}
            onClose={handleCloseTaskModal}
            taskId={selectedTaskId}
            onUpdate={handleTaskUpdate}
            currentUser={{ id: currentUserId, name: userName, role: userRole }}
            userRole={userRole}
          />
        )
      }
    </div>
  );
}
