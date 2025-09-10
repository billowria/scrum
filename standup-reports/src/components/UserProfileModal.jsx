import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUser, FiMail, FiPhone, FiLinkedin, FiCalendar, FiBriefcase, 
  FiEdit2, FiSave, FiCheck, FiAlertCircle, FiExternalLink, FiHash,
  FiMapPin, FiGlobe, FiTwitter, FiGithub, FiSlack
} from 'react-icons/fi';

const UserProfileModal = ({ isOpen, onClose, user, currentUser, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (user && currentUser) {
      setIsOwnProfile(user.id === currentUser.id);
      setFormData({
        ...user,
        name: user.name || '',
        email: user.email || '',
        job_title: user.job_title || '',
        bio: user.bio || '',
        phone: user.phone || '',
        linkedin_url: user.linkedin_url || '',
        slack_handle: user.slack_handle || '',
        start_date: user.start_date || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Update user profile in user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: formData.avatar_url,
          job_title: formData.job_title,
          bio: formData.bio,
          phone: formData.phone,
          linkedin_url: formData.linkedin_url,
          slack_handle: formData.slack_handle,
          start_date: formData.start_date
        })
        .select();
        
      if (error) throw error;
      
      // If it's the current user's profile, also update the users table
      if (isOwnProfile) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email
          })
          .eq('id', user.id);
          
        if (userError) throw userError;
      }
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mt-4">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt={formData.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white/30">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                )}
                
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="text-2xl font-bold bg-white/20 rounded-lg px-3 py-1 mb-1 w-full text-white placeholder-white/70"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{formData.name}</h2>
                  )}
                  
                  {isEditing ? (
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleInputChange}
                      placeholder="Job title"
                      className="text-indigo-100 bg-white/20 rounded-lg px-3 py-1 text-sm w-full placeholder-indigo-200"
                    />
                  ) : (
                    <p className="text-indigo-100">{formData.job_title || 'Job Title'}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                    {isOwnProfile && (
                      <span className="px-2 py-1 bg-emerald-500/30 rounded-full text-xs font-medium">
                        You
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                {error && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-6">
                {/* Bio Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-indigo-600" />
                    About
                  </h3>
                  
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.bio || 'No bio available.'}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMail className="w-5 h-5 text-indigo-600" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full font-medium bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{formData.email}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiPhone className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Phone</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full font-medium bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formData.phone || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Slack */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiSlack className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Slack Handle</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="slack_handle"
                            value={formData.slack_handle}
                            onChange={handleInputChange}
                            className="w-full font-medium bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formData.slack_handle ? `@${formData.slack_handle}` : 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* LinkedIn */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiLinkedin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">LinkedIn</p>
                        {isEditing ? (
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url}
                            onChange={handleInputChange}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full font-medium bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                          />
                        ) : formData.linkedin_url ? (
                          <a 
                            href={formData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            View Profile
                            <FiExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="font-medium text-gray-900">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiBriefcase className="w-5 h-5 text-indigo-600" />
                    Work Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiCalendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Start Date</p>
                        {isEditing ? (
                          <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                            className="w-full font-medium bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formData.start_date 
                              ? new Date(formData.start_date).toLocaleDateString() 
                              : 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Role */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiBriefcase className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              Member since {user.created_at 
                ? new Date(user.created_at).toLocaleDateString() 
                : 'Unknown date'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;