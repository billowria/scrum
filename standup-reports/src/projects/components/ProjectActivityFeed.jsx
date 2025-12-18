import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiActivity, FiPlus, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import Avatar from '../../components/shared/Avatar';

const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'created_section': return <FiPlus className="w-4 h-4 text-green-600 dark:text-green-400" />;
            case 'created_topic': return <FiPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'added_content': return <FiEdit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
            case 'updated_status': return <FiCheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
            default: return <FiActivity className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getMessage = (activity) => {
        const { action_type, details } = activity;
        switch (action_type) {
            case 'created_section': return <span className="text-gray-600 dark:text-gray-300">created section <strong className="text-gray-900 dark:text-white">{details.name}</strong></span>;
            case 'created_topic': return <span className="text-gray-600 dark:text-gray-300">added topic <strong className="text-gray-900 dark:text-white">{details.name}</strong></span>;
            case 'added_content': return <span className="text-gray-600 dark:text-gray-300">updated content in <strong className="text-gray-900 dark:text-white">{details.topicName}</strong></span>;
            case 'updated_status': return <span className="text-gray-600 dark:text-gray-300">changed status to <strong className="text-gray-900 dark:text-white">{details.status}</strong></span>;
            default: return <span className="text-gray-600 dark:text-gray-300">performed an action</span>;
        }
    };

    return (
        <div className="flex gap-4 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
            <div className="mt-1">
                <Avatar user={activity.user} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{activity.user?.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                    </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="p-1 bg-gray-100 dark:bg-slate-800 rounded-full">
                        {getIcon(activity.action_type)}
                    </span>
                    {getMessage(activity)}
                </p>
            </div>
        </div>
    );
};

const ProjectActivityFeed = ({ isOpen, onClose, activities = [], loading }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-gray-100 dark:border-slate-800"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">Activity Log</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse flex gap-4">
                                            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                                                <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                    <FiActivity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No activity yet</p>
                                </div>
                            ) : (
                                activities.map(activity => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProjectActivityFeed;
