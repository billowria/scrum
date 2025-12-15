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
import UserProfileInfoModal from '../components/UserProfileInfoModal';

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
    const [selectedUserProfileId, setSelectedUserProfileId] = useState(null);
    const headerRef = useRef(null);

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
            className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 relative overflow-hidden bg-gradient-to-br from-indigo-50/40 via-purple-50/40 to-pink-50/40"
        >
            {/* Ambient Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-300/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Liquid Glass Header - Fixed Position */}
            <motion.div
                ref={headerRef}
                className="fixed top-16 right-0 z-50 px-6 py-4 pointer-events-none"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                style={{
                    left: '80px',
                    width: 'calc(100% - 80px)',
                    transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div
                    className="pointer-events-auto relative overflow-hidden bg-white/10 backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-between group"
                    style={{
                        boxShadow: `
                            0 8px 32px 0 rgba(31, 38, 135, 0.15),
                            inset 0 0 0 1px rgba(255, 255, 255, 0.2),
                            inset 0 0 20px rgba(255, 255, 255, 0.05)
                        `
                    }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                    }}
                >
                    {/* Liquid Sheen Effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: `radial-gradient(
                                800px circle at var(--mouse-x) var(--mouse-y), 
                                rgba(255, 255, 255, 0.15), 
                                transparent 40%
                            )`
                        }}
                    />

                    {/* Chromatic Edge Simulation (Fake Refraction) */}
                    <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-50 mix-blend-overlay bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />

                    {/* Left: Title & Context */}
                    <div className="flex items-center gap-4 px-4 relative z-10">
                        <div className="relative group/icon cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover/icon:opacity-60 transition-opacity"></div>
                            <div className="relative p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 group-hover/icon:scale-105 transition-transform duration-300">
                                <FiFileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                                Standup Reports
                            </h1>
                            <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                {reportsViewMode === 'today' ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live Updates
                                    </>
                                ) : (
                                    <>
                                        <FiClock className="w-3 h-3" />
                                        History Archive
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Center: Futuristic Toggle */}
                    <div className="hidden md:flex bg-gray-100/30 backdrop-blur-xl p-1.5 rounded-2xl relative z-10 border border-white/40 shadow-inner overflow-hidden">
                        {[
                            { id: 'today', icon: FiCalendar, label: 'Active Sprint' },
                            { id: 'history', icon: FiClock, label: 'Past Reports' }
                        ].map((tab) => (
                            <motion.button
                                key={tab.id}
                                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 z-10 ${reportsViewMode === tab.id
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
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
                                {/* Active Indicator Background */}
                                {reportsViewMode === tab.id && (
                                    <>
                                        <motion.div
                                            className={`absolute inset-0 rounded-xl shadow-lg border border-white/20 ${tab.id === 'history'
                                                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500' // History -> Pink/Purple
                                                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500' // Active -> Blue/Cyan
                                                }`}
                                            layoutId="activeTabReport"
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        />

                                        {/* Inner Pulse/Glow */}
                                        <motion.div
                                            className={`absolute inset-0.5 rounded-xl opacity-50 ${tab.id === 'history'
                                                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400'
                                                : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400'
                                                }`}
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />

                                        {/* Diagonal Surface Shine */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-xl"
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        />
                                    </>
                                )}

                                <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                                    <tab.icon className={`w-4 h-4 ${reportsViewMode === tab.id ? 'text-white' : ''}`} />
                                    {tab.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 px-2 relative z-10">
                        {/* Refresh */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-colors relative group"
                        >
                            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </motion.button>

                        {/* New Report CTA */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/report')}
                            className="relative overflow-hidden px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm shadow-xl shadow-indigo-900/20 group border border-gray-800"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient" />
                            <span className="relative z-10 flex items-center gap-2">
                                <FiPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Entry</span>
                            </span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Scrollable Content Area - Full Width */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar scroll-smooth">
                <div className="w-full space-y-8 pt-32 px-4">

                    {/* Navigation & Filters Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {reportsViewMode === 'history' && (
                            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-sm">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={goToPreviousDay}
                                    className="p-2 hover:bg-white/60 rounded-xl transition-colors text-indigo-600"
                                >
                                    <FiChevronLeft className="w-5 h-5" />
                                </motion.button>

                                <div className="px-4 flex flex-col items-center">
                                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider opacity-60">Viewing</span>
                                    <span className="font-bold text-gray-800">{format(new Date(date), 'MMM d, yyyy')}</span>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={goToNextDay}
                                    disabled={isToday(new Date(date))}
                                    className={`p-2 rounded-xl transition-colors ${isToday(new Date(date)) ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-white/60'}`}
                                >
                                    <FiChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        )}

                        {/* Missing Reports Alert */}
                        {reportsViewMode === 'today' && userTeamId && currentCompany?.id && (
                            <div className="w-full">
                                <MissingReports
                                    date={new Date().toISOString().split('T')[0]}
                                    teamId={userTeamId}
                                    companyId={currentCompany.id}
                                    onAvatarClick={(userId) => setSelectedUserProfileId(userId)}
                                />
                            </div>
                        )}

                        {/* Filter Panel Toggle (If in History Mode) */}
                        {reportsViewMode === 'history' && (
                            <div className="w-full">
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
                                />
                            </div>
                        )}
                    </div>

                    {/* Stats Overview for Today */}
                    {reportsViewMode === 'today' && stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Reports', value: stats.totalReports, icon: FiFileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Completion', value: `${stats.completionRate}%`, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Missing', value: stats.missingReports, icon: FiAlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                                { label: 'Active', value: stats.uniqueUsers, icon: FiUsers, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/60 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Content Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 animate-spin border-t-indigo-600"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <FiFileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                It seems quiet here. {reportsViewMode === 'today' ? "Wait for the team to submit their updates." : "Try adjusting your filters."}
                            </p>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 ${viewMode === 'list' && filteredReports.length > 0 ? 'xl:grid-cols-2' : ''} gap-8`}>
                            {filteredReports.map((report, index) => (
                                <motion.div
                                    key={report.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.01 }}
                                    className="group relative bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-lg overflow-hidden transition-all duration-300"
                                >
                                    {/* Status Strip */}
                                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${report.blockers ? 'bg-gradient-to-b from-rose-500 to-red-600' :
                                        (report.yesterday && report.today) ? 'bg-gradient-to-b from-emerald-400 to-green-600' :
                                            'bg-gradient-to-b from-orange-400 to-amber-500'
                                        }`} />

                                    <div className="p-6 pl-8">
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {report.users?.avatar_url ? (
                                                        <img src={report.users.avatar_url} alt={report.users.name} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md border-2 border-white">
                                                            {report.users?.name?.[0]}
                                                        </div>
                                                    )}
                                                    {isToday(new Date(report.created_at)) && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{report.users?.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                            {report.users?.teams?.name || 'No Team'}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <FiClock className="w-3 h-3" />
                                                            {format(new Date(report.created_at), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => openFullscreenModal(index)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors"
                                            >
                                                <FiMaximize className="w-5 h-5" />
                                            </motion.button>
                                        </div>

                                        {/* Card Content Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Yesterday */}
                                            <div className="bg-white/50 rounded-2xl p-4 border border-white/60">
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                    Yesterday
                                                </div>
                                                <div className="prose prose-sm prose-indigo leading-snug text-gray-600 max-h-40 overflow-y-auto custom-scrollbar">
                                                    <RichTextDisplay content={report.yesterday} />
                                                </div>
                                            </div>

                                            {/* Today */}
                                            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    Today
                                                </div>
                                                <div className="prose prose-sm prose-indigo leading-snug text-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
                                                    <RichTextDisplay content={report.today} />
                                                </div>
                                            </div>

                                            {/* Blockers Row (Full Width if exists) */}
                                            {report.blockers && (
                                                <div className="md:col-span-2 bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-rose-500 uppercase tracking-wider">
                                                        <FiAlertCircle className="w-3 h-3" />
                                                        Blockers
                                                    </div>
                                                    <div className="prose prose-sm prose-rose leading-snug text-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
                                                        <RichTextDisplay content={report.blockers} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Gradient overlay on hover */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fullscreen Modal Logic kept from original but wrapped in Portal if needed - simplified here to reuse existing state */}

                {/* Fullscreen Modal - Re-implemented with Dark Glass */}
                <AnimatePresence>
                    {showFullscreenModal && filteredReports.length > 0 && (
                        <motion.div
                            className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[60] p-4 md:p-8 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeFullscreenModal}
                        >
                            <motion.div
                                className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                                onClick={e => e.stopPropagation()}
                                layoutId={`report-${currentReportIndex}`}
                            >
                                {/* Modal Header */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                                <div className="relative pt-12 px-8 pb-8">
                                    <button
                                        onClick={closeFullscreenModal}
                                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors z-10"
                                    >
                                        <FiX className="w-6 h-6" />
                                    </button>

                                    {/* User Avatar Badge */}
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl mb-4 transform -rotate-3">
                                            {filteredReports[currentReportIndex].users?.avatar_url ? (
                                                <img src={filteredReports[currentReportIndex].users.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl font-bold text-indigo-500">
                                                    {filteredReports[currentReportIndex].users?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">{filteredReports[currentReportIndex].users?.name}</h2>
                                        <p className="text-indigo-500 font-medium">{filteredReports[currentReportIndex].users?.teams?.name}</p>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Yesterday</h3>
                                            <div className="prose prose-indigo max-w-none text-gray-600">
                                                <RichTextDisplay content={filteredReports[currentReportIndex].yesterday} />
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Today</h3>
                                            <div className="prose prose-indigo max-w-none text-gray-800">
                                                <RichTextDisplay content={filteredReports[currentReportIndex].today} />
                                            </div>
                                        </div>
                                        {filteredReports[currentReportIndex].blockers && (
                                            <div className="md:col-span-2 bg-rose-50/50 rounded-2xl p-6 border border-rose-100">
                                                <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4">Blockers</h3>
                                                <div className="prose prose-rose max-w-none text-gray-800">
                                                    <RichTextDisplay content={filteredReports[currentReportIndex].blockers} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex justify-between mt-8">
                                        <button
                                            onClick={prevReport}
                                            disabled={currentReportIndex === 0}
                                            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold disabled:opacity-50 hover:bg-gray-200 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="flex items-center text-sm font-mono text-gray-400">
                                            {currentReportIndex + 1} / {filteredReports.length}
                                        </span>
                                        <button
                                            onClick={nextReport}
                                            disabled={currentReportIndex === filteredReports.length - 1}
                                            className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50 hover:bg-black transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>



            {/* User Profile Modal */}
            <UserProfileInfoModal
                isOpen={!!selectedUserProfileId}
                onClose={() => setSelectedUserProfileId(null)}
                userId={selectedUserProfileId}
            />
        </motion.div >

    );
}
