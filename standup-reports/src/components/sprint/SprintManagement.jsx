import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiCalendar,
  FiTarget,
  FiClock,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
  FiChevronLeft,
  FiFolder,
  FiUsers,
  FiFilter,
  FiTrendingDown,
  FiBarChart2,
  FiZap,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiAward,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { format, parseISO, isWithinInterval, differenceInDays, isAfter, isBefore, subWeeks, addDays } from 'date-fns';
import {
  getSprintStatus,
  calculateSprintProgress,
  getSprintMetrics,
  getRemainingDays,
  getHealthColor
} from '../../utils/sprintUtils';
import ProjectListView from './ProjectListView';
import SprintListView from './SprintListView';

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
  // New props for project-first flow
  projects = [],
  selectedProjectId = 'all',
  setSelectedProjectId = () => { }
}) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Planning', 'Active', 'Completed'
  const [viewMode, setViewMode] = useState('list'); // 'board' or 'list'

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

  // Get gradient color for project based on index
  const getProjectGradient = (index) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-emerald-500 to-teal-500',
      'from-indigo-500 to-purple-500',
      'from-rose-500 to-pink-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              width: `${200 + Math.random() * 300}px`,
              height: `${200 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 5,
            }}
          >
            <div className={`w-full h-full rounded-full bg-gradient-to-r ${i % 4 === 0 ? 'from-purple-400 to-pink-400' :
              i % 4 === 1 ? 'from-blue-400 to-cyan-400' :
                i % 4 === 2 ? 'from-orange-400 to-red-400' :
                  'from-emerald-400 to-teal-400'
              }`} />
          </motion.div>
        ))}
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">

        {/* Enhanced Project Selection Grid */}
        {projects?.length > 0 && selectedProjectId === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Section Header with View Toggle */}
            <div className="flex items-center justify-between">

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-xl p-1.5 border border-gray-200 shadow-md">
                <motion.button
                  onClick={() => setViewMode('board')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'board'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Board</span>
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiList className="w-4 h-4" />
                  <span>List</span>
                </motion.button>
              </div>
            </div>

            {/* Project View - Board or List */}
            {viewMode === 'list' ? (
              <ProjectListView
                projects={projects}
                sprints={sprints}
                getSprintTasks={getSprintTasks}
                setSelectedProjectId={setSelectedProjectId}
              />
            ) : (
              /* Enhanced Project Cards Grid */
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                {projects.map((project, index) => {
                  const projectSprints = sprints.filter(s => s.project_id === project.id);
                  const sprintCount = projectSprints.length;
                  const activeSprints = projectSprints.filter(s => getSprintStatus(s) === 'Active').length;
                  const completedSprints = projectSprints.filter(s => getSprintStatus(s) === 'Completed').length;
                  const totalTasks = projectSprints.reduce((total, sprint) => {
                    return total + getSprintTasks(sprint.id).length;
                  }, 0);
                  const completedTasks = projectSprints.reduce((total, sprint) => {
                    const sprintTasks = getSprintTasks(sprint.id);
                    return total + sprintTasks.filter(task => task.status === 'Completed').length;
                  }, 0);
                  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                  return (
                    <motion.div
                      key={project.id}
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      className="group relative"
                    >
                      <motion.button
                        onClick={() => setSelectedProjectId(project.id)}
                        className="w-full text-left bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Gradient Accent Bar */}
                        <div className={`h-2 bg-gradient-to-r ${getProjectGradient(index)}`} />

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative p-6 space-y-5">
                          {/* Project Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                {project.name}
                              </h3>
                              {activeSprints > 0 && (
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    className="w-2 h-2 bg-emerald-500 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  <span className="text-sm font-semibold text-emerald-600">
                                    {activeSprints} Active Sprint{activeSprints !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Circular Progress Ring */}
                            <div className="relative w-16 h-16">
                              <svg className="w-16 h-16 transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                  className="text-gray-200"
                                />
                                <motion.circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="url(#gradient)"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 28}`}
                                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                                  animate={{
                                    strokeDashoffset: 2 * Math.PI * 28 * (1 - completionPercentage / 100)
                                  }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#EC4899" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Sprint Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200/50 text-center">
                              <div className="text-xl font-bold text-blue-700">{sprintCount}</div>
                              <div className="text-xs font-medium text-blue-600">Sprints</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200/50 text-center">
                              <div className="text-xl font-bold text-emerald-700">{totalTasks}</div>
                              <div className="text-xs font-medium text-emerald-600">Tasks</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200/50 text-center">
                              <div className="text-xl font-bold text-purple-700">{completedTasks}</div>
                              <div className="text-xs font-medium text-purple-600">Done</div>
                            </div>
                          </div>

                          {/* Health Indicator */}
                          {completedSprints > 0 && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200/50">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${completedSprints / Math.max(sprintCount, 1) > 0.8 ? 'bg-emerald-100' :
                                  completedSprints / Math.max(sprintCount, 1) > 0.6 ? 'bg-blue-100' : 'bg-orange-100'
                                  }`}>
                                  {completedSprints / Math.max(sprintCount, 1) > 0.8 ?
                                    <FiAward className="w-4 h-4 text-emerald-600" /> :
                                    completedSprints / Math.max(sprintCount, 1) > 0.6 ?
                                      <FiTrendingUp className="w-4 h-4 text-blue-600" /> :
                                      <FiBarChart2 className="w-4 h-4 text-orange-600" />
                                  }
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Project Health</span>
                              </div>
                              <div className={`text-lg font-bold ${completedSprints / Math.max(sprintCount, 1) > 0.8 ? 'text-emerald-600' :
                                completedSprints / Math.max(sprintCount, 1) > 0.6 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                {Math.round((completedSprints / Math.max(sprintCount, 1)) * 100)}%
                              </div>
                            </div>
                          )}

                          {/* Empty State - Compact */}
                          {sprintCount === 0 && (
                            <div className="text-center py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <FiCalendar className="w-6 h-6 mx-auto mb-1.5 text-gray-400" />
                              <div className="text-sm font-medium text-gray-600">No Sprints Yet</div>
                              <div className="text-xs text-gray-500">Click to create your first sprint</div>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Sprint Management View */}
        {selectedProjectId !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <motion.button
                onClick={() => setSelectedProjectId('all')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur-xl rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiChevronLeft className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-700">Back</span>
              </motion.button>

              {userRole === 'manager' && onCreateSprint && (
                <motion.button
                  onClick={onCreateSprint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all text-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiPlus className="w-4 h-4" />
                  <span>New Sprint</span>
                </motion.button>
              )}
            </div>

            {/* Filter Controls with View Toggle */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Filter Sprints</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiFilter className="w-4 h-4" />
                    <span className="font-semibold">{filteredSprints.length} sprint{filteredSprints.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <motion.button
                    onClick={() => setViewMode('board')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'board'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiGrid className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiList className="w-3.5 h-3.5" />
                    <span>List</span>
                  </motion.button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {['all', 'Planning', 'Active', 'Completed'].map((status) => (
                  <motion.button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${filterStatus === status
                      ? 'text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {filterStatus === status && (
                      <motion.div
                        layoutId="activeFilter"
                        className={`absolute inset-0 rounded-xl ${status === 'all' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          status === 'Active' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                            status === 'Completed' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {status === 'all' && <FiFilter className="w-4 h-4" />}
                      {status === 'Active' && <FiPlay className="w-4 h-4" />}
                      {status === 'Completed' && <FiCheckCircle className="w-4 h-4" />}
                      {status === 'Planning' && <FiCalendar className="w-4 h-4" />}
                      {status === 'all' ? 'All Sprints' : status}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sprint View - Board or List */}
            {viewMode === 'list' ? (
              <SprintListView
                sprints={filteredSprints.filter(s => s.project_id === selectedProjectId)}
                getSprintTasks={getSprintTasks}
                getSprintMetrics={getSprintMetrics}
                calculateSprintProgress={calculateSprintProgress}
                onSelectSprint={onSelectSprint}
                onEditSprint={onEditSprint}
                onStartSprint={onStartSprint}
                onCompleteSprint={onCompleteSprint}
                userRole={userRole}
                selectedSprintId={selectedSprintId}
              />
            ) : (
              /* Enhanced Sprint Cards Grid */
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {filteredSprints
                    .filter(s => s.project_id === selectedProjectId)
                    .map((sprint, index) => {
                      const sprintTasks = getSprintTasks(sprint.id);
                      const status = getSprintStatus(sprint);
                      const metrics = getSprintMetrics(sprint, sprintTasks);
                      const progress = calculateSprintProgress(sprint);
                      const healthColor = getHealthColor(metrics.health);

                      return (
                        <SprintCard
                          key={sprint.id}
                          sprint={sprint}
                          status={status}
                          metrics={metrics}
                          progress={progress}
                          healthColor={healthColor}
                          isSelected={selectedSprintId === sprint.id}
                          onSelect={() => onSelectSprint && onSelectSprint(sprint)}
                          onEdit={() => onEditSprint && onEditSprint(sprint)}
                          onDelete={() => onDeleteSprint && onDeleteSprint(sprint.id)}
                          onStart={() => onStartSprint && onStartSprint(sprint.id)}
                          onComplete={() => onCompleteSprint && onCompleteSprint(sprint.id)}
                          userRole={userRole}
                          index={index}
                        />
                      );
                    })}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Enhanced Empty State */}
            {filteredSprints.filter(s => s.project_id === selectedProjectId).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-dashed border-purple-300 shadow-xl"
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-2xl" />
                  <FiTarget className="w-20 h-20 mx-auto text-purple-400 relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {filterStatus === 'all' ? 'No Sprints Yet' : `No ${filterStatus} Sprints`}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {filterStatus === 'all'
                    ? 'Create your first sprint to start planning your work'
                    : `No sprints found with status: ${filterStatus}`
                  }
                </p>
                {userRole === 'manager' && filterStatus === 'all' && onCreateSprint && (
                  <motion.button
                    onClick={onCreateSprint}
                    className="relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-xl font-semibold shadow-2xl overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-xl opacity-50 blur-md" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <FiPlus className="w-6 h-6 relative z-10" />
                    <span className="relative z-10 text-lg">Create Your First Sprint</span>
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

// Enhanced Sprint Card Component
const SprintCard = ({ sprint, status, metrics, progress, healthColor, isSelected, onSelect, onEdit, onDelete, onStart, onComplete, userRole, index }) => {
  const getStatusGradient = () => {
    switch (status) {
      case 'Active':
        return 'from-emerald-500 to-green-500';
      case 'Completed':
        return 'from-blue-500 to-cyan-500';
      case 'Planning':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Active':
        return FiPlay;
      case 'Completed':
        return FiCheckCircle;
      case 'Planning':
        return FiCalendar;
      default:
        return FiClock;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative bg-white/80 backdrop-blur-xl rounded-2xl border-2 ${isSelected ? 'border-purple-400 shadow-2xl' : 'border-gray-200 shadow-lg hover:shadow-xl'
        } transition-all duration-300 cursor-pointer overflow-hidden group`}
      onClick={onSelect}
    >
      {/* Glassmorphic Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Card Content */}
      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-purple-600 transition-colors">
              {sprint.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiCalendar className="w-4 h-4" />
              <span>{format(parseISO(sprint.start_date), 'MMM dd')} - {format(parseISO(sprint.end_date), 'MMM dd')}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`relative px-4 py-2 bg-gradient-to-r ${getStatusGradient()} text-white text-xs font-bold rounded-xl shadow-lg overflow-hidden`}>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative flex items-center gap-1.5">
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{status}</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Progress</span>
            <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getStatusGradient()} rounded-full relative overflow-hidden`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
            <div className="text-xl font-bold text-blue-700">{metrics.totalTasks || 0}</div>
            <div className="text-xs text-blue-600 font-medium">Tasks</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50">
            <div className="text-xl font-bold text-emerald-700">{metrics.completedTasks || 0}</div>
            <div className="text-xs text-emerald-600 font-medium">Done</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
            <div className="text-xl font-bold text-amber-700">{metrics.pendingTasks || 0}</div>
            <div className="text-xs text-amber-600 font-medium">Open</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${healthColor}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-600 font-medium">
              {getRemainingDays(sprint)} days left
            </span>
          </div>

          {userRole === 'manager' && (
            <div className="flex items-center gap-2">
              {status === 'Planning' && onStart && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onStart(); }}
                  className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Start Sprint"
                >
                  <FiPlay className="w-4 h-4" />
                </motion.button>
              )}
              {status === 'Active' && onComplete && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Complete Sprint"
                >
                  <FiCheckCircle className="w-4 h-4" />
                </motion.button>
              )}
              {onEdit && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Edit Sprint"
                >
                  <FiEdit2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SprintManagement;
