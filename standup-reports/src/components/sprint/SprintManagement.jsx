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
  FiArrowDown
} from 'react-icons/fi';
import { format, parseISO, isWithinInterval, differenceInDays, isAfter, isBefore, subWeeks, addDays } from 'date-fns';
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
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
        {/* Enhanced Compact Project Selection Grid */}
        {projects?.length > 0 && selectedProjectId === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Projects Overview
                </h2>
                <p className="text-sm text-gray-600 mt-1">Choose a project to manage its sprint workflow</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Project Count Badge */}
                <motion.div
                  className="relative px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-xl text-white font-bold shadow-xl overflow-hidden backdrop-blur-sm"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-xl opacity-50 blur-md"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent">
                    <motion.div
                      className="h-full"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    ></motion.div>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <FiFolder className="w-4 h-4" />
                    <span className="text-lg">{projects.length}</span>
                    <span className="text-sm font-normal">project{projects.length !== 1 ? 's' : ''}</span>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <div className="flex items-center gap-2 text-sm bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-200">
                  <div className="flex items-center gap-1 text-purple-700">
                    <FiTarget className="w-4 h-4" />
                    <span className="font-semibold">{sprints.filter(s => getSprintStatus(s) === 'Active').length}</span>
                    <span className="text-purple-600">Active</span>
                  </div>
                  <div className="w-px h-4 bg-purple-300"></div>
                  <div className="flex items-center gap-1 text-pink-700">
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="font-semibold">{sprints.filter(s => getSprintStatus(s) === 'Completed').length}</span>
                    <span className="text-pink-600">Done</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
              {projects.map((project, index) => {
                const projectSprints = sprints.filter(s => s.project_id === project.id);
                const sprintCount = projectSprints.length;
                const activeSprints = projectSprints.filter(s => getSprintStatus(s) === 'Active').length;
                const completedSprints = projectSprints.filter(s => getSprintStatus(s) === 'Completed').length;
                const planningSprints = projectSprints.filter(s => getSprintStatus(s) === 'Planning').length;

                // Calculate total tasks across all sprints
                const totalTasks = projectSprints.reduce((total, sprint) => {
                  const sprintTasks = getSprintTasks(sprint.id);
                  return total + sprintTasks.length;
                }, 0);

                const completedTasksAcrossProject = projectSprints.reduce((total, sprint) => {
                  const sprintTasks = getSprintTasks(sprint.id);
                  return total + sprintTasks.filter(task => task.status === 'Completed').length;
                }, 0);

                return (
                  <motion.div
                    key={project.id}
                    variants={{
                      hidden: { opacity: 0, y: 15, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } }
                    }}
                    className="group relative"
                  >
                    <motion.button
                      onClick={() => setSelectedProjectId(project.id)}
                      className="w-full text-left bg-white/80 backdrop-blur-xl rounded-xl border border-purple-200 hover:border-purple-400 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
                      whileHover={{
                        y: -6,
                        boxShadow: "0 20px 40px rgba(168, 85, 247, 0.25)",
                        scale: 1.02
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Enhanced Background Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-rose-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Clean Modern Card Content */}
                      <div className="relative p-4 space-y-4">
                        {/* Clean Centered Header */}
                        <div className="text-center space-y-2">
                          <motion.div
                            className="relative"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent text-center leading-tight">
                              {project.name}
                            </h3>
                            {activeSprints > 0 && (
                              <motion.div
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-400 text-white text-xs font-semibold rounded-full mt-2 shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                              >
                                <FiPlay className="w-3 h-3" />
                                <span>{activeSprints} Active Sprint{activeSprints !== 1 ? 's' : ''}</span>
                              </motion.div>
                            )}
                          </motion.div>
                          {project.description && (
                            <p className="text-sm text-gray-600 text-center max-w-32 mx-auto" title={project.description}>
                              {project.description}
                            </p>
                          )}
                        </div>

                        {/* Project Health Score & Status */}
                        <div className="space-y-3">
                          {/* Health Score */}
                          {completedSprints > 0 && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200/50">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  className={`p-1.5 rounded-full ${
                                    completedSprints / Math.max(sprintCount, 1) > 0.8 ? 'bg-emerald-100' :
                                    completedSprints / Math.max(sprintCount, 1) > 0.6 ? 'bg-blue-100' : 'bg-orange-100'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                >
                                  {completedSprints / Math.max(sprintCount, 1) > 0.8 ? <FiTrendingUp className="w-4 h-4 text-emerald-600" /> :
                                   completedSprints / Math.max(sprintCount, 1) > 0.6 ? <FiBarChart2 className="w-4 h-4 text-blue-600" /> :
                                   <FiTrendingDown className="w-4 h-4 text-orange-600" />}
                                </motion.div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-900">Project Health</div>
                                  <div className={`text-xs font-medium ${
                                    completedSprints / Math.max(sprintCount, 1) > 0.8 ? 'text-emerald-600' :
                                    completedSprints / Math.max(sprintCount, 1) > 0.6 ? 'text-blue-600' : 'text-orange-600'
                                  }`}>
                                    {Math.round((completedSprints / Math.max(sprintCount, 1)) * 100)}% Sprint Success Rate
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-purple-700">
                                  {completedSprints}/{Math.max(sprintCount, 1)}
                                </div>
                                <div className="text-xs text-purple-600">Completed</div>
                              </div>
                            </div>
                          )}

                          {/* Task Overview */}
                          {totalTasks > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200/50 text-center">
                                <div className="text-xl font-bold text-blue-700 mb-1">{totalTasks}</div>
                                <div className="text-xs font-medium text-blue-800">Total Tasks</div>
                              </div>
                              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200/50 text-center">
                                <div className="text-xl font-bold text-emerald-700 mb-1">{completedTasksAcrossProject}</div>
                                <div className="text-xs font-medium text-emerald-800">Completed</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sprint Overview Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                            <div className="text-lg font-bold text-gray-900 mb-1">{sprintCount}</div>
                            <div className="text-xs font-medium text-gray-600">Total Sprints</div>
                            {planningSprints > 0 && (
                              <div className="text-xs text-amber-600 mt-1">
                                +{planningSprints} planned
                              </div>
                            )}
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 text-center">
                            <div className="text-lg font-bold text-indigo-700 mb-1">
                              {sprintCount > 0 ? Math.round(totalTasks / Math.max(sprintCount, 1)) : 0}
                            </div>
                            <div className="text-xs font-medium text-indigo-600">Avg. Tasks/Sprint</div>
                          </div>
                        </div>

                        {/* Risk Indicators */}
                        {(() => {
                          const overdueTasks = projectSprints.reduce((total, sprint) => {
                            const sprintTasks = getSprintTasks(sprint.id);
                            const activeSprintTasks = sprintTasks.filter(task =>
                              getSprintStatus(sprint) === 'Active' &&
                              task.due_date &&
                              isBefore(parseISO(task.due_date), new Date())
                            );
                            return total + activeSprintTasks.length;
                          }, 0);

                          if (overdueTasks > 0) {
                            return (
                              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200/50">
                                <div className="flex items-center gap-2 mb-2">
                                  <motion.div
                                    className="w-2 h-2 bg-red-500 rounded-full"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  />
                                  <span className="text-sm font-semibold text-red-800">Attention Required</span>
                                </div>
                                <div className="text-xs text-red-700">
                                  {overdueTasks} overdue task{overdueTasks !== 1 ? 's' : ''} in active sprints
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Empty State */}
                        {sprintCount === 0 && (
                          <motion.div
                            className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <FiCalendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <div className="text-sm font-medium text-gray-600 mb-1">No Sprints Yet</div>
                            <div className="text-xs text-gray-500">Start by creating your first sprint</div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
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
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 hover:border-cyan-400 transition-colors"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="font-medium text-gray-700">Back to Projects</span>
              </motion.button>

              {userRole === 'manager' && onCreateSprint && (
                <motion.button
                  onClick={onCreateSprint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Create Sprint</span>
                </motion.button>
              )}
            </div>

            {/* Filter Controls with Compact Design */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Sprints</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiFilter className="w-4 h-4" />
                  <span>{filteredSprints.length} sprint{filteredSprints.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <motion.div className="flex flex-wrap gap-2">
                {['all', 'Planning', 'Active', 'Completed'].map((status, index) => (
                  <motion.button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                      filterStatus === status
                        ? 'border-transparent shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {filterStatus === status ? (
                      <div className={`relative px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg overflow-hidden backdrop-blur-sm -m-px ${
                        status === 'all' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                        status === 'Active' ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
                        status === 'Completed' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                        'bg-gradient-to-r from-amber-400 to-orange-400'
                      }`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${
                          status === 'all' ? 'from-blue-400 to-cyan-400' :
                          status === 'Active' ? 'from-emerald-400 to-green-400' :
                          status === 'Completed' ? 'from-blue-400 to-cyan-400' :
                          'from-amber-400 to-orange-400'
                        } rounded-full opacity-50 blur-md`}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
                          <motion.div
                            className="h-full"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                              delay: Math.random() * 2
                            }}
                          ></motion.div>
                        </div>
                        <div className="relative flex items-center gap-2">
                          {status === 'all' && <FiFilter className="w-3 h-3" />}
                          {status === 'Active' && <FiPlay className="w-3 h-3" />}
                          {status === 'Completed' && <FiCheckCircle className="w-3 h-3" />}
                          {status === 'Planning' && <FiCalendar className="w-3 h-3" />}
                          <span>{status === 'all' ? 'All Sprints' : status}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {status === 'all' && <FiFilter className="w-3 h-3" />}
                        {status === 'Active' && <FiPlay className="w-3 h-3" />}
                        {status === 'Completed' && <FiCheckCircle className="w-3 h-3" />}
                        {status === 'Planning' && <FiCalendar className="w-3 h-3" />}
                        <span>{status === 'all' ? 'All Sprints' : status}</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Sprint Cards Grid */}
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
                className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-cyan-300 shadow-lg"
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-xl"></div>
                  <FiTarget className="w-16 h-16 mx-auto text-cyan-400 relative" />
                </div>
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
                    className="relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-lg font-medium shadow-lg overflow-hidden backdrop-blur-sm"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg opacity-50 blur-md"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
                      <motion.div
                        className="h-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      ></motion.div>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <FiPlus className="w-5 h-5" />
                      <span>Create Your First Sprint</span>
                    </div>
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
const SprintCard = ({ sprint, status, metrics, progress, healthColor, isSelected, onSelect, onEdit, onDelete, onStart, onComplete, userRole }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Active':
        return 'from-emerald-400 to-green-400';
      case 'Completed':
        return 'from-blue-400 to-cyan-400';
      case 'Planning':
        return 'from-amber-400 to-orange-400';
      default:
        return 'from-gray-400 to-slate-400';
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
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-white rounded-xl border-2 ${
        isSelected ? 'border-cyan-400 shadow-xl' : 'border-gray-200 shadow-md hover:shadow-lg'
      } transition-all duration-300 cursor-pointer overflow-hidden`}
      onClick={onSelect}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Card Content */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{sprint.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(parseISO(sprint.start_date), 'MMM dd')} - {format(parseISO(sprint.end_date), 'MMM dd')}
            </p>
          </div>
          <div className="relative px-3 py-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-50 blur-md"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
              <motion.div
                className="h-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              ></motion.div>
            </div>
            <div className="relative flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              <span>{status}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
            ></motion.div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-cyan-200">
            <div className="text-lg font-bold text-cyan-700">{metrics.totalTasks || 0}</div>
            <div className="text-xs text-cyan-600">Tasks</div>
          </div>
          <div className="text-center p-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-700">{metrics.completedTasks || 0}</div>
            <div className="text-xs text-green-600">Done</div>
          </div>
          <div className="text-center p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{metrics.pendingTasks || 0}</div>
            <div className="text-xs text-amber-600">Open</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${healthColor}`}></div>
            <span className="text-xs text-gray-600">
              {getRemainingDays(sprint)} days left
            </span>
          </div>

          {userRole === 'manager' && (
            <div className="flex items-center gap-1">
              {status === 'Planning' && onStart && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onStart(); }}
                  className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 text-white rounded-lg shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiPlay className="w-3 h-3" />
                </motion.button>
              )}
              {status === 'Active' && onComplete && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="p-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-lg shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiCheckCircle className="w-3 h-3" />
                </motion.button>
              )}
              {onEdit && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiEdit2 className="w-3 h-3" />
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
