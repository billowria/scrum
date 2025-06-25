import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../supabaseClient';
import { FiUsers, FiClipboard, FiSettings, FiClock, FiCalendar, FiCheck, FiX, 
  FiMessageSquare, FiUser, FiRefreshCw, FiAlertCircle, FiInfo,FiBell, FiChevronLeft, FiChevronRight,
  FiTarget, FiTrendingUp, FiFileText, FiAward, FiShield, FiZap, FiStar } from 'react-icons/fi';
import { TbHistory } from 'react-icons/tb';
import History from './History';

// Components
import LeavePastRecords from '../components/LeavePastRecords';
import AnnouncementManager from '../components/AnnouncementManager';
import TeamManagement from './TeamManagement';
import FloatingNav from '../components/FloatingNav';
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
    }
  };

  const colors = colorClasses[accentColor];

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

export default function ManagerDashboard({ activeTabDefault = 'leave-requests' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  const [activeSubTab, setActiveSubTab] = useState('staff-oversight');
  
  // Refs for scroll functionality
  const teamManagementRef = useRef(null);
  const leaveRequestsRef = useRef(null);
  const leaveHistoryRef = useRef(null);
  const announcementsRef = useRef(null);
  const reportHistoryRef = useRef(null);
  
  // Get tab from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');

    if (tabParam && ['team-management', 'leave-requests', 'leave-history', 'announcements', 'report-history'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(activeTabDefault);
    }

    if (subtabParam && ['staff-oversight', 'team-assignment', 'manager-delegation'].includes(subtabParam)) {
      setActiveSubTab(subtabParam);
    }
  }, [location.search, activeTabDefault]);
  
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

  const tabs = [
    {
      id: 'team-management',
      label: 'Team Management',
      icon: <FiUsers />,
    },
    {
      id: 'leave-requests',
      label: 'Leave Requests',
      icon: <FiClipboard />,
    },
    {
      id: 'leave-history',
      label: 'Leave History',
      icon: <FiClock />,
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
    
    // Set up real-time subscription for leave requests
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
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role,
          teams:team_id (id, name)
        `);
      
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
        .eq('id', selectedUser);
      
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
      const { error } = await supabase
        .from('leave_plans')
        .update({ status })
        .eq('id', leaveId);
      
      if (error) throw error;
      
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
      'leave-requests': leaveRequestsRef,
      'leave-history': leaveHistoryRef,
      'announcements': announcementsRef,
      'report-history': reportHistoryRef
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Floating Navigation */}
      <FloatingNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        context="manager-dashboard"
        onTabClick={scrollToTab}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContent}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="max-w-7xl mx-auto"
        >
          {/* Team Management Tab */}
          {activeTab === 'team-management' && (
            <div ref={teamManagementRef}>
              <TabHeader
                title="Team Management"
                subtitle="Lead & Organize Your Team"
                description="Comprehensive team oversight with member assignments, role management, and performance tracking. Manage team structures, delegate responsibilities, and monitor team dynamics."
                icon={FiUsers}
                accentColor="blue"
                features={[
                  "Staff Oversight",
                  "Team Assignment", 
                  "Manager Delegation",
                  "Role Management"
                ]}
                stats={[
                  { value: teams.length, label: "Teams" },
                  { value: users.length, label: "Members" },
                  { value: users.filter(u => u.role === 'manager').length, label: "Managers" },
                  { value: users.filter(u => u.role === 'member').length, label: "Members" }
                ]}
              />
              <TeamManagement activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
            </div>
          )}

          {/* Leave Requests Tab */}
          {activeTab === 'leave-requests' && (
            <div ref={leaveRequestsRef}>
              <TabHeader
                title="Leave Requests"
                subtitle="Approve & Manage Time Off"
                description="Review and approve employee leave requests with comprehensive filtering and status management. Track pending approvals, manage team availability, and maintain leave policies."
                icon={FiClipboard}
                accentColor="green"
                features={[
                  "Request Approval",
                  "Status Management",
                  "Team Filtering",
                  "Quick Actions"
                ]}
                stats={[
                  { value: leaveRequests.length, label: "Total Requests" },
                  { value: leaveRequests.filter(r => r.status === 'pending').length, label: "Pending" },
                  { value: leaveRequests.filter(r => r.status === 'approved').length, label: "Approved" },
                  { value: leaveRequests.filter(r => r.status === 'rejected').length, label: "Rejected" }
                ]}
              />
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FiCalendar className="text-primary-600" />
                    Leave Requests
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                          statusFilter === 'all' 
                            ? 'bg-white shadow-sm text-primary-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setStatusFilter('all')}
                      >
                        All
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                          statusFilter === 'pending' 
                            ? 'bg-white shadow-sm text-primary-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setStatusFilter('pending')}
                      >
                        Pending
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                          statusFilter === 'approved' 
                            ? 'bg-white shadow-sm text-primary-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setStatusFilter('approved')}
                      >
                        Approved
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                          statusFilter === 'rejected' 
                            ? 'bg-white shadow-sm text-primary-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setStatusFilter('rejected')}
                      >
                        Rejected
                      </button>
                    </div>
                    
                    <motion.button
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-primary-600 transition-colors"
                      onClick={handleRefresh}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Refresh"
                    >
                      <FiRefreshCw />
                    </motion.button>
                  </div>
                </div>
                
                {/* Table of Requests */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : filteredLeaveRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FiInfo className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No leave requests found</p>
                    <p className="text-gray-400 mt-2">Try a different filter or check back later</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedLeaveRequests.map((request, index) => {
                          const startDate = parseISO(request.start_date);
                          const endDate = parseISO(request.end_date);
                          const isPending = request.status === 'pending';
                          const days = differenceInDays(endDate, startDate) + 1;
                          
                          return (
                            <motion.tr
                              key={request.id}
                              className="hover:bg-gray-50 transition-colors"
                              custom={index}
                              variants={itemVariants}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                    {request.users?.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="ml-2">
                                    <div className="text-sm font-medium text-gray-900">{request.users?.name || 'Unknown'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{request.users?.teams?.name || 'No Team'}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {days} {days === 1 ? 'day' : 'days'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border ${getLeaveTypeBadgeClass('vacation')}`}>
                                  {getFormattedLeaveType()}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                  isPending 
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                    : request.status === 'approved' 
                                      ? 'bg-green-100 text-green-800 border border-green-200' 
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {request.status === 'approved' ? (
                                    <>
                                      <FiCheck className="mr-1" />
                                      Approved
                                    </>
                                  ) : request.status === 'rejected' ? (
                                    <>
                                      <FiX className="mr-1" />
                                      Rejected
                                    </>
                                  ) : (
                                    <>
                                      <FiClock className="mr-1" />
                                      Pending
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-900 max-w-xs truncate">
                                  {request.reason || '-'}
                                </p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isPending ? (
                                  <div className="flex gap-2">
                                    <motion.button
                                      className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                      onClick={() => handleLeaveAction(request.id, 'approved')}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Approve"
                                    >
                                      <FiCheck />
                                    </motion.button>
                                    
                                    <motion.button
                                      className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                      onClick={() => handleLeaveAction(request.id, 'rejected')}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Reject"
                                    >
                                      <FiX />
                                    </motion.button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    {format(parseISO(request.created_at), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Leave History Tab */}
          {activeTab === 'leave-history' && (
            <div ref={leaveHistoryRef}>
              <TabHeader
                title="Leave History"
                subtitle="Track Past Time Off Records"
                description="Comprehensive historical view of all approved and completed leave requests. Analyze patterns, track team availability, and maintain detailed records for reporting and compliance."
                icon={FiClock}
                accentColor="purple"
                features={[
                  "Historical Records",
                  "Pattern Analysis",
                  "Team Availability",
                  "Compliance Tracking"
                ]}
                stats={[
                  { value: leaveRequests.filter(r => r.status === 'approved').length, label: "Approved" },
                  { value: leaveRequests.filter(r => r.status === 'rejected').length, label: "Rejected" },
                  { value: teams.length, label: "Teams" },
                  { value: users.length, label: "Employees" }
                ]}
              />
              <LeavePastRecords />
            </div>
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
