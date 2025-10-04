import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { format, isToday, parseISO, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../supabaseClient';

// Icons
import { FiFilter,FiAward,FiZap, FiClock, FiUser, FiUsers, FiCheckCircle, FiAlertCircle, FiCalendar, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus, FiList, FiGrid, FiMaximize, FiMinimize, FiX, FiFileText, FiArrowRight, FiChevronDown, FiBell, FiBarChart2 } from 'react-icons/fi';

// Components
import AnnouncementModal from '../components/AnnouncementModal';
import NotificationBell from '../components/NotificationBell';
import Announcements from '../components/Announcements';
import TeamAvailabilityAnalytics from '../components/TeamAvailabilityAnalytics';
import LeaveRequestForm from '../components/LeaveRequestForm';
import TeamHealthIndicator from '../components/TeamHealthIndicator';
import UserListModal from '../components/UserListModal';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
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

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } },
  active: {
    scale: 1.05,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.95 },
  active: { backgroundColor: '#4F46E5', color: '#ffffff' }
};

const switchVariants = {
  list: { x: 0 },
  grid: { x: '100%' }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scaleY: 0.8, transformOrigin: "top" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scaleY: 1,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scaleY: 0.8,
    transition: { duration: 0.2 } 
  }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function Dashboard({ sidebarOpen }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); 
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  
  // User state
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  
  // Missing reports state
  const [teamMembers, setTeamMembers] = useState([]);
  const [missingReports, setMissingReports] = useState([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  
  // On-leave count and announcements count
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);

  // Animation controls
  const cardControls = useAnimation();
  const navigate = useNavigate();
  
  // Ref for scroll animations
  const reportRefs = useRef([]);
  const carouselRef = useRef(null);

  const [slideDirection, setSlideDirection] = useState('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);

  const [activeFilter, setActiveFilter] = useState(false);

  // Add new state variables for team interaction features
  const [showTeamAvailabilityWidget, setShowTeamAvailabilityWidget] = useState(true);
  const [showQuickLeaveRequest, setShowQuickLeaveRequest] = useState(false);
  const [leaveRequestSuccess, setLeaveRequestSuccess] = useState(false);
  const [teamMetrics, setTeamMetrics] = useState({
    collaboration: 0,
    velocity: 0,
    quality: 0,
    happiness: 0
  });
  

  // Add new state for modals and on-leave members
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showOnLeaveModal, setShowOnLeaveModal] = useState(false);
  const [onLeaveMembers, setOnLeaveMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);

  const [showHeader, setShowHeader] = useState(true);
  // State to toggle showing all missing reports in-card
  const [showAllMissingReports, setShowAllMissingReports] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  // Toggle for Missing Reports header visibility
  const [showMissingHeader, setShowMissingHeader] = useState(true);
  
  // State for animated time display
  const [currentTime, setCurrentTime] = useState(new Date());
  // Current user avatar
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
      // Get current user information including their team
      const getUserInfo = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setUserId(authUser.id);
        setUser(authUser); // Store full user object

        // Get user's info including avatar and team
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, avatar_url, team_id, teams:team_id (id, name)')
          .eq('id', authUser.id)
          .single();
        
        if (!error && data) {
          setAvatarUrl(data.avatar_url || null);
          setUserTeamId(data.team_id);
          setUserName(data.name || authUser.user_metadata?.name || authUser.email);
          fetchTeamMembers(data.team_id);
        } else {
          // Fallback if user not in our DB
          setUserName(authUser.user_metadata?.name || authUser.email);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
    fetchReports(date);
    fetchTeams();
    
    // Initialize animation controls
    cardControls.start({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5 }
    });
    
    // Add keyboard listener for ESC key to exit fullscreen modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFullscreenModal) {
        setShowFullscreenModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    
    // Set up intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Observe report elements when they're added to the DOM
    reportRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      if (reportRefs.current) {
        reportRefs.current.forEach((ref) => {
          if (ref) observer.unobserve(ref);
        });
      }
    };
  }, [date, cardControls]);
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };

  const fetchReports = async (date) => {
    setLoading(true);
    setError(null);

    try {
      // Query to get reports with user and team information
      let query = supabase
        .from('daily_reports')
        .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, teams:team_id (id, name))
        `)
        .eq('date', date)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
      
      // If today's date is selected, update missing reports
      if (date === new Date().toISOString().split('T')[0] && userTeamId) {
        identifyMissingReports(data || [], userTeamId);
      }
      
      // Reset refs array to match new reports length
      reportRefs.current = Array(data?.length || 0).fill().map((_, i) => reportRefs.current[i] || null);
    } catch (error) {
      setError('Error fetching reports: ' + error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    if (!teamId) return;
    
    setLoadingMissing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, teams:team_id (id, name)')
        .eq('team_id', teamId);
        
      if (error) throw error;
      
      setTeamMembers(data || []);
      
      // If reports are already loaded, identify missing reports
      if (reports.length > 0 && date === new Date().toISOString().split('T')[0]) {
        identifyMissingReports(reports, teamId);
      }
      
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingMissing(false);
    }
  };

  // This function is used for fetching team members when team is selected in filter
  const fetchTeamMembersForStatus = async (teamId) => {
    if (!teamId || teamId === 'all') return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, teams:team_id (id, name)')
        .eq('team_id', teamId)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTeamMembers(data || []);
      
    } catch (error) {
      console.error('Error fetching team members for status:', error);
    }
  };
  
  // Effect to fetch team members when team filter changes
  useEffect(() => {
    if (selectedTeam !== 'all') {
      fetchTeamMembersForStatus(selectedTeam);
    }
  }, [selectedTeam]);
  
  // Update missing reports when team members data changes
  useEffect(() => {
    if (teamMembers.length > 0 && date === new Date().toISOString().split('T')[0]) {
      identifyMissingReports(reports, userTeamId);
    }
  }, [teamMembers, reports, userTeamId, date]);
  
  // Utility function to check if a team member has submitted a report
  const hasSubmittedReport = (userId) => {
    return reports.some(report => report.users?.id === userId);
  };
  
  const identifyMissingReports = (reportsList, teamId) => {
    // Only run for today's date
    if (date !== new Date().toISOString().split('T')[0]) return;
    
    // Get IDs of users who have submitted reports
    const submittedUserIds = reportsList.map(report => report.users?.id).filter(Boolean);
    
    // Make sure we have team members loaded
    if (teamMembers.length === 0) {
      console.log("No team members loaded yet");
      return;
    }
    
    // Filter team members who haven't submitted reports
    const missing = teamMembers.filter(
      member => !submittedUserIds.includes(member.id)
    );
    
    console.log("Team members:", teamMembers.length);
    console.log("Submitted IDs:", submittedUserIds);
    console.log("Missing reports:", missing.length);
    
    setMissingReports(missing);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(date);
    
    // If today's date is selected, also refresh team members data
    if (date === new Date().toISOString().split('T')[0] && userTeamId) {
      await fetchTeamMembers(userTeamId);
    }
    
    setTimeout(() => setRefreshing(false), 600); // Add a small delay for animation
    setCurrentReportIndex(0); // Reset to first report after refresh
  };
  
  const handleDragStart = (e) => {
    setDragStart(e.clientX);
  };

  const handleDragEnd = (e) => {
    setDragEnd(e.clientX);
    const dragDistance = dragStart - dragEnd;
    
    if (Math.abs(dragDistance) > 50) { // Minimum drag distance to trigger slide
      if (dragDistance > 0 && currentReportIndex < filteredReports.length - 1) {
        nextReport();
      } else if (dragDistance < 0 && currentReportIndex > 0) {
        prevReport();
      }
    }
  };

  const nextReport = () => {
    if (currentReportIndex < filteredReports.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('right');
      setCurrentReportIndex(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };
  
  const prevReport = () => {
    if (currentReportIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('left');
      setCurrentReportIndex(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };
  
  // Toggle fullscreen modal
  const openFullscreenModal = () => {
    setShowFullscreenModal(true);
    // Lock body scroll when fullscreen modal is open
    document.body.style.overflow = 'hidden';
  };
  
  // Close fullscreen modal
  const closeFullscreenModal = () => {
    setShowFullscreenModal(false);
    // Restore body scroll when fullscreen modal is closed
    document.body.style.overflow = 'auto';
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'carousel' ? 'list' : 'carousel');
  };
  
  const handleNewReport = () => {
    navigate('/report');
  };

  // Filter reports by team
  const filteredReports = selectedTeam === 'all'
    ? reports
    : reports.filter(report => report.users?.teams?.id === selectedTeam);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if date is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Fetch on-leave count
  const fetchOnLeaveCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error, count } = await supabase
        .from('leave_plans')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) throw error;
      setOnLeaveCount(count || 0);
    } catch (error) {
      console.error('Error fetching on-leave count:', error.message);
    }
  };

  // Fetch announcements count
  const fetchAnnouncementsCount = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setAnnouncementsCount(0);

      // Fetch all announcements for user's team
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select(`id, team_id, expiry_date, announcement_reads:announcement_reads!announcement_reads_announcement_id_fkey(user_id, read)`)
        .gte('expiry_date', new Date().toISOString());
      if (annError) throw annError;

      // Only count announcements that are not read by this user
      const unreadCount = (announcements || []).filter(a => {
        const readEntry = (a.announcement_reads || []).find(r => r.user_id === user.id);
        return !readEntry || !readEntry.read;
      }).length;
      setAnnouncementsCount(unreadCount);
    } catch (error) {
      console.error('Error fetching announcements count:', error.message);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOnLeaveCount();
    fetchAnnouncementsCount();
  }, []);

  // Fetch available and on-leave members when userTeamId is available
  useEffect(() => {
    if (userTeamId) {
      fetchOnLeaveMembers();
    }
  }, [userTeamId]);

  // Function to scroll to missing reports section
  const scrollToMissingReports = () => {
    const element = document.getElementById('missing-reports-header');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to fetch on-leave members and available members
  const fetchOnLeaveMembers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch on-leave members
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_plans')
        .select(`
          id,
          users:user_id (id, name, avatar_url, role, teams:team_id (id, name))
        `)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (leaveError) {
        console.error('Error fetching on-leave members:', leaveError);
        throw leaveError;
      }
      
      const onLeaveUserIds = leaveData.map(item => item.users?.id).filter(Boolean);
      setOnLeaveMembers(leaveData.map(item => item.users).filter(Boolean));
      
      // Fetch all team members to determine available ones
      if (userTeamId) {
        const { data: allMembers, error: membersError } = await supabase
          .from('users')
          .select('id, name, avatar_url, role, teams:team_id (id, name)')
          .eq('team_id', userTeamId);
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
        } else {
          // Filter out on-leave members to get available members
          const available = allMembers.filter(member => !onLeaveUserIds.includes(member.id));
          setAvailableMembers(available);
        }
      }
    } catch (error) {
      console.error('Error in fetchOnLeaveMembers:', error);
    }
  };

  // Scroll hide/show header logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // When showing the missing header, don't scroll it into view
  useEffect(() => {
    // Removed auto-scrolling effect
  }, [showMissingHeader]);

  // Dashboard stat cards
  const dashboardStats = [
    {
      label: 'Reports Today',
      value: reports.length,
      icon: <FiFileText className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      label: 'Present',
      value: teamMembers.length - onLeaveCount,
      icon: <FiUsers className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'On Leave',
      value: onLeaveCount,
      icon: <FiClock className="w-5 h-5" />,
      color: 'from-yellow-400 to-orange-400',
    },
    {
      label: 'Announcements',
      value: announcementsCount,
      icon: <FiBell className="w-5 h-5" />,
      color: 'from-pink-500 to-purple-500',
    },
  ];

  // Professional Dashboard Header component with Missing Reports summary
  const DashboardHeader = () => {
    // Calculate completion percentage for reports
    const reportCompletionPercentage = teamMembers.length > 0 
      ? Math.round(((teamMembers.length - missingReports.length) / teamMembers.length) * 100) 
      : 0;
      
    return (
      <div className="space-y-8 mb-8">

        {/* Professional Dashboard Stats Overview */}
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
          variants={statCardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
              
              {/* Premium Quick Actions - Completely Redesigned */}
              <motion.div 
                className="md:col-span-3 bg-white/20 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-rose-400/10 rounded-full blur-3xl animate-pulse delay-1500" />
                </div>

                <div className="relative z-10">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-sm text-white shadow-xl shadow-cyan-500/20 border border-white/20"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <FiZap className="w-6 h-6" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Quick Actions</h3>
                        <p className="text-gray-600 text-sm mt-1">Accelerate your workflow with one-click actions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <motion.button
                        onClick={() => navigate('/notifications')}
                        className="relative p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all shadow-md"
                        title="Notifications"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiBell className="w-5 h-5" />
                        {announcementsCount > 0 && (
                          <motion.span 
                            className="absolute -top-2 -right-2 text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-2 py-1 min-w-[20px] h-[20px] flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-sm"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                '0 0 0 8px rgba(239, 68, 68, 0)',
                                '0 0 0 0 rgba(239, 68, 68, 0.4)'
                              ]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2
                            }}
                          >
                            {announcementsCount > 99 ? '99+' : announcementsCount}
                          </motion.span>
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={handleRefresh}
                        className="p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all shadow-md"
                        title="Refresh Dashboard"
                        whileHover={{ scale: 1.1, y: -2, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Action Cards Grid - Completely New Design */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {[
                      { 
                        key: 'tasks', 
                        icon: <FiList className="w-6 h-6" />, 
                        onClick: () => navigate('/tasks?assignee=me'), 
                        label: 'My Tasks', 
                        gradient: 'from-blue-500 to-indigo-600',
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/30',
                        glow: 'shadow-blue-500/20'
                      },
                      { 
                        key: 'report', 
                        icon: <FiPlus className="w-6 h-6" />, 
                        onClick: handleNewReport, 
                        label: 'Add Report', 
                        gradient: 'from-emerald-500 to-teal-600',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/30',
                        glow: 'shadow-emerald-500/20'
                      },
                      { 
                        key: 'projects', 
                        icon: <FiGrid className="w-6 h-6" />, 
                        onClick: () => navigate('/projects'), 
                        label: 'Projects', 
                        gradient: 'from-purple-500 to-fuchsia-600',
                        bg: 'bg-purple-500/10',
                        border: 'border-purple-500/30',
                        glow: 'shadow-purple-500/20'
                      },
                      { 
                        key: 'team', 
                        icon: <FiUsers className="w-6 h-6" />, 
                        onClick: async () => {
                          // Ensure we have userTeamId
                          let currentTeamId = userTeamId;
                          if (!currentTeamId) {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              const { data: userData, error } = await supabase
                                .from('users')
                                .select('team_id')
                                .eq('id', user.id)
                                .single();
                              if (!error && userData) {
                                currentTeamId = userData.team_id;
                                setUserTeamId(currentTeamId);
                              }
                            }
                          }
                          
                          if (currentTeamId) {
                            await fetchOnLeaveMembers();
                          }
                          
                          setTimeout(() => {
                            setShowOnLeaveModal(true);
                          }, 100);
                        }, 
                        label: 'Team', 
                        gradient: 'from-teal-500 to-cyan-600',
                        bg: 'bg-teal-500/10',
                        border: 'border-teal-500/30',
                        glow: 'shadow-teal-500/20'
                      },
                      { 
                        key: 'ach', 
                        icon: <FiAward className="w-6 h-6" />, 
                        onClick: () => navigate('/achievements'), 
                        label: 'Achievements', 
                        gradient: 'from-amber-500 to-orange-600',
                        bg: 'bg-amber-500/10',
                        border: 'border-amber-500/30',
                        glow: 'shadow-amber-500/20'
                      },
                      { 
                        key: 'missing', 
                        icon: <FiAlertCircle className="w-6 h-6" />, 
                        onClick: scrollToMissingReports, 
                        label: 'Missing', 
                        gradient: 'from-rose-500 to-pink-600',
                        bg: 'bg-rose-500/10',
                        border: 'border-rose-500/30',
                        glow: 'shadow-rose-500/20'
                      },
                      { 
                        key: 'leaves', 
                        icon: <FiClock className="w-6 h-6" />, 
                        onClick: () => navigate('/leaves'), 
                        label: 'Leaves', 
                        gradient: 'from-cyan-500 to-blue-600',
                        bg: 'bg-cyan-500/10',
                        border: 'border-cyan-500/30',
                        glow: 'shadow-cyan-500/20'
                      },
                      { 
                        key: 'announcements', 
                        icon: <FiBell className="w-6 h-6" />, 
                        onClick: () => navigate('/notifications'), 
                        label: 'Announcements', 
                        gradient: 'from-violet-500 to-purple-600',
                        bg: 'bg-violet-500/10',
                        border: 'border-violet-500/30',
                        glow: 'shadow-violet-500/20'
                      },
                      { 
                        key: 'profile', 
                        icon: <FiUser className="w-6 h-6" />, 
                        onClick: () => navigate('/profile'), 
                        label: 'Profile', 
                        gradient: 'from-fuchsia-500 to-pink-600',
                        bg: 'bg-fuchsia-500/10',
                        border: 'border-fuchsia-500/30',
                        glow: 'shadow-fuchsia-500/20'
                      },
                      { 
                        key: 'calendar', 
                        icon: <FiCalendar className="w-6 h-6" />, 
                        onClick: () => navigate('/calendar'), 
                        label: 'Calendar', 
                        gradient: 'from-green-500 to-emerald-600',
                        bg: 'bg-green-500/10',
                        border: 'border-green-500/30',
                        glow: 'shadow-green-500/20'
                      }
                    ].map((action, index) => (
                      <motion.div
                        key={action.key}
                        className="group relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, zIndex: 10 }}
                      >
                        <motion.button
                          onClick={action.onClick}
                          className={`w-full h-28 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden border border-white/30 shadow-md bg-white/20 hover:shadow-lg hover:bg-white/30`}
                          whileHover={{ 
                            scale: 1.05,
                            y: -5,
                            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.05)`
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Animated background on hover */}
                          <motion.div 
                            className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                          />
                          
                          {/* Icon container with gradient background */}
                          <motion.div 
                            className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg relative z-10 border border-white/20 backdrop-blur-sm`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            {action.icon}
                          </motion.div>
                          
                          {/* Label with animated underline */}
                          <div className="relative z-10">
                            <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                              {action.label}
                            </span>
                            <motion.div 
                              className={`h-0.5 bg-gradient-to-r ${action.gradient} rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                              initial={{ width: 0 }}
                              whileHover={{ width: '100%' }}
                            />
                          </div>
                          
                          {/* Pulse animation on hover */}
                          <motion.div 
                            className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0, 0.3, 0]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity
                            }}
                          />
                        </motion.button>
                        
                        {/* Floating tooltip */}
                        <motion.div 
                          className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${action.gradient} text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl pointer-events-none`}
                          initial={{ y: 10 }}
                          whileHover={{ opacity: 1, y: 0 }}
                        >
                          {action.label}
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 ${action.gradient} rotate-45`}></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Integrated Missing Reports Summary */}
        <AnimatePresence initial={false}>
          {showMissingHeader && (
            <motion.div
              id="missing-reports-header"
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              layout
            >
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md text-white mr-3">
                <FiAlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Missing Reports</h3>
                <p className="text-sm text-gray-600">
                  {missingReports.length === 0 
                    ? 'Everyone has submitted their reports today!' 
                    : `${missingReports.length} team member${missingReports.length !== 1 ? 's' : ''} still need${missingReports.length === 1 ? 's' : ''} to submit a report`}
                </p>
              </div>
            </div>
            
            {isToday(date) && !loadingMissing && missingReports.length > 0 && (
              <button 
                className="mt-2 sm:mt-0 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                onClick={() => setShowMissingModal(true)}
              >
                <FiUsers className="h-4 w-4" />
                <span>View All</span>
              </button>
            )}
          </div>
          
          {/* Missing Reports List */}
          {isToday(date) && missingReports.length > 0 && (
            <div className="p-4 bg-white">
              <div className="flex flex-wrap gap-2">
                {(showAllMissingReports ? missingReports : missingReports.slice(0, 5)).map((member, index) => (
                  <motion.div 
                    key={member.id} 
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { 
                        delay: showAllMissingReports ? index * 0.05 : 0 
                      }
                    }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300,
                      damping: 20
                    }}
                    layout
                  >
                    <div 
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => navigate(`/profile/${member.id}`)}
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover shadow border-2 border-indigo-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">{member.name}</span>
                    </div>
                  </motion.div>
                ))}
                
                {missingReports.length > 5 && !showAllMissingReports && (
                  <button
                     type="button"
                     className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                     onClick={() => {
                      setIsAnimating(true);
                      setShowAllMissingReports(true);
                      setTimeout(() => setIsAnimating(false), 300);
                    }}
                   >
                    <span className="text-sm font-medium text-gray-700">+{missingReports.length - 5} more</span>
                  </button>
                )}
                {showAllMissingReports && (
                  <button
                     type="button"
                     className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                     onClick={() => {
                      setIsAnimating(true);
                      setShowAllMissingReports(false);
                      setTimeout(() => setIsAnimating(false), 300);
                    }}
                   >
                    <span className="text-sm font-medium text-gray-700">Close</span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Beautiful and Thin Animated Progress Bar */}
          {isToday(date) && teamMembers.length > 0 && (
            <div className="px-5 py-3 bg-gradient-to-r from-white to-indigo-50/30 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  Report Progress
                </h4>
                <motion.span 
                  className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {reportCompletionPercentage}%
                </motion.span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${reportCompletionPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                </motion.div>
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span>{teamMembers.length - missingReports.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>{missingReports.length}</span>
                </div>
              </div>
            </div>
          )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div 
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Enhanced Dashboard Header */}
      <motion.header
        className={`fixed top-16 ${sidebarOpen ? 'left-64' : 'left-20'} right-0 z-30 transition-all duration-300 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50 backdrop-blur-xl shadow-lg border-b border-indigo-100/50`}
        id="dashboard-header"
        animate={{ y: showHeader ? 0 : '-100%' }}
        initial={{ y: 0 }}
        transition={{ type: 'tween', duration: 0.3 }}
        style={{ minHeight: 100, width: `calc(100% - ${sidebarOpen ? '16rem' : '5rem'})` }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="relative z-10 flex items-center justify-between px-6 py-3">
          {/* Left section - User information */}
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="w-10 h-10 rounded-lg object-cover bg-white"
                />
              ) : (
                <div className="p-2.5 text-white">
                  <FiUser className="w-5 h-5" />
                </div>
              )}
            </motion.div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Good day, 
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-lg font-bold text-indigo-600">
                    {userName || 'User'}
                  </span>
                  {user?.email && (
                    <span className="text-xs text-gray-500 font-light italic hidden sm:inline">
                      ({user.email})
                    </span>
                  )}
                </div>
                <motion.span 
                  className="text-2xl"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                >
                  👋
                </motion.span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FiCalendar className="w-4 h-4 text-indigo-500" />
                <p className="text-sm text-gray-600">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right section - Animated time display */}
          <div className="flex items-center gap-6">
            {/* Greeting badge */}
            <motion.div 
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-md"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiCheckCircle className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">Productive Day!</span>
            </motion.div>
            
            {/* Animated time display */}
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-xl text-center">
                    <div className="text-sm font-medium tracking-wider">
                      {format(currentTime, 'h:mm')}
                    </div>
                  </div>
                </div>
                <motion.div 
                  className="text-2xl font-bold text-gray-800 min-w-[40px] text-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                  {format(currentTime, 'ss')}
                </motion.div>
                <div className="text-gray-500 text-sm font-medium px-2 py-1.5 bg-gray-100 rounded-lg">
                  {format(currentTime, 'a')}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-1 font-medium uppercase tracking-wider">
                {format(currentTime, 'zzz')}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>
      {/* Spacer to prevent content overlap */}
      <div style={{ height: 80 }} />

      {/* Dashboard Header with Missing Reports Component */}
      <div className="container mx-auto px-6 pt-6">
        <DashboardHeader />
      </div>

      {/* Main Content: Daily Reports View with Carousel and Missing Reports */}
      <div className="grid grid-cols-1 gap-6 w-full mt-6 px-6">
        
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ 
              boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.05)",
              y: -3, 
              transition: { type: "spring", stiffness: 400, damping: 15 }
            }}
          >
            {/* Glass overlay decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl"></div>
            
            {/* Header */}
            <div className="relative p-4 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <motion.h2 
                  className="text-2xl font-bold text-gray-800 flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-md text-white">
                    <FiFileText className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">
                    Daily Standup Reports
                  </span>
                </motion.h2>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
                  {/* Filter button moved here from top section */}
                  <motion.button
                    className={`p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors relative ${activeFilter ? 'border-primary-300 text-primary-600 bg-primary-50' : ''}`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    animate={activeFilter ? "active" : ""}
                    onClick={() => {
                      setShowFilters(!showFilters);
                      setActiveFilter(!activeFilter);
                    }}
                  >
                    <FiFilter className={showFilters ? "text-primary-600" : ""} />
                    {activeFilter && (
                      <motion.span 
                        className="absolute -top-1 -right-1 bg-primary-500 rounded-full w-2 h-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      />
                    )}
            </motion.button>
                  
                  {/* View mode switcher - redesigned */}
                  <motion.div 
                    className="relative overflow-hidden border border-indigo-200 rounded-full flex items-center p-1 bg-white shadow-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div 
                      className="absolute top-1 bottom-1 rounded-full bg-indigo-100"
                      variants={switchVariants}
                      animate={viewMode === 'carousel' ? 'list' : 'grid'}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: '48%', height: '85%', left: viewMode === 'list' ? '1%' : '51%' }}
                    />
          <motion.button
                      className={`relative z-10 flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        viewMode === 'list' 
                          ? 'text-indigo-700' 
                          : 'text-gray-600'
                      }`}
            whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setViewMode('list')}
                    >
                      <FiList className={viewMode === 'list' ? 'text-indigo-600' : 'text-gray-500'} />
                      <span>List</span>
          </motion.button>
          <motion.button
                      className={`relative z-10 flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        viewMode === 'carousel' 
                          ? 'text-indigo-700' 
                          : 'text-gray-600'
                      }`}
            whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setViewMode('carousel')}
                    >
                      <FiGrid className={viewMode === 'carousel' ? 'text-indigo-600' : 'text-gray-500'} />
                      <span>Cards</span>
                    </motion.button>
                  </motion.div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {viewMode === 'carousel' && filteredReports.length > 0 && (
                      <motion.button
                        className="p-2.5 rounded-full border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors flex items-center justify-center"
                        whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
                        onClick={openFullscreenModal}
          >
                        <FiMaximize />
          </motion.button>
                    )}
          
          <motion.button
                      className="p-2.5 rounded-full border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 shadow-sm transition-colors flex items-center justify-center"
                      whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
                      onClick={handleNewReport}
          >
                      <FiPlus />
          </motion.button>
        </div>
                </div>
              </div>
            </div>

            {/* Filters - moved inside the container */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
                  className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-2 mt-2"
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div 
                      className="flex-1"
                      variants={filterVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="active"
                    >
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-4 w-4 text-gray-400" />
                  </div>
                        <motion.input
                    type="date"
                    id="date-filter"
                    value={date}
                          onChange={(e) => {
                            setDate(e.target.value);
                            handleRefresh();
                          }}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm text-sm"
                    max={new Date().toISOString().split('T')[0]}
                          whileFocus={{ boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.2)' }}
                  />
                </div>
                    </motion.div>
                    <motion.div 
                      className="flex-1"
                      variants={filterVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="active"
                      transition={{ delay: 0.1 }}
                    >
                <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="h-4 w-4 text-gray-400" />
                  </div>
                        <motion.select
                    id="team-filter"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                          className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm text-sm appearance-none"
                          whileFocus={{ boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.2)' }}
                  >
                    <option value="all">All Teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                        </motion.select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <motion.div
                            animate={{ rotate: showFilters ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <FiChevronDown className="h-4 w-4 text-gray-400" />
                          </motion.div>
                </div>
              </div>
                    </motion.div>
            </div>
                  <motion.div 
                    className="mt-4 flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRefresh}
                    >
                      <FiRefreshCw className="mr-1 h-3 w-3" />
                      Refresh Results
                    </motion.button>
                  </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Date navigation bar */}
        <motion.div 
              className="relative p-4 bg-gradient-to-r from-indigo-50 to-slate-50"
              initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                  <motion.button 
                    onClick={() => setDate(subDays(new Date(date), 1).toISOString().split('T')[0])}
                    className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors shadow-sm bg-white border border-indigo-100"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiChevronLeft />
                  </motion.button>
                  
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-primary-400 rounded-lg blur opacity-20 group-hover:opacity-50 transition-opacity"></div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="relative bg-white border border-indigo-200 rounded-lg py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-primary-300 focus:border-primary-500 shadow-sm transition-all outline-none cursor-pointer"
                    />
          </div>
                  
                  <motion.button 
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="px-4 py-2 rounded-lg shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-1.5"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiCalendar className="h-3.5 w-3.5" />
                    Today
                  </motion.button>
          </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">Showing</span>
                    <span className="mx-1.5 text-indigo-700 font-medium">{filteredReports.length}</span>
                    <span className="text-gray-500">reports</span>
            </div>
                  
            <motion.button
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
            >
                    <FiRefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
            </motion.button>
          </div>
              </div>
            </motion.div>
            
            {/* Reports Content */}
            <div className="p-4 bg-white/90 backdrop-blur-sm min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-4 rounded-full border-t-2 border-emerald-500 animate-spin animate-delay-300"></div>
                    <div className="absolute inset-8 rounded-full border-t-2 border-amber-500 animate-spin animate-delay-500"></div>
                  </div>
                  <p className="mt-4 text-gray-500 animate-pulse">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="w-20 h-20 mb-4 text-gray-300">
                    <FiFileText className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No reports found</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    {isToday(date) ? 
                      "No standup reports have been submitted for today yet." : 
                      `No standup reports were found for ${formatDate(date)}.`}
                  </p>
          <motion.button
                    onClick={handleNewReport}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Your Report
          </motion.button>
                </motion.div>
              ) : viewMode === 'carousel' ? (
                <div className="relative">
                  <AnimatePresence mode="wait">
              <motion.div
                key={currentReportIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative"
                    >
                      <div className="bg-gradient-to-b from-indigo-50/50 to-transparent rounded-xl overflow-hidden p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
                          <div className="flex items-center gap-3">
                            {filteredReports[currentReportIndex].users?.image_url ? (
                              <img
                                src={filteredReports[currentReportIndex].users.image_url}
                                alt={filteredReports[currentReportIndex].users?.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-medium shadow-sm">
                                {filteredReports[currentReportIndex].users?.name?.charAt(0) || "U"}
                        </div>
                            )}
                        <div>
                              <h3 className="font-semibold text-gray-900">
                                {filteredReports[currentReportIndex].users?.name || "Unknown User"}
                              </h3>
                              <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                <FiClock className="h-3 w-3" />
                                <span>
                                  {filteredReports[currentReportIndex].created_at 
                                    ? format(new Date(filteredReports[currentReportIndex].created_at), "MMM d, h:mm a") 
                                    : "Unknown time"}
                                </span>
                          </div>
                        </div>
                      </div>
                      
                          <div className="ml-auto flex flex-wrap gap-2 items-center">
                            {filteredReports[currentReportIndex].users?.teams?.name && (
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium inline-flex items-center">
                                <FiUsers className="mr-1 h-3 w-3" />
                                {filteredReports[currentReportIndex].users.teams.name}
                              </span>
                            )}
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                              filteredReports[currentReportIndex].blockers 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {filteredReports[currentReportIndex].blockers 
                                ? <FiAlertCircle className="mr-1 h-3 w-3" /> 
                                : <FiCheckCircle className="mr-1 h-3 w-3" />}
                              {filteredReports[currentReportIndex].blockers 
                                ? "Has Blockers" 
                                : "No Blockers"}
                            </span>
                          </div>
                    </div>
                    
                        <div className="grid md:grid-cols-3 gap-6 flex-1">
                        <motion.div 
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className="bg-indigo-600 text-white px-5 py-3">
                              <h4 className="font-medium flex items-center text-lg">
                                <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center mr-2 text-sm font-bold">1</span>
                            Yesterday
                          </h4>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 h-[210px] flex flex-col group-hover:from-indigo-100 group-hover:to-indigo-50 transition-colors">
                              <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose prose-sm">
                                {filteredReports[currentReportIndex].yesterday || 
                                  <span className="italic text-gray-400 flex items-center gap-2">
                                    <FiInfo className="h-4 w-4" />
                                    No update provided
                                  </span>
                                }
                              </div>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className="bg-emerald-600 text-white px-5 py-3">
                              <h4 className="font-medium flex items-center text-lg">
                                <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center mr-2 text-sm font-bold">2</span>
                            Today
                          </h4>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 h-[210px] flex flex-col group-hover:from-emerald-100 group-hover:to-emerald-50 transition-colors">
                              <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose prose-sm">
                                {filteredReports[currentReportIndex].today || 
                                  <span className="italic text-gray-400 flex items-center gap-2">
                                    <FiInfo className="h-4 w-4" />
                                    No update provided
                                  </span>
                                }
                              </div>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className={`px-5 py-3 text-white ${filteredReports[currentReportIndex].blockers ? 'bg-amber-600' : 'bg-blue-600'}`}>
                              <h4 className="font-medium flex items-center text-lg">
                                <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center mr-2 text-sm font-bold">3</span>
                            Blockers
                          </h4>
                            </div>
                            <div className={`p-5 h-[210px] flex flex-col transition-colors ${
                              filteredReports[currentReportIndex].blockers 
                                ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 group-hover:from-amber-100 group-hover:to-amber-50' 
                                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 group-hover:from-blue-100 group-hover:to-blue-50'
                            }`}>
                              <div className={`flex-1 overflow-y-auto custom-scrollbar px-1 prose ${filteredReports[currentReportIndex].blockers ? 'text-amber-700' : 'text-blue-700'}`}>
                                {filteredReports[currentReportIndex].blockers || <span className="italic text-emerald-600 flex items-center gap-1">
                                  <FiCheckCircle className="h-3 w-3" />
                                  No blockers
                                </span>}
                              </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
              </motion.div>
            </AnimatePresence>
                  
                  {/* Navigation controls */}
                  <div className="flex justify-between mt-6">
                <motion.button 
                      onClick={prevReport}
                      disabled={filteredReports.length <= 1}
                      className={`p-3 rounded-full shadow-md flex items-center justify-center ${
                        filteredReports.length <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      } transition-all`}
                      whileHover={filteredReports.length > 1 ? { scale: 1.1 } : {}}
                      whileTap={filteredReports.length > 1 ? { scale: 0.9 } : {}}
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </motion.button>
                    
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-gray-600">
                        {filteredReports.length > 0 ? `${currentReportIndex + 1} of ${filteredReports.length}` : '0 of 0'}
                      </span>
        </div>
                    
                    <motion.button 
                      onClick={nextReport}
                      disabled={filteredReports.length <= 1}
                      className={`p-3 rounded-full shadow-md flex items-center justify-center ${
                        filteredReports.length <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      } transition-all`}
                      whileHover={filteredReports.length > 1 ? { scale: 1.1 } : {}}
                      whileTap={filteredReports.length > 1 ? { scale: 0.9 } : {}}
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </motion.button>
          </div>
                </div>
              ) : (
                // List view
        <motion.div 
                  className="flex flex-col space-y-4"
                  variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
                  {filteredReports.map((report) => (
            <motion.div 
              key={report.id} 
                      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-5 overflow-hidden"
              variants={itemVariants}
                      whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {report.users?.image_url ? (
                            <img
                              src={report.users.image_url}
                              alt={report.users?.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-medium shadow-sm">
                              {report.users?.name?.charAt(0) || "U"}
                    </div>
                            )}
                    <div>
                            <h3 className="font-medium text-gray-900">{report.users?.name || "Unknown User"}</h3>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FiClock className="h-3 w-3" />
                              <span>{report.created_at ? format(new Date(report.created_at), "MMM d, h:mm a") : "Unknown time"}</span>
                    </div>
                  </div>
                </div>
                
                        <div className="flex flex-wrap gap-2 items-center">
                          {report.users?.teams?.name && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium inline-flex items-center">
                              <FiUsers className="mr-1 h-3 w-3" />
                              {report.users.teams.name}
                            </span>
                          )}
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                            report.blockers 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {report.blockers 
                              ? <FiAlertCircle className="mr-1 h-3 w-3" /> 
                              : <FiCheckCircle className="mr-1 h-3 w-3" />}
                            {report.blockers 
                              ? "Has Blockers" 
                              : "No Blockers"}
                          </span>
                  </div>
                  </div>
                      
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 hover:bg-indigo-100/50 transition-colors">
                          <span className="font-medium text-indigo-700 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">1</span>
                            Yesterday:
                          </span>
                          <span className="text-gray-700 break-words text-sm">
                            {report.yesterday || <span className="italic text-gray-400">No update</span>}
                          </span>
                      </div>
                        
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 hover:bg-emerald-100/50 transition-colors">
                          <span className="font-medium text-emerald-700 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">2</span>
                            Today:
                          </span>
                          <span className="text-gray-700 break-words text-sm">
                            {report.today || <span className="italic text-gray-400">No update</span>}
                          </span>
                    </div>
                    
                        <div className={`rounded-lg p-3 hover:bg-opacity-70 transition-colors ${
                          report.blockers 
                            ? 'bg-amber-50 border border-amber-100 hover:bg-amber-100/50' 
                            : 'bg-blue-50 border border-blue-100 hover:bg-blue-100/50'
                        }`}> 
                          <span className={`font-medium block mb-1.5 flex items-center gap-1.5 ${
                            report.blockers ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              report.blockers ? 'bg-amber-200 text-amber-700' : 'bg-blue-200 text-blue-700'
                            }`}>
                              3
                            </span>
                            Blockers:
                          </span>
                          <span className={`break-words text-sm ${
                            report.blockers ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            {report.blockers || 
                              <span className="italic text-emerald-600 flex items-center gap-1">
                                <FiCheckCircle className="h-3 w-3" />
                                No blockers
                              </span>
                            }
                          </span>
                      </div>
                    </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
                    
        {/* Missing Reports Widget - Redesigned to be more compact and professional */}
        <motion.div 
          id="missing-reports-section"
          className="w-full max-w-5xl mx-auto mb-10 hidden"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants} 
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex flex-wrap items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md text-white mr-3">
                  <FiAlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    Missing Reports Today
                  </h2>
                  <p className="text-gray-500 text-sm">Team members who haven't submitted their daily standup</p>
                </div>
              </div>
              
              {isToday(date) && !loadingMissing && (
                <div className="flex items-center mt-2 sm:mt-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center px-3 py-1.5 mr-2">
                    <div className="text-center mr-3 pr-3 border-r border-gray-200">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-lg text-indigo-700">{teamMembers.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Missing</div>
                      <div className="font-bold text-lg text-indigo-700">{missingReports.length}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 flex items-center hover:bg-indigo-700 transition-colors"
                  >
                    <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              {isToday(date) ? (
                <>
                  {loadingMissing ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="w-8 h-8 absolute top-2 left-2 border-4 border-indigo-100 border-b-indigo-400 rounded-full animate-spin"></div>
                      </div>
                      <p className="ml-4 text-gray-500 font-medium">Loading team status...</p>
                    </div>
                  ) : missingReports.length === 0 ? (
                    <div className="p-6 mx-6 my-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 overflow-hidden relative">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-100 rounded-full opacity-30"></div>
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                          <FiCheckCircle className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-green-700 mb-1">All Caught Up!</h3>
                          <p className="text-green-600">Everyone on the team has submitted their reports for today.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex flex-wrap justify-between items-center mb-4">
                        <p className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-full inline-flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" /> 
                          {missingReports.length} {missingReports.length === 1 ? 'person' : 'people'} still need to submit a report
                        </p>
                        
                        {missingReports.length > 0 && (
                          <div className="mt-2 sm:mt-0 flex">
                            <div className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 mr-2 flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
                              <span>Last updated: {format(new Date(), 'h:mm a')}</span>
                            </div>
                            
                            <button
                              onClick={() => handleNewReport()}
                              className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 flex items-center hover:bg-indigo-700 transition-colors"
                            >
                              <FiPlus className="mr-1 h-3 w-3" />
                              Add Report
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {missingReports.map((member, index) => (
                          <motion.div
                            key={`missing-${member.id}-${index}`}
                            className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            onClick={() => navigate(`/profile/${member.id}`)}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                className="w-9 h-9 rounded-full object-cover shadow mr-3 border-2 border-indigo-100"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow mr-3">
                                {member.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{member.name}</p>
                              <p className="text-xs text-gray-600 truncate">{member.teams?.name || 'No Team'}</p>
                            </div>
                            <FiAlertCircle className="text-amber-500 ml-2" />
                            <FiChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12 px-6 bg-gray-50">
                  <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-400 mb-4">
                      <FiCalendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Historical View</h3>
                    <p className="text-gray-500 mb-4">Missing reports are only available for the current date.</p>
                    <motion.button 
                      onClick={() => setDate(new Date().toISOString().split('T')[0])}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors text-sm font-medium"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Switch to Today
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Fullscreen Modal */}
      <AnimatePresence>
      {showFullscreenModal && (
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
          
            <div 
              className="w-full max-w-5xl mx-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              {filteredReports.length > 0 && (
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
                      {/* Current report content */}
                      <div className="flex items-center gap-5 mb-8 pb-5 border-b border-gray-200">
                        <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shadow-md">
                          {filteredReports[currentReportIndex].users?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                          <h3 className="text-3xl font-bold text-gray-900 mb-1">{filteredReports[currentReportIndex].users?.name || 'Unknown User'}</h3>
                          <div className="text-gray-500 flex items-center gap-3 text-lg">
                          <span className="font-medium">{filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}</span>
                            <span>&bull;</span>
                            <span className="flex items-center">
                              <FiClock className="mr-1.5" />
                              {filteredReports[currentReportIndex].created_at 
                                ? format(parseISO(filteredReports[currentReportIndex].created_at), 'MMM d, h:mm a') 
                                : ''}
                            </span>
                      </div>
                    </div>
                    
                        <div className="ml-auto text-sm bg-primary-50 text-primary-700 rounded-full px-4 py-1 border border-primary-100">
                          Report {currentReportIndex + 1} of {filteredReports.length}
                      </div>
                  </div>
                  
                      <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-primary-50 rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border border-primary-100">
                          <h4 className="font-semibold text-primary-700 mb-4 flex items-center text-xl border-b border-primary-100 pb-3">
                            <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                          Yesterday
                        </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                            {filteredReports[currentReportIndex].yesterday || <span className="italic text-gray-400">No update</span>}
                        </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border border-green-100">
                          <h4 className="font-semibold text-green-700 mb-4 flex items-center text-xl border-b border-green-100 pb-3">
                            <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                          Today
                        </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                            {filteredReports[currentReportIndex].today || <span className="italic text-gray-400">No update</span>}
                        </div>
                        </div>
                        
                        <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border ${filteredReports[currentReportIndex].blockers ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                          <h4 className={`font-semibold mb-4 flex items-center text-xl pb-3 border-b ${filteredReports[currentReportIndex].blockers ? 'text-red-700 border-red-100' : 'text-gray-700 border-gray-200'}`}>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${filteredReports[currentReportIndex].blockers ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>3</span>
                          Blockers
                        </h4>
                          <div className={`flex-1 overflow-y-auto custom-scrollbar px-1 prose ${filteredReports[currentReportIndex].blockers ? 'text-red-700' : 'text-green-700'}`}>
                            {filteredReports[currentReportIndex].blockers || <span className="italic text-emerald-600 flex items-center gap-1">
                              <FiCheckCircle className="h-3 w-3" />
                              No blockers
                            </span>}
                          </div>
                    </div>
                  </div>
                      
                      {/* Navigation indicator */}
                      <div className="flex items-center justify-center mt-8 gap-2">
                        {filteredReports.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-3 rounded-full transition-all cursor-pointer hover:scale-110 ${idx === currentReportIndex ? 'bg-primary-500 w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'}`}
                            onClick={() => setCurrentReportIndex(idx)}
              />
            ))}
          </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Left/Right Buttons for Navigation */}
                  {filteredReports.length > 1 && (
                    <>
                      <button 
                        className={`absolute left-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                        onClick={prevReport}
                        disabled={currentReportIndex === 0}
                      >
                        <FiChevronLeft size={28} />
                      </button>
                      <button 
                        className={`absolute right-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                        onClick={nextReport}
                        disabled={currentReportIndex === filteredReports.length - 1}
                      >
                        <FiChevronRight size={28} />
                      </button>
                    </>
                  )}
      </div>
    )}
    </div>
          </motion.div>
        )}
      </AnimatePresence>

      

      {/* Modal for Missing Reports */}
      <UserListModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        title="Missing Reports Today"
        users={missingReports}
        emptyMessage="Everyone has submitted their reports today!"
      />

      {/* Custom Team Availability Modal */}
      <AnimatePresence>
        {showOnLeaveModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOnLeaveModal(false)}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Team Availability</h2>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowOnLeaveModal(false)}
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <span className="font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                    {teams.find(t => t.id === userTeamId)?.name || 'Team'}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="font-medium text-gray-700">
                    {format(new Date(), 'MMMM d, yyyy')}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-green-600 font-medium bg-green-100 px-2.5 py-1 rounded-full">
                    {availableMembers.length} Available
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-red-600 font-medium bg-red-100 px-2.5 py-1 rounded-full">
                    {onLeaveMembers.length} On Leave
                  </span>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* On Leave Members Section */}
                {onLeaveMembers.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">On Leave Today</h3>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {onLeaveMembers.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {onLeaveMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={() => navigate(`/profile/${member.id}`)}
                        >
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-red-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium text-sm shadow">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-red-700 font-medium bg-red-100 px-2 py-1 rounded-full w-fit mt-1">
                              On Leave Today
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Available Members Section */}
                {availableMembers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Available Today</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {availableMembers.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {availableMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={() => navigate(`/profile/${member.id}`)}
                        >
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm shadow">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full w-fit mt-1">
                              Available Today
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No members message */}
                {onLeaveMembers.length === 0 && availableMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No team members found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
   
    </motion.div>
  );
}