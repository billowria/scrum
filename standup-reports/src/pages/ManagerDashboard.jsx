import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../supabaseClient';
import { FiUsers, FiClipboard, FiSettings, FiClock, FiCalendar, FiCheck, FiX, 
  FiMessageSquare, FiUser, FiRefreshCw, FiAlertCircle, FiInfo,FiBell } from 'react-icons/fi';

// Components
import LeavePastRecords from '../components/LeavePastRecords';
import AnnouncementManager from '../components/AnnouncementManager';

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

const tabVariants = {
  inactive: { 
    color: "#6B7280", 
    backgroundColor: "transparent",
    boxShadow: "none"
  },
  active: { 
    color: "#4F46E5", 
    backgroundColor: "#EEF2FF",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  }
};

export default function ManagerDashboard({ activeTabDefault = 'team-management' }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  
  // Get tab from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['team-management', 'leave-requests', 'leave-history', 'announcements'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
    setActiveTab(activeTabDefault);
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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null });
  
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
      const { data, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status, created_at,
          users:user_id (id, name, team_id, teams:team_id(id, name))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeaveRequests(data || []);
      
      // Update pending count
      const pending = data?.filter(request => request.status === 'pending') || [];
      setPendingCount(pending.length);
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
      
      // Team filter
      if (teamFilter !== 'all' && request.users?.teams?.id !== teamFilter) return false;
      
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
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'team':
          return (a.users?.teams?.name || '').localeCompare(b.users?.teams?.name || '');
        default:
          return 0;
      }
  });
  
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
    return 'Vacation'; // Default to Vacation for all leave requests since the leave_type column doesn't exist
  };
  
  return (
    <motion.div
      className="max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl font-bold font-display mb-6 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent"
        variants={itemVariants}
      >
        Manager Dashboard
      </motion.h1>
      
      {/* Success/error message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            className={`mb-4 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {message.type === 'success' ? <FiCheck className="mr-2" /> : <FiX className="mr-2" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tabs */}
      <motion.div 
        className="flex border-b border-gray-200 mb-6 overflow-x-auto"
        variants={itemVariants}
      >
        <motion.a
          href="/team-management"
          className={`py-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'team-management' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          variants={tabVariants}
          animate={activeTab === 'team-management' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiUsers />
          Team Management
        </motion.a>
        
        <motion.button
          className={`py-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'leave-requests' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('leave-requests')}
          variants={tabVariants}
          animate={activeTab === 'leave-requests' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiCalendar />
          Leave Requests
        </motion.button>
        
        <motion.button
          className={`py-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'leave-history' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('leave-history')}
          variants={tabVariants}
          animate={activeTab === 'leave-history' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiClock />
          Leave History
        </motion.button>
        
        <motion.button
          className={`py-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'announcements' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('announcements')}
          variants={tabVariants}
          animate={activeTab === 'announcements' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiBell />
          Announcements
        </motion.button>
      </motion.div>
      
      {/* Refresh button */}
      <motion.div 
        className="flex justify-end mb-4"
        variants={itemVariants}
      >
        <motion.button
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
          onClick={handleRefresh}
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </motion.div>
      
      {/* Team Management Tab */}
      {activeTab === 'team-management' && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FiUsers className="text-primary-600" />
              Workforce Management
            </h2>
            
            <motion.a
              href="/team-management"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiUsers />
              Manage Workforce
            </motion.a>
          </div>
          
          <p className="text-gray-600 mb-6">
            Click the button above to access the Workforce Management interface where you can:
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-primary-700 mb-2 flex items-center gap-2">
                <FiUsers className="text-primary-500" />
                Staff Oversight
              </h3>
              <p className="text-sm text-gray-600">
                View and manage team members in your organization.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-primary-700 mb-2 flex items-center gap-2">
                <FiUsers className="text-primary-500" />
                Team Assignment
              </h3>
              <p className="text-sm text-gray-600">
                Assign team members to specific teams or projects.
              </p>
                          </div>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-primary-700 mb-2 flex items-center gap-2">
                <FiUsers className="text-primary-500" />
                Manager Delegation
              </h3>
              <p className="text-sm text-gray-600">
                Assign managers to oversee specific team members.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Leave Requests Tab */}
      {activeTab === 'leave-requests' && (
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
          
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-800">{leaveRequests.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <FiCalendar size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-4 border border-yellow-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <FiClock size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-800">
                    {leaveRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <FiCheck size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-4 border border-red-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-800">
                    {leaveRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <FiX size={20} />
                </div>
              </div>
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
                  {filteredLeaveRequests.map((request, index) => {
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
      )}
      
      {/* Leave History Tab */}
      {activeTab === 'leave-history' && (
        <LeavePastRecords />
      )}
      
      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <AnnouncementManager />
      )}
      
      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showUserModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
            />
            
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-primary-600 text-white p-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FiUsers />
                    {selectedUser ? 'Update Team Assignment' : 'Assign Team to User'}
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium">Select User</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={selectedUser || ''}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      disabled={!!selectedUser}
                    >
                      <option value="">Select a user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-medium">Select Team</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={selectedTeam || ''}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="">Select a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <motion.button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                      onClick={() => setShowUserModal(false)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      onClick={handleAssignTeam}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!selectedUser || !selectedTeam}
                    >
                      {selectedUser ? 'Update Assignment' : 'Assign Team'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
