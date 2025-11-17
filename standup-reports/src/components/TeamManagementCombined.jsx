import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiUserCheck, FiUsers, FiInfo, FiRefreshCw, FiCheck, FiX, FiFilter, FiMail, FiShield, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

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

export default function TeamManagementCombined({ searchQuery = '', setSearchQuery, searchValue = '' }) {
  const { currentCompany } = useCompany();
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchManagers();
  }, [refreshTrigger, currentCompany]);

    
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error.message);
    }
  };
  
  const fetchUsers = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, avatar_url,
          teams:team_id (id, name),
          manager:manager_id (id, name)
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
  
  const fetchManagers = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'manager')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const openAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedManager(user.manager_id || null);
    setShowAssignModal(true);
  };
  
  const handleAssignManager = async () => {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'No user selected' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ manager_id: selectedManager })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Manager assigned successfully' });
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedManager(null);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning manager:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  const handleRemoveManager = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ manager_id: null })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Manager removed successfully' });
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error removing manager:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  // Function for the "Assign Self" functionality (from ManagerAssignment)
  const handleAssignSelfAsManager = async (userId) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ manager_id: currentUser.id })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Successfully assigned as manager' });
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning self as manager:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  const filteredUsers = (() => {
    let filtered = roleFilter === 'all'
      ? users
      : roleFilter === 'unassigned'
        ? users.filter(user => !user.manager_id)
        : roleFilter === 'member'
          ? users.filter(user => user.role === 'member')
          : users.filter(user => user.role === 'manager');

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        user.teams?.name?.toLowerCase().includes(searchLower) ||
        user.manager?.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  })();
  
  if (!currentUser || currentUser.role !== 'manager') {
    return (
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/60 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-200/40 to-amber-200/40 rounded-full blur-2xl" />

        <div className="relative p-8">
          <div className="flex items-start gap-4">
            <motion.div
              className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <FiShield className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Manager Access Required
                </span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  Restricted
                </span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You need manager privileges to access this feature. Please contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className="relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Success/Error message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            className={`p-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiUsers className="text-primary-500" />
            Team Management
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchValue}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-64"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="unassigned">No Manager</option>
                <option value="member">Members Only</option>
                <option value="manager">Managers Only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <FiFilter size={14} />
              </div>
            </div>
            
            <motion.button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FiRefreshCw className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            variants={itemVariants}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FiUsers className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Users Found</h3>
            <p className="text-gray-500">No users match the selected filter criteria.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative group"
              >
                <div className="relative bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-sm hover:shadow-md border border-white/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    {/* User Info Section */}
                    <div className="flex items-center gap-2.5 flex-1">
                      <motion.div
                        className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md"
                        whileHover={{ scale: 1.05, rotate: 3 }}
                        style={{
                          background: user.avatar_url 
                            ? 'transparent' // Use transparent so the image shows properly
                            : `linear-gradient(135deg, hsl(${210 + index * 5}, 70%, 60%), hsl(${270 + index * 5}, 70%, 50%))`  /* Updated to use more professional blue */
                        }}
                      >
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.name} 
                            className="w-full h-full rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm mb-1">
                          {user.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 text-gray-600 truncate">
                            <FiMail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-medium rounded text-xs">
                            {user.role}
                          </span>
                          {user.teams && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-medium rounded text-xs truncate">
                              {user.teams.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Manager Status & Actions */}
                    <div className="flex items-center gap-2 ml-3">
                      {/* Manager Status */}
                      {user.manager ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-medium rounded text-xs">
                          {user.manager.name}
                        </span>
                      ) : (
                        <>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 font-medium rounded text-xs">
                            No Manager
                          </span>

                          {/* Assign Me Button */}
                          {user.manager_id !== currentUser.id && (
                            <motion.button
                              onClick={() => handleAssignSelfAsManager(user.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title="Assign this user to me as their manager"
                            >
                              <FiPlus className="w-3 h-3" />
                              <span className="hidden sm:inline">Assign me</span>
                            </motion.button>
                          )}
                        </>
                      )}

                      {/* Direct Action Buttons */}
                      <div className="flex items-center gap-2 ml-3">
                        {user.manager ? (
                          <>
                            <motion.button
                              onClick={() => openAssignModal(user)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <FiEdit2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Change Manager</span>
                            </motion.button>
                            {user.manager_id !== currentUser.id && (
                              <motion.button
                                onClick={() => handleAssignSelfAsManager(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-md hover:bg-emerald-600 transition-colors shadow-sm hover:shadow-md"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FiPlus className="w-3 h-3" />
                                <span className="hidden sm:inline">Assign to Me</span>
                              </motion.button>
                            )}
                            {user.manager_id === currentUser.id && (
                              <motion.button
                                onClick={() => handleRemoveManager(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FiX className="w-3 h-3" />
                                <span className="hidden sm:inline">Remove Manager</span>
                              </motion.button>
                            )}
                          </>
                        ) : (
                          <motion.button
                            onClick={() => openAssignModal(user)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-md hover:bg-emerald-600 transition-colors shadow-sm hover:shadow-md"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiUserCheck className="w-3 h-3" />
                            <span className="hidden sm:inline">Assign Manager</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Manager Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-blue-900/70 to-indigo-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white/20 overflow-hidden"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FiUserCheck className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Assign Manager
                    </h3>
                    <p className="text-sm text-gray-600">Assign a manager to {selectedUser?.name}</p>
                  </div>
                </div>

                {selectedUser && (
                  <motion.div
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FiUsers className="h-4 w-4" />
                      User
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{selectedUser.name}</div>
                        <div className="text-sm text-gray-600">{selectedUser.email}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiUserCheck className="h-4 w-4" />
                    Select Manager
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-blue-200/60 rounded-2xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 font-medium"
                    value={selectedManager || ''}
                    onChange={(e) => setSelectedManager(e.target.value)}
                  >
                    <option value="">Select a manager...</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>{manager.name}</option>
                    ))}
                  </select>
                </motion.div>

                <motion.div
                  className="flex justify-end gap-3 mt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    type="button"
                    className="px-6 py-3 rounded-2xl border-2 border-gray-200/60 text-gray-700 bg-white/80 backdrop-blur-md font-semibold hover:bg-gray-100 transition-all duration-300"
                    onClick={() => setShowAssignModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    className="relative px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleAssignManager}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">Assign Manager</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}