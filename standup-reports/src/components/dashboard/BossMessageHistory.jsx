import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';
import {
    FiX, FiSearch, FiCalendar, FiUser, FiCheckCircle,
    FiClock, FiEdit3, FiChevronDown, FiChevronUp
} from 'react-icons/fi';

const CrownIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L9 9L1 6L4 14H20L23 6L15 9L12 1ZM4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16H4Z" />
    </svg>
);

const MessageHistoryItem = ({ message, userRole, onEdit, totalUsers }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [ackStats, setAckStats] = useState(null);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchAckStats();
        }
    }, [message.id, isAdmin]);

    const fetchAckStats = async () => {
        try {
            const { data: reads, error } = await supabase
                .from('announcement_reads')
                .select('user_id, read')
                .eq('announcement_id', message.id)
                .eq('read', true);

            if (error) throw error;

            setAckStats({
                acknowledged: reads?.length || 0,
                total: totalUsers
            });
        } catch (error) {
            console.error('Error fetching ack stats:', error);
        }
    };

    const percentage = ackStats?.total > 0 ? Math.round((ackStats.acknowledged / ackStats.total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 hover:border-amber-400/30 transition-all group"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <CrownIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            Announcement {message.id.split('-')[0].toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                            {format(new Date(message.created_at), 'MMM d, yyyy')}
                        </span>
                    </div>

                    {/* Message preview/full */}
                    <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${!isExpanded && message.content.length > 150 ? 'line-clamp-2' : ''}`}>
                        {message.content}
                    </p>

                    {message.content.length > 150 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-amber-500 hover:text-amber-600 mt-2 flex items-center gap-1"
                        >
                            {isExpanded ? (
                                <>
                                    <FiChevronUp className="w-3 h-3" /> Show less
                                </>
                            ) : (
                                <>
                                    <FiChevronDown className="w-3 h-3" /> Read more
                                </>
                            )}
                        </button>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-400/50">
                                {message.users?.avatar_url ? (
                                    <img src={message.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-black">
                                        {message.users?.name?.[0]}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{message.users?.name}</span>
                        </div>

                        {isAdmin && ackStats && (
                            <>
                                <div className="h-3 w-[1px] bg-gray-300 dark:bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <FiCheckCircle className="w-3 h-3 text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {ackStats.acknowledged}/{ackStats.total} ({percentage}%)
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                    <button
                        onClick={() => onEdit(message)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Edit"
                    >
                        <FiEdit3 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const BossMessageHistory = ({ isOpen, onClose, userRole, onEdit }) => {
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);

    const { currentCompany } = useCompany();
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (isOpen && currentCompany?.id) {
            fetchMessages();
            if (isAdmin) {
                fetchTotalUsers();
            }
        }
    }, [isOpen, currentCompany?.id, isAdmin]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = messages.filter(m =>
                m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.users?.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredMessages(filtered);
        } else {
            setFilteredMessages(messages);
        }
    }, [searchQuery, messages]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select(`
          id, content, created_at, created_by, expiry_date,
          users:created_by (id, name, avatar_url)
        `)
                .eq('notification_type', 'boss_message')
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setMessages(data || []);
            setFilteredMessages(data || []);
        } catch (error) {
            console.error('Error fetching message history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTotalUsers = async () => {
        try {
            const { count, error } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);

            if (error) throw error;
            setTotalUsers(count || 0);
        } catch (error) {
            console.error('Error fetching total users:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="w-full max-w-3xl max-h-[80vh] rounded-[2.5rem] bg-white/90 dark:bg-slate-950/90 border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 pb-6 border-b border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                                    <FiCalendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Message History</h2>
                                    <p className="text-sm text-gray-500">
                                        {filteredMessages.length} {filteredMessages.length === 1 ? 'decree' : 'decrees'} from the boss
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-all">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-purple-400 focus:outline-none text-sm text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-purple-500"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-purple-500"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-purple-500"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    />
                                </div>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <FiCalendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery ? 'No messages found matching your search.' : 'No messages yet. The boss hasn\'t issued any decrees.'}
                                </p>
                            </div>
                        ) : (
                            filteredMessages.map((message) => (
                                <MessageHistoryItem
                                    key={message.id}
                                    message={message}
                                    userRole={userRole}
                                    onEdit={onEdit}
                                    totalUsers={totalUsers}
                                />
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BossMessageHistory;
