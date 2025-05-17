import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiAward, FiSave, FiUserPlus, FiX, FiCheck, FiCamera } from 'react-icons/fi';

// Animation variants
const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const inputFocusVariants = {
  rest: { scale: 1, borderColor: 'rgba(209, 213, 219, 1)' },
  focus: { scale: 1.01, borderColor: 'rgba(79, 70, 229, 1)' }
};

const AchievementForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [awardType, setAwardType] = useState('recognition');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Award type options
  const awardTypeOptions = [
    { value: 'promotion', label: 'Promotion' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'recognition', label: 'Recognition' },
    { value: 'performance', label: 'Performance' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'special', label: 'Special Award' },
    { value: 'technical', label: 'Technical Excellence' },
    { value: 'other', label: 'Other' }
  ];
  
  // Fetch users when the form opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle photo upload
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
        return;
      }
      
      setPhoto(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAwardType('recognition');
    setSelectedUser(null);
    setSearchTerm('');
    setPhoto(null);
    setPhotoPreview(null);
    setMessage({ type: '', text: '' });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Please select an employee' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to post achievements');
      }
      
      let imageUrl = null;
      
      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${selectedUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `achievement-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photo);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        imageUrl = data.publicUrl;
      }
      
      // Create achievement record
      const { error } = await supabase
        .from('achievements')
        .insert([{
          user_id: selectedUser.id,
          title,
          description,
          award_type: awardType,
          created_by: user.id,
          image_url: imageUrl,
          awarded_at: new Date().toISOString(), // Add current date as award date
        }]);
      
      if (error) throw error;
      
      // Success
      setMessage({ type: 'success', text: 'Achievement posted successfully!' });
      
      // Reset form and close after delay
      setTimeout(() => {
        resetForm();
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error posting achievement:', error);
      setMessage({ 
        type: 'error', 
        text: `Error: ${error.message || 'Failed to post achievement'}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          className="bg-white rounded-xl shadow-xl max-w-lg w-full"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FiAward className="text-primary-500 mr-2" />
              Post New Achievement
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {/* Success/Error message */}
            <AnimatePresence>
              {message.text && (
                <motion.div 
                  className={`p-3 mb-4 rounded-md ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-100' 
                      : 'bg-red-50 text-red-800 border border-red-100'
                  }`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {message.type === 'success' && <FiCheck className="inline-block mr-2" />}
                  {message.type === 'error' && <FiX className="inline-block mr-2" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Employee Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for an employee..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {searchTerm && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                    {filteredUsers.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                    ) : (
                      filteredUsers.map(user => (
                        <div 
                          key={user.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchTerm(user.name);
                          }}
                        >
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                            <span className="font-medium text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {selectedUser && (
                  <div className="mt-2 flex items-center bg-primary-50 rounded-md p-2">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                      <span className="font-medium text-sm">{selectedUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{selectedUser.name}</div>
                      <div className="text-xs text-gray-500">{selectedUser.email}</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchTerm('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Achievement Title <span className="text-red-500">*</span>
              </label>
              <motion.input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter achievement title"
                variants={inputFocusVariants}
                initial="rest"
                whileFocus="focus"
              />
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <motion.textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe the achievement..."
                rows="3"
                variants={inputFocusVariants}
                initial="rest"
                whileFocus="focus"
              />
            </div>
            
            {/* Award Type */}
            <div className="mb-4">
              <label htmlFor="award-type" className="block text-sm font-medium text-gray-700 mb-1">
                Award Type <span className="text-red-500">*</span>
              </label>
              <select
                id="award-type"
                value={awardType}
                onChange={(e) => setAwardType(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {awardTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Photo Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo (Optional)
              </label>
              <div className="flex items-center">
                <div className="mr-4">
                  {photoPreview ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary-100">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <FiCamera className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="photo-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                    Upload Photo
                  </label>
                  <input 
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={onClose}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !title || !selectedUser}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Post Achievement
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AchievementForm; 