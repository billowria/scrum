import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiUserPlus, FiUsers, FiRefreshCw, FiCheck, FiX, FiFilter, FiMail, FiShield, FiBriefcase, FiHome, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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
  const [showAssignOverlay, setShowAssignOverlay] = useState(false);
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

  const openAssignOverlay = (user) => {
    setSelectedUser(user);
    setSelectedTeam(user.team_id || null);
    setShowAssignOverlay(true);
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
      setShowAssignOverlay(false);
      setActiveButtonId(null);
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
      ? users.filter(user => !user.teams?.id)
      : users.filter(user => user.teams?.id === teamFilter);
  
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-20 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1500" />
      </div>

      {/* Header Section */}
      <motion.div variants={itemVariants} className="relative z-10 mb-6">
        <div className="flex justify-between items-center">
          {/* Left Section - Primary Action */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowAddTeamModal(true)}
              className="relative group px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FiPlus className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Add Team</span>
            </motion.button>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
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
      </motion.div>

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
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative group"
              >
                <div className="relative bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-sm hover:shadow-md border border-white/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    {/* User Info Section */}
                    <div className="flex items-center gap-2.5 flex-1">
                      <motion.div
                        className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-md"
                        whileHover={{ scale: 1.05, rotate: 3 }}
                        style={{
                          background: user.avatar_url
                            ? 'transparent' // Use transparent so the image shows properly
                            : `linear-gradient(135deg,
                              hsl(${280 + index * 15}, 70%, 60%),
                              hsl(${340 + index * 15}, 70%, 50%))`
                        }}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-full h-full rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9333ea&color=fff`;
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
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-medium rounded text-xs">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-2 ml-3">
                      {/* Team Status */}
                      {user.teams ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-medium rounded text-xs">
                          {user.teams.name}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 font-medium rounded text-xs">
                          Unassigned
                        </span>
                      )}

                      {/* Direct Action Buttons */}
                      <div className="flex items-center gap-2 ml-3">
                        {user.teams ? (
                          <>
                            <motion.button
                              onClick={() => openAssignOverlay(user)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <FiEdit2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Change Team</span>
                            </motion.button>
                            <motion.button
                              onClick={() => handleRemoveTeam(user.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <FiTrash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Remove</span>
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            onClick={() => openAssignOverlay(user)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-md hover:bg-emerald-600 transition-colors shadow-sm hover:shadow-md"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiUserPlus className="w-3 h-3" />
                            <span className="hidden sm:inline">Assign Team</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      
      {/* Simple Team Assignment Modal */}
      <AnimatePresence>
        {showAssignOverlay && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignOverlay(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedUser.teams ? 'Change Team' : 'Assign Team'}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedUser.name}</p>
                </div>
                <button
                  onClick={() => setShowAssignOverlay(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Team Selection */}
              <div className="mb-4">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">Select team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignOverlay(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTeam}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                >
                  {selectedUser.teams ? 'Change' : 'Assign'}
                </button>
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
      </div>
    </motion.div>
  );
}
