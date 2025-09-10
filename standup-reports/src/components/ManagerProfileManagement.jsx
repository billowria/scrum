import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { 
  FiUser, FiUsers, FiSearch, FiEdit2, FiSave, FiX, FiMail, FiPhone, 
  FiLinkedin, FiCalendar, FiBriefcase, FiCheck, FiAlertCircle, FiChevronDown
} from 'react-icons/fi';

const ManagerProfileManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTeamMembers();
    }
  }, [currentUser]);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, teamMembers]);

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
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchTeamMembers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch team members with their profiles
      const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('team_id', currentUser.team_id)
        .order('name');
        
      if (error) throw error;
      
      setTeamMembers(data || []);
      setFilteredMembers(data || []);
    } catch (err) {
      setError('Failed to load team members');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(teamMembers);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = teamMembers.filter(member => 
      member.name.toLowerCase().includes(term) ||
      (member.job_title && member.job_title.toLowerCase().includes(term)) ||
      (member.email && member.email.toLowerCase().includes(term))
    );
    
    setFilteredMembers(filtered);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData({ ...member });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedMember) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: selectedMember.id,
          job_title: formData.job_title,
          bio: formData.bio,
          phone: formData.phone,
          linkedin_url: formData.linkedin_url,
          slack_handle: formData.slack_handle,
          start_date: formData.start_date
        });
        
      if (profileError) throw profileError;
      
      // Update user info
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email
        })
        .eq('id', selectedMember.id);
        
      if (userError) throw userError;
      
      // Refresh the member list
      fetchTeamMembers();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...selectedMember });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Team Profile Management</h1>
                <p className="text-indigo-100">Manage profiles for your team members</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-200" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-white"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Team Members List */}
          <div className="lg:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Team Members</h2>
              <p className="text-sm text-gray-600">{filteredMembers.length} members</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No team members found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedMember?.id === member.id 
                            ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleMemberSelect(member)}
                        whileHover={{ x: 5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      >
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-medium shadow">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                            <p className="text-sm text-gray-600 truncate">
                              {member.job_title || member.role}
                            </p>
                          </div>
                          {selectedMember?.id === member.id && (
                            <FiCheck className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member Profile Details */}
          <div className="lg:w-2/3">
            {selectedMember ? (
              <div className="h-full flex flex-col">
                {/* Profile Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start gap-4">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt={formData.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white">
                        {formData.name.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="text-2xl font-bold bg-gray-100 rounded-lg px-3 py-1 mb-1 w-full"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
                      )}
                      
                      {isEditing ? (
                        <input
                          type="text"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleInputChange}
                          placeholder="Job title"
                          className="text-gray-600 bg-gray-100 rounded-lg px-3 py-1 text-sm w-full"
                        />
                      ) : (
                        <p className="text-gray-600">{formData.job_title || formData.role}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <motion.button
                            onClick={handleCancel}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiX className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {saving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiSave className="w-5 h-5" />
                            )}
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Bio Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-indigo-600" />
                        Bio
                      </h3>
                      
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about this team member..."
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-700">
                          {formData.bio || 'No bio available for this team member.'}
                        </p>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div>
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
                            <FiHash className="w-5 h-5" />
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
                                className="font-medium text-indigo-600 hover:underline"
                              >
                                View Profile
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
                            <p className="font-medium text-gray-900 capitalize">{formData.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-500">
                <FiUsers className="w-16 h-16 mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Select a Team Member</h3>
                <p>Choose a team member from the list to view and edit their profile information.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ManagerProfileManagement;