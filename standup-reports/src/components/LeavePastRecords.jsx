import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, getMonth, getYear, differenceInDays } from 'date-fns';
import { FiCalendar, FiUser, FiFilter, FiDownload, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

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

const LeavePastRecords = () => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  
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
    fetchUsers();
    fetchTeams();
    fetchLeaveHistory();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [leaveHistory, filters]);
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name');
        
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
  
  const fetchLeaveHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status, created_at,
          users:user_id (id, name, team_id, teams:team_id(id, name))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeaveHistory(data || []);
    } catch (error) {
      console.error('Error fetching leave history:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...leaveHistory];
    
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
    
    setFilteredHistory(filtered);
  };
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const generateCSV = () => {
    // Check if there's data to export
    if (filteredHistory.length === 0) return;
    
    // Create CSV header
    const headers = ['Employee', 'Team', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Created At'];
    
    // Create CSV rows
    const rows = filteredHistory.map(item => [
      item.users?.name || 'Unknown',
      item.users?.teams?.name || 'No Team',
      format(parseISO(item.start_date), 'yyyy-MM-dd'),
      format(parseISO(item.end_date), 'yyyy-MM-dd'),
      differenceInDays(parseISO(item.end_date), parseISO(item.start_date)) + 1,
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
    link.setAttribute('download', `leave_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FiClock className="text-primary-600" />
          Leave History
        </h2>
        
        <div className="flex items-center gap-3">
          <motion.button
            className="px-3 py-1.5 border border-gray-300 rounded-lg flex items-center gap-1 text-sm hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiFilter className="text-primary-600" />
            Filters
          </motion.button>
          
          <motion.button
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg flex items-center gap-1 text-sm hover:bg-primary-700"
            onClick={generateCSV}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={filteredHistory.length === 0}
          >
            <FiDownload />
            Export
          </motion.button>
        </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No leave records found</p>
          {Object.values(filters).some(val => val !== 'all') && (
            <p className="mt-2 text-sm">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((leave, index) => {
                const startDate = parseISO(leave.start_date);
                const endDate = parseISO(leave.end_date);
                const leaveDays = differenceInDays(endDate, startDate) + 1;
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  approved: 'bg-green-100 text-green-800 border-green-200',
                  rejected: 'bg-red-100 text-red-800 border-red-200'
                };
                
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
                      <div className="text-sm text-gray-900">
                        {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Requested on {format(parseISO(leave.created_at), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{leaveDays} {leaveDays === 1 ? 'day' : 'days'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${statusColors[leave.status]}`}>
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
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default LeavePastRecords; 