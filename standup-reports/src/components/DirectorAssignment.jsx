import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiUserCheck, FiInfo, FiRefreshCw, FiShield, FiUser, FiUsers, FiBriefcase, FiCheck, FiX } from 'react-icons/fi';

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

export default function DirectorAssignment() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [actionType, setActionType] = useState('');
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
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
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, 
          department:department_id (id, name),
          teams:team_id (id, name),
          directs:departments!director_id (id, name)
        `)
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id, name, director_id,
          director:director_id (id, name)
        `)
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
  
  const openPromoteModal = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };
  
  const openAssignModal = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };
  
  const handlePromoteToDirector = async () => {
    if (!selectedUser) return;
    
    setSubmitting(true);
    
    try {
      // Call the promote_to_director function
      const { error } = await supabase.rpc('promote_to_director', {
        user_id: selectedUser.id
      });
      
      if (error) throw error;
      
      // Show success animation
      setActionType('promote');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleRefresh();
      }, 1500);
      
      setMessage({ type: 'success', text: 'User promoted to director successfully' });
      setShowPromoteModal(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error promoting user to director:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAssignDirectorToDepartment = async () => {
    if (!selectedUser || !selectedDepartment) {
      setMessage({ type: 'error', text: 'Please select both user and department' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update the department with the director ID
      const { error } = await supabase
        .from('departments')
        .update({ director_id: selectedUser.id })
        .eq('id', selectedDepartment);
      
      if (error) throw error;
      
      // Show success animation
      setActionType('assign');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleRefresh();
      }, 1500);
      
      setMessage({ type: 'success', text: 'Director assigned to department successfully' });
      setShowAssignModal(false);
      setSelectedDepartment(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning director to department:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
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
              <p>You need director privileges to manage director assignments.</p>
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
            <FiUserCheck className="text-primary-500" />
            Director Management
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
                      backgroundColor: actionType === 'promote' 
                        ? ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#bae6fd'][i % 5]
                        : ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'][i % 5],
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
      
      {/* Users listing */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Users</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                        user.role === 'director' ? 'bg-purple-500' : 
                        user.role === 'manager' ? 'bg-primary-500' : 
                        'bg-gray-500'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'director' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'director' ? (
                          <FiShield className="mr-1" />
                        ) : user.role === 'manager' ? (
                          <FiUsers className="mr-1" />
                        ) : (
                          <FiUser className="mr-1" />
                        )}
                        {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.directs && user.directs.length > 0 && (
                      <div className="w-full">
                        <div className="text-xs text-gray-500 mb-1 flex items-center">
                          <FiBriefcase className="mr-1" /> 
                          Director of Departments
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.directs.map(dept => (
                            <span key={dept.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-md">
                              {dept.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    {user.role !== 'director' && (
                      <motion.button
                        onClick={() => openPromoteModal(user)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium inline-flex items-center gap-1.5 hover:bg-purple-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiShield size={14} />
                        Promote to Director
                      </motion.button>
                    )}
                    
                    {user.role === 'director' && (
                      <motion.button
                        onClick={() => openAssignModal(user)}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm font-medium inline-flex items-center gap-1.5 hover:bg-primary-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiBriefcase size={14} />
                        Assign to Department
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Promote to Director Modal */}
      <AnimatePresence>
        {showPromoteModal && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPromoteModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-purple-600 text-white p-4">
                <h3 className="text-lg font-medium flex items-center">
                  <FiShield className="mr-2" /> Promote to Director
                </h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-xl mr-3">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedUser.name}</h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-md mb-4">
                  <p className="text-purple-800 text-sm">
                    <strong>Warning:</strong> You're about to promote this user to director role. Directors can:
                  </p>
                  <ul className="mt-2 text-sm text-purple-700 space-y-1 pl-5 list-disc">
                    <li>Create and manage departments</li>
                    <li>Assign users to departments</li>
                    <li>Promote users to manager role</li>
                    <li>Oversee all teams in their departments</li>
                  </ul>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPromoteModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePromoteToDirector}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Promoting...
                      </>
                    ) : (
                      <>Promote to Director</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Assign to Department Modal */}
      <AnimatePresence>
        {showAssignModal && selectedUser && (
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
                  <FiBriefcase className="mr-2" /> Assign to Department
                </h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-xl mr-3">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{selectedUser.name}</h4>
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                        Director
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
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
                    <option value="">-- Select a department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.director && `(Current director: ${dept.director.name})`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedDepartment && departments.find(d => d.id === selectedDepartment)?.director && (
                  <div className="bg-yellow-50 p-3 rounded-md mb-4 text-sm text-yellow-800">
                    <strong>Note:</strong> This department already has a director assigned. 
                    Assigning a new director will replace the current one.
                  </div>
                )}
                
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
                    onClick={handleAssignDirectorToDepartment}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                    disabled={submitting || !selectedDepartment}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Assigning...
                      </>
                    ) : (
                      <>Assign to Department</>
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