import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiPlay, FiCheckCircle, FiClock, FiEdit2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { getRemainingDays } from '../../utils/sprintUtils';

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
            className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 ${isSelected ? 'border-purple-400 shadow-2xl' : 'border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl'
                } transition-all duration-300 cursor-pointer overflow-hidden group h-full flex flex-col`}
            onClick={onSelect}
        >
            {/* Glassmorphic Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 dark:from-purple-900/20 via-pink-50/20 dark:via-pink-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Selection Indicator */}
            {isSelected && (
                <motion.div
                    className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                />
            )}

            {/* Card Content */}
            <div className="relative p-6 flex-1 flex flex-col space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {sprint.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FiCalendar className="w-4 h-4" />
                            <span>{format(parseISO(sprint.start_date), 'MMM dd')} - {format(parseISO(sprint.end_date), 'MMM dd')}</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`relative px-4 py-2 bg-gradient-to-r ${getStatusGradient()} text-white text-xs font-bold rounded-xl shadow-lg overflow-hidden flex-shrink-0`}>
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
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
                        <span className="font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                    </div>

                    {/* Circular Progress Ring */}
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700 mt-auto">
                    <div className="flex items-center gap-2">
                        <motion.div
                            className={`w-2.5 h-2.5 rounded-full ${healthColor}`}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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

export default SprintCard;
