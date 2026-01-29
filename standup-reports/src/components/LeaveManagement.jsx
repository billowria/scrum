import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, getMonth, getYear, differenceInDays } from 'date-fns';
import {
  FiCalendar, FiUser, FiFilter, FiDownload, FiClock, FiCheck, FiX, FiSearch,
  FiChevronLeft, FiChevronRight, FiInfo, FiSliders, FiRefreshCw, FiClipboard, FiTarget
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { notifyLeaveStatus, approveLeaveRequestFromNotification, rejectLeaveRequestFromNotification } from '../utils/notificationHelper';

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

// Beautiful Toggle Component
const ViewToggle = ({ activeView, setActiveView }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeView === 'requests'
            ? 'bg-white shadow-sm text-primary-700'
            : 'text-gray-600 hover:text-gray-800'
          }`}
        onClick={() => setActiveView('requests')}
      >
        <FiClipboard className={activeView === 'requests' ? 'text-primary-600' : ''} />
        Pending Requests
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeView === 'history'
            ? 'bg-white shadow-sm text-primary-700'
            : 'text-gray-600 hover:text-gray-800'
          }`}
        onClick={() => setActiveView('history')}
      >
        <FiClock className={activeView === 'history' ? 'text-primary-700' : ''} />
        History
      </button>
    </div>
  );
};

const LeaveManagement = () => {
  const [activeView, setActiveView] = useState('requests'); // 'requests' or 'history'
  const [allLeaveData, setAllLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedItems, setPaginatedItems] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    month: 'all',
    year: new Date().getFullYear(),
    team: 'all',
    user: 'all',
    status: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Memoized filter function to prevent the initialization error
  const getFilteredData = useCallback(() => {
    let filtered = [...allLeaveData];

    // Filter based on active view
    if (activeView === 'requests') {
      filtered = filtered.filter(item => item.status === 'pending');
    } else {
      // For history view, we show approved/rejected items
      filtered = filtered.filter(item => item.status !== 'pending');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.users?.name?.toLowerCase().includes(query) ||
          item.users?.teams?.name?.toLowerCase().includes(query) ||
          item.reason?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by year
    if (filters.year !== 'all') {
      filtered = filtered.filter(item =>
        getYear(parseISO(item.start_date)) === parseInt(filters.year) ||
        getYear(parseISO(item.end_date)) === parseInt(filters.year)
      );
    }

    // Filter by month
    if (filters.month !== 'all') {
      filtered = filtered.filter(item =>
        getMonth(parseISO(item.start_date)) === parseInt(filters.month) - 1 ||
        getMonth(parseISO(item.end_date)) === parseInt(filters.month) - 1
      );
    }

    // Filter by team
    if (filters.team !== 'all') {
      filtered = filtered.filter(item => item.users?.teams?.id === filters.team);
    }

    // Filter by user
    if (filters.user !== 'all') {
      filtered = filtered.filter(item => item.users?.id === filters.user);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    return filtered;
  }, [allLeaveData, activeView, searchQuery, filters]);



  useEffect(() => {
    // Update pagination when filtered items change
    const filteredData = getFilteredData();
    const total = Math.ceil(filteredData.length / itemsPerPage);
    setTotalPages(total || 1);

    // Reset to first page when filters change
    if (currentPage > total) {
      setCurrentPage(1);
    }

    updatePaginatedItems();
  }, [allLeaveData, activeView, searchQuery, filters, currentPage, itemsPerPage, getFilteredData]); // Use function reference instead of calling it

  const updatePaginatedItems = () => {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(filteredData.slice(startIndex, endIndex));
  };

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
      setUserRole(data?.role || 'member');
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
      setUserRole(null);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      await Promise.all([
        fetchUsers(),
        fetchTeams(),
        fetchLeaveData()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, teams:team_id(id, name)');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

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

  const fetchLeaveData = async () => {
    try {
      let query = supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status, created_at,
          users:user_id (id, name, team_id, teams:team_id(id, name))
        `)
        .order('created_at', { ascending: false });

      // Filter data based on user role
      if (userRole === 'admin') {
        // Admins see all leave requests
      } else if (userRole === 'manager') {
        // Managers see all leave requests for their direct reportees
        query = query.eq('manager_id', currentUser.id);
      } else {
        // Regular users only see their own leave requests
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAllLeaveData(data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error.message);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    // Only allow managers and admins to approve/reject leave requests
    if (userRole !== 'manager' && userRole !== 'admin') {
      console.error('Only managers and admins can approve or reject leave requests');
      return;
    }

    try {
      // Get leave request details before updating
      const leaveItem = allLeaveData.find(req => req.id === leaveId);

      let notificationSuccess = false;

      // Use new notification service methods to update the leave request
      if (status === 'approved') {
        notificationSuccess = await approveLeaveRequestFromNotification(leaveId, currentUser.id);
      } else if (status === 'rejected') {
        notificationSuccess = await rejectLeaveRequestFromNotification(leaveId, currentUser.id);
      }

      if (!notificationSuccess) {
        // Fallback to direct database update if notification method fails
        const { error } = await supabase
          .from('leave_plans')
          .update({ status })
          .eq('id', leaveId);

        if (error) throw error;
      }

      // Send notification to the user about their leave status
      if (leaveItem && leaveItem.users?.id) {
        try {
          await notifyLeaveStatus(
            leaveItem,
            status,
            leaveItem.users.id
          );
        } catch (notificationError) {
          console.error('Error sending leave notification:', notificationError);
          // Continue even if notification fails
        }
      }

      // Refresh the data
      await fetchLeaveData();
    } catch (error) {
      console.error('Error updating leave request:', error.message);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate month options
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate year options (last 5 years and current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Status badge color helper
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-200 text-green-700';
      case 'rejected':
        return 'bg-red-100 border-red-200 text-red-700';
      case 'pending':
      default:
        return 'bg-yellow-100 border-yellow-200 text-yellow-700';
    }
  };

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
    return 'Vacation'; // Default to Vacation for all leave requests
  };

  // Status filter options based on active view
  const statusOptions = activeView === 'requests'
    ? [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' }
    ]
    : [
      { value: 'all', label: 'All Statuses' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' }
    ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const generateCSV = () => {
    const filteredData = getFilteredData();

    // Check if there's data to export
    if (filteredData.length === 0) return;

    // Create CSV header
    const headers = ['Employee', 'Team', 'Start Date', 'End Date', 'Days', 'Type', 'Status', 'Reason', 'Created At'];

    // Create CSV rows
    const rows = filteredData.map(item => [
      item.users?.name || 'Unknown',
      item.users?.teams?.name || 'No Team',
      format(parseISO(item.start_date), 'yyyy-MM-dd'),
      format(parseISO(item.end_date), 'yyyy-MM-dd'),
      differenceInDays(parseISO(item.end_date), parseISO(item.start_date)) + 1,
      'Vacation', // Default leave type
      item.status,
      item.reason || '',
      format(parseISO(item.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_${activeView}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FiTarget className="text-primary-600" />
          <h2 className="text-xl font-semibold">
            {activeView === 'requests' ? 'Leave Requests' : 'Leave History'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <motion.button
            className="px-3 py-2 border border-gray-300 rounded-lg flex items-center gap-1 text-sm hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiSliders className="text-primary-600" />
            Filters
            {Object.values(filters).some(val => val !== 'all') && (
              <span className="w-2 h-2 bg-primary-500 rounded-full ml-1"></span>
            )}
          </motion.button>

          <motion.button
            className="px-3 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-1 text-sm hover:bg-primary-700 transition-colors"
            onClick={generateCSV}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={getFilteredData().length === 0}
          >
            <FiDownload />
            Export
          </motion.button>

          <motion.button
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            onClick={fetchLeaveData}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Refresh data"
          >
            <FiRefreshCw className="text-primary-600" />
          </motion.button>
        </div>
      </div>

      {/* Toggle between requests and history */}
      <div className="px-6 pt-4">
        <ViewToggle activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="px-6 pb-4 bg-gray-50 border-b border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                >
                  <option value="all">All Months</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="all">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={filters.team}
                  onChange={(e) => handleFilterChange('team', e.target.value)}
                >
                  <option value="all">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                >
                  <option value="all">All Employees</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                onClick={() => {
                  setFilters({
                    month: 'all',
                    year: new Date().getFullYear(),
                    team: 'all',
                    user: 'all',
                    status: 'all'
                  });
                  setSearchQuery('');
                }}
              >
                <FiX className="w-3 h-3" />
                Clear filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : getFilteredData().length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No {activeView} found</p>
          {(Object.values(filters).some(val => val !== 'all') || searchQuery) && (
            <p className="mt-2 text-sm">Try adjusting your filters or search</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  {activeView === 'requests' && (userRole === 'manager' || userRole === 'admin') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((leave, index) => {
                  const startDate = parseISO(leave.start_date);
                  const endDate = parseISO(leave.end_date);
                  const leaveDays = differenceInDays(endDate, startDate) + 1;

                  return (
                    <motion.tr
                      key={leave.id}
                      className="hover:bg-gray-50 transition-colors"
                      custom={index}
                      variants={itemVariants}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            {leave.users?.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">{leave.users?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{leave.users?.teams?.name || 'No Team'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activeView === 'history' ? (
                            <>Requested on {format(parseISO(leave.created_at), 'MMM dd, yyyy')}</>
                          ) : (
                            <>Requested {format(parseISO(leave.created_at), 'MMM dd, yyyy')}</>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">{leaveDays} {leaveDays === 1 ? 'day' : 'days'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border ${getLeaveTypeBadgeClass(leave.leave_type)}`}>
                          {getFormattedLeaveType(leave.leave_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status === 'approved' ? (
                            <FiCheck className="mr-1" />
                          ) : leave.status === 'rejected' ? (
                            <FiX className="mr-1" />
                          ) : (
                            <FiClock className="mr-1" />
                          )}
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {leave.reason || '-'}
                        </div>
                      </td>
                      {activeView === 'requests' && (userRole === 'manager' || userRole === 'admin') && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <motion.button
                              className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              onClick={() => handleLeaveAction(leave.id, 'approved')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Approve"
                            >
                              <FiCheck />
                            </motion.button>

                            <motion.button
                              className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              onClick={() => handleLeaveAction(leave.id, 'rejected')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Reject"
                            >
                              <FiX />
                            </motion.button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                {(() => {
                  const filteredData = getFilteredData();
                  return (
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                      <span className="font-medium">{Math.min(filteredData.length, currentPage * itemsPerPage)}</span> of{' '}
                      <span className="font-medium">{filteredData.length}</span> results
                    </p>
                  );
                })()}
              </div>
              <div className="flex gap-x-4 items-center">
                <select
                  className="border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>

                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                        ${currentPage === index + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LeaveManagement;