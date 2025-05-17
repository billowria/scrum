import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiUserPlus, FiUsers, FiInfo, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

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

export default function ManagerAssignment() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [actionType, setActionType] = useState('');
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, team_id,
          manager_id,
          manager:manager_id(id, name)
        `)
        .neq('id', user.id); // Exclude current user
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleAssignManager = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ manager_id: currentUser.id })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Show success animation
      setActionType('assign');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleRefresh();
      }, 1500);
      
      setMessage({ type: 'success', text: 'Successfully assigned as manager' });
      
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
      
      // Show success animation
      setActionType('remove');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleRefresh();
      }, 1500);
      
      setMessage({ type: 'success', text: 'Successfully removed as manager' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error removing manager:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };
  
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
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiUsers className="text-primary-500" />
            Manage Your Team Members
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
                      backgroundColor: actionType === 'assign' 
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
      
      <div className="p-4">
        <motion.div variants={itemVariants}>
          <p className="text-sm text-gray-600 mb-4">
            As a manager, you can assign yourself to team members. This allows you to manage their leave requests and team assignments.
          </p>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-gray-500"
            variants={itemVariants}
          >
            No users found to manage.
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
                    Current Manager
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
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
                      {user.manager ? (
                        <div className="text-sm text-gray-900">
                          {user.manager.name === currentUser.name ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiCheck className="mr-1" /> You
                            </span>
                          ) : user.manager.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.manager_id === currentUser.id ? (
                        <button
                          onClick={() => handleRemoveManager(user.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <FiX className="mr-1" /> Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignManager(user.id)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <FiUserPlus className="mr-1" /> Assign Me
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
    </motion.div>
  );
}
