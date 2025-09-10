import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiCalendar, 
  FiPhone, 
  FiHash, 
  FiLinkedin, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiAlertCircle,
  FiChevronRight,
  FiUsers,
  FiClock,
  FiCheck,
  FiArrowLeft,
  FiMapPin,
  FiGlobe,
  FiTwitter,
  FiGithub,
  FiSlack,
  FiStar,
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiSettings,
  FiCamera,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsOwnProfile(!userId || userId === currentUser.id);
      const id = userId || currentUser.id;
      fetchProfile(id);
    }
  }, [userId, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, team_id')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to fetch current user data');
    }
  };

  const fetchProfile = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { p_user_id: id });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        setFormData(data[0]);
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

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
      // Update user data in users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email
        })
        .eq('id', profile.id);
        
      if (userError) throw userError;
      
      // Update profile data in user_profiles table
      const { error: profileError } = await supabase
        .rpc('upsert_user_profile', {
          p_user_id: profile.id,
          p_avatar_url: formData.avatar_url,
          p_job_title: formData.job_title,
          p_bio: formData.bio,
          p_start_date: formData.start_date,
          p_phone: formData.phone,
          p_slack_handle: formData.slack_handle,
          p_linkedin_url: formData.linkedin_url
        });
        
      if (profileError) throw profileError;
      
      // Refresh the profile
      await fetchProfile(profile.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setIsEditing(false);
    setError(null);
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // Stats cards data
  const stats = [
    { name: 'Projects', value: '12', icon: <FiBriefcase className="w-6 h-6" />, color: 'border-blue-500 bg-blue-50 text-blue-600' },
    { name: 'Tasks Completed', value: '42', icon: <FiCheck className="w-6 h-6" />, color: 'border-green-500 bg-green-50 text-green-600' },
    { name: 'Achievements', value: '8', icon: <FiAward className="w-6 h-6" />, color: 'border-purple-500 bg-purple-50 text-purple-600' },
    { name: 'Attendance', value: '98%', icon: <FiTrendingUp className="w-6 h-6" />, color: 'border-amber-500 bg-amber-50 text-amber-600' },
  ];

  // Social links data
  const socialLinks = [
    { name: 'LinkedIn', icon: <FiLinkedin className="w-5 h-5" />, url: formData.linkedin_url, color: 'bg-blue-600' },
    { name: 'GitHub', icon: <FiGithub className="w-5 h-5" />, url: '#', color: 'bg-gray-800' },
    { name: 'Twitter', icon: <FiTwitter className="w-5 h-5" />, url: '#', color: 'bg-sky-500' },
    { name: 'Slack', icon: <FiSlack className="w-5 h-5" />, value: formData.slack_handle, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Profile</h3>
          <p className="text-gray-600">Please wait while we fetch your profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <motion.button
            onClick={handleGoBack}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FiUser className="w-10 h-10 text-gray-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Profile Not Found</h3>
          <p className="text-gray-600 mb-6">The requested profile could not be found.</p>
          <motion.button
            onClick={handleGoBack}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Profile
                </button>
              )}
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <FiX className="mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md flex items-center disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            <div className="absolute inset-0 bg-black/10"></div>
            
            {/* Profile Picture */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-2xl">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow">
                      {profile.name.charAt(0)}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-colors">
                    <FiCamera className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-3xl font-bold bg-gray-100 rounded-lg px-3 py-1 mb-1 w-full"
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                    )}
                    
                    {isEditing ? (
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        placeholder="Job title"
                        className="text-lg text-gray-600 bg-gray-100 rounded-lg px-3 py-1 w-full"
                      />
                    ) : (
                      <p className="text-lg text-gray-600">{profile.job_title || profile.role}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-2 md:mt-0">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium capitalize">
                      {profile.role}
                    </span>
                    {profile.team_name && (
                      <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {profile.team_name}
                      </span>
                    )}
                    {isOwnProfile && (
                      <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                        <FiCheck className="mr-1" />
                        You
                      </span>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={2}
                    className="mt-4 w-full p-3 bg-gray-100 rounded-lg text-gray-700"
                  />
                ) : (
                  <p className="mt-4 text-gray-700 max-w-3xl">
                    {profile.bio || 'No bio available.'}
                  </p>
                )}
              </div>
              
              <div className="mt-6 md:mt-0">
                <div className="flex space-x-3">
                  {socialLinks.map((social, index) => 
                    (social.url || social.value) ? (
                      <a
                        key={index}
                        href={social.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 ${social.color} rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity`}
                      >
                        {social.icon}
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${stat.color.split(' ')[0]} hover:shadow-xl transition-all duration-300`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color.split(' ')[1]} ${stat.color.split(' ')[2]}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', name: 'Overview', icon: <FiUser className="mr-2 w-4 h-4" /> },
                { id: 'activity', name: 'Activity', icon: <FiActivity className="mr-2 w-4 h-4" /> },
                { id: 'settings', name: 'Settings', icon: <FiSettings className="mr-2 w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUser className="w-5 h-5 text-indigo-600" />
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="job_title"
                            value={formData.job_title || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Your job title"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.job_title || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="start_date"
                            value={formData.start_date || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : profile.start_date ? (
                          <p className="text-gray-900">
                            {new Date(profile.start_date).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-gray-900">Not specified</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        {isEditing ? (
                          <textarea
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Tell us about yourself..."
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {profile.bio || 'No bio provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiMail className="w-5 h-5 text-indigo-600" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Your phone number"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slack Handle</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="slack_handle"
                            value={formData.slack_handle || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Your Slack handle"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profile.slack_handle ? `@${profile.slack_handle}` : 'Not provided'}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        {isEditing ? (
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : profile.linkedin_url ? (
                          <a 
                            href={profile.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center"
                          >
                            View LinkedIn Profile
                            <FiChevronRight className="ml-1" />
                          </a>
                        ) : (
                          <p className="text-gray-900">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiStar className="w-5 h-5 text-indigo-600" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Node.js', 'UI/UX', 'Project Management'].map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiActivity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Activity Feed</h3>
                <p className="text-gray-500">Recent activities will appear here</p>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSettings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Settings</h3>
                <p className="text-gray-500">Manage your profile settings here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;