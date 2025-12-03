import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import {
  FiBriefcase, FiActivity, FiUsers, FiPlus,
  FiArrowRight, FiTarget, FiLayers,
  FiUserPlus, FiClock,
  FiCalendar, FiFileText, FiAward, FiBarChart2, FiMessageSquare,
  FiCheckCircle, FiStar, FiAlertCircle, FiEdit3
} from 'react-icons/fi';
import MissingReports from '../components/MissingReports';

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

// 1. Premium Projects List View - Sophisticated & Elegant
const ProjectSummaryWidget = ({ projects, loading, navigate }) => {
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
      {/* Header with Stats */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur opacity-20"></div>
              <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Active Projects</h3>
              <p className="text-xs text-gray-500">Manage your ongoing initiatives</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            View All
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-700">{activeProjects.length} Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
            <FiTarget className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-semibold text-gray-700">On Track</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeProjects.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activeProjects.slice(0, 8).map((project, idx) => {
                const priority = getPriorityConfig(idx);
                const progress = Math.floor(Math.random() * 40) + 30;
                const daysLeft = Math.floor(Math.random() * 15) + 5;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="group px-5 py-4 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-300 relative"
                  >
                    {/* Priority Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${priority.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                    <div className="flex items-start gap-4">
                      {/* Project Icon with Gradient */}
                      <div className="relative flex-shrink-0">
                        <div className={`absolute inset-0 bg-gradient-to-br ${priority.gradient} rounded-xl blur opacity-20`}></div>
                        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${priority.gradient} flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                          {project.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${priority.color}-50 text-${priority.color}-700 border border-${priority.color}-200`}>
                                {priority.label}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {daysLeft} days left
                              </span>
                            </div>
                          </div>

                          {/* Team Avatars */}
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-xs text-gray-600 font-semibold bg-gradient-to-br from-indigo-100 to-purple-100">
                                  <span className="text-[10px]">{String.fromCharCode(64 + i)}</span>
                                </div>
                              ))}
                            </div>
                            <FiUsers className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Progress Bar with Percentage */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-600">Progress</span>
                            <span className="font-bold text-gray-900">{progress}%</span>
                          </div>
                          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${priority.gradient} rounded-full`}
                            >
                              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </motion.div>
                          </div>
                        </div>

                        {/* Quick Actions (visible on hover) */}
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            <FiTarget className="w-3 h-3" />
                            Tasks
                          </button>
                          <span className="text-gray-300">•</span>
                          <button className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                            <FiUsers className="w-3 h-3" />
                            Team
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50"></div>
                <FiBriefcase className="relative w-16 h-16 mb-4 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No active projects</p>
              <button
                onClick={() => navigate('/projects')}
                className="mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
              >
                Create your first project <FiArrowRight className="w-4 h-4" />
              </button>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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

const TeamPulseWidget = ({ teamMembers, loading, navigate, userTeamId }) => {
  // Filter team members to show only those in the user's team
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
            <h3 className="text-lg font-bold text-gray-900">My Team</h3>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-2">
            {myTeamMembers.map((member, idx) => {
              const isOnLeave = leaveStatus[member.id] || false;
              const roleColors = {
                manager: 'bg-blue-50 text-blue-700 border-blue-200',
                admin: 'bg-purple-50 text-purple-700 border-purple-200',
                member: 'bg-gray-50 text-gray-700 border-gray-200'
              };

              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all border border-transparent hover:border-purple-100 group">
                  <div className="relative">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 flex items-center justify-center font-bold border border-purple-200 shadow-sm text-sm">
                        {member.name?.[0]}
                      </div>
                    )}
                    {/* Leave Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isOnLeave ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{member.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${roleColors[member.role || 'member']}`}>
                        {member.role || 'member'}
                      </span>
                      <span className={`text-xs font-medium ${isOnLeave ? 'text-orange-600' : 'text-green-600'}`}>
                        {isOnLeave ? 'On Leave' : 'Available'}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-purple-600 transition-colors hover:shadow-sm border border-transparent hover:border-purple-100 opacity-0 group-hover:opacity-100">
                    <FiMessageSquare className="w-4 h-4" />
                  </button>
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

// 4. Missing Reports Widget with Submit Button
const MissingReportsWidget = ({ companyId, userTeamId, currentUserId, navigate, onCreateReport }) => {
  const [hasSubmittedToday, setHasSubmittedToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    checkTodayReport();
  }, [currentUserId, companyId]);

  const checkTodayReport = async () => {
    if (!currentUserId || !companyId) return;

    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('date', today)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      setHasSubmittedToday(!!data);
    } catch (error) {
      console.error('Error checking today report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4 mb-8">
      {/* Submit Report Alert (if not submitted today) */}
      {!hasSubmittedToday && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border border-blue-100 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl blur opacity-30 animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                  <FiEdit3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Daily Report Pending
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Today</span>
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">You haven't submitted your standup report for today yet</p>
              </div>
            </div>
            <button
              onClick={onCreateReport}
              className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <FiPlus className="w-5 h-5" />
              <span>Submit Report</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Missing Reports Component */}
      {companyId && userTeamId && (
        <MissingReports
          date={today}
          teamId={userTeamId}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// --- Spacious Header ---

const DashboardHeader = ({
  userName,
  teamName,
  availableMembers = [],
  onLeaveMembers = []
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl mb-10"
    >
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />

      {/* Large Glowing Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -ml-20 -mb-20" />

      <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-lg">
              <FiUsers className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-bold tracking-wide uppercase text-indigo-50">{teamName || 'No Team Assigned'}</span>
            </div>

            {/* Team Availability Indicators */}
            <div className="flex items-center gap-4 text-sm font-medium text-slate-400 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-emerald-100">{availableMembers.length} Online</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-100">{onLeaveMembers.length} Away</span>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white mb-3 leading-tight">
            Good Afternoon,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200">
              {userName}
            </span>
          </h1>
          <p className="text-lg text-indigo-200/80 max-w-xl">
            Here's your command center for today. You have pending items that need your attention.
          </p>
        </div>

        <div className="flex flex-col items-end">
          {/* Digital Clock */}
          <div className="text-right">
            <div className="font-mono text-6xl font-bold tracking-tighter text-white drop-shadow-2xl">
              {format(time, 'HH:mm')}
            </div>
            <div className="text-lg text-indigo-300 font-medium uppercase tracking-widest mt-2">
              {format(time, 'MMMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Hero Quick Actions (Tiles) ---

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
        }

        // 2. Fetch Projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false });

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
          .select('id, name, role, avatar_url, team_id')
          .eq('company_id', currentCompany.id);

        setTeamMembers(teamData || []);

        // 5. Fetch Leave Data
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

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompany, companyLoading]);

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
      />

      {/* Hero Quick Actions */}
      <QuickActionsHero navigate={navigate} userRole={userRole} />

      {/* Missing Reports Widget - Intelligent Position */}
      <MissingReportsWidget
        companyId={currentCompany?.id}
        userTeamId={userTeamId}
        currentUserId={currentUserId}
        navigate={navigate}
        onCreateReport={() => navigate('/reports')}
      />

      {/* Main Content Grid - New 4-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        {/* Left: Team Pulse - Full Height */}
        <div className="lg:col-span-1 h-[700px]">
          <TeamPulseWidget teamMembers={teamMembers} loading={loading} navigate={navigate} userTeamId={userTeamId} />
        </div>

        {/* Middle: Projects - 2 Columns */}
        <div className="lg:col-span-2 h-[700px]">
          <ProjectSummaryWidget projects={projects} loading={loading} navigate={navigate} />
        </div>

        {/* Right: Task Progress */}
        <div className="lg:col-span-1 h-[700px]">
          <TaskAnalyticsWidget taskStats={taskStats} loading={loading} navigate={navigate} />
        </div>
      </div>
    </motion.div>
  );
}
