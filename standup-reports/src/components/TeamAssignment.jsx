import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiUserPlus, FiUsers, FiInfo, FiRefreshCw, FiCheck, FiX, FiFilter, FiMail, FiShield, FiBriefcase, FiHome, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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

const inputFocusVariants = {
  rest: { scale: 1, borderColor: 'rgba(209, 213, 219, 1)' },
  focus: { scale: 1.01, borderColor: 'rgba(79, 70, 229, 1)' }
};

export default function TeamAssignment() {
  const { currentCompany } = useCompany();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  
  // Add new team state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchTeams();
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
          id, name, email, role,
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
  
  const fetchTeams = async () => {
    try {
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
  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const openAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedTeam(user.team_id || null);
    setShowAssignModal(true);
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
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Team assigned successfully' });
      setShowAssignModal(false);
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
  
  const handleRemoveTeam = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ team_id: null })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Team removed successfully' });
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error removing team:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' });
      return;
    }

    if (!currentCompany?.id) {
      setMessage({ type: 'error', text: 'Company information not available. Please refresh the page.' });
      return;
    }

    setAddingTeam(true);

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: newTeamName.trim(),
          company_id: currentCompany.id
        }])
        .select();
      
      if (error) throw error;
      
      // Success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowAddTeamModal(false);
        setNewTeamName('');
        handleRefresh();
      }, 1500);
      
      setMessage({ type: 'success', text: 'Team added successfully' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error adding team:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setAddingTeam(false);
    }
  };
  
  const filteredUsers = teamFilter === 'all' 
    ? users 
    : teamFilter === 'unassigned' 
      ? users.filter(user => !user.team_id) 
      : users.filter(user => user.team_id === teamFilter);
  
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
                You need manager privileges to access team assignment features. Please contact your administrator for access.
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
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
       

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="unassigned">Unassigned</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <FiFilter size={14} />
            </div>
          </div>

          {/* Add Team Button */}
          <motion.button
            onClick={() => setShowAddTeamModal(true)}
            className="relative group px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FiPlus className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Add Team</span>
          </motion.button>

          <motion.button
            onClick={handleRefresh}
            className="relative group p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FiRefreshCw className={`h-4 w-4 relative z-10 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Success/Error message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className={`mb-6 relative overflow-hidden rounded-2xl p-4 backdrop-blur-md border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-200/60'
                : 'bg-red-500/10 border-red-200/60'
            }`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-red-500/20 text-red-600'
                }`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {message.type === 'success' ? <FiCheck /> : <FiX />}
              </motion.div>
              <span className={`font-medium ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message.text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FiRefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-20 blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
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
            <p className="text-gray-500">
              {teamFilter === 'all' ? 'There are no users in this company.' :
               teamFilter === 'unassigned' ? 'All users are assigned to teams.' :
               `No users found in the selected team.`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                variants={itemVariants}
                whileHover={{ x: 8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm" />

                  <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      {/* User Info Section */}
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div
                          className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          style={{
                            background: `linear-gradient(135deg,
                              hsl(${280 + index * 15}, 70%, 60%),
                              hsl(${340 + index * 15}, 70%, 50%))`
                          }}
                        >
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-800 truncate">{user.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FiMail className="h-3 w-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-semibold rounded-full">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600 font-medium mb-1">Team</div>
                          {user.teams ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-full">
                              <FiBriefcase className="h-3 w-3" />
                              {user.teams.name}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-semibold rounded-full">
                              <FiX className="h-3 w-3" />
                              Unassigned
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600 font-medium mb-1">Manager</div>
                          {user.manager ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-full">
                              <FiUsers className="h-3 w-3" />
                              {user.manager.name}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-semibold rounded-full">
                              <FiX className="h-3 w-3" />
                              None
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {user.teams ? (
                            <>
                              <motion.button
                                onClick={() => openAssignModal(user)}
                                className="relative group/btn overflow-hidden rounded-xl px-3 py-2 font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex items-center gap-1">
                                  <FiEdit2 className="h-3 w-3" />
                                  Change
                                </div>
                              </motion.button>
                              <motion.button
                                onClick={() => handleRemoveTeam(user.id)}
                                className="relative group/btn overflow-hidden rounded-xl px-3 py-2 font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex items-center gap-1">
                                  <FiTrash2 className="h-3 w-3" />
                                  Remove
                                </div>
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              onClick={() => openAssignModal(user)}
                              className="relative group/btn overflow-hidden rounded-xl px-4 py-2 font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              <div className="relative z-10 flex items-center gap-2">
                                <FiUserPlus className="h-4 w-4" />
                                Assign Team
                              </div>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FiBriefcase className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Assign Team
                    </h3>
                    <p className="text-sm text-gray-600">Select a team for this user</p>
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
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
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
                    <FiHome className="h-4 w-4" />
                    Team Selection
                  </label>
                  <motion.select
                    className="w-full px-4 py-3 border-2 border-purple-200/60 rounded-2xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800 font-medium"
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <option value="">Select a team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </motion.select>
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
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleAssignTeam}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Assign Team
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Team Modal */}
      <AnimatePresence>
        {showAddTeamModal && (
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-blue-900/70 to-indigo-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddTeamModal(false)}
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
                    <FiPlus className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Create New Team
                    </h3>
                    <p className="text-sm text-gray-600">Add a new team to your organization</p>
                  </div>
                </div>

                {/* Company Info Display */}
                {currentCompany && (
                  <motion.div
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FiHome className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Company</span>
                    </div>
                    <div className="text-lg font-medium text-blue-700">{currentCompany.name}</div>
                    <div className="text-xs text-blue-600 mt-1">ID: {currentCompany.id}</div>
                  </motion.div>
                )}

                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div>
                    <label htmlFor="team-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FiBriefcase className="h-4 w-4" />
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="team-name"
                      type="text"
                      className="w-full px-4 py-3 border-2 border-blue-200/60 rounded-2xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 font-medium"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      variants={inputFocusVariants}
                      initial="rest"
                      whileFocus="focus"
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      This team will be automatically associated with {currentCompany?.name || 'your company'}.
                    </p>
                  </div>
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
                    onClick={() => {
                      setShowAddTeamModal(false);
                      setNewTeamName('');
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    className="relative px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    onClick={handleAddTeam}
                    disabled={addingTeam || !newTeamName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 hover:opacity-100 transition-opacity" />
                    {addingTeam ? (
                      <>
                        <FiRefreshCw className="h-4 w-4 animate-spin relative z-10" />
                        <span className="relative z-10">Creating...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">Create Team</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900/70 to-indigo-900/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              <motion.div
                className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-white/20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="relative">
                  <FiCheck className="h-20 w-20 bg-gradient-to-br from-blue-400 to-indigo-500 bg-clip-text text-transparent" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 bg-clip-text text-transparent blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      background: `linear-gradient(135deg, #6366f1, #818cf8, #a5b4fc, #c7d2fe, #e0e7ff)`,
                      width: Math.random() * 16 + 8,
                      height: Math.random() * 16 + 8,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.random() * 400 - 200,
                      y: Math.random() * 400 - 200,
                      opacity: 0,
                      scale: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 2 + Math.random() * 0.8, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
