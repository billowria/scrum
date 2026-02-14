import React from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiTarget, FiCheckCircle, FiClock, FiActivity, FiTrendingUp, FiBarChart2, FiAward, FiCalendar } from 'react-icons/fi';
import { getSprintStatus } from '../../utils/sprintUtils';
import { useTheme } from '../../context/ThemeContext';

const ProjectGridView = ({ projects, sprints, getSprintTasks, setSelectedProjectId }) => {
    const { themeMode } = useTheme();
    const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);
    const isDark = themeMode === 'dark' || isPremiumTheme;

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

    // Theme-aware card styles
    const cardBg = isPremiumTheme
        ? 'bg-white/[0.06] border-white/10 hover:border-white/20'
        : 'bg-white/90 dark:bg-slate-800/90 border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50';

    // Theme-aware stat card styles
    const getStatCardStyles = (color) => {
        if (isPremiumTheme) {
            return {
                blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
                emerald: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
                purple: 'bg-purple-500/20 border-purple-400/30 text-purple-300'
            }[color];
        }
        return {
            blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-800/50',
            emerald: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/50',
            purple: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-800/50'
        }[color];
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
                            className={`w-full h-full text-left rounded-2xl border transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl ${cardBg}`}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Gradient Accent Bar */}
                            <div className={`h-2 bg-gradient-to-r ${getProjectGradient(index)}`} />

                            {/* Hover Glow Effect */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                                ${isPremiumTheme
                                    ? 'bg-gradient-to-br from-white/[0.05] via-transparent to-transparent'
                                    : 'bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-transparent dark:from-purple-900/10 dark:via-pink-900/5 dark:to-transparent'}`}
                            />

                            <div className="relative p-6 flex-1 flex flex-col space-y-5">
                                {/* Project Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className={`text-xl font-bold mb-2 transition-colors truncate
                                            ${isPremiumTheme
                                                ? 'text-white group-hover:text-purple-300'
                                                : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
                                            {project.name}
                                        </h3>
                                        {activeSprints > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <motion.div
                                                    className="w-2 h-2 bg-emerald-500 rounded-full"
                                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span className={`text-sm font-semibold ${isPremiumTheme ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {activeSprints} Active Sprint{activeSprints !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className={`text-sm font-medium ${isPremiumTheme ? 'text-white/40' : 'text-gray-400'}`}>
                                                No active sprints
                                            </div>
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
                                                className={isPremiumTheme ? 'text-white/10' : 'text-gray-100 dark:text-slate-700'}
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
                                            <span className={`text-sm font-bold ${isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {completionPercentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sprint Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className={`rounded-xl p-3 border text-center ${getStatCardStyles('blue')}`}>
                                        <div className={`text-xl font-bold ${isPremiumTheme ? 'text-blue-300' : 'text-blue-700 dark:text-blue-400'}`}>
                                            {sprintCount}
                                        </div>
                                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-blue-400' : 'text-blue-600 dark:text-blue-500'}`}>
                                            Sprints
                                        </div>
                                    </div>
                                    <div className={`rounded-xl p-3 border text-center ${getStatCardStyles('emerald')}`}>
                                        <div className={`text-xl font-bold ${isPremiumTheme ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                            {totalTasks}
                                        </div>
                                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                            Tasks
                                        </div>
                                    </div>
                                    <div className={`rounded-xl p-3 border text-center ${getStatCardStyles('purple')}`}>
                                        <div className={`text-xl font-bold ${isPremiumTheme ? 'text-purple-300' : 'text-purple-700 dark:text-purple-400'}`}>
                                            {completedTasks}
                                        </div>
                                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-purple-400' : 'text-purple-600 dark:text-purple-500'}`}>
                                            Done
                                        </div>
                                    </div>
                                </div>

                                {/* Health Indicator (Push to bottom) */}
                                <div className="mt-auto pt-2">
                                    {completedSprints > 0 ? (
                                        <div className={`flex items-center justify-between rounded-xl p-3 border
                                            ${isPremiumTheme
                                                ? 'bg-white/[0.05] border-white/10'
                                                : 'bg-gradient-to-r from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-700/50 border-gray-100 dark:border-slate-700'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-full ${completedSprints / Math.max(sprintCount, 1) > 0.8
                                                    ? isPremiumTheme ? 'bg-emerald-500/20' : 'bg-emerald-100 dark:bg-emerald-900/30'
                                                    : completedSprints / Math.max(sprintCount, 1) > 0.6
                                                        ? isPremiumTheme ? 'bg-blue-500/20' : 'bg-blue-100 dark:bg-blue-900/30'
                                                        : isPremiumTheme ? 'bg-orange-500/20' : 'bg-orange-100 dark:bg-orange-900/30'
                                                    }`}>
                                                    {completedSprints / Math.max(sprintCount, 1) > 0.8 ?
                                                        <FiAward className={`w-4 h-4 ${isPremiumTheme ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`} /> :
                                                        completedSprints / Math.max(sprintCount, 1) > 0.6 ?
                                                            <FiTrendingUp className={`w-4 h-4 ${isPremiumTheme ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} /> :
                                                            <FiBarChart2 className={`w-4 h-4 ${isPremiumTheme ? 'text-orange-400' : 'text-orange-600 dark:text-orange-400'}`} />
                                                    }
                                                </div>
                                                <span className={`text-sm font-semibold ${isPremiumTheme ? 'text-white/70' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    Project Health
                                                </span>
                                            </div>
                                            <div className={`text-lg font-bold ${completedSprints / Math.max(sprintCount, 1) > 0.8
                                                ? isPremiumTheme ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'
                                                : completedSprints / Math.max(sprintCount, 1) > 0.6
                                                    ? isPremiumTheme ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'
                                                    : isPremiumTheme ? 'text-orange-400' : 'text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {Math.round((completedSprints / Math.max(sprintCount, 1)) * 100)}%
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`text-center py-3 rounded-xl border-2 border-dashed
                                            ${isPremiumTheme
                                                ? 'bg-white/[0.03] border-white/20'
                                                : 'bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700'}`}>
                                            <FiCalendar className={`w-5 h-5 mx-auto mb-1 ${isPremiumTheme ? 'text-white/30' : 'text-gray-300 dark:text-gray-600'}`} />
                                            <div className={`text-xs ${isPremiumTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
                                                No sprints completed yet
                                            </div>
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
