import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiGrid, FiInfo, FiRefreshCw,FiUnlink, FiBriefcase, FiUsers, FiCheck, FiX, FiLink, FiUnlink } from 'react-icons/fi';

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

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

export default function DepartmentTeamAssignment() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
    fetchDepartments();
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
  
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id, name, 
          department:department_id (id, name),
          users:users (id)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Add users count to each team
      const teamsWithCount = data.map(team => ({
        ...team,
        userCount: team.users ? team.users.length : 0
      }));
      
      setTeams(teamsWithCount || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error.message);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const openAssignModal = (team) => {
    setSelectedTeam(team);
    setSelectedDepartment(team.department?.id || null);
    setShowAssignModal(true);
  };
  
  const handleAssignTeamToDepartment = async () => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('teams')
        .update({ department_id: selectedDepartment })
        .eq('id', selectedTeam.id);
      
      if (error) throw error;
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      
      setMessage({ type: 'success', text: selectedDepartment 
        ? 'Team assigned to department successfully' 
        : 'Team removed from department successfully'
      });
      setShowAssignModal(false);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning team to department:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter teams based on selected filter
  const filteredTeams = selectedFilter === 'all' 
    ? teams 
    : selectedFilter === 'assigned' 
      ? teams.filter(team => team.department)
      : teams.filter(team => !team.department);
  
  // Check if user is authorized (director role)
  const isAuthorized = currentUser && currentUser.role === 'director';
  
  if (!isAuthorized) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Director Access Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You need director privileges to manage department team assignments.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      className="bg-white rounded-xl overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiGrid className="text-primary-500" />
            Department Teams
          </h2>
          
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
                      backgroundColor: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'][i % 5],
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
      
      {/* Filter tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              selectedFilter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            } transition-colors`}
          >
            All Teams
          </button>
          <button
            onClick={() => setSelectedFilter('assigned')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              selectedFilter === 'assigned'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            } transition-colors`}
          >
            Assigned Teams
          </button>
          <button
            onClick={() => setSelectedFilter('unassigned')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              selectedFilter === 'unassigned'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:bg-gray-100'
            } transition-colors`}
          >
            Unassigned Teams
          </button>
        </div>
      </div>
      
      {/* Teams listing */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FiGrid className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-800">No Teams Found</h3>
            <p className="text-gray-500 mt-2">
              {selectedFilter === 'all' 
                ? "There are no teams in the system yet." 
                : selectedFilter === 'assigned' 
                  ? "No teams have been assigned to departments yet."
                  : "All teams have been assigned to departments."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <motion.div
                key={team.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                variants={itemVariants}
                whileHover={{ y: -2 }}
              >
                <div className={`p-4 border-b ${
                  team.department 
                    ? 'bg-green-50 border-green-100' 
                    : 'bg-yellow-50 border-yellow-100'
                }`}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      {team.name}
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        <FiUsers className="mr-1 h-3 w-3" />
                        {team.userCount}
                      </span>
                    </h3>
                    
                    <motion.button
                      onClick={() => openAssignModal(team)}
                      className={`p-1.5 rounded transition-colors ${
                        team.department 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-yellow-600 hover:bg-yellow-100'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {team.department ? <FiUnlink size={16} /> : <FiLink size={16} />}
                    </motion.button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center text-sm">
                    <FiBriefcase className="text-gray-400 mr-2" />
                    <span className="text-gray-700 font-medium">Department:</span>
                    {team.department ? (
                      <span className="ml-2 text-green-600 font-medium">{team.department.name}</span>
                    ) : (
                      <span className="ml-2 text-yellow-600 italic">Not assigned</span>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <motion.button
                      onClick={() => openAssignModal(team)}
                      className={`w-full py-1.5 rounded-md text-sm font-medium flex items-center justify-center ${
                        team.department 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      } transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {team.department ? (
                        <>
                          <FiUnlink className="mr-1.5" />
                          Change Department
                        </>
                      ) : (
                        <>
                          <FiLink className="mr-1.5" />
                          Assign to Department
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Assign to Department Modal */}
      <AnimatePresence>
        {showAssignModal && selectedTeam && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-primary-600 text-white p-4">
                <h3 className="text-lg font-medium flex items-center">
                  <FiLink className="mr-2" /> Assign Team to Department
                </h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xl mr-3">
                    <FiUsers />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedTeam.name}</h4>
                    {selectedTeam.department && (
                      <p className="text-sm text-green-600">
                        Currently assigned to: {selectedTeam.department.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Department
                  </label>
                  <select
                    id="department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedDepartment || ''}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">-- No Department (Unassign) --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignTeamToDepartment}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : selectedDepartment ? (
                      <>Assign to Department</>
                    ) : (
                      <>Remove from Department</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 