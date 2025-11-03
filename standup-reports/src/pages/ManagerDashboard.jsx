import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../supabaseClient';
import { notifyLeaveStatus } from '../utils/notificationHelper';
import { useCompany } from '../contexts/CompanyContext';
import { FiUsers, FiClipboard, FiSettings, FiClock, FiCalendar, FiCheck, FiX, 
  FiMessageSquare, FiUser, FiRefreshCw, FiAlertCircle, FiInfo,FiBell, FiChevronLeft, FiChevronRight,
  FiTarget, FiTrendingUp, FiFileText, FiAward, FiShield, FiZap, FiStar, FiUserPlus, FiMail, FiLock, FiFolder } from 'react-icons/fi';
import { TbListDetails } from 'react-icons/tb';
import { TbHistory } from 'react-icons/tb';
import History from './History';

// Components
import LeavePastRecords from '../components/LeavePastRecords';
import AnnouncementManager from '../components/AnnouncementManager';
import TeamManagement from './TeamManagement';
import FloatingNav from '../components/FloatingNav';
import AddMember from '../components/AddMember';
import ProjectManagement from '../components/ProjectManagement';
import TimesheetHistory from '../components/TimesheetHistory';
import './ManagerDashboard.css';

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
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.05,
      type: 'spring', 
      stiffness: 300, 
      damping: 24 
    }
  })
};

const tabContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const tabItemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

const tabContent = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.1,
    },
  },
};

const badgeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 15,
    },
  },
  pulse: {
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 0 0px rgba(255, 255, 255, 0.4)',
      '0 0 0 5px rgba(255, 255, 255, 0)',
      '0 0 0 0px rgba(255, 255, 255, 0)',
    ],
    transition: {
      duration: 1.8,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 0.3,
    },
  },
};

// Beautiful Tab Header Component
const TabHeader = ({ 
  title, 
  subtitle, 
  description, 
  icon: Icon, 
  gradient, 
  stats = [], 
  features = [],
  accentColor = "blue" 
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-600 via-purple-600 to-indigo-600",
      accent: "from-blue-500 to-purple-500",
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    green: {
      gradient: "from-green-600 via-emerald-600 to-teal-600",
      accent: "from-green-500 to-emerald-500",
      text: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200"
    },
    purple: {
      gradient: "from-purple-600 via-pink-600 to-indigo-600",
      accent: "from-purple-500 to-pink-500",
      text: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200"
    },
    orange: {
      gradient: "from-orange-600 via-red-600 to-pink-600",
      accent: "from-orange-500 to-red-500",
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200"
    },
    indigo: {
      gradient: "from-indigo-600 via-blue-600 to-purple-600",
      accent: "from-indigo-500 to-blue-500",
      text: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200"
    },
    emerald: {
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      accent: "from-emerald-500 to-teal-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200"
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative p-8 lg:p-12">
        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Section */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <motion.div 
                className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Icon className={`w-8 h-8 ${colors.text}`} />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl lg:text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h1>
                <motion.p 
                  className="text-xl text-white/90 font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {subtitle}
                </motion.p>
              </div>
            </div>

            <motion.p 
              className="text-white/80 text-lg leading-relaxed max-w-2xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {description}
            </motion.p>

            {/* Features */}
            {features.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`px-4 py-2 ${colors.bg} ${colors.border} rounded-full text-sm font-medium ${colors.text} backdrop-blur-sm`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {feature}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right Section - Stats */}
          {stats.length > 0 && (
            <motion.div 
              className="lg:w-80"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-white/80 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 left-8 w-1 h-1 bg-white/40 rounded-full"
          animate={{ 
            scale: [1, 2, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
      </div>
    </motion.div>
  );
};

export default function ManagerDashboard({ activeTabDefault = 'team-management' }) {
  const { currentCompany } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  const [activeSubTab, setActiveSubTab] = useState('team-management');
  
  // Refs for scroll functionality
  const teamManagementRef = useRef(null);
  const announcementsRef = useRef(null);
  const reportHistoryRef = useRef(null);
  const projectManagerRef = useRef(null);
  const projectsRef = useRef(null);
  
  // Get tab from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');

    if (tabParam && ['team-management', 'announcements', 'report-history', 'projects', 'project-manager', 'timesheets'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(activeTabDefault);
    }

    if (subtabParam && ['staff-oversight', 'team-assignment', 'manager-delegation'].includes(subtabParam)) {
      setActiveSubTab(subtabParam);
    }
  }, [location.search, activeTabDefault]);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // date, status, team
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, team_id, manager_id')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setCurrentUser(data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  const tabs = [
    {
      id: 'team-management',
      label: 'Team Management',
      icon: <FiUsers />,
    },
    {
      id: 'timesheets',
      label: 'Timesheets',
      icon: <TbListDetails />,
    },
    {
      id: 'add-member',
      label: 'Add Member',
      icon: <FiUserPlus />,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <FiBell />,
    },
    {
      id: 'report-history',
      label: 'Report History',
      icon: <TbHistory />,
    },
    {
      id: 'project-manager',
      label: 'Project Manager',
      icon: <FiFolder />,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FiFolder />,
    },
  ];
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null });
  const [userFilter, setUserFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchTeams();
    fetchUsers();
    fetchLeaveRequests();
  }, [currentCompany]); // Re-fetch when company data changes

  // Set up real-time subscription for leave requests
  useEffect(() => {
    const leaveRequestsSubscription = supabase
      .channel('leave_requests_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_plans'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchLeaveRequests();
        }
      )
      .subscribe();

    return () => {
      leaveRequestsSubscription.unsubscribe();
    };
  }, [refreshTrigger]);
  
  const fetchTeams = async () => {
    try {
      // Don't fetch teams if company is not loaded yet
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };
  
  const fetchUsers = async () => {
    try {
      // Don't fetch users if company is not loaded yet
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, company_id,
          teams:team_id (id, name)
        `)
        .eq('company_id', currentCompany.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLeaveRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let managedTeamIds = [];

      if (user) {
        const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();

        if (currentUser.role === 'manager') {
            const { data: teamsData } = await supabase.rpc('get_managed_team_ids', { manager_id_param: user.id });
            managedTeamIds = teamsData.map(t => t.team_id);
        }

        let query = supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status, created_at,
          users:user_id (id, name, team_id, teams:team_id(id, name))
        `)
        .order('created_at', { ascending: false });
      
        if (currentUser.role === 'manager' && managedTeamIds.length > 0) {
          query = query.filter('users.team_id', 'in', `(${managedTeamIds.join(',')})`);
        }
        
        const { data, error } = await query;
      if (error) throw error;
      
        setLeaveRequests(data || []);
      const pending = data?.filter(request => request.status === 'pending') || [];
      setPendingCount(pending.length);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error.message);
    }
  };


  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleAssignTeam = async () => {
    if (!selectedUser || !selectedTeam) {
      setMessage({ type: 'error', text: 'Please select both user and team' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ team_id: selectedTeam })
        .eq('id', selectedUser)
        .eq('company_id', currentCompany?.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Team assigned successfully' });
      setShowUserModal(false);
      setSelectedUser(null);
      setSelectedTeam(null);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning team:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  const handleLeaveAction = async (leaveId, status) => {
    try {
      // Get leave request details before updating
      const leaveRequest = leaveRequests.find(req => req.id === leaveId);
      
      const { error } = await supabase
        .from('leave_plans')
        .update({ status })
        .eq('id', leaveId);
      
      if (error) throw error;
      
      // Send notification to the user about their leave status
      if (leaveRequest && leaveRequest.users?.id) {
        try {
          await notifyLeaveStatus(
            leaveRequest,
            status,
            leaveRequest.users.id
          );
        } catch (notificationError) {
          console.error('Error sending leave notification:', notificationError);
          // Continue even if notification fails
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully` 
      });
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating leave request:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  // Enhanced filtering and sorting
  const filteredLeaveRequests = leaveRequests
    .filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      
      // User filter for leave history
      if (activeTab === 'leave-history' && userFilter !== 'all' && request.users?.id !== userFilter) return false;
      
      // Team filter for leave requests
      if (activeTab === 'leave-requests' && teamFilter !== 'all' && request.users?.teams?.id !== teamFilter) return false;
      
      // Search query
      if (searchQuery && !request.users?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Date range filter
      if (dateRangeFilter.start && dateRangeFilter.end) {
        const requestStart = parseISO(request.start_date);
        const requestEnd = parseISO(request.end_date);
        const filterStart = parseISO(dateRangeFilter.start);
        const filterEnd = parseISO(dateRangeFilter.end);
        
        if (requestStart < filterStart || requestEnd > filterEnd) return false;
      }
      
      return true;
    });
  
  // Pagination logic
  const paginatedLeaveRequests = filteredLeaveRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLeaveRequests.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add this to your JSX where you render the leave history
  const renderPagination = () => (
    <div className="flex justify-center items-center gap-2 mt-4 mb-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-primary-600 hover:bg-primary-50'
        }`}
      >
        <FiChevronLeft size={20} />
      </button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-primary-50'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-primary-600 hover:bg-primary-50'
        }`}
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
  
  // Leave type badge color helper
  const getLeaveTypeBadgeClass = (type) => {
    switch (type) {
      case 'sick':
        return 'bg-blue-100 border-blue-200 text-blue-700';
      case 'personal':
        return 'bg-indigo-100 border-indigo-200 text-indigo-700';
      case 'family':
        return 'bg-purple-100 border-purple-200 text-purple-700';
      case 'other':
        return 'bg-gray-100 border-gray-200 text-gray-700';
      case 'vacation':
      default:
        return 'bg-teal-100 border-teal-200 text-teal-700';
    }
  };

  // Get formatted leave type
  const getFormattedLeaveType = (type) => {
    // Since the leave_type column doesn't exist in the leave_requests table,
    // we'll just return a default value.
    // In a real scenario, you would map the type to a display-friendly string.
    return 'Vacation'; // Default to Vacation for all leave requests since the leave_type column doesn't exist
  };

  // Scroll to tab function
  const scrollToTab = (tabId) => {
    const refs = {
      'team-management': teamManagementRef,
      'leave-management': null, // Leave management doesn't need a specific ref since it's the whole section
      'announcements': announcementsRef,
      'report-history': reportHistoryRef,
      'project-manager': projectManagerRef,
      'projects': projectsRef
    };

    const ref = refs[tabId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pt-2 pr-5 pb-5 pl-5">
      {/* Floating Navigation */}
      <FloatingNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        context="manager-dashboard"
        onTabClick={scrollToTab}
        userRole={currentUser?.role}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContent}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Team Management Tab */}
          {activeTab === 'team-management' && (
            <div ref={teamManagementRef}>
              <TeamManagement activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
            </div>
          )}

          {/* Add Member Tab */}
          {activeTab === 'add-member' && (
            <AddMember 
              onMemberAdded={() => {
                fetchUsers();
                setRefreshTrigger(prev => prev + 1);
              }} 
              onClose={() => setActiveTab('team-management')}
            />
          )}



          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div ref={announcementsRef}>
              <TabHeader
                title="Announcements"
                subtitle="Communicate with Your Team"
                description="Create and manage team announcements, important updates, and company communications. Schedule posts, target specific teams, and track engagement with your messages."
                icon={FiBell}
                accentColor="orange"
                features={[
                  "Team Communication",
                  "Scheduled Posts",
                  "Targeted Messages",
                  "Engagement Tracking"
                ]}
                stats={[
                  { value: "Active", label: "Status" },
                  { value: teams.length, label: "Teams" },
                  { value: users.length, label: "Recipients" },
                  { value: "Real-time", label: "Updates" }
                ]}
              />
              <AnnouncementManager />
            </div>
          )}

          {/* Report History Tab */}
          {activeTab === 'report-history' && (
            <div ref={reportHistoryRef}>
              <TabHeader
                title="Report History"
                subtitle="Analytics & Performance Insights"
                description="Access comprehensive reports and analytics on team performance, leave patterns, and operational metrics. Generate insights, track trends, and make data-driven decisions."
                icon={TbHistory}
                accentColor="indigo"
                features={[
                  "Performance Analytics",
                  "Trend Analysis",
                  "Data Export",
                  "Custom Reports"
                ]}
                stats={[
                  { value: "24/7", label: "Availability" },
                  { value: "Real-time", label: "Data" },
                  { value: "Multiple", label: "Formats" },
                  { value: "Secure", label: "Access" }
                ]}
              />
              <History />
            </div>
          )}

          {/* Timesheets Tab */}
          {activeTab === 'timesheets' && (
            <div>
              <TabHeader
                title="Timesheet History"
                subtitle="Review & Approve Submissions"
                description="View employee timesheet submissions for your teams. Inspect entries and approve or reject pending submissions."
                icon={TbListDetails}
                accentColor="indigo"
                features={[
                  'Submission Review',
                  'Approval Workflow',
                  'Team Filtering',
                  'Detailed View'
                ]}
              />
              <TimesheetHistory />
            </div>
          )}

          {/* Project Manager Tab */}
          {activeTab === 'project-manager' && (
            <div ref={projectManagerRef}>
              <TabHeader
                title="Project Manager"
                subtitle="Create & Manage Projects"
                description="Comprehensive project management system for creating, organizing, and managing projects with sections, topics, and content. Assign team members, track progress, and maintain project documentation."
                icon={FiFolder}
                accentColor="emerald"
                features={[
                  "Project Creation",
                  "Team Assignment",
                  "Content Management",
                  "Progress Tracking"
                ]}
                stats={[
                  { value: "Active", label: "Status" },
                  { value: "Multiple", label: "Projects" },
                  { value: "Real-time", label: "Updates" },
                  { value: "Secure", label: "Access" }
                ]}
              />
              <ProjectManagement />
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div ref={projectsRef}>
              <ProjectManagement />
            </div>
          )}
        </motion.div>
      </AnimatePresence>



    </div>
  );
}




