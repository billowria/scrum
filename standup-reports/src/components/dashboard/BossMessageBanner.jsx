import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';
import {
    FiX, FiEdit3, FiSend, FiInfo, FiChevronLeft, FiChevronRight,
    FiCheckCircle, FiClock, FiUsers, FiArchive
} from 'react-icons/fi';
import BossMessageHistory from './BossMessageHistory';
import BossMessageComposer from './BossMessageComposer';
import AcknowledgementPanel from './AcknowledgementPanel';

// Crown icon component
const CrownIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L9 9L1 6L4 14H20L23 6L15 9L12 1ZM4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16H4Z" />
    </svg>
);

// Magnetic Cursor Effect Hook
const useMagnetic = (ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { damping: 20, stiffness: 150 });
    const springY = useSpring(y, { damping: 20, stiffness: 150 });

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const strength = 15;
        x.set((clientX - centerX) / strength);
        y.set((clientY - centerY) / strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return { springX, springY, handleMouseMove, handleMouseLeave };
};

// Typewriter text component
const TypewriterText = ({ text, onComplete, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!text) return;
        let currentIndex = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                    setIsComplete(true);
                    onComplete?.();
                }
            }, 20);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay, onComplete]);

    return (
        <span className="relative">
            {displayedText}
            {!isComplete && (
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-[3px] h-[1.1em] bg-amber-400 ml-1 align-middle"
                />
            )}
        </span>
    );
};

// Main Boss Message Banner Component
const BossMessageBanner = ({ userRole, className = '' }) => {
    const [messages, setMessages] = useState([]);
    const [lastAcknowledged, setLastAcknowledged] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sender, setSender] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showComposer, setShowComposer] = useState(false);
    const [composerMode, setComposerMode] = useState('create');
    const [editingMessage, setEditingMessage] = useState(null);
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const [ackStats, setAckStats] = useState(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    const containerRef = useRef(null);
    const iconRef = useRef(null);
    const isInView = useInView(containerRef, { once: true });
    const { themeMode, isAnimatedTheme } = useTheme();
    const { currentCompany } = useCompany();
    const isAdmin = userRole === 'admin';

    const { springX, springY, handleMouseMove, handleMouseLeave } = useMagnetic(iconRef);

    const currentMessage = messages[currentIndex] || null;

    // Fetch unacknowledged messages for current user
    const fetchUnacknowledgedMessages = async () => {
        if (!currentCompany?.id) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString();

            // Get all active boss messages
            const { data: allMessages, error: messagesError } = await supabase
                .from('announcements')
                .select(`
          id, content, created_at, expiry_date, created_by,
          users:created_by (id, name, avatar_url, role)
        `)
                .eq('notification_type', 'boss_message')
                .eq('company_id', currentCompany.id)
                .gte('expiry_date', today)
                .order('created_at', { ascending: false });

            if (messagesError) throw messagesError;

            if (!allMessages || allMessages.length === 0) {
                setMessages([]);
                setIsLoading(false);
                return;
            }

            // Get user's read records
            const { data: readRecords, error: readsError } = await supabase
                .from('announcement_reads')
                .select('announcement_id, read, read_at')
                .eq('user_id', user.id)
                .in('announcement_id', allMessages.map(m => m.id));

            if (readsError) throw readsError;

            // Filter to unacknowledged messages
            const acknowledgedIds = (readRecords || [])
                .filter(r => r.read)
                .map(r => r.announcement_id);

            const unacknowledged = allMessages.filter(m => !acknowledgedIds.includes(m.id));

            setMessages(unacknowledged);
            if (unacknowledged.length > 0) {
                setSender(unacknowledged[0].users);
                setLastAcknowledged(null);
            } else {
                // All acknowledged - find the most recently acknowledged one
                const acknowledgedMessages = allMessages.filter(m => acknowledgedIds.includes(m.id));
                if (acknowledgedMessages.length > 0) {
                    const readsWithTimestamp = readRecords.filter(r => r.read && r.read_at);
                    const mostRecentRead = readsWithTimestamp.sort((a, b) =>
                        new Date(b.read_at) - new Date(a.read_at)
                    )[0];

                    const lastMsg = allMessages.find(m => m.id === mostRecentRead?.announcement_id);
                    if (lastMsg) {
                        setLastAcknowledged(lastMsg);
                        setSender(lastMsg.users);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching unacknowledged messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch acknowledgement stats for admin
    const fetchAcknowledgementStats = async (messageId) => {
        if (!isAdmin || !messageId || !currentCompany?.id) return;

        try {
            // Get total company users
            const { data: allUsers, error: usersError } = await supabase
                .from('users')
                .select('id, name, avatar_url')
                .eq('company_id', currentCompany.id);

            if (usersError) throw usersError;

            // Get reads for this message
            const { data: reads, error: readsError } = await supabase
                .from('announcement_reads')
                .select('user_id, read, read_at, users:user_id(id, name, avatar_url)')
                .eq('announcement_id', messageId)
                .eq('read', true);

            if (readsError) throw readsError;

            const acknowledgedUserIds = (reads || []).map(r => r.user_id);
            const acknowledgedUsers = (reads || []).map(r => ({
                ...r.users,
                read_at: r.read_at
            }));
            const pendingUsers = (allUsers || []).filter(u => !acknowledgedUserIds.includes(u.id));

            setAckStats({
                total: allUsers?.length || 0,
                acknowledged: acknowledgedUsers.length,
                acknowledgedUsers,
                pendingUsers
            });
        } catch (error) {
            console.error('Error fetching acknowledgement stats:', error);
        }
    };

    // Subscribe to real-time updates
    useEffect(() => {
        if (!currentCompany?.id) return;

        fetchUnacknowledgedMessages();

        const announcementsChannel = supabase
            .channel('boss-message-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'announcements',
                filter: `notification_type=eq.boss_message`
            }, () => {
                fetchUnacknowledgedMessages();
                setHasAnimated(false);
            })
            .subscribe();

        const readsChannel = supabase
            .channel('announcement-reads-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'announcement_reads'
            }, () => {
                fetchUnacknowledgedMessages();
                if (currentMessage) {
                    fetchAcknowledgementStats(currentMessage.id);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(announcementsChannel);
            supabase.removeChannel(readsChannel);
        };
    }, [currentCompany?.id]);

    // Fetch ack stats when current message changes
    useEffect(() => {
        if (currentMessage && isAdmin) {
            fetchAcknowledgementStats(currentMessage.id);
        }
    }, [currentMessage?.id, isAdmin]);

    // Handle acknowledgement
    const handleAcknowledge = async () => {
        if (!currentMessage || isAcknowledging) return;

        setIsAcknowledging(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('announcement_reads')
                .upsert({
                    announcement_id: currentMessage.id,
                    user_id: user.id,
                    read: true,
                    read_at: new Date().toISOString()
                }, {
                    onConflict: 'announcement_id,user_id'
                });

            if (error) throw error;

            // Remove current message from queue
            const newMessages = messages.filter((_, idx) => idx !== currentIndex);
            setMessages(newMessages);

            // Adjust current index
            if (currentIndex >= newMessages.length && newMessages.length > 0) {
                setCurrentIndex(newMessages.length - 1);
            } else if (newMessages.length === 0) {
                setCurrentIndex(0);
            }

            setHasAnimated(false);
        } catch (error) {
            console.error('Error acknowledging message:', error);
        } finally {
            setIsAcknowledging(false);
        }
    };

    // Navigate messages
    const goToPrevMessage = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setHasAnimated(false);
        }
    };

    const goToNextMessage = () => {
        if (currentIndex < messages.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setHasAnimated(false);
        }
    };

    // Broadcast ID generation
    const broadcastId = useMemo(() => {
        if (!currentMessage?.id) return 'B-0000';
        return `B-${currentMessage.id.split('-')[0].toUpperCase()}`;
    }, [currentMessage?.id]);

    // Handle composer
    const handleOpenComposer = (mode, message = null) => {
        setComposerMode(mode);
        setEditingMessage(message);
        setShowComposer(true);
    };

    const handleCloseComposer = () => {
        setShowComposer(false);
        setEditingMessage(null);
    };

    const handleSubmitMessage = async (content) => {
        const { data: { user } } = await supabase.auth.getUser();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        if (composerMode === 'edit' && editingMessage?.id) {
            await supabase.from('announcements')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', editingMessage.id);
        } else {
            await supabase.from('announcements').insert({
                title: 'Words from the Boss',
                content,
                notification_type: 'boss_message',
                priority: 'High',
                created_by: user.id,
                company_id: currentCompany.id,
                expiry_date: expiryDate.toISOString()
            });
        }

        fetchUnacknowledgedMessages();
        handleCloseComposer();
    };

    const showBanner = messages.length > 0 || lastAcknowledged || isAdmin;
    if (!isLoading && !showBanner) return null;

    const displayMessage = currentMessage || lastAcknowledged;
    const isShowingAcknowledged = !currentMessage && lastAcknowledged;

    return (
        <div className={`w-full ${className} px-4 sm:px-6 lg:px-8`} ref={containerRef}>
            <AnimatePresence>
                {!isDismissed && showBanner ? (
                    isShowingAcknowledged && isCollapsed ? (
                        // Collapsed mini-banner for last acknowledged message
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center py-4"
                        >
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-md text-xs font-bold text-amber-500 uppercase tracking-widest transition-all hover:bg-amber-500/10 hover:scale-105 group"
                            >
                                <CrownIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>Last Announcement</span>
                                <span className="text-[10px] text-gray-400">({formatDistanceToNow(new Date(lastAcknowledged.created_at), { addSuffix: true })})</span>
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full group"
                        >
                            {/* Glass Container */}
                            <div className="absolute inset-0 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm rounded-[3rem] border border-white/10 dark:border-white/5 shadow-2xl" />

                            <div className="relative z-10 p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">

                                {/* Left: Icon & Heading */}
                                <div className="flex items-center gap-6 flex-shrink-0">
                                    <div
                                        ref={iconRef}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        className="relative cursor-pointer"
                                    >
                                        <motion.div
                                            style={{ x: springX, y: springY }}
                                            className="w-20 h-20 rounded-3xl bg-white/5 border border-amber-400/30 flex items-center justify-center relative overflow-hidden group/icon transition-all duration-300 hover:border-amber-400"
                                        >
                                            <div className="absolute inset-0 bg-amber-400/5 group-hover/icon:bg-amber-400/10 transition-all" />
                                            <CrownIcon className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                        </motion.div>

                                        {isInView && (
                                            <motion.div
                                                className="absolute inset-0 rounded-3xl border border-amber-400"
                                                initial={{ opacity: 0, scale: 1 }}
                                                animate={{ opacity: [0.3, 0], scale: [1, 1.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <motion.div
                                            className="flex items-center gap-2 mb-1"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                                Announcement {broadcastId}
                                            </span>
                                            {messages.length > 0 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </motion.div>
                                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                            Words from <br className="hidden sm:block" /> the <span className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Boss</span>
                                        </h2>
                                    </div>
                                </div>

                                {/* Center: Message */}
                                <div className="flex-1 max-w-2xl relative group/message">
                                    <div className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed italic max-h-32 overflow-y-auto overflow-x-hidden break-words scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent pr-2">
                                        {currentMessage ? (
                                            <TypewriterText
                                                text={currentMessage.content}
                                                onComplete={() => setHasAnimated(true)}
                                                delay={500}
                                            />
                                        ) : (
                                            <span className="text-gray-400 opacity-50">No active announcements. {isAdmin && 'Create one to notify your team.'}</span>
                                        )}
                                    </div>

                                    {/* Message metadata */}
                                    {currentMessage && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-6 flex flex-wrap items-center gap-6"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400/50">
                                                    {sender?.avatar_url ? (
                                                        <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-black">{sender?.name?.[0]}</div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{sender?.name || 'Administrator'}</span>
                                            </div>

                                            <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />

                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {formatDistanceToNow(new Date(currentMessage.created_at), { addSuffix: true })}
                                            </span>

                                            {/* Message navigation */}
                                            {messages.length > 1 && (
                                                <>
                                                    <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={goToPrevMessage}
                                                            disabled={currentIndex === 0}
                                                            className="p-1 rounded-lg hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <FiChevronLeft className="w-4 h-4 text-amber-500" />
                                                        </button>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase">
                                                            {currentIndex + 1} / {messages.length}
                                                        </span>
                                                        <button
                                                            onClick={goToNextMessage}
                                                            disabled={currentIndex === messages.length - 1}
                                                            className="p-1 rounded-lg hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <FiChevronRight className="w-4 h-4 text-amber-500" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Admin: Acknowledgement stats */}
                                    {isAdmin && currentMessage && ackStats && (
                                        <div className="mt-4">
                                            <AcknowledgementPanel stats={ackStats} />
                                        </div>
                                    )}
                                </div>

                                {/* Right: Actions */}
                                <div className="flex lg:flex-col gap-3 flex-shrink-0">
                                    {/* History button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowHistory(true)}
                                        className="w-12 h-12 rounded-2xl bg-gray-500/5 text-gray-400 border border-gray-500/10 flex items-center justify-center transition-all hover:bg-purple-500/10 hover:text-purple-500"
                                        title="View History"
                                    >
                                        <FiArchive className="w-5 h-5" />
                                    </motion.button>

                                    {isAdmin && (
                                        <>
                                            {/* New decree button */}
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleOpenComposer('create')}
                                                className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center transition-all hover:bg-amber-500 hover:text-white hover:shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)]"
                                                title="New Announcement"
                                            >
                                                <FiSend className="w-5 h-5" />
                                            </motion.button>

                                            {/* Edit button */}
                                            {currentMessage && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleOpenComposer('edit', currentMessage)}
                                                    className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center transition-all hover:bg-blue-500 hover:text-white"
                                                    title="Edit Message"
                                                >
                                                    <FiEdit3 className="w-5 h-5" />
                                                </motion.button>
                                            )}
                                        </>
                                    )}

                                    {/* Acknowledge button (non-admin) */}
                                    {!isAdmin && currentMessage && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAcknowledge}
                                            disabled={isAcknowledging}
                                            className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center transition-all hover:bg-emerald-500 hover:text-white hover:shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-50"
                                            title="I Acknowledge"
                                        >
                                            <FiCheckCircle className="w-5 h-5" />
                                        </motion.button>
                                    )}

                                    {/* Dismiss */}
                                    {currentMessage && !isAdmin && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsDismissed(true)}
                                            className="w-12 h-12 rounded-2xl bg-gray-500/5 text-gray-400 border border-gray-500/10 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <FiX className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                ) : messages.length > 0 && isDismissed ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center py-4"
                    >
                        <button
                            onClick={() => setIsDismissed(false)}
                            className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-md text-xs font-bold text-amber-500 uppercase tracking-widest transition-all hover:bg-amber-500/10 hover:scale-105"
                        >
                            <CrownIcon className="w-4 h-4" />
                            Words from the Boss ({messages.length})
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Modals */}
            <BossMessageHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                userRole={userRole}
                onEdit={(msg) => handleOpenComposer('edit', msg)}
            />

            <BossMessageComposer
                isOpen={showComposer}
                onClose={handleCloseComposer}
                onSubmit={handleSubmitMessage}
                mode={composerMode}
                existingMessage={editingMessage}
            />
        </div>
    );
};

export default BossMessageBanner;
