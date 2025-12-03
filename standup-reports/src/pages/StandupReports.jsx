import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import {
    FiFilter, FiInfo, FiClock, FiUser, FiUsers, FiCheckCircle,
    FiAlertCircle, FiCalendar, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiPlus, FiList, FiGrid, FiMaximize, FiX, FiFileText, FiSearch, FiEye, FiEyeOff
} from 'react-icons/fi';

// Import FilterPanel from History
import FilterPanel from '../components/history/FilterPanel';
import MissingReports from '../components/MissingReports';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

// Utility: basic HTML escaping
const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Convert lightweight markdown and tokens to safe HTML
function formatReportContent(raw) {
    if (!raw) return '';
    const input = String(raw);

    // Detect if content is Tiptap/HTML (basic check)
    const isHtml = /<\s*(p|ul|ol|li|br|strong|em|span|div|a)[\s>]/i.test(input);

    if (isHtml) {
        // Minimal sanitize: strip scripts and inline event handlers
        let html = input
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/ on\w+\s*=\s*\"[^\"]*\"/gi, '')
            .replace(/ on\w+\s*=\s*\'[^\']*\'/gi, '');

        // Replace [TASK:{id}|{title}] tokens inside HTML - show truncated task title
        html = html.replace(/\[TASK:([^|\]]+)\|([^\]]+)\]/g, (m, id, title) => {
            const safeTitle = escapeHtml(title);
            return `<span class="task-ref-wrapper inline-block max-w-xs align-baseline"><a href="#" class="task-ref text-indigo-600 hover:text-indigo-800 underline hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors cursor-pointer font-medium truncate block" data-task-id="${id}" title="${safeTitle}">${safeTitle}</a></span>`;
        });

        // Mentions: @Name{id:uuid} -> link to profile; fallback @word -> query link
        html = html.replace(/@([^\{\s]+)\{id:([a-f0-9\-]+)\}/gi, (m, name, id) => {
            const safeName = escapeHtml(name);
            return `<a href="/profile/${id}" class="mention text-blue-600 hover:underline">@${safeName}</a>`;
        });
        html = html.replace(/(^|\s)@([A-Za-z0-9_\.\-]+)/g, (m, pre, name) => {
            return `${pre}<a href="/profile?name=${name}" class="mention text-blue-600 hover:underline">@${name}</a>`;
        });

        // Hashtags within HTML text
        html = html.replace(/(^|\s)#([A-Za-z0-9_\-]+)/g, (m, pre, tag) => {
            return `${pre}<span class="hashtag text-purple-600">#${tag}</span>`;
        });

        return html;
    }

    // Plain text path: escape and transform to simple HTML
    let text = escapeHtml(input);

    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold and italic (simple)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Lists
    const blocks = text.split(/\n\n+/);
    const formattedBlocks = blocks.map(block => {
        const lines = block.split(/\n/);
        if (lines.every(l => /^\s*-\s+/.test(l))) {
            const items = lines.map(l => `<li>${l.replace(/^\s*-\s+/, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        }
        if (lines.every(l => /^\s*\d+\.\s+/.test(l))) {
            const items = lines.map(l => `<li>${l.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol>${items}</ol>`;
        }
        return block.replace(/\n/g, '<br/>');
    });
    let html = formattedBlocks.join('\n');

    // Tokens and linkify - show truncated task title
    html = html.replace(/\[TASK:([^|\]]+)\|([^\]]+)\]/g, (m, id, title) => {
        const safeTitle = escapeHtml(title);
        return `<span class=\"task-ref-wrapper inline-block max-w-xs align-baseline\"><a href=\"#\" class=\"task-ref text-indigo-600 hover:text-indigo-800 underline hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors cursor-pointer font-medium truncate block\" data-task-id=\"${id}\" title=\"${safeTitle}\">${safeTitle}</a></span>`;
    });
    html = html.replace(/@([^\{\s]+)\{id:([a-f0-9\-]+)\}/gi, (m, name, id) => {
        const safeName = escapeHtml(name);
        return `<a href=\"/profile/${id}\" class=\"mention text-blue-600 hover:underline\">@${safeName}</a>`;
    });
    html = html.replace(/(^|\s)@([A-Za-z0-9_\.\-]+)/g, (m, pre, name) => {
        return `${pre}<a href=\"/profile?name=${name}\" class=\"mention text-blue-600 hover:underline\">@${name}</a>`;
    });
    html = html.replace(/(^|\s)#([A-Za-z0-9_\-]+)/g, (m, pre, tag) => {
        return `${pre}<span class=\"hashtag text-purple-600\">#${tag}</span>`;
    });
    html = html.replace(/(https?:\/\/[^\s<]+)/g, (m, url) => {
        const safe = escapeHtml(url);
        return `<a href=\"${safe}\" target=\"_blank\" rel=\"noopener\" class=\"text-indigo-600 underline\">${safe}</a>`;
    });

    return html;
}

// Display component that binds click handlers for task refs
function RichTextDisplay({ content, onTaskClick }) {
    const containerRef = React.useRef(null);
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onClick = (e) => {
            const target = e.target;
            if (target && target.classList && target.classList.contains('task-ref')) {
                e.preventDefault();
                const taskId = target.getAttribute('data-task-id');
                if (taskId && onTaskClick) onTaskClick(taskId);
            }
        };
        el.addEventListener('click', onClick);
        return () => el.removeEventListener('click', onClick);
    }, [onTaskClick]);

    const html = React.useMemo(() => formatReportContent(content), [content]);
    return (
        <div ref={containerRef} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    );
}

export default function StandupReports() {
    const navigate = useNavigate();
    const { currentCompany, loading: companyLoading } = useCompany();

    // State
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]); // Multi-select users
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [currentReportIndex, setCurrentReportIndex] = useState(0);
    const [showFullscreenModal, setShowFullscreenModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // User & Team State
    const [userId, setUserId] = useState(null);
    const [userTeamId, setUserTeamId] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [missingReports, setMissingReports] = useState([]);
    const [onLeaveMembers, setOnLeaveMembers] = useState([]);

    // Reports View Mode State
    const [reportsViewMode, setReportsViewMode] = useState('today');

    // Header visibility state (like TaskPage)
    const [showHeader, setShowHeader] = useState(true);


    // Animation State
    const [slideDirection, setSlideDirection] = useState('right');
    const [isAnimating, setIsAnimating] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragEnd, setDragEnd] = useState(0);

    // Fetch User Info
    useEffect(() => {
        const getUserInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase
                    .from('users')
                    .select('team_id')
                    .eq('id', user.id)
                    .single();
                if (data) setUserTeamId(data.team_id);
            }
        };
        getUserInfo();
    }, []);

    // Initialize date range to last 7 days
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    }, []);

    // Fetch Data - Updated for both modes
    useEffect(() => {
        if (!companyLoading && currentCompany?.id) {
            if (reportsViewMode === 'today') {
                // For today mode, we set the date range to today and fetch
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
                // Fetch reports for today
                const fetchTodayReports = async () => {
                    setLoading(true);
                    try {
                        const { data, error } = await supabase
                            .from('daily_reports')
                            .select(`
                      id, date, yesterday, today, blockers, created_at,
                      users:user_id (id, name, team_id, avatar_url, teams:team_id (id, name))
                    `)
                            .eq('date', today)
                            .eq('company_id', currentCompany.id)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        setReports(data || []);

                        // Fetch team members for missing reports if viewing today
                        if (userTeamId) {
                            fetchTeamMembers(userTeamId, data || []);
                        }
                    } catch (error) {
                        console.error('Error fetching today\'s reports:', error);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchTodayReports();
                fetchTeams();
            } else if (startDate && endDate) {
                // For history mode, use the selected date range
                fetchReports();
                fetchTeams();
            }
        }
    }, [companyLoading, currentCompany, reportsViewMode, startDate, endDate]);

    // Fetch Teams
    const fetchTeams = async () => {
        if (!currentCompany?.id) return;
        const { data } = await supabase
            .from('teams')
            .select('id, name')
            .eq('company_id', currentCompany.id);
        setTeams(data || []);
    };

    // Fetch Reports (Date Range Support)
    const fetchReports = async () => {
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_reports')
                .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, avatar_url, teams:team_id (id, name))
        `)
                .gte('date', startDate)
                .lte('date', endDate)
                .eq('company_id', currentCompany.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setReports(data || []);

            // Fetch team members for missing reports if viewing today
            const today = new Date().toISOString().split('T')[0];
            if (reportsViewMode === 'today' && endDate === today && userTeamId) {
                fetchTeamMembers(userTeamId, data || []);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Team Members & Identify Missing
    const fetchTeamMembers = async (teamId, currentReports) => {
        try {
            const { data: members } = await supabase
                .from('users')
                .select('id, name, avatar_url, team_id')
                .eq('team_id', teamId)
                .eq('company_id', currentCompany.id);

            setTeamMembers(members || []);

            // Fetch On Leave
            const today = new Date().toISOString().split('T')[0];
            const { data: leaveData } = await supabase
                .from('leave_plans')
                .select('user_id')
                .eq('status', 'approved')
                .lte('start_date', today)
                .gte('end_date', today);

            const onLeaveIds = (leaveData || []).map(l => l.user_id);
            const submittedIds = currentReports.map(r => r.users?.id);

            const missing = (members || []).filter(m =>
                !submittedIds.includes(m.id) && !onLeaveIds.includes(m.id)
            );

            setMissingReports(missing);
            setOnLeaveMembers(onLeaveIds);
        } catch (error) {
            console.error('Error fetching team context:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        if (reportsViewMode === 'today') {
            // Refresh today's reports
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('daily_reports')
                .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, avatar_url, teams:team_id (id, name))
        `)
                .eq('date', today)
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);

            // Fetch team members for missing reports if viewing today
            if (userTeamId) {
                fetchTeamMembers(userTeamId, data || []);
            }
        } else {
            await fetchReports();
        }
        setTimeout(() => setRefreshing(false), 600);
    };

    // Filter Logic
    const filteredReports = reports.filter(report => {
        // Team filter
        const matchesTeam = selectedTeam === 'all' || (report.users?.teams?.id === selectedTeam);

        // Multi-user filter
        const matchesUsers = !selectedUsers || selectedUsers.length === 0 ||
            (report.users && selectedUsers.includes(report.users.id));

        // Search filter
        const matchesSearch = !searchTerm ||
            report.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.users?.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.yesterday?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.today?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.blockers?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTeam && matchesUsers && matchesSearch;
    });

    // Calculate statistics for header
    const stats = {
        totalReports: filteredReports.length,
        completedReports: filteredReports.filter(r => r.yesterday || r.today).length,
        uniqueUsers: new Set(filteredReports.map(r => r.users?.id).filter(Boolean)).size,
        daysWithData: new Set(filteredReports.map(r => r.date)).size,
        completionRate: filteredReports.length > 0
            ? Math.round((filteredReports.filter(r => r.yesterday || r.today).length / filteredReports.length) * 100)
            : 0,
        missingReports: missingReports.length
    };

    // Clear filters function
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedTeam('all');
        setSelectedUsers([]);
        goToToday();
    };

    const nextReport = () => {
        if (currentReportIndex < filteredReports.length - 1) {
            setSlideDirection('right');
            setCurrentReportIndex(prev => prev + 1);
        }
    };

    const prevReport = () => {
        if (currentReportIndex > 0) {
            setSlideDirection('left');
            setCurrentReportIndex(prev => prev - 1);
        }
    };

    const openFullscreenModal = (index) => {
        setCurrentReportIndex(index);
        setShowFullscreenModal(true);
    };

    const closeFullscreenModal = () => {
        setShowFullscreenModal(false);
    };

    const handleDragStart = (e) => {
        setDragStart(e.clientX || e.touches?.[0]?.clientX || 0);
    };

    const handleDragEnd = (e) => {
        const dragEndPos = e.clientX || e.changedTouches?.[0]?.clientX || 0;
        setDragEnd(dragEndPos);
        const diff = dragStart - dragEndPos;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextReport();
            } else {
                prevReport();
            }
        }
    };

    const goToPreviousDay = () => {
        const currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - 1);
        const newEnd = currentDate.toISOString().split('T')[0];
        setEndDate(newEnd);
        // Keep 7-day range
        const newStart = new Date(currentDate);
        newStart.setDate(newStart.getDate() - 7);
        setStartDate(newStart.toISOString().split('T')[0]);
    };

    const goToNextDay = () => {
        const currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
        const newEnd = currentDate.toISOString().split('T')[0];
        setEndDate(newEnd);
        // Keep 7-day range
        const newStart = new Date(currentDate);
        newStart.setDate(newStart.getDate() - 7);
        setStartDate(newStart.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        const today = new Date();
        setEndDate(today.toISOString().split('T')[0]);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo.toISOString().split('T')[0]);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'list' ? 'carousel' : 'list');
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6"
        >
            {/* Header - Positioned in flow */}
            <div className="z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg p-4">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white shadow-lg shadow-indigo-200/50">
                            <FiFileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Standup Reports</h1>
                            <p className="text-xs text-gray-600 hidden sm:block">
                                {reportsViewMode === 'today'
                                    ? 'Track daily standup reports and team progress'
                                    : 'Review historical standup reports and analytics'}
                            </p>
                        </div>
                    </div>

                    {/* Center Section - Enhanced Modern View Toggle */}
                    <div className="flex items-center justify-center">
                        <div className="relative group">
                            {/* Enhanced Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-amber-400/30 to-yellow-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Main Container */}
                            <div className="relative bg-white/25 backdrop-blur-2xl p-2 rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
                                {/* Animated Background Layers */}
                                <div className="absolute inset-0">
                                    {/* Metallic Shimmer Layer */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-orange-200/10 via-amber-200/15 to-yellow-200/10"
                                        animate={{
                                            x: ['-100%', '100%'],
                                            opacity: [0, 0.3, 0]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            delay: 1
                                        }}
                                    />
                                    {/* Depth Layer */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5"></div>
                                </div>

                                {/* Floating Particles */}
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full opacity-30"
                                        initial={{
                                            x: Math.random() * 240,
                                            y: Math.random() * 48,
                                            scale: 0
                                        }}
                                        animate={{
                                            y: [Math.random() * 48, Math.random() * 48, Math.random() * 48],
                                            x: [Math.random() * 240, Math.random() * 240, Math.random() * 240],
                                            scale: [0, 1, 0],
                                            opacity: [0, 0.6, 0]
                                        }}
                                        transition={{
                                            duration: 4 + Math.random() * 2,
                                            repeat: Infinity,
                                            delay: Math.random() * 2
                                        }}
                                    />
                                ))}

                                <div className="relative flex items-center gap-1.5">
                                    {[
                                        { id: 'today', icon: FiCalendar, label: 'Today Reports', gradient: 'from-orange-500 via-amber-500 to-yellow-500' },
                                        { id: 'history', icon: FiFileText, label: 'Reports History', gradient: 'from-blue-500 via-indigo-500 to-purple-500' }
                                    ].map((tab, index) => (
                                        <motion.button
                                            key={tab.id}
                                            className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${reportsViewMode === tab.id
                                                ? 'text-white shadow-2xl'
                                                : 'text-gray-700/90 hover:text-gray-900 hover:bg-white/20'
                                                }`}
                                            onClick={() => setReportsViewMode(tab.id)}
                                            whileHover={{
                                                scale: 1.05,
                                                rotateY: reportsViewMode === tab.id ? 0 : 2,
                                                z: 10
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                perspective: '1000px',
                                                transformStyle: 'preserve-3d'
                                            }}
                                        >
                                            {/* Enhanced Active Indicator */}
                                            {reportsViewMode === tab.id && (
                                                <>
                                                    <motion.div
                                                        className={`absolute inset-0 rounded-2xl shadow-2xl border border-white/30 bg-gradient-to-r ${tab.gradient}`}
                                                        layoutId="activeTab"
                                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                    />
                                                    {/* Inner Glow */}
                                                    <motion.div
                                                        className={`absolute inset-0.5 rounded-2xl opacity-50 bg-gradient-to-r ${tab.gradient}`}
                                                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                    {/* Pulsing Border */}
                                                    <motion.div
                                                        className="absolute inset-0 rounded-2xl border-2 border-white/60"
                                                        animate={{ opacity: [0.8, 0.3, 0.8] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                </>
                                            )}

                                            {/* Enhanced Hover Glow for Inactive */}
                                            {reportsViewMode !== tab.id && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-amber-400/30 to-yellow-400/20 rounded-2xl opacity-0 transition-opacity"
                                                    whileHover={{ opacity: 1 }}
                                                />
                                            )}

                                            <div className="relative flex items-center gap-2.5">
                                                <motion.div
                                                    animate={reportsViewMode === tab.id ? { rotate: [0, 10, -10, 0] } : {}}
                                                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                                                >
                                                    <tab.icon className={reportsViewMode === tab.id ? "w-4 h-4" : "w-4 h-4"} />
                                                </motion.div>
                                                <span className="hidden sm:inline tracking-wide">{tab.label}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Glowing Stats & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Glowing Stats Pills */}
                        <div className="hidden md:flex items-center gap-2">
                            {stats && (
                                <>
                                    <motion.div
                                        className="relative bg-gradient-to-r from-indigo-400 to-purple-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                                        variants={{
                                            hidden: { opacity: 0, x: 20 },
                                            visible: { opacity: 1, x: 0 },
                                            hover: {}
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover="hover"
                                        transition={{ delay: 0.1 }}
                                    >
                                        {/* Glowing effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-50 blur-md"></div>
                                        {/* Shimmer effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <div className="relative flex items-center gap-1.5">
                                            <FiFileText className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="text-xs font-bold">{stats.totalReports}</span>
                                            {/* Expandable label on hover */}
                                            <motion.span
                                                className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                                                variants={{
                                                    hidden: { width: 0, opacity: 0, marginLeft: 0 },
                                                    visible: { width: 0, opacity: 0, marginLeft: 0 },
                                                    hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                                                }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                Reports
                                            </motion.span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="relative bg-gradient-to-r from-emerald-400 to-green-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                                        variants={{
                                            hidden: { opacity: 0, x: 20 },
                                            visible: { opacity: 1, x: 0 },
                                            hover: {}
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover="hover"
                                        transition={{ delay: 0.2 }}
                                    >
                                        {/* Glowing effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-50 blur-md"></div>
                                        {/* Shimmer effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                                        />
                                        <div className="relative flex items-center gap-1.5">
                                            <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="text-xs font-bold">{stats.completionRate}%</span>
                                            {/* Expandable label on hover */}
                                            <motion.span
                                                className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                                                variants={{
                                                    hidden: { width: 0, opacity: 0, marginLeft: 0 },
                                                    visible: { width: 0, opacity: 0, marginLeft: 0 },
                                                    hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                                                }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                Completion
                                            </motion.span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="relative bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                                        variants={{
                                            hidden: { opacity: 0, x: 20 },
                                            visible: { opacity: 1, x: 0 },
                                            hover: {}
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover="hover"
                                        transition={{ delay: 0.3 }}
                                    >
                                        {/* Glowing effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-50 blur-md"></div>
                                        {/* Shimmer effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <div className="relative flex items-center gap-1.5">
                                            <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="text-xs font-bold">{stats.missingReports}</span>
                                            {/* Expandable label on hover */}
                                            <motion.span
                                                className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                                                variants={{
                                                    hidden: { width: 0, opacity: 0, marginLeft: 0 },
                                                    visible: { width: 0, opacity: 0, marginLeft: 0 },
                                                    hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                                                }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                Missing
                                            </motion.span>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </div>

                        {/* Glowing Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Refresh button with glow */}
                            <motion.button
                                className="relative p-2.5 bg-white/40 backdrop-blur-xl border border-white/50 text-gray-700 rounded-xl hover:bg-white/60 transition-all group"
                                onClick={handleRefresh}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Refresh Reports"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <FiRefreshCw className={`w-4 h-4 relative z-10 ${refreshing ? 'animate-spin' : ''}`} />
                            </motion.button>

                            {/* New Report button */}
                            <motion.button
                                className="relative px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm shadow-lg overflow-hidden group backdrop-blur-sm"
                                onClick={() => navigate('/report')}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {/* Outer glow */}
                                <div className="absolute inset-0 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative flex items-center gap-2">
                                    <FiPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Report</span>
                                </div>
                            </motion.button>

                            {/* Hide Header Toggle - similar to TaskPage */}
                            <motion.button
                                className="relative p-2.5 bg-white/40 backdrop-blur-xl border border-white/50 text-gray-700 hover:text-gray-900 rounded-xl transition-all group"
                                onClick={() => setShowHeader(!showHeader)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Toggle Header"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {showHeader ? <FiEyeOff className="w-4 h-4 relative z-10" /> : <FiEye className="w-4 h-4 relative z-10" />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area - Full Width */}
            <div className="flex-1 overflow-y-auto">
                {/* Date Navigation - Only for History Mode */}
                {reportsViewMode === 'history' && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goToPreviousDay}
                            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-700"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                            Previous Day
                        </motion.button>

                        {!isToday(new Date(date)) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={goToToday}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm"
                            >
                                <FiCalendar className="w-4 h-4" />
                                Today
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goToNextDay}
                            disabled={isToday(new Date(date))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${isToday(new Date(date))
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700'
                                }`}
                        >
                            Next Day
                            <FiChevronRight className="w-4 h-4" />
                        </motion.button>

                        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                            <FiCalendar className="w-4 h-4" />
                            <span className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                    </div>
                )}

                {/* Today Navigation - Only for Today Mode */}
                {reportsViewMode === 'today' && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-200 text-orange-800 font-medium">
                            <FiCalendar className="w-4 h-4" />
                            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                    </div>
                )}

                {/* Missing Reports Component - only in Today Reports mode */}
                {reportsViewMode === 'today' && userTeamId && currentCompany?.id && (
                    <MissingReports
                        date={new Date().toISOString().split('T')[0]} // Show missing reports for today only
                        teamId={userTeamId}
                        companyId={currentCompany.id}
                    />
                )}

                {/* Filter Panel - only in History mode */}
                {reportsViewMode === 'history' && (
                    <FilterPanel
                        startDate={startDate}
                        endDate={endDate}
                        selectedTeam={selectedTeam}
                        teams={teams}
                        selectedUsers={selectedUsers}
                        reports={reports}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onTeamChange={setSelectedTeam}
                        onUserChange={setSelectedUsers}
                        onSearchChange={setSearchTerm}
                        searchTerm={searchTerm}
                        onClearFilters={clearFilters}
                        isCollapsed={!showFilters}
                        onToggleCollapse={() => setShowFilters(!showFilters)}
                        className="mb-6"
                    />
                )}

                {/* Stats already calculated in useMemo hook above */}

                {/* Statistics Cards - Color scheme based on view mode */}

                {/* Reports Display */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${reportsViewMode === 'today' ? 'border-orange-500' : 'border-indigo-600'
                            }`}></div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className={`text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed ${reportsViewMode === 'today' ? 'border-orange-200' : 'border-gray-200'
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${reportsViewMode === 'today' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <FiFileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                        <p className="text-gray-500 mt-1">No standup reports have been submitted for this date.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                variants={itemVariants}
                                className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow relative group ${reportsViewMode === 'today' ? 'border-orange-100' : 'border-gray-100'
                                    }`}
                            >
                                {/* Maximize Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openFullscreenModal(index)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                    title="View Fullscreen"
                                >
                                    <FiMaximize className="w-4 h-4" />
                                </motion.button>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            {report.users?.avatar_url ? (
                                                <img src={report.users.avatar_url} alt={report.users.name} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                                                    {report.users?.name?.[0]}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{report.users?.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <FiClock className="w-3 h-3" />
                                                        {format(new Date(report.created_at), 'h:mm a')}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-indigo-600 font-medium">{report.users?.teams?.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {report.blockers && (
                                            <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium flex items-center gap-1.5">
                                                <FiAlertCircle className="w-4 h-4" />
                                                Has Blockers
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yesterday</h4>
                                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 min-h-[100px]">
                                                <RichTextDisplay content={report.yesterday} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today</h4>
                                            <div className="bg-indigo-50/50 rounded-xl p-4 text-sm text-gray-700 min-h-[100px]">
                                                <RichTextDisplay content={report.today} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blockers</h4>
                                            <div className={`rounded-xl p-4 text-sm min-h-[100px] ${report.blockers ? 'bg-red-50/50 text-gray-800' : 'bg-gray-50 text-gray-400 italic'}`}>
                                                {report.blockers ? <RichTextDisplay content={report.blockers} /> : 'No blockers reported'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* Carousel View */
                    <div className="relative">
                        <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                            <motion.div
                                key={currentReportIndex}
                                custom={slideDirection}
                                initial={(direction) => ({
                                    x: direction === 'right' ? '100%' : '-100%',
                                    opacity: 0
                                })}
                                animate={{
                                    x: 0,
                                    opacity: 1
                                }}
                                exit={(direction) => ({
                                    x: direction === 'right' ? '-100%' : '100%',
                                    opacity: 0
                                })}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                    mass: 0.8
                                }}
                                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${reportsViewMode === 'today' ? 'border border-orange-100' : 'border border-gray-100'
                                    }`}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                            >
                                {/* Maximize Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openFullscreenModal(currentReportIndex)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                    title="View Fullscreen"
                                >
                                    <FiMaximize className="w-4 h-4" />
                                </motion.button>

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
                                        <div className="flex items-center gap-5">
                                            {filteredReports[currentReportIndex].users?.avatar_url ? (
                                                <img
                                                    src={filteredReports[currentReportIndex].users.avatar_url}
                                                    alt={filteredReports[currentReportIndex].users.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                                                    {filteredReports[currentReportIndex].users?.name?.[0]}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">{filteredReports[currentReportIndex].users?.name}</h3>
                                                <div className="flex items-center gap-3 text-gray-500 mt-1">
                                                    <span className="font-medium">{filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <FiClock />
                                                        {format(new Date(filteredReports[currentReportIndex].created_at), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-sm bg-indigo-50 text-indigo-700 rounded-full px-4 py-1 border border-indigo-100">
                                            Report {currentReportIndex + 1} of {filteredReports.length}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-8">
                                        <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 ${reportsViewMode === 'today'
                                            ? 'bg-orange-50 border border-orange-100'
                                            : 'bg-gray-50 border border-gray-100'
                                            }`}>
                                            <h4 className={`font-semibold mb-3 flex items-center justify-center text-sm border-b pb-2 ${reportsViewMode === 'today'
                                                ? 'text-orange-700 border-orange-200'
                                                : 'text-gray-700 border-gray-200'
                                                }`}>
                                                <span className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${reportsViewMode === 'today'
                                                    ? 'bg-orange-200 text-orange-700'
                                                    : 'bg-gray-200 text-gray-700'
                                                    }`}>1</span>
                                                Yesterday
                                            </h4>
                                            <div className="text-gray-700 flex-1 overflow-y-auto">
                                                <RichTextDisplay content={filteredReports[currentReportIndex].yesterday} />
                                            </div>
                                        </div>

                                        <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 ${reportsViewMode === 'today'
                                            ? 'bg-amber-50 border border-amber-100'
                                            : 'bg-green-50 border border-green-100'
                                            }`}>
                                            <h4 className={`font-semibold mb-3 flex items-center justify-center text-sm border-b pb-2 ${reportsViewMode === 'today'
                                                ? 'text-amber-700 border-amber-100'
                                                : 'text-green-700 border-green-100'
                                                }`}>
                                                <span className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${reportsViewMode === 'today'
                                                    ? 'bg-amber-200 text-amber-700'
                                                    : 'bg-green-200 text-green-700'
                                                    }`}>2</span>
                                                Today
                                            </h4>
                                            <div className="text-gray-700 flex-1 overflow-y-auto">
                                                <RichTextDisplay content={filteredReports[currentReportIndex].today} />
                                            </div>
                                        </div>

                                        {(() => {
                                            const blockers = filteredReports[currentReportIndex]?.blockers;
                                            const isEmptyContent = !blockers || blockers.toString().trim() === '' || blockers.toString().trim() === '<p></p>';
                                            return !isEmptyContent && (
                                                <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 ${reportsViewMode === 'today'
                                                    ? 'bg-red-50 border border-red-100'
                                                    : 'bg-red-50 border border-red-100'
                                                    }`}>
                                                    <h4 className="font-semibold text-red-700 mb-3 flex items-center justify-center text-sm border-b border-red-100 pb-2">
                                                        <span className="h-5 w-5 rounded-full bg-red-200 flex items-center justify-center mr-2 text-xs font-bold">3</span>
                                                        Blockers
                                                    </h4>
                                                    <div className="text-red-700 flex-1 overflow-y-auto">
                                                        <RichTextDisplay content={filteredReports[currentReportIndex].blockers} />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Navigation Indicators */}
                                    <div className="flex items-center justify-center mt-8 gap-2">
                                        {filteredReports.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-2 rounded-full transition-all cursor-pointer hover:scale-110 ${idx === currentReportIndex ? 'bg-indigo-500 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                                                    }`}
                                                onClick={() => setCurrentReportIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        {filteredReports.length > 1 && (
                            <>
                                <button
                                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-lg ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                                        }`}
                                    onClick={prevReport}
                                    disabled={currentReportIndex === 0}
                                >
                                    <FiChevronLeft size={24} />
                                </button>
                                <button
                                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-lg ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                                        }`}
                                    onClick={nextReport}
                                    disabled={currentReportIndex === filteredReports.length - 1}
                                >
                                    <FiChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Fullscreen Modal */}
                <AnimatePresence>
                    {showFullscreenModal && filteredReports.length > 0 && (
                        <motion.div
                            className="fixed inset-0 bg-black/95 z-50 p-6 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeFullscreenModal}
                        >
                            <motion.button
                                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={closeFullscreenModal}
                            >
                                <FiX className="h-6 w-6" />
                            </motion.button>

                            <div className="w-full max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                                    <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                                        <motion.div
                                            key={currentReportIndex}
                                            custom={slideDirection}
                                            initial={(direction) => ({
                                                x: direction === 'right' ? '100%' : '-100%',
                                                opacity: 0
                                            })}
                                            animate={{
                                                x: 0,
                                                opacity: 1
                                            }}
                                            exit={(direction) => ({
                                                x: direction === 'right' ? '-100%' : '100%',
                                                opacity: 0
                                            })}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                                mass: 0.8
                                            }}
                                            className="p-8"
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            {/* Report Header */}
                                            <div className="flex items-center gap-5 mb-8 pb-5 border-b border-gray-200">
                                                {filteredReports[currentReportIndex].users?.avatar_url ? (
                                                    <img
                                                        src={filteredReports[currentReportIndex].users.avatar_url}
                                                        alt={filteredReports[currentReportIndex].users.name}
                                                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold shadow-md">
                                                        {filteredReports[currentReportIndex].users?.name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                                                        {filteredReports[currentReportIndex].users?.name || 'Unknown User'}
                                                    </h3>
                                                    <div className="text-gray-500 flex items-center gap-3 text-lg">
                                                        <span className="font-medium">
                                                            {filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center">
                                                            <FiClock className="mr-1.5" />
                                                            {filteredReports[currentReportIndex].created_at
                                                                ? format(parseISO(filteredReports[currentReportIndex].created_at), 'MMM d, h:mm a')
                                                                : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="ml-auto text-sm bg-indigo-50 text-indigo-700 rounded-full px-4 py-1 border border-indigo-100">
                                                    Report {currentReportIndex + 1} of {filteredReports.length}
                                                </div>
                                            </div>

                                            {/* Report Content */}
                                            <div className={`grid gap-8 ${(() => {
                                                const blockers = filteredReports[currentReportIndex]?.blockers;
                                                const isEmptyContent = !blockers || blockers.toString().trim() === '' || blockers.toString().trim() === '<p></p>';
                                                return !isEmptyContent ? 'md:grid-cols-3' : 'md:grid-cols-2';
                                            })()}`}>
                                                <div className="bg-gray-50 rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border border-gray-100">
                                                    <h4 className="font-semibold text-gray-700 mb-1 flex items-center justify-center text-sm border-b border-gray-200 pb-0.5">
                                                        <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">1</span>
                                                        Yesterday
                                                    </h4>
                                                    <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                                                        {filteredReports[currentReportIndex].yesterday ? (
                                                            <RichTextDisplay content={filteredReports[currentReportIndex].yesterday} />
                                                        ) : (
                                                            <span className="italic text-gray-400">No update</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-green-50 rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border border-green-100">
                                                    <h4 className="font-semibold text-green-700 mb-1 flex items-center justify-center text-sm border-b border-green-100 pb-0.5">
                                                        <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">2</span>
                                                        Today
                                                    </h4>
                                                    <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                                                        {filteredReports[currentReportIndex].today ? (
                                                            <RichTextDisplay content={filteredReports[currentReportIndex].today} />
                                                        ) : (
                                                            <span className="italic text-gray-400">No update</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const blockers = filteredReports[currentReportIndex]?.blockers;
                                                    const isEmptyContent = !blockers || blockers.toString().trim() === '' || blockers.toString().trim() === '<p></p>';
                                                    return !isEmptyContent && (
                                                        <div className="rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border bg-red-50 border-red-100">
                                                            <h4 className="font-semibold mb-1 flex items-center justify-center text-sm pb-0.5 border-b text-red-700 border-red-100">
                                                                <span className="h-5 w-5 rounded-full flex items-center justify-center mr-2 text-xs font-bold bg-red-100 text-red-700">3</span>
                                                                Blockers
                                                            </h4>
                                                            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 text-red-700">
                                                                <RichTextDisplay content={filteredReports[currentReportIndex].blockers} />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Navigation Indicators */}
                                            <div className="flex items-center justify-center mt-8 gap-2">
                                                {filteredReports.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`h-3 rounded-full transition-all cursor-pointer hover:scale-110 ${idx === currentReportIndex ? 'bg-indigo-500 w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'
                                                            }`}
                                                        onClick={() => setCurrentReportIndex(idx)}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Left/Right Navigation Buttons */}
                                    {filteredReports.length > 1 && (
                                        <>
                                            <button
                                                className={`absolute left-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                                                    }`}
                                                onClick={prevReport}
                                                disabled={currentReportIndex === 0}
                                            >
                                                <FiChevronLeft size={28} />
                                            </button>
                                            <button
                                                className={`absolute right-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                                                    }`}
                                                onClick={nextReport}
                                                disabled={currentReportIndex === filteredReports.length - 1}
                                            >
                                                <FiChevronRight size={28} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div> {/* End of scrollable content area */}
        </motion.div>
    );
}
