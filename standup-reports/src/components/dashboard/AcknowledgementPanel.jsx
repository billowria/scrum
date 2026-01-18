import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiCheckCircle, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const AcknowledgementPanel = ({ stats }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!stats) return null;

    const percentage = stats.total > 0 ? Math.round((stats.acknowledged / stats.total) * 100) : 0;

    return (
        <div className="space-y-3">
            {/* Summary Bar */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        {stats.acknowledged}/{stats.total} acknowledged
                    </span>
                </div>

                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>

                <span className="text-xs font-black text-emerald-500">{percentage}%</span>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                    {isExpanded ? (
                        <FiChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <FiChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Acknowledged Users */}
                            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                        Acknowledged ({stats.acknowledgedUsers.length})
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {stats.acknowledgedUsers.map((user) => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-300 dark:border-emerald-500/30">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black">
                                                        {user.name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-700 dark:text-gray-100 font-medium">{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pending Users */}
                            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <FiClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">
                                        Pending ({stats.pendingUsers.length})
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {stats.pendingUsers.map((user) => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-300 dark:border-amber-500/30">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-black">
                                                        {user.name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-700 dark:text-gray-100 font-medium">{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcknowledgementPanel;
