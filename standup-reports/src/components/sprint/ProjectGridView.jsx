import React from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiTarget, FiCheckCircle, FiClock, FiActivity, FiTrendingUp, FiBarChart2, FiAward, FiCalendar } from 'react-icons/fi';
import { getSprintStatus } from '../../utils/sprintUtils';

const ProjectGridView = ({ projects, sprints, getSprintTasks, setSelectedProjectId }) => {
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
                        className="group relative h-full"
                    >
                        <motion.button
                            onClick={() => setSelectedProjectId(project.id)}
                            className="w-full h-full text-left bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden flex flex-col"
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Gradient Accent Bar */}
                            <div className={`h-2 bg-gradient-to-r ${getProjectGradient(index)}`} />

                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="relative p-6 flex-1 flex flex-col space-y-5">
                                {/* Project Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                            {project.name}
                                        </h3>
                                        {activeSprints > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <motion.div
                                                    className="w-2 h-2 bg-emerald-500 rounded-full"
                                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {activeSprints} Active Sprint{activeSprints !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 font-medium">No active sprints</div>
                                        )}
                                    </div>

                                    {/* Circular Progress Ring */}
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <svg className="w-16 h-16 transform -rotate-90">
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="28"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                                className="text-gray-100 dark:text-slate-700"
                                            />
                                            <motion.circle
                                                cx="32"
                                                cy="32"
                                                r="28"
                                                stroke={`url(#gradient-${project.id})`}
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
                                                <linearGradient id={`gradient-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#8B5CF6" />
                                                    <stop offset="100%" stopColor="#EC4899" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sprint Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/50 text-center">
                                        <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{sprintCount}</div>
                                        <div className="text-xs font-medium text-blue-600 dark:text-blue-500">Sprints</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{totalTasks}</div>
                                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-500">Tasks</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/50 text-center">
                                        <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{completedTasks}</div>
                                        <div className="text-xs font-medium text-purple-600 dark:text-purple-500">Done</div>
                                    </div>
                                </div>

                                {/* Health Indicator (Push to bottom) */}
                                <div className="mt-auto pt-2">
                                    {completedSprints > 0 ? (
                                        <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100">
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
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project Health</span>
                                            </div>
                                            <div className={`text-lg font-bold ${completedSprints / Math.max(sprintCount, 1) > 0.8 ? 'text-emerald-600' :
                                                completedSprints / Math.max(sprintCount, 1) > 0.6 ? 'text-blue-600' : 'text-orange-600'
                                                }`}>
                                                {Math.round((completedSprints / Math.max(sprintCount, 1)) * 100)}%
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                                            <FiCalendar className="w-5 h-5 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                                            <div className="text-xs text-gray-400 dark:text-gray-500">No sprints completed yet</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

export default ProjectGridView;
