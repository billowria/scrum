import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { format, isToday, parseISO, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../supabaseClient';

// Icons
import { FiFilter, FiClock, FiUser, FiUsers, FiCheckCircle, FiAlertCircle, FiCalendar, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus, FiList, FiGrid, FiMaximize, FiMinimize, FiX, FiFileText, FiArrowRight, FiChevronDown } from 'react-icons/fi';

// Components
import AnnouncementModal from '../components/AnnouncementModal';
import NotificationBell from '../components/NotificationBell';
import Announcements from '../components/Announcements';
import TeamAvailabilityAnalytics from '../components/TeamAvailabilityAnalytics';
import LeaveRequestForm from '../components/LeaveRequestForm';
import TeamHealthIndicator from '../components/TeamHealthIndicator';

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

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); 
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  
  // User state
  const [userId, setUserId] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  
  // Missing reports state
  const [teamMembers, setTeamMembers] = useState([]);
  const [missingReports, setMissingReports] = useState([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  
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
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(true);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [leaveData, setLeaveData] = useState([]);

  useEffect(() => {
    // Get current user information including their team
    const getUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserId(user.id);
        
        // Get user's team information
        const { data, error } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setUserTeamId(data.team_id);
          fetchTeamMembers(data.team_id);
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
        .select('id, name, role')
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
        .select('id, name, role')
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

  return (
      <motion.div 
      className="max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      {/* Dashboard Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-bold font-display mb-2 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            Team Dashboard
          </h1>
          <p className="text-gray-500">
            Your team's collaborative workspace
          </p>
        </div>
        <div className="flex gap-2">
            <motion.button
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
              onClick={handleNewReport}
          >
            <FiPlus />
            New Report
            </motion.button>
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
          <div className="relative overflow-hidden border border-gray-300 rounded-lg flex items-center">
            <motion.div 
              className="absolute top-0 bottom-0 left-0 right-0 bg-primary-500 rounded-md"
              variants={switchVariants}
              animate={viewMode === 'carousel' ? 'list' : 'grid'}
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '50%', height: '100%', opacity: 0.15 }}
            />
          <motion.button
              className={`p-2 z-10 relative text-gray-600 hover:text-primary-600 transition-colors ${viewMode === 'list' ? 'text-primary-600 font-medium' : ''}`}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setViewMode('list')}
            >
              <FiList />
          </motion.button>
          <motion.button
              className={`p-2 z-10 relative text-gray-600 hover:text-primary-600 transition-colors ${viewMode === 'carousel' ? 'text-primary-600 font-medium' : ''}`}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setViewMode('carousel')}
            >
              <FiGrid />
          </motion.button>
          </div>
        </div>
      </motion.div>
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-4 mb-6"
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
      {/* Main Content: Daily Reports View with Carousel and Missing Reports */}
      <div className="grid grid-cols-1 gap-6">
        
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
            <div className="relative p-6 md:p-8 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm">
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
            
            {/* Date navigation bar */}
            <motion.div 
              className="relative p-5 bg-gradient-to-r from-indigo-50 to-slate-50"
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
            <div className="p-4 md:p-6 bg-white/90 backdrop-blur-sm min-h-[300px]">
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
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
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
                        <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
                          <div className="flex items-center gap-3">
                            {filteredReports[currentReportIndex].users?.image_url ? (
                              <img
                                src={filteredReports[currentReportIndex].users.image_url}
                                alt={filteredReports[currentReportIndex].users?.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-semibold text-lg border-2 border-white shadow-md">
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
                              <div className={`flex-1 overflow-y-auto custom-scrollbar px-1 prose prose-sm ${
                                filteredReports[currentReportIndex].blockers ? 'text-amber-900' : 'text-blue-900'
                              }`}>
                                {filteredReports[currentReportIndex].blockers || 
                                  <span className="italic text-gray-400 flex items-center gap-2">
                                    <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                                    No blockers reported
                                  </span>
                                }
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
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
                    
        {/* Missing Reports Widget */}
        <div className="w-full max-w-4xl mx-auto mb-10">
          <motion.div 
            variants={itemVariants} 
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold flex items-center text-gray-800">
                <FiAlertCircle className="mr-3 text-primary-500" />
                Missing Reports Today
              </h2>
              <p className="text-gray-500 text-sm mt-1">Team members who haven't submitted their daily report yet</p>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {isToday(date) ? (
                <>
                  {loadingMissing ? (
                    <div className="flex justify-center py-8">
                      <motion.div 
                        className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : missingReports.length === 0 ? (
                    <div className="text-center p-6 bg-green-50 rounded-xl text-green-700 border border-green-100">
                      <FiCheckCircle className="mx-auto mb-3 h-8 w-8" />
                      <p className="font-bold text-xl mb-2">All Caught Up!</p>
                      <p className="text-green-600">Everyone on the team has submitted their reports for today.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-yellow-600 mb-4 bg-yellow-50 p-2 rounded-lg inline-flex items-center">
                        <FiAlertCircle className="mr-2" /> {missingReports.length} team member{missingReports.length > 1 ? 's' : ''} still need to submit their report.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {missingReports.map(member => (
                          <div key={member.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors border border-gray-200">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3 shadow-sm">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-medium text-gray-800 block">{member.name}</span>
                                <span className="text-xs text-gray-500">{member.role || 'Team Member'}</span>
                              </div>
                            </div>
                            <span className="text-sm text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">Pending</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mx-auto mb-4">
                    <FiCalendar className="h-8 w-8" />
                  </div>
                  <p className="text-lg mb-3">Missing reports are only available for today.</p>
                  <button 
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="mt-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
                  >
                    Switch to Today
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
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
                            <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                            Yesterday
                          </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                            {filteredReports[currentReportIndex].yesterday || <span className="italic text-gray-400">No update provided</span>}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border border-green-100">
                          <h4 className="font-semibold text-green-700 mb-4 flex items-center text-xl border-b border-green-100 pb-3">
                            <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                            Today
                          </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                            {filteredReports[currentReportIndex].today || <span className="italic text-gray-400">No update provided</span>}
                          </div>
                        </div>
                        
                        <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border ${filteredReports[currentReportIndex].blockers ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                          <h4 className={`font-semibold mb-4 flex items-center text-xl pb-3 border-b ${filteredReports[currentReportIndex].blockers ? 'text-red-700 border-red-100' : 'text-gray-700 border-gray-200'}`}>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${filteredReports[currentReportIndex].blockers ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>3</span>
                            Blockers
                          </h4>
                          <div className={`flex-1 overflow-y-auto custom-scrollbar px-1 prose ${filteredReports[currentReportIndex].blockers ? 'text-red-700' : 'text-green-700'}`}>
                            {filteredReports[currentReportIndex].blockers || <span className="italic text-gray-400">No blockers reported</span>}
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
    </motion.div>
  );
}