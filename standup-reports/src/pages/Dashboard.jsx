import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <FiBriefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Projects</h3>
              <p className="text-[10px] text-gray-500">{activeProjects.length} active</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
          >
            View All <FiArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
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
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {project.name}
                          </h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${priority.color}-50 text-${priority.color}-700 ml-2`}>
                            {priority.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
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
              <p className="text-sm font-medium text-gray-500">No active projects</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// 1A. Assigned Tasks Widget - Show user's incomplete tasks
const AssignedTasksWidget = ({ tasks = [], loading, currentUserId, onTaskClick }) => {
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
    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <FiTarget className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Pending Tasks</h3>
              <p className="text-[10px] text-gray-500">
                {incompleteTasks.length} tasks
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/tasks'}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1">
            View All <FiArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
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
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 pr-2">
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
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
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
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FiMessageSquare className="w-3 h-3" />
                              <span>{task.comments_count}</span>
                            </div>
                          </div>

                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FiClock className="w-3 h-3" />
                              <span>{formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Professional icon on hover */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiExternalLink className="w-4 h-4 text-gray-500" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <FiTarget className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No pending tasks</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
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
    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/30 via-white to-teal-50/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur opacity-20"></div>
            <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <FiTarget className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Task Analytics</h3>
            <p className="text-xs text-gray-500">Monthly performance metrics</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
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
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">Complete</span>
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
                    <span className="text-xs font-semibold text-gray-600 block">Completed</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{completedPercent}% of total</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{taskStats.completed}</span>
                  <span className="text-xs text-gray-500 block">tasks</span>
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
                    <span className="text-xs font-semibold text-gray-600 block">In Progress</span>
                    <span className="text-[10px] text-blue-600 font-bold">{inProgressPercent}% of total</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{taskStats.inProgress}</span>
                  <span className="text-xs text-gray-500 block">tasks</span>
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
                    <span className="text-xs font-semibold text-gray-600 block">To Do</span>
                    <span className="text-[10px] text-gray-600 font-bold">{todoPercent}% of total</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{taskStats.todo}</span>
                  <span className="text-xs text-gray-500 block">tasks</span>
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
      )}
    </motion.div>
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
    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-purple-50/30 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Team Pulse</h3>
            <p className="text-xs text-gray-500">{myTeamMembers.length} members</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/team-management')}
          className="text-xs text-purple-600 font-bold hover:text-purple-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
        >
          View All <FiArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading || loadingLeave ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-2">
            {myTeamMembers.map((member, idx) => {
              const isOnLeave = leaveStatus[member.id] || false;
              const hasMissingReport = missingReportIds.includes(member.id) && !isOnLeave;

              const roleColors = {
                manager: 'bg-blue-50 text-blue-700 border-blue-200',
                admin: 'bg-purple-50 text-purple-700 border-purple-200',
                member: 'bg-gray-50 text-gray-700 border-gray-200'
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
                      <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{member.name}</h4>
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
                    className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-purple-600 transition-colors hover:shadow-sm border border-transparent hover:border-purple-100 opacity-0 group-hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartChat?.(member)}
                  >
                    <FiMessageSquare className="w-4 h-4" />
                  </motion.button>
                </div>
              );
            })}
            {myTeamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No team members in your team</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Spacious Header (Redesigned Compact) ---
const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Innovation distinguishes between a leader and a follower.",
  "Stay hungry, stay foolish.",
  "Your time is limited, so don't waste it living someone else's life.",
  "The best way to predict the future is to create it.",
  "Believe you can and you're halfway there.",
  "Do what you can, with what you have, where you are.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear.",
  "Success usually comes to those who are too busy to be looking for it.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "Quality is not an act, it is a habit.",
  "Well done is better than well said.",
  "Optimism is the faith that leads to achievement.",
  "It always seems impossible until it's done.",
  "Setting goals is the first step in turning the invisible into the visible.",
  "You miss 100% of the shots you don't take.",
  "Talent wins games, but teamwork and intelligence win championships.",
  "Alone we can do so little; together we can do so much.",
  "Productivity is never an accident. It is always the result of a commitment to excellence.",
  "Focus on being productive instead of busy.",
  "Simplicity is the ultimate sophistication.",
  "Creativity is intelligence having fun.",
  "The best way out is always through.",
  "Action is the foundational key to all success.",
  "Small daily improvements over time lead to stunning results.",
  "Don't count the days, make the days count.",
  "The power of imagination makes us infinite."
];

// Separate component for animated quote to prevent re-renders
const AnimatedQuote = React.memo(({ quote }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 1.0,
        duration: 1.2,
        type: "spring",
        stiffness: 80,
        damping: 12
      }}
      className="relative max-w-2xl"
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '3rem', opacity: 1 }}
          transition={{
            delay: 1.5,
            duration: 1.0,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          style={{ transformOrigin: 'top' }}
          className="hidden sm:block w-1 bg-gradient-to-b from-amber-300 to-orange-500 rounded-full"
        />
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1.0,
            duration: 1.2,
            type: "spring",
            stiffness: 80,
            damping: 12
          }}
          className="font-serif text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-orange-100 to-amber-50 italic leading-relaxed drop-shadow-sm"
        >
          "{quote}"
        </motion.blockquote>
      </div>
    </motion.div>
  );
});

AnimatedQuote.displayName = 'AnimatedQuote';

const DashboardHeader = ({
  userName,
  teamName,
  availableMembers = [],
  onLeaveMembers = [],
  onOpenUserList,
  onCreateReport,
  hasSubmittedToday
}) => {
  const [time, setTime] = useState(new Date());

  // Quote Logic
  const dayOfMonth = new Date().getDate();
  const quote = QUOTES[dayOfMonth - 1] || QUOTES[0];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 sm:p-8 text-white shadow-xl mb-8"
    >
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />

      {/* Subtle Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px] -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] -ml-10 -mb-10" />

      <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-6">
        <div className="flex-1">
          {/* Top Row: Team & Status */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
              <FiUsers className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-xs font-bold tracking-wide uppercase text-indigo-200">{teamName || 'No Team'}</span>
            </div>

            {/* Clickable Status Chips */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-300 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5 transition-all w-fit">
              <button
                onClick={() => onOpenUserList('available')}
                className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                <span>{availableMembers.length} Online</span>
              </button>
              <div className="w-px h-2.5 bg-white/10" />
              <button
                onClick={() => onOpenUserList('onLeave')}
                className="flex items-center gap-1.5 hover:text-amber-200 transition-colors group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{onLeaveMembers.length} Away</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-6 leading-tight">
            Good Afternoon, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200">{userName}</span>
          </h1>

          {/* Animated Quote - Memoized Component */}
          <AnimatedQuote quote={quote} />
        </div>

        <div className="flex flex-col items-end gap-5">
          {/* Digital Clock with Seconds */}
          <div className="text-right">
            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-tighter text-white drop-shadow-xl tabular-nums">
              {format(time, 'HH:mm:ss')}
            </div>
            <div className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1 opacity-80">
              {format(time, 'EEEE, MMM d')}
            </div>
          </div>

          {/* Submit Report Button (Compact) */}
          {hasSubmittedToday === false && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white text-sm font-bold shadow-lg shadow-amber-500/20 border border-white/10 transition-all group"
            >
              <FiEdit3 className="w-4 h-4" />
              <span>Submit Daily Report</span>
              <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Quick Actions (Unchanged) ---
// ... (Keeping HeroActionTile and QuickActionsHero code the same, but simplified in this replacement block for brevity if not changing) ...
// Wait, I need to keep the full file content valid. Since QuickActionsHero and HeroActionTile are internal, I should include them or ensure I don't delete them if replacing a range.
// The range starts at line 606 (DashboardHeader) and goes to end. 
// I will include the other components as is.

const HeroActionTile = ({ action, index }) => {
  // Map theme colors to specific Tailwind classes - using gradient colors for text
  const themeStyles = {
    violet: {
      hoverBg: 'hover:bg-violet-50',
      hoverBorder: 'hover:border-violet-200',
      titleColor: 'group-hover:text-violet-600',
      descColor: 'group-hover:text-violet-500',
      arrowBg: 'group-hover:bg-violet-100',
      arrowColor: 'group-hover:text-violet-600'
    },
    amber: {
      hoverBg: 'hover:bg-amber-50',
      hoverBorder: 'hover:border-amber-200',
      titleColor: 'group-hover:text-amber-600',
      descColor: 'group-hover:text-amber-500',
      arrowBg: 'group-hover:bg-amber-100',
      arrowColor: 'group-hover:text-amber-600'
    },
    blue: {
      hoverBg: 'hover:bg-blue-50',
      hoverBorder: 'hover:border-blue-200',
      titleColor: 'group-hover:text-blue-600',
      descColor: 'group-hover:text-blue-500',
      arrowBg: 'group-hover:bg-blue-100',
      arrowColor: 'group-hover:text-blue-600'
    },
    emerald: {
      hoverBg: 'hover:bg-emerald-50',
      hoverBorder: 'hover:border-emerald-200',
      titleColor: 'group-hover:text-emerald-600',
      descColor: 'group-hover:text-emerald-500',
      arrowBg: 'group-hover:bg-emerald-100',
      arrowColor: 'group-hover:text-emerald-600'
    },
    cyan: {
      hoverBg: 'hover:bg-cyan-50',
      hoverBorder: 'hover:border-cyan-200',
      titleColor: 'group-hover:text-cyan-600',
      descColor: 'group-hover:text-cyan-500',
      arrowBg: 'group-hover:bg-cyan-100',
      arrowColor: 'group-hover:text-cyan-600'
    },
    pink: {
      hoverBg: 'hover:bg-pink-50',
      hoverBorder: 'hover:border-pink-200',
      titleColor: 'group-hover:text-pink-600',
      descColor: 'group-hover:text-pink-500',
      arrowBg: 'group-hover:bg-pink-100',
      arrowColor: 'group-hover:text-pink-600'
    },
    red: {
      hoverBg: 'hover:bg-red-50',
      hoverBorder: 'hover:border-red-200',
      titleColor: 'group-hover:text-red-600',
      descColor: 'group-hover:text-red-500',
      arrowBg: 'group-hover:bg-red-100',
      arrowColor: 'group-hover:text-red-600'
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
      className={`group relative overflow-hidden p-6 rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-300 text-left h-full flex flex-col justify-between ${style.hoverBg} ${style.hoverBorder}`}
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
          className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 transition-colors duration-300 ${style.arrowBg} ${style.arrowColor}`}
          variants={{
            hover: { x: 5 }
          }}
        >
          <FiArrowRight className="w-4 h-4 transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <h3 className={`text-lg font-bold text-gray-900 transition-colors duration-300 ${style.titleColor}`}>
          {action.label}
        </h3>
        <p className={`text-sm text-gray-500 mt-1 transition-colors duration-300 ${style.descColor}`}>
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
      label: 'Projects',
      icon: FiBriefcase,
      gradient: 'from-blue-500 to-indigo-600',
      theme: 'blue',
      onClick: () => navigate('/projects'),
      desc: 'Manage initiatives'
    },
    {
      label: 'Leave Calendar',
      icon: FiCalendar,
      gradient: 'from-emerald-400 to-teal-500',
      theme: 'emerald',
      onClick: () => navigate('/leave-calendar'),
      desc: 'Check availability'
    },
    {
      label: 'Analytics',
      icon: FiBarChart2,
      gradient: 'from-cyan-400 to-blue-500',
      theme: 'cyan',
      onClick: () => navigate('/analytics-dashboard'),
      desc: 'Performance metrics'
    },
    {
      label: 'Achievements',
      icon: FiAward,
      gradient: 'from-pink-500 to-rose-500',
      theme: 'pink',
      onClick: () => navigate('/achievements'),
      desc: 'Badges & rewards'
    }
  ];

  if (userRole === 'manager') {
    actions.splice(3, 0, {
      label: 'Manage Users',
      icon: FiUserPlus,
      gradient: 'from-red-500 to-orange-600',
      theme: 'red',
      onClick: () => navigate('/team-management'),
      desc: 'Administer team'
    });
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
        {actions.map((action, index) => (
          <HeroActionTile key={index} action={action} index={index} />
        ))}
      </div>
    </div>
  );
};


// --- Main Dashboard Component ---

export default function Dashboard({ sidebarOpen, sidebarMode }) {
  const navigate = useNavigate();
  const { currentCompany, loading: companyLoading } = useCompany();

  // State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
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
            .select('name, role, team_id, teams(name)')
            .eq('id', user.id)
            .single();

          setUserName(userData?.name || user.email?.split('@')[0] || 'User');
          setUserRole(userData?.role || '');
          setTeamName(userData?.teams?.name || '');
          setUserTeamId(userData?.team_id || null);

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-8 max-w-[1800px] mx-auto min-h-screen bg-gray-50/30"
    >
      {/* Spacious Header */}
      <DashboardHeader
        userName={userName}
        teamName={teamName}
        navigate={navigate}
        userRole={userRole}
        availableMembers={availableMembers}
        onLeaveMembers={onLeaveMembers}
        onOpenUserList={handleOpenUserList}
        onCreateReport={() => navigate('/report')}
        hasSubmittedToday={hasSubmittedToday}
      />



      {/* Hero Quick Actions */}
      <QuickActionsHero navigate={navigate} userRole={userRole} />

      {/* Dashboard Section Header */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
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
        <div className="lg:col-span-1 h-[700px] flex flex-col gap-6">
          <div className="flex-1 overflow-hidden min-h-0">
            <CompactProjectsWidget projects={projects} loading={loading} navigate={navigate} />
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
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
          />
        </div>

        {/* Column 4: Task Progress */}
        <div className="lg:col-span-1 h-[700px]">
          <TaskAnalyticsWidget taskStats={taskStats} loading={loading} navigate={navigate} />
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
      {selectedTaskId && (
        <TaskDetailView
          isOpen={showTaskDetailModal}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
          onUpdate={handleTaskUpdate}
          currentUser={{ id: currentUserId, name: userName, role: userRole }}
          userRole={userRole}
        />
      )}
    </motion.div >
  );
}
