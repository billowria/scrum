import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiActivity, FiPlus, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import Avatar from '../../components/shared/Avatar';

const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'created_section': return <FiPlus className="w-4 h-4 text-green-600" />;
            case 'created_topic': return <FiPlus className="w-4 h-4 text-blue-600" />;
            case 'added_content': return <FiEdit2 className="w-4 h-4 text-indigo-600" />;
            case 'updated_status': return <FiCheckCircle className="w-4 h-4 text-orange-600" />;
            default: return <FiActivity className="w-4 h-4 text-gray-600" />;
        }
    };

    const getMessage = (activity) => {
        const { action_type, details } = activity;
        switch (action_type) {
            case 'created_section': return <span>created section <strong>{details.name}</strong></span>;
            case 'created_topic': return <span>added topic <strong>{details.name}</strong></span>;
            case 'added_content': return <span>updated content in <strong>{details.topicName}</strong></span>;
            case 'updated_status': return <span>changed status to <strong>{details.status}</strong></span>;
            default: return <span>performed an action</span>;
        }
    };

    return (
        <div className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
            <div className="mt-1">
                <Avatar user={activity.user} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{activity.user?.name}</span>
                    <span className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleString()}
                    </span>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="p-1 bg-gray-100 rounded-full">
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
                        className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Activity Log</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse flex gap-4">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
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
