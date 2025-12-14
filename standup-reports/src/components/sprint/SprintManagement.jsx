import React, { useState } from 'react';
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
  FiList
} from 'react-icons/fi';
import { getSprintStatus } from '../../utils/sprintUtils';
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
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Your Projects
              </h2>

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
                <span className="font-medium text-gray-700">Back to Projects</span>
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
                    <span className="font-semibold">{filteredSprints.filter(s => s.project_id === selectedProjectId).length} sprint{filteredSprints.filter(s => s.project_id === selectedProjectId).length !== 1 ? 's' : ''}</span>
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

export default SprintManagement;
