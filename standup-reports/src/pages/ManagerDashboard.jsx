import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import { FiUsers, FiUserPlus, FiCalendar, FiCheck, FiX, FiEdit, FiInfo, FiFilter, FiRefreshCw } from 'react-icons/fi';

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

const tabVariants = {
  inactive: { opacity: 0.7 },
  active: { 
    opacity: 1, 
    scale: 1.05,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
};

export default function ManagerDashboard({ activeTabDefault = 'team-management' }) {
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  
  // Update activeTab when activeTabDefault changes
  useEffect(() => {
    setActiveTab(activeTabDefault);
  }, [activeTabDefault]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  
  useEffect(() => {
    fetchTeams();
    fetchUsers();
    fetchLeaveRequests();
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
        `);
      
      if (error) throw error;
      setLeaveRequests(data || []);
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
  
  // Filter leave requests based on status
  const filteredLeaveRequests = leaveRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });
  
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
        className="flex border-b border-gray-200 mb-6"
        variants={itemVariants}
      >
        <motion.button
          className={`py-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'team-management' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('team-management')}
          variants={tabVariants}
          animate={activeTab === 'team-management' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiUsers />
          Team Management
        </motion.button>
        
        <motion.button
          className={`py-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'leave-requests' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('leave-requests')}
          variants={tabVariants}
          animate={activeTab === 'leave-requests' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiCalendar />
          Leave Requests
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
              Team Members
            </h2>
            
            <motion.button
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedUser(null);
                setSelectedTeam(null);
                setShowUserModal(true);
              }}
            >
              <FiUserPlus />
              Assign Team
            </motion.button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.teams ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {user.teams.name}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role === 'manager' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Manager
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setSelectedTeam(user.teams?.id || null);
                            setShowUserModal(true);
                          }}
                        >
                          <FiEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Leave Requests Tab */}
      {activeTab === 'leave-requests' && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FiCalendar className="text-primary-600" />
              Leave Requests
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Filter:</div>
              <select
                className="border border-gray-300 rounded-md text-sm p-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredLeaveRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiInfo className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaveRequests.map((request) => {
                const startDate = parseISO(request.start_date);
                const endDate = parseISO(request.end_date);
                const isPending = request.status === 'pending';
                
                return (
                  <motion.div
                    key={request.id}
                    className={`border rounded-lg p-4 ${isPending ? 'border-yellow-200 bg-yellow-50' : request.status === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            {request.users?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium">{request.users?.name}</span>
                          {request.users?.teams && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              {request.users.teams.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="ml-10 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-primary-500" />
                            <span>
                              {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                          
                          {request.reason && (
                            <div className="flex items-start gap-1 mt-1">
                              <FiInfo className="text-primary-500 mt-0.5" />
                              <span>{request.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${isPending ? 'bg-yellow-100 text-yellow-800' : request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          Requested on {format(parseISO(request.created_at), 'MMM dd, yyyy')}
                        </div>
                        
                        {isPending && (
                          <div className="mt-4 flex gap-2">
                            <motion.button
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                              onClick={() => handleLeaveAction(request.id, 'approved')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiCheck className="w-3 h-3" />
                              Approve
                            </motion.button>
                            
                            <motion.button
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-1"
                              onClick={() => handleLeaveAction(request.id, 'rejected')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiX className="w-3 h-3" />
                              Reject
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
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
