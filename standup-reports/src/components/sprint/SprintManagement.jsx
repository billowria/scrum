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
  FiFolder
} from 'react-icons/fi';
import { format, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import {
  getSprintStatus,
  calculateSprintProgress,
  getSprintMetrics,
  getRemainingDays,
  getHealthColor
} from '../../utils/sprintUtils';

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
  setSelectedProjectId = () => {}
}) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Planning', 'Active', 'Completed'

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

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Header with Vibrant Purple Gradient Background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-6 shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 bg-white/30 rounded-full blur-3xl"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-white/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/40"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <FiTarget className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">Sprint Management</h2>
                <p className="text-sm text-white/90 mt-1">Plan, track, and manage your agile sprints</p>
              </div>
            </div>
            
            {userRole === 'manager' && onCreateSprint && selectedProjectId !== 'all' && (
              <motion.button
                onClick={onCreateSprint}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-purple-50"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Sprint</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Enhanced Project Selection Grid */}
        {projects?.length > 0 && selectedProjectId === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-md border-2 border-purple-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select a Project</h3>
                <p className="text-sm text-gray-600 mt-1">Choose a project to view and manage its sprints</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-fuchsia-100 rounded-xl border-2 border-purple-300">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                  {projects.length}
                </span>
                <span className="text-sm text-gray-700 ml-1 font-semibold">project{projects.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                      className="w-full text-left bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 shadow-md hover:shadow-xl p-5"
                      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(168, 85, 247, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Compact Card Content */}
                      <div className="space-y-3">
                        {/* Header with Icon and Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                              className="flex-shrink-0 p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-lg shadow-md"
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <FiFolder className="w-5 h-5 text-white" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                                {project.name}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {project.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          {activeSprints > 0 && (
                            <motion.div
                              className="flex-shrink-0 px-2 py-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-md"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                            >
                              {activeSprints} Active
                            </motion.div>
                          )}
                        </div>

                        {/* Compact Sprint Stats */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-center p-2 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg border-2 border-purple-200">
                            <p className="text-xs text-gray-700 font-medium mb-0.5">Total</p>
                            <p className="text-lg font-bold text-purple-700">{sprintCount}</p>
                          </div>
                          <div className="flex-1 text-center p-2 bg-gradient-to-br from-fuchsia-100 to-pink-100 rounded-lg border-2 border-fuchsia-200">
                            <p className="text-xs text-gray-700 font-medium mb-0.5">Active</p>
                            <p className="text-lg font-bold text-fuchsia-700">{activeSprints}</p>
                          </div>
                          <div className="flex-1 text-center p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg border-2 border-violet-200">
                            <p className="text-xs text-gray-700 font-medium mb-0.5">Done</p>
                            <p className="text-lg font-bold text-violet-700">{completedSprints}</p>
                          </div>
                        </div>

                        {/* View Action */}
                        <div className="flex items-center justify-center gap-2 pt-2 border-t-2 border-gray-100 text-purple-700 group-hover:text-purple-800 font-semibold text-sm">
                          <span>View Sprints</span>
                          <motion.div
                            className="transform group-hover:translate-x-1 transition-transform"
                          >
                            <FiTarget className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* Sprint View with Smooth Animation */}
        {selectedProjectId !== 'all' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Enhanced Breadcrumb with Project Info */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setSelectedProjectId('all')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-purple-100 hover:to-fuchsia-100 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-gray-300 hover:border-purple-400"
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    title="Back to projects"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    Projects
                  </motion.button>
                  <span className="text-gray-400 font-bold">/</span>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-lg shadow-md">
                      <FiFolder className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {projects.find(p => p.id === selectedProjectId)?.name || 'Project'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-fuchsia-100 rounded-lg border-2 border-purple-300">
                  <FiTarget className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-semibold text-purple-800">
                    {sprints.filter(s => s.project_id === selectedProjectId).length} sprint{sprints.filter(s => s.project_id === selectedProjectId).length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 bg-white rounded-xl p-2 shadow-md border-2 border-purple-200"
            >
              {['all', 'Planning', 'Active', 'Completed'].map((status, index) => (
                <motion.button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-purple-100 hover:scale-102'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {status === 'all' ? 'All Sprints' : status}
                  {filterStatus === status && (
                    <motion.div
                      className="ml-2 inline-block w-2 h-2 bg-white rounded-full shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Sprint Cards Grid with Smooth Animation */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.2 }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {filteredSprints
                  .filter(s => s.project_id === selectedProjectId)
                  .map((sprint) => {
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
                    />
                  );
                  })}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Empty State */}
            {filteredSprints.filter(s => s.project_id === selectedProjectId).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 shadow-lg"
            >
              <FiTarget className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No Sprints Yet' : `No ${filterStatus} Sprints`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all' 
                  ? 'Create your first sprint to start planning your work'
                  : `No sprints found with status: ${filterStatus}`
                }
              </p>
              {userRole === 'manager' && filterStatus === 'all' && onCreateSprint && (
                <motion.button
                  onClick={onCreateSprint}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus className="w-5 h-5" />
                  Create Your First Sprint
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

// Sprint Card Component
const SprintCard = ({
  sprint,
  status,
  metrics,
  progress,
  healthColor,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStart,
  onComplete,
  userRole
}) => {
  const [showActions, setShowActions] = useState(false);

  // Get status badge styles
  const getStatusBadge = (status) => {
    const badges = {
      'Planning': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: FiClock,
        gradient: 'from-blue-500 to-indigo-600'
      },
      'Active': { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        icon: FiActivity,
        gradient: 'from-green-500 to-emerald-600'
      },
      'Completed': { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        icon: FiCheckCircle,
        gradient: 'from-gray-500 to-gray-600'
      },
      'Overdue': { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: FiAlertCircle,
        gradient: 'from-red-500 to-rose-600'
      }
    };
    return badges[status] || badges['Planning'];
  };

  const statusBadge = getStatusBadge(status);
  const StatusIcon = statusBadge.icon;

  // Get health indicator
  const getHealthIndicator = (color) => {
    const indicators = {
      'green': { bg: 'bg-green-500', pulse: 'animate-pulse-slow' },
      'amber': { bg: 'bg-amber-500', pulse: 'animate-pulse' },
      'red': { bg: 'bg-red-500', pulse: 'animate-pulse-fast' }
    };
    return indicators[color] || indicators['green'];
  };

  const healthIndicator = getHealthIndicator(healthColor);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-2 ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${statusBadge.gradient}`}></div>

      {/* Card Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{sprint.name}</h3>
              {/* Health Indicator */}
              <div className={`w-2 h-2 rounded-full ${healthIndicator.bg} ${healthIndicator.pulse}`}></div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{sprint.goal || 'No goal set'}</p>
          </div>
          
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusBadge.bg} ${statusBadge.text} text-xs font-medium`}>
            <StatusIcon className="w-3 h-3" />
            <span>{status}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
          <FiCalendar className="w-3.5 h-3.5" />
          <span>{format(parseISO(sprint.start_date), 'MMM dd')} - {format(parseISO(sprint.end_date), 'MMM dd, yyyy')}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Tasks</p>
            <p className="text-lg font-bold text-gray-900">{metrics.totalTasks}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Done</p>
            <p className="text-lg font-bold text-green-700">{metrics.completedTasks}</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Days</p>
            <p className="text-lg font-bold text-blue-700">{getRemainingDays(sprint)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-medium">{Math.round(metrics.completionRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full bg-gradient-to-r ${statusBadge.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${metrics.completionRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {showActions && userRole === 'manager' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {status === 'Planning' && onStart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                  title="Start Sprint"
                >
                  <FiPlay className="w-3.5 h-3.5" />
                  Start
                </button>
              )}
              
              {(status === 'Active' || status === 'Overdue') && onComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors"
                  title="Complete Sprint"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors"
                  title="Edit Sprint"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
              
              {status === 'Planning' && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this sprint?')) {
                      onDelete();
                    }
                  }}
                  className="p-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                  title="Delete Sprint"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <FiCheckCircle className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default SprintManagement;
