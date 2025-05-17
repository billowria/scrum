import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiUserPlus, FiUsers, FiInfo, FiRefreshCw, FiCheck, FiX, FiFilter } from 'react-icons/fi';

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
  }, [refreshTrigger]);
  
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
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, 
          teams:team_id (id, name),
          manager:manager_id (id, name)
        `);
      
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
    
    setAddingTeam(true);
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ 
          name: newTeamName.trim()
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
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Manager Access Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You need manager privileges to access this feature.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm overflow-hidden"
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
            <FiUserPlus className="text-primary-500" />
            Team Assignment
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Add New Team button */}
            <motion.button
              onClick={() => setShowAddTeamModal(true)}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiUsers size={16} />
              <span>Add New Team</span>
            </motion.button>
            
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="unassigned">Unassigned</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
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
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-gray-500"
            variants={itemVariants}
          >
            No users found matching the selected filter.
          </motion.div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                          <span className="font-medium text-sm">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.teams ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.teams.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.manager ? (
                        <div className="text-sm text-gray-900">
                          {user.manager.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.teams ? (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => openAssignModal(user)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => handleRemoveTeam(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignModal(user)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <FiUserPlus className="mr-1" /> Assign Team
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
            <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
            >
              <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Team</h3>
              
              {selectedUser && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedUser.name}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                    <select
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={selectedTeam || ''}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="">Select a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handleAssignTeam}
                >
                  Assign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add New Team Modal */}
      <AnimatePresence>
        {showAddTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 px-4">
            <motion.div 
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <h2 className="text-lg font-semibold mb-4">Add New Team</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    id="team-name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    variants={inputFocusVariants}
                    initial="rest"
                    whileFocus="focus"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setShowAddTeamModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handleAddTeam}
                  disabled={addingTeam || !newTeamName.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {addingTeam ? 'Adding...' : 'Add Team'}
                    </motion.button>
                  </div>
            </motion.div>
                </div>
        )}
      </AnimatePresence>
      
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              <motion.div 
                className="bg-white rounded-full p-8 shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <FiCheck className="h-16 w-16 text-green-500" />
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ 
                      backgroundColor: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#bae6fd'][i % 5],
                      width: Math.random() * 8 + 4,
                      height: Math.random() * 8 + 4,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.random() * 200 - 100,
                      y: Math.random() * 200 - 100,
                      opacity: 0,
                      scale: 0
                    }}
                    transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
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
