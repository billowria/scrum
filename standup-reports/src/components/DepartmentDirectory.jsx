import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiBriefcase, FiInfo, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiUsers, FiUserCheck, FiCheck, FiX } from 'react-icons/fi';

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

export default function DepartmentDirectory() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchCurrentUser();
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
  
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id, name, description, created_at, updated_at,
          director:director_id (id, name, email),
          teams:teams (id, name)
        `)
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Department name is required' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([{
          name: formData.name,
          description: formData.description
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Department added successfully' });
      setFormData({ name: '', description: '' });
      setShowAddModal(false);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error adding department:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setFormData({ 
      name: department.name, 
      description: department.description || '' 
    });
    setShowEditModal(true);
  };
  
  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Department name is required' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', selectedDepartment.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Department updated successfully' });
      setShowEditModal(false);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating department:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  const openDeleteModal = (department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };
  
  const handleDeleteDepartment = async () => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', selectedDepartment.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Department deleted successfully' });
      setShowDeleteModal(false);
      handleRefresh();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting department:', error.message);
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
              <p>You need director privileges to manage departments.</p>
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
            <FiBriefcase className="text-primary-500" />
            Departments
          </h2>
          
          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus size={16} />
              Add Department
            </motion.button>
            
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
      
      {/* Departments listing */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FiBriefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-800">No Departments</h3>
            <p className="text-gray-500 mt-2 mb-4">You haven't created any departments yet.</p>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium inline-flex items-center gap-1 hover:bg-primary-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus size={16} />
              Create First Department
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((department) => (
              <motion.div
                key={department.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className="bg-primary-50 p-4 border-b border-primary-100">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{department.name}</h3>
                    <div className="flex gap-1">
                      <motion.button
                        onClick={() => openEditModal(department)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FiEdit2 size={14} />
                      </motion.button>
                      <motion.button
                        onClick={() => openDeleteModal(department)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FiTrash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {department.description && (
                    <p className="text-sm text-gray-600 mb-4">{department.description}</p>
                  )}
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <FiUserCheck className="mr-1" /> 
                      Director
                    </div>
                    {department.director ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-xs mr-2">
                          {department.director.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{department.director.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No director assigned</span>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <FiUsers className="mr-1" /> 
                      Teams
                    </div>
                    {department.teams && department.teams.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {department.teams.map(team => (
                          <span key={team.id} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {team.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No teams assigned</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Department Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
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
                  <FiPlus className="mr-2" /> Add New Department
                </h3>
              </div>
              
              <form onSubmit={handleAddDepartment} className="p-4">
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>Add Department</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Department Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
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
                  <FiEdit2 className="mr-2" /> Edit Department
                </h3>
              </div>
              
              <form onSubmit={handleEditDepartment} className="p-4">
                <div className="mb-4">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>Update Department</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delete Department Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-lg font-medium flex items-center">
                  <FiTrash2 className="mr-2" /> Delete Department
                </h3>
              </div>
              
              <div className="p-6">
                <p className="mb-4 text-gray-700">
                  Are you sure you want to delete the department "{selectedDepartment?.name}"? This action cannot be undone.
                </p>
                
                {selectedDepartment?.teams && selectedDepartment.teams.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm mb-4">
                    <strong>Warning:</strong> This department has {selectedDepartment.teams.length} teams assigned to it. 
                    Deleting this department will remove the department association from these teams.
                  </div>
                )}
                
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDepartment}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Deleting...
                      </>
                    ) : (
                      <>Delete Department</>
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