import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiPlay, FiCheckCircle, FiClock, FiEdit2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { getRemainingDays } from '../../utils/sprintUtils';
import { useTheme } from '../../context/ThemeContext';

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
    const { themeMode } = useTheme();
    const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);
    const isDark = themeMode === 'dark' || isPremiumTheme;

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

    // Theme-aware metric card styles
    const getMetricCardStyles = (color) => {
        if (isPremiumTheme) {
            return {
                blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
                emerald: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
                amber: 'bg-amber-500/20 border-amber-400/30 text-amber-300'
            }[color];
        }
        if (isDark) {
            return {
                blue: 'bg-blue-900/40 border-blue-700/50 text-blue-400',
                emerald: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400',
                amber: 'bg-amber-900/40 border-amber-700/50 text-amber-400'
            }[color];
        }
        return {
            blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-blue-700',
            emerald: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 text-emerald-700',
            amber: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 text-amber-700'
        }[color];
    };

    const StatusIcon = getStatusIcon();

    // Card background and border styles
    const cardStyles = isPremiumTheme
        ? `bg-white/[0.06] border-white/10 ${isSelected ? 'border-purple-400/50 shadow-purple-500/20' : 'hover:border-white/20'}`
        : isDark
            ? `bg-slate-800/90 border-slate-700 ${isSelected ? 'border-purple-400 shadow-purple-500/20' : 'hover:border-slate-600'}`
            : `bg-white border-gray-200 ${isSelected ? 'border-purple-400 shadow-purple-100' : 'hover:border-gray-300'}`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative rounded-2xl border-2 ${cardStyles} ${isSelected ? 'shadow-2xl ring-2 ring-purple-500/20' : 'shadow-lg hover:shadow-xl'} 
                transition-all duration-300 cursor-pointer overflow-hidden group h-full flex flex-col backdrop-blur-xl`}
            onClick={onSelect}
        >
            {/* Glassmorphic Overlay on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                ${isPremiumTheme
                    ? 'bg-gradient-to-br from-white/[0.05] to-transparent'
                    : isDark
                        ? 'bg-gradient-to-br from-purple-900/10 via-pink-900/5 to-transparent'
                        : 'bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-transparent'}`}
            />

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
                        <h3 className={`text-lg font-bold truncate mb-2 transition-colors
                            ${isPremiumTheme
                                ? 'text-white group-hover:text-purple-300'
                                : isDark
                                    ? 'text-white group-hover:text-purple-400'
                                    : 'text-gray-900 group-hover:text-purple-600'}`}>
                            {sprint.name}
                        </h3>
                        <div className={`flex items-center gap-2 text-sm ${isPremiumTheme ? 'text-white/60' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                        <span className={`font-medium ${isPremiumTheme ? 'text-white/60' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>Progress</span>
                        <span className={`font-bold ${isPremiumTheme ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(progress)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`relative w-full h-3 rounded-full overflow-hidden
                        ${isPremiumTheme ? 'bg-white/10' : isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
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
                    <div className={`text-center p-3 rounded-xl border ${getMetricCardStyles('blue')}`}>
                        <div className="text-xl font-bold">{metrics.totalTasks || 0}</div>
                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-blue-400' : isDark ? 'text-blue-500' : 'text-blue-600'}`}>Tasks</div>
                    </div>
                    <div className={`text-center p-3 rounded-xl border ${getMetricCardStyles('emerald')}`}>
                        <div className="text-xl font-bold">{metrics.completedTasks || 0}</div>
                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-emerald-400' : isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>Done</div>
                    </div>
                    <div className={`text-center p-3 rounded-xl border ${getMetricCardStyles('amber')}`}>
                        <div className="text-xl font-bold">{metrics.pendingTasks || 0}</div>
                        <div className={`text-xs font-medium ${isPremiumTheme ? 'text-amber-400' : isDark ? 'text-amber-500' : 'text-amber-600'}`}>Open</div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`flex items-center justify-between pt-3 border-t mt-auto
                    ${isPremiumTheme ? 'border-white/10' : isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        <motion.div
                            className={`w-2.5 h-2.5 rounded-full ${healthColor}`}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className={`text-sm font-medium ${isPremiumTheme ? 'text-white/60' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                    className={`p-2 rounded-lg transition-colors
                                        ${isPremiumTheme
                                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                            : isDark
                                                ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-800'
                                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
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
