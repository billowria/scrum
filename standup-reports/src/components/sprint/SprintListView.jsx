import React from 'react';
import { motion } from 'framer-motion';
import {
    FiTarget,
    FiCalendar,
    FiCheckCircle,
    FiPlay,
    FiEdit2,
    FiClock,
    FiEye
} from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { getSprintStatus, getRemainingDays, getSprintMetrics, calculateSprintProgress } from '../../utils/sprintUtils';
import { useTheme } from '../../context/ThemeContext';

const SprintListView = ({
    sprints,
    getSprintTasks,
    onSelectSprint,
    onEditSprint,
    onStartSprint,
    onCompleteSprint,
    userRole,
    selectedSprintId
}) => {
    const { themeMode } = useTheme();
    const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);
    const isDark = themeMode === 'dark' || isPremiumTheme;

    const getStatusColor = (status) => {
        if (isPremiumTheme) {
            switch (status) {
                case 'Active':
                    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
                case 'Completed':
                    return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
                case 'Planning':
                    return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
                default:
                    return 'bg-white/10 text-white/70 border-white/20';
            }
        }
        switch (status) {
            case 'Active':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
            case 'Completed':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
            case 'Planning':
                return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
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

    // Theme-aware styles
    const headerBg = isPremiumTheme
        ? 'bg-white/[0.05] border-white/10'
        : 'bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-slate-700/50';

    const rowBg = isPremiumTheme
        ? 'bg-white/[0.06] border-white/10 hover:border-white/20'
        : 'bg-white/90 dark:bg-slate-800/90 border-gray-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/50';

    const selectedRowBg = isPremiumTheme
        ? 'border-purple-400/50 shadow-lg ring-1 ring-purple-500/20'
        : 'border-purple-400 dark:border-purple-500 shadow-md ring-1 ring-purple-100 dark:ring-purple-900/20';

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className={`${headerBg} px-6 py-4 rounded-2xl border shadow-sm backdrop-blur-sm`}>
                <div className={`grid grid-cols-12 gap-4 text-sm font-semibold 
                    ${isPremiumTheme ? 'text-white/70' : 'text-gray-700 dark:text-gray-300'}`}>
                    <div className="col-span-3">Sprint Name</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Dates</div>
                    <div className="col-span-2 text-center">Progress</div>
                    <div className="col-span-2 text-center">Tasks</div>
                    <div className="col-span-1 text-center">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="space-y-3">
                {sprints.map((sprint, index) => {
                    const sprintTasks = getSprintTasks(sprint.id);
                    const status = getSprintStatus(sprint);
                    const metrics = getSprintMetrics(sprint, sprintTasks);
                    const progress = calculateSprintProgress(sprint);
                    const StatusIcon = getStatusIcon(status);
                    const remainingDays = getRemainingDays(sprint);
                    const isSelected = selectedSprintId === sprint.id;

                    return (
                        <motion.div
                            key={sprint.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer backdrop-blur-sm
                                ${isSelected ? selectedRowBg : rowBg}`}
                            onClick={(e) => { e.stopPropagation(); onSelectSprint && onSelectSprint(sprint); }}
                        >
                            {/* Hover Gradient Overlay */}
                            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                                ${isPremiumTheme
                                    ? 'bg-gradient-to-r from-white/[0.03] to-transparent'
                                    : 'bg-gradient-to-r from-purple-50/30 to-pink-50/20 dark:from-purple-900/10 dark:to-pink-900/5'}`}
                            />

                            <div className="relative grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                {/* Sprint Name */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm flex-shrink-0">
                                            <FiTarget className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate text-sm transition-colors
                                                ${isPremiumTheme
                                                    ? 'text-white group-hover:text-purple-300'
                                                    : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
                                                {sprint.name}
                                            </h3>
                                            {remainingDays > 0 && status === 'Active' && (
                                                <p className={`text-xs font-medium
                                                    ${isPremiumTheme ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {remainingDays} days left
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 flex justify-center">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getStatusColor(status)}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">{status}</span>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="col-span-2 text-center">
                                    <div className={`text-xs ${isPremiumTheme ? 'text-white/60' : 'text-gray-600 dark:text-gray-400'}`}>
                                        <div>{format(parseISO(sprint.start_date), 'MMM dd')}</div>
                                        <div className={isPremiumTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}>to</div>
                                        <div>{format(parseISO(sprint.end_date), 'MMM dd')}</div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="col-span-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center">
                                            <span className={`text-sm font-bold ${isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full overflow-hidden
                                            ${isPremiumTheme ? 'bg-white/10' : 'bg-gray-200 dark:bg-slate-700'}`}>
                                            <motion.div
                                                className={`h-full rounded-full ${status === 'Active' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                    status === 'Completed' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                                        'bg-gradient-to-r from-amber-500 to-orange-500'
                                                    }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div className="col-span-2 text-center">
                                    <div className="inline-flex items-center gap-2">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded
                                            ${isPremiumTheme
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'}`}>
                                            <FiCheckCircle className="w-3 h-3" />
                                            <span className="text-xs font-bold">{metrics.completedTasks || 0}</span>
                                        </div>
                                        <span className={`text-xs ${isPremiumTheme ? 'text-white/30' : 'text-gray-400 dark:text-slate-600'}`}>/</span>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded
                                            ${isPremiumTheme
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'}`}>
                                            <span className="text-xs font-bold">{metrics.totalTasks || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex items-center justify-center gap-1">
                                    {userRole === 'manager' && (
                                        <>
                                            {status === 'Planning' && onStartSprint && (
                                                <motion.button
                                                    onClick={(e) => { e.stopPropagation(); onStartSprint(sprint.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors
                                                        ${isPremiumTheme
                                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800'}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Start Sprint"
                                                >
                                                    <FiPlay className="w-3.5 h-3.5" />
                                                </motion.button>
                                            )}
                                            {status === 'Active' && onCompleteSprint && (
                                                <motion.button
                                                    onClick={(e) => { e.stopPropagation(); onCompleteSprint(sprint.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors
                                                        ${isPremiumTheme
                                                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Complete Sprint"
                                                >
                                                    <FiCheckCircle className="w-3.5 h-3.5" />
                                                </motion.button>
                                            )}
                                            {onEditSprint && (
                                                <motion.button
                                                    onClick={(e) => { e.stopPropagation(); onEditSprint(sprint); }}
                                                    className={`p-1.5 rounded-lg transition-colors
                                                        ${isPremiumTheme
                                                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800'}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Edit Sprint"
                                                >
                                                    <FiEdit2 className="w-3.5 h-3.5" />
                                                </motion.button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty State */}
            {sprints.length === 0 && (
                <div className={`text-center py-12 rounded-2xl border-2 border-dashed
                    ${isPremiumTheme
                        ? 'bg-white/[0.03] border-white/20'
                        : 'bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                    <FiTarget className={`w-12 h-12 mx-auto mb-3 
                        ${isPremiumTheme ? 'text-white/30' : 'text-gray-300 dark:text-gray-600'}`} />
                    <p className={`font-medium ${isPremiumTheme ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}>
                        No sprints found
                    </p>
                </div>
            )}
        </div>
    );
};

export default SprintListView;
