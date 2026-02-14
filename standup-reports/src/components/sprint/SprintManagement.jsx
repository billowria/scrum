import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiCalendar,
  FiTarget,
  FiPlay,
  FiCheckCircle,
  FiChevronLeft,
  FiFilter,
  FiGrid,
  FiList,
  FiZap,
  FiTrendingUp,
  FiActivity,
  FiLayers
} from 'react-icons/fi';
import { getSprintStatus } from '../../utils/sprintUtils';
import { useTheme } from '../../context/ThemeContext';
import ProjectListView from './ProjectListView';
import SprintListView from './SprintListView';
import ProjectGridView from './ProjectGridView';
import SprintGridView from './SprintGridView';

const SprintManagement = ({
  sprints,
  tasks,
  onCreateSprint,
  onEditSprint,
  onDeleteSprint,
  onSelectSprint,
  onStartSprint,
  onCompleteSprint,
  selectedSprintId,
  userRole,
  projects = [],
  selectedProjectId = 'all',
  setSelectedProjectId = () => { }
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const { themeMode } = useTheme();

  // Premium theme detection
  const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);
  const isDark = themeMode === 'dark' || isPremiumTheme;

  // Theme-aware styles
  const getThemeStyles = () => {
    const baseStyles = {
      light: {
        bg: 'from-slate-50 via-blue-50/30 to-purple-50/30',
        orb1: '#3b82f6',
        orb2: '#8b5cf6',
        orb3: '#06b6d4',
        cardBg: 'bg-white/80 border-gray-200/60',
        cardHover: 'hover:border-purple-300 hover:shadow-purple-100/50',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        accent: 'from-purple-500 to-pink-500'
      },
      dark: {
        bg: 'from-slate-950 via-slate-900 to-slate-950',
        orb1: '#6366f1',
        orb2: '#8b5cf6',
        orb3: '#06b6d4',
        cardBg: 'bg-slate-800/60 border-slate-700/60',
        cardHover: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-400',
        accent: 'from-purple-400 to-pink-400'
      },
      ocean: {
        bg: 'from-slate-950 via-cyan-950/50 to-blue-950/50',
        orb1: '#06b6d4',
        orb2: '#0ea5e9',
        orb3: '#22d3ee',
        cardBg: 'bg-cyan-900/20 border-cyan-500/20',
        cardHover: 'hover:border-cyan-400/40 hover:shadow-cyan-500/20',
        textPrimary: 'text-white',
        textSecondary: 'text-cyan-300/80',
        accent: 'from-cyan-400 to-blue-500'
      },
      forest: {
        bg: 'from-slate-950 via-emerald-950/50 to-green-950/50',
        orb1: '#10b981',
        orb2: '#22c55e',
        orb3: '#34d399',
        cardBg: 'bg-emerald-900/20 border-emerald-500/20',
        cardHover: 'hover:border-emerald-400/40 hover:shadow-emerald-500/20',
        textPrimary: 'text-white',
        textSecondary: 'text-emerald-300/80',
        accent: 'from-emerald-400 to-green-500'
      },
      space: {
        bg: 'from-slate-950 via-purple-950/50 to-indigo-950/50',
        orb1: '#a855f7',
        orb2: '#6366f1',
        orb3: '#ec4899',
        cardBg: 'bg-purple-900/20 border-purple-500/20',
        cardHover: 'hover:border-purple-400/40 hover:shadow-purple-500/20',
        textPrimary: 'text-white',
        textSecondary: 'text-purple-300/80',
        accent: 'from-purple-400 to-pink-500'
      }
    };
    return baseStyles[themeMode] || baseStyles.dark;
  };

  const styles = getThemeStyles();

  // Calculate sprint statistics
  const sprintStats = useMemo(() => {
    const projectSprints = selectedProjectId === 'all'
      ? sprints
      : sprints.filter(s => s.project_id === selectedProjectId);

    const active = projectSprints.filter(s => getSprintStatus(s) === 'Active').length;
    const completed = projectSprints.filter(s => getSprintStatus(s) === 'Completed').length;
    const planning = projectSprints.filter(s => getSprintStatus(s) === 'Planning').length;
    const totalTasks = projectSprints.reduce((acc, sprint) => {
      return acc + tasks.filter(t => t.sprint_id === sprint.id).length;
    }, 0);

    return { total: projectSprints.length, active, completed, planning, totalTasks };
  }, [sprints, tasks, selectedProjectId]);

  // Filter sprints based on status
  const filteredSprints = sprints.filter(sprint => {
    if (filterStatus === 'all') return true;
    const status = getSprintStatus(sprint);
    return status === filterStatus;
  });

  // Get tasks for a specific sprint
  const getSprintTasks = (sprintId) => {
    return tasks.filter(task => task.sprint_id === sprintId);
  };

  // Filter status configurations
  const filterConfigs = [
    { key: 'all', label: 'All Sprints', icon: FiLayers, gradient: 'from-blue-500 to-cyan-500' },
    { key: 'Planning', label: 'Planning', icon: FiCalendar, gradient: 'from-amber-500 to-orange-500' },
    { key: 'Active', label: 'Active', icon: FiPlay, gradient: 'from-emerald-500 to-green-500' },
    { key: 'Completed', label: 'Completed', icon: FiCheckCircle, gradient: 'from-blue-500 to-indigo-500' }
  ];

  return (
    <div className={`w-full min-h-screen bg-gradient-to-br ${styles.bg} relative overflow-hidden`}>
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary mesh gradient orbs */}
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${styles.orb1} 0%, transparent 70%)` }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 60, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${styles.orb2} 0%, transparent 70%)` }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${styles.orb3} 0%, transparent 60%)` }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Noise texture overlay */}
        <div
          className={`absolute inset-0 ${isDark ? 'opacity-[0.015]' : 'opacity-[0.025]'}`}
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />

        {/* Animated grid lines for premium themes */}
        {isPremiumTheme && (
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(${styles.orb1}40 1px, transparent 1px), linear-gradient(90deg, ${styles.orb1}40 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
        )}
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-5 md:space-y-6 relative z-10">

        {/* Premium Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl border shadow-2xl
            ${isPremiumTheme
              ? 'bg-white/[0.05] border-white/10'
              : isDark
                ? 'bg-slate-800/50 border-slate-700/50'
                : 'bg-white/70 border-gray-200/50'}`}
        >
          {/* Header glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${styles.accent} opacity-5`} />

          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              {/* Title Section */}
              <div className="space-y-1">
                <motion.h1
                  className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight
                    bg-gradient-to-r ${styles.accent} bg-clip-text text-transparent`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Sprint Management
                </motion.h1>
                <p className={`text-sm sm:text-base ${styles.textSecondary}`}>
                  {selectedProjectId === 'all'
                    ? 'Select a project to manage sprints'
                    : 'Plan, track, and complete your sprints'}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { label: 'Total', value: sprintStats.total, icon: FiLayers, color: 'blue' },
                  { label: 'Active', value: sprintStats.active, icon: FiZap, color: 'emerald' },
                  { label: 'Done', value: sprintStats.completed, icon: FiCheckCircle, color: 'purple' },
                  { label: 'Tasks', value: sprintStats.totalTasks, icon: FiActivity, color: 'amber' }
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={`group relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl backdrop-blur-sm border transition-all duration-300
                      ${isPremiumTheme
                        ? 'bg-white/[0.08] border-white/10 hover:bg-white/[0.12] hover:border-white/20'
                        : isDark
                          ? 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70'
                          : 'bg-white/60 border-gray-200/50 hover:bg-white/80'}`}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-${stat.color}-500/20`}>
                      <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${stat.color}-${isDark ? '400' : '600'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-base sm:text-lg font-bold ${styles.textPrimary}`}>
                        {stat.value}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-medium ${styles.textSecondary}`}>
                        {stat.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Animated accent line */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${styles.accent}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </motion.div>

        {/* Project Selection Grid */}
        {projects?.length > 0 && selectedProjectId === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Section Header with View Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-r ${styles.accent}`}>
                  <FiTarget className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold ${styles.textPrimary}`}>
                  Your Projects
                </h2>
              </div>

              {/* Premium View Mode Toggle */}
              <div className={`flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl backdrop-blur-xl border transition-all
                ${isPremiumTheme
                  ? 'bg-white/[0.08] border-white/10'
                  : isDark
                    ? 'bg-slate-800/60 border-slate-700/60'
                    : 'bg-white/70 border-gray-200/50'}`}>
                {[
                  { mode: 'board', icon: FiGrid, label: 'Board' },
                  { mode: 'list', icon: FiList, label: 'List' }
                ].map(({ mode, icon: Icon, label }) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300
                      ${viewMode === mode
                        ? `text-white shadow-lg`
                        : `${styles.textSecondary} hover:${styles.textPrimary}`}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {viewMode === mode && (
                      <motion.div
                        layoutId="viewToggle"
                        className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r ${styles.accent}`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                    <span className="relative z-10 hidden xs:inline">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Project View */}
            {viewMode === 'list' ? (
              <ProjectListView
                projects={projects}
                sprints={sprints}
                getSprintTasks={getSprintTasks}
                setSelectedProjectId={setSelectedProjectId}
              />
            ) : (
              <ProjectGridView
                projects={projects}
                sprints={sprints}
                getSprintTasks={getSprintTasks}
                setSelectedProjectId={setSelectedProjectId}
              />
            )}
          </motion.div>
        )}

        {/* Sprint Management View */}
        {selectedProjectId !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <motion.button
                onClick={() => setSelectedProjectId('all')}
                className={`group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl backdrop-blur-xl border transition-all duration-300
                  ${isPremiumTheme
                    ? 'bg-white/[0.08] border-white/10 hover:bg-white/[0.15] hover:border-white/20'
                    : isDark
                      ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/80'
                      : 'bg-white/70 border-gray-200/50 hover:bg-white/90 hover:border-purple-300'}`}
                whileHover={{ scale: 1.02, x: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 
                  ${isPremiumTheme ? 'text-white/70' : isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${styles.textPrimary}`}>Back to Projects</span>
              </motion.button>

              {userRole === 'manager' && onCreateSprint && (
                <motion.button
                  onClick={onCreateSprint}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white shadow-lg overflow-hidden
                    bg-gradient-to-r ${styles.accent}`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <FiPlus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 text-sm">New Sprint</span>
                </motion.button>
              )}
            </div>

            {/* Premium Filter Controls */}
            <div className={`rounded-2xl sm:rounded-3xl backdrop-blur-xl border shadow-xl overflow-hidden
              ${isPremiumTheme
                ? 'bg-white/[0.05] border-white/10'
                : isDark
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-white/70 border-gray-200/50'}`}>

              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isPremiumTheme ? 'bg-white/10' : isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      <FiFilter className={`w-4 h-4 ${isPremiumTheme ? 'text-white/70' : styles.textSecondary}`} />
                    </div>
                    <div>
                      <h3 className={`text-base sm:text-lg font-bold ${styles.textPrimary}`}>Filter Sprints</h3>
                      <p className={`text-xs sm:text-sm ${styles.textSecondary}`}>
                        {filteredSprints.filter(s => s.project_id === selectedProjectId).length} sprint{filteredSprints.filter(s => s.project_id === selectedProjectId).length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm border
                    ${isPremiumTheme
                      ? 'bg-white/[0.05] border-white/10'
                      : isDark
                        ? 'bg-slate-900/50 border-slate-700/50'
                        : 'bg-gray-100/80 border-gray-200/50'}`}>
                    {[
                      { mode: 'board', icon: FiGrid },
                      { mode: 'list', icon: FiList }
                    ].map(({ mode, icon: Icon }) => (
                      <motion.button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                          ${viewMode === mode
                            ? 'text-white'
                            : styles.textSecondary}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {viewMode === mode && (
                          <motion.div
                            layoutId="sprintViewToggle"
                            className={`absolute inset-0 rounded-lg bg-gradient-to-r ${styles.accent}`}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{mode === 'board' ? 'Board' : 'List'}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Premium Filter Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {filterConfigs.map((filter, idx) => (
                    <motion.button
                      key={filter.key}
                      onClick={() => setFilterStatus(filter.key)}
                      className={`relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300
                        ${filterStatus === filter.key
                          ? 'text-white shadow-lg'
                          : `${isPremiumTheme
                            ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10'
                            : isDark
                              ? 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200/50'}`
                        }`}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {filterStatus === filter.key && (
                        <motion.div
                          layoutId="activeFilter"
                          className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r ${filter.gradient}`}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <filter.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {filter.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sprint View */}
            {viewMode === 'list' ? (
              <SprintListView
                sprints={filteredSprints.filter(s => s.project_id === selectedProjectId)}
                getSprintTasks={getSprintTasks}
                userRole={userRole}
                selectedSprintId={selectedSprintId}
                onSelectSprint={onSelectSprint}
                onEditSprint={onEditSprint}
                onStartSprint={onStartSprint}
                onCompleteSprint={onCompleteSprint}
              />
            ) : (
              <SprintGridView
                sprints={filteredSprints.filter(s => s.project_id === selectedProjectId)}
                getSprintTasks={getSprintTasks}
                onSelectSprint={onSelectSprint}
                onEditSprint={onEditSprint}
                onDeleteSprint={onDeleteSprint}
                onStartSprint={onStartSprint}
                onCompleteSprint={onCompleteSprint}
                selectedSprintId={selectedSprintId}
                userRole={userRole}
              />
            )}

            {/* Premium Empty State */}
            {filteredSprints.filter(s => s.project_id === selectedProjectId).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative text-center py-16 sm:py-20 rounded-3xl border-2 border-dashed overflow-hidden
                  ${isPremiumTheme
                    ? 'bg-white/[0.03] border-white/20'
                    : isDark
                      ? 'bg-slate-800/40 border-slate-600/50'
                      : 'bg-white/50 border-purple-300/50'}`}
              >
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${isPremiumTheme ? 'bg-white/20' : 'bg-purple-400/30'}`}
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${30 + (i % 3) * 20}%`
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </div>

                {/* 3D Floating Icon */}
                <motion.div
                  className="relative w-24 h-24 mx-auto mb-6"
                  animate={{ y: [0, -10, 0], rotateY: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${styles.accent} rounded-full opacity-30 blur-2xl`} />
                  <div className={`relative w-full h-full rounded-full flex items-center justify-center
                    ${isPremiumTheme
                      ? 'bg-white/[0.08] border border-white/20'
                      : isDark
                        ? 'bg-slate-800/80 border border-slate-700/50'
                        : 'bg-white/80 border border-purple-200/50'}`}>
                    <FiTarget className={`w-10 h-10 ${isPremiumTheme ? 'text-white/70' : isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  </div>
                </motion.div>

                <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${styles.textPrimary}`}>
                  {filterStatus === 'all' ? 'No Sprints Yet' : `No ${filterStatus} Sprints`}
                </h3>
                <p className={`text-sm sm:text-base mb-8 max-w-md mx-auto px-4 ${styles.textSecondary}`}>
                  {filterStatus === 'all'
                    ? 'Create your first sprint to start organizing and tracking your work'
                    : `No sprints found with the "${filterStatus}" status`}
                </p>

                {userRole === 'manager' && filterStatus === 'all' && onCreateSprint && (
                  <motion.button
                    onClick={onCreateSprint}
                    className={`relative inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white shadow-2xl overflow-hidden
                      bg-gradient-to-r ${styles.accent}`}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.accent} opacity-50 blur-xl`} />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <FiPlus className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                    <span className="relative z-10 text-base sm:text-lg">Create Your First Sprint</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SprintManagement;
