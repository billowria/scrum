import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiFileText, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiRefreshCw, FiPlus, FiEdit2, FiCheckCircle, FiAlertCircle, FiUsers, FiMaximize, FiX, FiChevronDown } from 'react-icons/fi';

// Import FilterPanel from History
import FilterPanel from '../components/history/FilterPanel';
import MissingReports from '../components/MissingReports';
import ReportContentParser from '../components/reports/ReportContentParser';
import UserProfileInfoModal from '../components/UserProfileInfoModal';
import { useTheme } from '../context/ThemeContext';

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

export default function StandupReports({ sidebarMode }) {
    const navigate = useNavigate();
    const { currentCompany, loading: companyLoading } = useCompany();
    const { themeMode } = useTheme();
    const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);

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
    const [viewMode, setViewMode] = useState('carousel');
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

    // State for extracted entities
    const [usersMap, setUsersMap] = useState({});
    const [tasksMap, setTasksMap] = useState({});

    // Helper functions to extract mentions and tasks from content
    const extractMentionIds = (content) => {
        if (!content) return [];
        const regex = /@([a-f0-9-]{36})/g;
        return [...new Set([...content.matchAll(regex)].map(m => m[1]))];
    };

    const extractTaskIds = (content) => {
        if (!content) return [];
        const regex = /#TASK-([a-f0-9-]+|\d+)/g;
        return [...new Set([...content.matchAll(regex)].map(m => m[1]))];
    };

    // Get all mentions and tasks from a report
    const getReportEntities = (report) => {
        const allContent = `${report.yesterday || ''} ${report.today || ''} ${report.blockers || ''}`;
        return {
            mentionIds: extractMentionIds(allContent),
            taskIds: extractTaskIds(allContent)
        };
    };

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

    // Fetch entity data (users and tasks) for all mentions and task references in reports
    useEffect(() => {
        const fetchEntityData = async () => {
            if (!reports || reports.length === 0) return;

            // Collect all unique user IDs and task IDs from all reports
            const allUserIds = new Set();
            const allTaskIds = new Set();

            reports.forEach(report => {
                const { mentionIds, taskIds } = getReportEntities(report);
                mentionIds.forEach(id => allUserIds.add(id));
                taskIds.forEach(id => allTaskIds.add(id));
            });

            // Fetch users
            if (allUserIds.size > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, name, avatar_url')
                    .in('id', [...allUserIds]);

                const newUsersMap = {};
                (usersData || []).forEach(user => {
                    newUsersMap[user.id] = user;
                });
                setUsersMap(newUsersMap);
            }

            // Fetch tasks
            if (allTaskIds.size > 0) {
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('id, title')
                    .in('id', [...allTaskIds]);

                const newTasksMap = {};
                (tasksData || []).forEach(task => {
                    newTasksMap[task.id] = task;
                });
                setTasksMap(newTasksMap);
            }
        };

        fetchEntityData();
    }, [reports]);

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
            className={`w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 relative overflow-hidden ${isPremiumTheme ? 'bg-transparent' : 'bg-gradient-to-br from-indigo-50/40 via-purple-50/40 to-pink-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'}`}
        >
            {/* Ambient Background Orbs - Hidden for premium themes */}
            {!isPremiumTheme && (
                <>
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
                </>
            )}

            {/* Liquid Glass Header - Fixed Position */}
            <motion.div
                ref={headerRef}
                className="fixed top-16 right-0 z-30 px-6 py-4 pointer-events-none"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                style={{
                    left: sidebarMode === 'expanded' ? '272px' : sidebarMode === 'collapsed' ? '100px' : '0px',
                    width: sidebarMode === 'expanded' ? 'calc(100% - 272px)' : sidebarMode === 'collapsed' ? 'calc(100% - 100px)' : '100%',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div
                    className={`pointer-events-auto relative overflow-hidden backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 flex items-center justify-between group ${isPremiumTheme
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/10 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50'
                        }`}
                    style={{
                        boxShadow: isPremiumTheme
                            ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                            : `0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)`
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
                    <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 relative z-10">
                        <div className="relative group/icon cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover/icon:opacity-60 transition-opacity"></div>
                            <div className="relative p-2 sm:p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 group-hover/icon:scale-105 transition-transform duration-300">
                                <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                                Standup Reports
                            </h1>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
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
                    <div className="flex bg-gray-100/30 backdrop-blur-xl p-1 sm:p-1.5 rounded-xl sm:rounded-2xl relative z-10 border border-white/40 shadow-inner overflow-hidden">
                        {[
                            { id: 'today', icon: FiCalendar, label: 'Active Sprint' },
                            { id: 'history', icon: FiClock, label: 'Past Reports' }
                        ].map((tab) => (
                            <motion.button
                                key={tab.id}
                                className={`relative px-2 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-2 z-10 ${reportsViewMode === tab.id
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/50'
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

                                <span className="relative z-10 flex items-center gap-1 sm:gap-2 drop-shadow-sm">
                                    <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${reportsViewMode === tab.id ? 'text-white' : ''}`} />
                                    <span className="text-[10px] sm:text-xs md:text-sm">{tab.label}</span>
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-3 px-1 sm:px-2 relative z-10">
                        {/* View Mode Toggle */}
                        <div className="flex bg-white/20 dark:bg-slate-800/50 p-1 rounded-xl border border-white/20 dark:border-slate-700/50">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                title="List View"
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('carousel')}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'carousel'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                title="Carousel View"
                            >
                                Carousel
                            </button>
                        </div>

                        {/* Refresh */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg sm:rounded-xl transition-colors relative group"
                        >
                            <FiRefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </motion.button>

                        {/* New Report CTA */}
                        {(() => {
                            // Check if current user has already submitted today's report
                            const hasSubmittedToday = reports.some(r =>
                                r.users?.id === userId &&
                                r.date === new Date().toISOString().split('T')[0]
                            );

                            return (
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/report')}
                                    className={`relative overflow-hidden px-3 py-2 sm:px-5 sm:py-2.5 ${hasSubmittedToday ? 'bg-amber-600/90 border-amber-700' : 'bg-gray-900 border-gray-800'} text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-900/20 group border`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient" />
                                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                                        {hasSubmittedToday ? (
                                            <>
                                                <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">Update Report</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">New Entry</span>
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            );
                        })()}
                    </div>
                </div>
            </motion.div>

            {/* Scrollable Content Area - Full Width */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar scroll-smooth">
                <div className="w-full space-y-8 pt-32 px-4">

                    {/* Navigation & Filters Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {reportsViewMode === 'history' && (
                            <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={goToPreviousDay}
                                    className="p-2 hover:bg-white/60 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-indigo-600 dark:text-indigo-400"
                                >
                                    <FiChevronLeft className="w-5 h-5" />
                                </motion.button>

                                <div className="px-4 flex flex-col items-center">
                                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider opacity-60">Viewing</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{format(new Date(date), 'MMM d, yyyy')}</span>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={goToNextDay}
                                    disabled={isToday(new Date(date))}
                                    className={`p-2 rounded-xl transition-colors ${isToday(new Date(date)) ? 'text-gray-400 dark:text-slate-600 cursor-not-allowed' : 'text-indigo-600 dark:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-700/50'}`}
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

                    {/* Content Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full border-4 animate-spin ${isPremiumTheme ? 'border-white/20 border-t-white' : 'border-indigo-200 border-t-indigo-600'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-4 h-4 rounded-full animate-pulse ${isPremiumTheme ? 'bg-white' : 'bg-indigo-600'}`}></div>
                                </div>
                            </div>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${isPremiumTheme
                                ? 'bg-white/5 border border-white/10'
                                : 'bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700'
                                }`}>
                                <FiFileText className={`w-10 h-10 ${isPremiumTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>No Reports Found</h3>
                            <p className={`max-w-md mx-auto ${isPremiumTheme ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                                It seems quiet here. {reportsViewMode === 'today' ? "Wait for the team to submit their updates." : "Try adjusting your filters."}
                            </p>
                        </div>
                    ) : viewMode === 'carousel' ? (
                        /* Carousel View */
                        <div className="relative">
                            {/* Navigation Buttons */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={prevReport}
                                    disabled={currentReportIndex === 0}
                                    className={`p-3 rounded-full backdrop-blur-md shadow-lg ${isPremiumTheme
                                        ? `bg-white/10 border border-white/20 ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`
                                        : `bg-white/80 dark:bg-slate-800/80 border border-white/50 dark:border-slate-700/50 ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-700'}`
                                        }`}
                                >
                                    <FiChevronLeft className={`w-6 h-6 ${isPremiumTheme ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                                </motion.button>
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={nextReport}
                                    disabled={currentReportIndex === filteredReports.length - 1}
                                    className={`p-3 rounded-full backdrop-blur-md shadow-lg ${isPremiumTheme
                                        ? `bg-white/10 border border-white/20 ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`
                                        : `bg-white/80 dark:bg-slate-800/80 border border-white/50 dark:border-slate-700/50 ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-700'}`
                                        }`}
                                >
                                    <FiChevronRight className={`w-6 h-6 ${isPremiumTheme ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                                </motion.button>
                            </div>

                            {/* Carousel Content */}
                            <div className="px-16">
                                <AnimatePresence mode="wait">
                                    {filteredReports[currentReportIndex] && (
                                        <motion.div
                                            key={filteredReports[currentReportIndex].id}
                                            initial={{ opacity: 0, x: slideDirection === 'right' ? 100 : -100 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: slideDirection === 'right' ? -100 : 100 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            className={`group relative rounded-[2rem] overflow-hidden ${isPremiumTheme
                                                ? 'bg-white/5 backdrop-blur-xl border border-white/10'
                                                : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-xl'
                                                }`}
                                        >
                                            {(() => {
                                                const report = filteredReports[currentReportIndex];
                                                return (
                                                    <>
                                                        {/* Gradient Header Bar */}
                                                        <div className={`relative px-8 py-6 ${isPremiumTheme
                                                            ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-b border-white/10'
                                                            : 'bg-gradient-to-r from-indigo-50 via-purple-50/50 to-white dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50'
                                                            }`}>
                                                            {/* Status Strip */}
                                                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${report.blockers ? 'bg-gradient-to-b from-rose-500 to-red-600' :
                                                                (report.yesterday && report.today) ? 'bg-gradient-to-b from-emerald-400 to-green-600' :
                                                                    'bg-gradient-to-b from-orange-400 to-amber-500'
                                                                }`} />

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative">
                                                                        {report.users?.avatar_url ? (
                                                                            <img src={report.users.avatar_url} alt={report.users.name} className={`w-14 h-14 rounded-2xl object-cover shadow-lg ${isPremiumTheme ? 'ring-2 ring-white/20' : 'ring-2 ring-white'}`} />
                                                                        ) : (
                                                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg ${isPremiumTheme ? 'ring-2 ring-white/20' : 'ring-2 ring-white'}`}>
                                                                                {report.users?.name?.[0]}
                                                                            </div>
                                                                        )}
                                                                        {isToday(new Date(report.created_at)) && (
                                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className={`font-bold text-xl ${isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                                            {report.users?.name}
                                                                        </h3>
                                                                        <div className={`flex items-center gap-3 text-sm mt-1 ${isPremiumTheme ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${isPremiumTheme
                                                                                ? 'bg-white/10 text-white/80 border border-white/10'
                                                                                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                                                                }`}>
                                                                                {report.users?.teams?.name || 'No Team'}
                                                                            </span>
                                                                            <span className="flex items-center gap-1.5">
                                                                                <FiClock className="w-3.5 h-3.5" />
                                                                                {format(new Date(report.created_at), 'MMM d, h:mm a')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Report Counter */}
                                                                <div className={`flex items-center gap-3 ${isPremiumTheme ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                    <span className="text-sm font-medium">
                                                                        {currentReportIndex + 1} of {filteredReports.length}
                                                                    </span>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => openFullscreenModal(currentReportIndex)}
                                                                        className={`p-2 rounded-lg transition-colors ${isPremiumTheme
                                                                            ? 'hover:bg-white/10 text-white/60 hover:text-white'
                                                                            : 'hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                                            }`}
                                                                        title="View fullscreen"
                                                                    >
                                                                        <FiMaximize className="w-4 h-4" />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content Sections - Horizontal Grid */}
                                                        <div className={`p-6 grid ${report.blockers ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                                                            {/* Yesterday Section */}
                                                            <div className={`rounded-xl overflow-hidden flex flex-col ${isPremiumTheme
                                                                ? 'bg-white/5 border border-white/10'
                                                                : 'bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30'
                                                                }`}>
                                                                <div className={`flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 ${isPremiumTheme
                                                                    ? 'bg-white/5 border-white/10'
                                                                    : 'bg-white dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/30'
                                                                    }`}>
                                                                    <div className={`w-2 h-2 rounded-full ${isPremiumTheme ? 'bg-white/40' : 'bg-slate-400'}`} />
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-white/50' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                        Yesterday
                                                                    </span>
                                                                </div>
                                                                <div className={`p-4 flex-1 overflow-y-auto custom-scrollbar text-sm leading-relaxed max-h-64 ${isPremiumTheme ? 'text-white/80' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                    <ReportContentParser content={report.yesterday} mode="view" />
                                                                </div>
                                                            </div>

                                                            {/* Today Section */}
                                                            <div className={`rounded-xl overflow-hidden flex flex-col ${isPremiumTheme
                                                                ? 'bg-indigo-500/10 border border-indigo-400/20'
                                                                : 'bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-500/20'
                                                                }`}>
                                                                <div className={`flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 ${isPremiumTheme
                                                                    ? 'bg-indigo-500/10 border-indigo-400/20'
                                                                    : 'bg-indigo-100/50 dark:bg-indigo-900/30 border-indigo-200/50 dark:border-indigo-500/20'
                                                                    }`}>
                                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-indigo-300/70' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                                        Today
                                                                    </span>
                                                                </div>
                                                                <div className={`p-4 flex-1 overflow-y-auto custom-scrollbar text-sm leading-relaxed max-h-64 ${isPremiumTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                    <ReportContentParser content={report.today} mode="view" />
                                                                </div>
                                                            </div>

                                                            {/* Blockers Section */}
                                                            {report.blockers && (
                                                                <div className={`rounded-xl overflow-hidden flex flex-col ${isPremiumTheme
                                                                    ? 'bg-rose-500/10 border border-rose-400/20'
                                                                    : 'bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20'
                                                                    }`}>
                                                                    <div className={`flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 ${isPremiumTheme
                                                                        ? 'bg-rose-500/10 border-rose-400/20'
                                                                        : 'bg-rose-100/50 dark:bg-rose-900/30 border-rose-200/50 dark:border-rose-500/20'
                                                                        }`}>
                                                                        <FiAlertCircle className={`w-3.5 h-3.5 ${isPremiumTheme ? 'text-rose-400' : 'text-rose-500'}`} />
                                                                        <span className={`text-xs font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-rose-300/70' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                            Blockers
                                                                        </span>
                                                                    </div>
                                                                    <div className={`p-4 flex-1 overflow-y-auto custom-scrollbar text-sm leading-relaxed max-h-64 ${isPremiumTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                        <ReportContentParser content={report.blockers} mode="view" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Pagination Dots */}
                            <div className="flex justify-center gap-2 mt-6">
                                {filteredReports.slice(0, Math.min(10, filteredReports.length)).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSlideDirection(idx > currentReportIndex ? 'right' : 'left');
                                            setCurrentReportIndex(idx);
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentReportIndex
                                            ? 'w-6 bg-indigo-500'
                                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                            }`}
                                    />
                                ))}
                                {filteredReports.length > 10 && (
                                    <span className="text-xs text-gray-400 ml-2">+{filteredReports.length - 10}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* List View - Redesigned as True List Layout */
                        <div className="space-y-3">
                            {filteredReports.map((report, index) => (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group relative overflow-hidden transition-all duration-200 ${isPremiumTheme
                                        ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl'
                                        : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-md rounded-xl'
                                        }`}
                                >
                                    {/* Status indicator */}
                                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${report.blockers ? 'bg-rose-500' :
                                        (report.yesterday && report.today) ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`} />

                                    <div className="flex flex-col lg:flex-row">
                                        {/* User Info - Fixed width on desktop */}
                                        <div className={`flex items-center gap-3 p-4 lg:w-56 lg:shrink-0 lg:border-r ${isPremiumTheme ? 'lg:border-white/10' : 'lg:border-slate-100 dark:lg:border-slate-700/50'}`}>
                                            <div className="relative">
                                                {report.users?.avatar_url ? (
                                                    <img
                                                        src={report.users.avatar_url}
                                                        alt={report.users.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                                                        {report.users?.name?.[0]}
                                                    </div>
                                                )}
                                                {isToday(new Date(report.created_at)) && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className={`font-semibold text-sm truncate ${isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                    {report.users?.name}
                                                </h3>
                                                <div className={`flex items-center gap-1.5 text-xs ${isPremiumTheme ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    <FiClock className="w-3 h-3" />
                                                    <span>{format(new Date(report.created_at), 'h:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Sections - Responsive horizontal layout */}
                                        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700/50">
                                            {/* Yesterday */}
                                            <div className="flex-1 p-3 md:p-4">
                                                <div className={`flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-white/40' : 'text-gray-400'}`}>
                                                    <div className={`w-1 h-1 rounded-full ${isPremiumTheme ? 'bg-white/40' : 'bg-gray-400'}`} />
                                                    Yesterday
                                                </div>
                                                <div className={`text-sm leading-relaxed max-h-20 overflow-y-auto custom-scrollbar report-content ${isPremiumTheme ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    <ReportContentParser content={report.yesterday} mode="view" />
                                                </div>
                                            </div>

                                            {/* Today */}
                                            <div className={`flex-1 p-3 md:p-4 ${isPremiumTheme ? '' : 'bg-indigo-50/30 dark:bg-indigo-900/5'}`}>
                                                <div className={`flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-indigo-300/60' : 'text-indigo-500 dark:text-indigo-400'}`}>
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                                    Today
                                                </div>
                                                <div className={`text-sm leading-relaxed max-h-20 overflow-y-auto custom-scrollbar report-content ${isPremiumTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    <ReportContentParser content={report.today} mode="view" />
                                                </div>
                                            </div>

                                            {/* Blockers (only if exists) */}
                                            {report.blockers && (
                                                <div className={`flex-1 p-3 md:p-4 ${isPremiumTheme ? '' : 'bg-rose-50/30 dark:bg-rose-900/5'}`}>
                                                    <div className={`flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider ${isPremiumTheme ? 'text-rose-300/60' : 'text-rose-500 dark:text-rose-400'}`}>
                                                        <FiAlertCircle className="w-3 h-3" />
                                                        Blockers
                                                    </div>
                                                    <div className={`text-sm leading-relaxed max-h-20 overflow-y-auto custom-scrollbar report-content ${isPremiumTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        <ReportContentParser content={report.blockers} mode="view" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className={`hidden lg:flex items-center p-4 ${isPremiumTheme ? '' : ''}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => openFullscreenModal(index)}
                                                className={`p-2 rounded-lg transition-colors ${isPremiumTheme
                                                    ? 'text-white/40 hover:text-white hover:bg-white/10'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                                                    }`}
                                                title="View full report"
                                            >
                                                <FiMaximize className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
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
                            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative"
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
                                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 p-1 shadow-xl mb-4 transform -rotate-3">
                                        {filteredReports[currentReportIndex].users?.avatar_url ? (
                                            <img src={filteredReports[currentReportIndex].users.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl font-bold text-indigo-500">
                                                {filteredReports[currentReportIndex].users?.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{filteredReports[currentReportIndex].users?.name}</h2>
                                    <p className="text-indigo-500 dark:text-indigo-400 font-medium">{filteredReports[currentReportIndex].users?.teams?.name}</p>
                                </div>

                                {/* Content Grid */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Yesterday</h3>
                                        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                            <ReportContentParser content={filteredReports[currentReportIndex].yesterday} mode="view" />
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20">
                                        <h3 className="text-sm font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-4">Today</h3>
                                        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                                            <ReportContentParser content={filteredReports[currentReportIndex].today} mode="view" />
                                        </div>
                                    </div>
                                    {filteredReports[currentReportIndex].blockers && (
                                        <div className="md:col-span-2 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-6 border border-rose-100 dark:border-rose-500/20">
                                            <h3 className="text-sm font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-4">Blockers</h3>
                                            <div className="prose prose-rose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                                                <ReportContentParser content={filteredReports[currentReportIndex].blockers} mode="view" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-8">
                                    <button
                                        onClick={prevReport}
                                        disabled={currentReportIndex === 0}
                                        className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="flex items-center text-sm font-mono text-gray-400">
                                        {currentReportIndex + 1} / {filteredReports.length}
                                    </span>
                                    <button
                                        onClick={nextReport}
                                        disabled={currentReportIndex === filteredReports.length - 1}
                                        className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold disabled:opacity-50 hover:bg-black dark:hover:bg-gray-100 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Profile Modal */}
            <UserProfileInfoModal
                isOpen={!!selectedUserProfileId}
                onClose={() => setSelectedUserProfileId(null)}
                userId={selectedUserProfileId}
            />
        </motion.div >

    );
}
