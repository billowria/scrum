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
import { getSprintStatus, getRemainingDays } from '../../utils/sprintUtils';

const SprintListView = ({
    sprints,
    getSprintTasks,
    getSprintMetrics,
    calculateSprintProgress,
    onSelectSprint,
    onEditSprint,
    onStartSprint,
    onCompleteSprint,
    userRole,
    selectedSprintId
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Completed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Planning':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
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

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-3">Sprint Name</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Dates</div>
                    <div className="col-span-2 text-center">Progress</div>
                    <div className="col-span-2 text-center">Tasks</div>
                    <div className="col-span-1 text-center">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
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
                            className={`group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 transition-all duration-200 ${isSelected ? 'bg-purple-50/50 border-l-4 border-l-purple-500' : ''
                                }`}
                        >
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                {/* Sprint Name */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm">
                                            <FiTarget className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate text-sm group-hover:text-purple-600 transition-colors">
                                                {sprint.name}
                                            </h3>
                                            {remainingDays > 0 && status === 'Active' && (
                                                <p className="text-xs text-gray-500">{remainingDays} days left</p>
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
                                    <div className="text-xs text-gray-600">
                                        <div>{format(parseISO(sprint.start_date), 'MMM dd')}</div>
                                        <div className="text-gray-400">to</div>
                                        <div>{format(parseISO(sprint.end_date), 'MMM dd')}</div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="col-span-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
                                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded">
                                            <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700">{metrics.completedTasks || 0}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">/</span>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
                                            <span className="text-xs font-bold text-blue-700">{metrics.totalTasks || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex items-center justify-center gap-1">
                                    <motion.button
                                        onClick={(e) => { e.stopPropagation(); onSelectSprint && onSelectSprint(sprint); }}
                                        className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="View Sprint"
                                    >
                                        <FiEye className="w-3.5 h-3.5" />
                                    </motion.button>

                                    {userRole === 'manager' && (
                                        <>
                                            {status === 'Planning' && onStartSprint && (
                                                <motion.button
                                                    onClick={(e) => { e.stopPropagation(); onStartSprint(sprint.id); }}
                                                    className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
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
                                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
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
                                                    className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
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
                <div className="text-center py-12">
                    <FiTarget className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No sprints found</p>
                </div>
            )}
        </div>
    );
};

export default SprintListView;
