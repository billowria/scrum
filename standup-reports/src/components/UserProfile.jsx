import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line
} from 'recharts';
import {
  FiUser, FiMail, FiBriefcase, FiCalendar, FiPhone, FiLinkedin,
  FiEdit2, FiSave, FiX, FiAlertCircle, FiChevronRight, FiUsers,
  FiClock, FiCheck, FiArrowLeft, FiTwitter, FiGithub, FiSlack,
  FiStar, FiAward, FiTrendingUp, FiActivity, FiSettings,
  FiCamera, FiSearch, FiDownload, FiUpload, FiBook, FiTarget,
  FiZap, FiHeart, FiShield, FiBarChart2, FiFolder, FiTag,
  FiBell, FiHome, FiMessageSquare, FiFileText, FiGrid,
  FiShare2, FiCopy, FiEdit, FiMenu, FiRefreshCw, FiPlus,
  FiMinus, FiMaximize2, FiMinimize2, FiCommand,
  FiMoon, FiSun
} from 'react-icons/fi';

// Command palette commands
const COMMANDS = [
  { id: 'edit', label: 'Toggle Edit Mode', icon: FiEdit2, action: 'toggleEdit' },
  { id: 'share', label: 'Share Profile', icon: FiShare2, action: 'share' },
  { id: 'export', label: 'Export Data', icon: FiDownload, action: 'export' },
  { id: 'overview', label: 'Go to Overview', icon: FiUser, action: 'navigate', target: 'overview' },
  { id: 'team', label: 'Go to Team', icon: FiUsers, action: 'navigate', target: 'team' },
  { id: 'projects', label: 'Go to Projects', icon: FiBriefcase, action: 'navigate', target: 'projects' },
  { id: 'activity', label: 'Go to Activity', icon: FiActivity, action: 'navigate', target: 'activity' },
  { id: 'achievements', label: 'Go to Achievements', icon: FiAward, action: 'navigate', target: 'achievements' },
  { id: 'timesheets', label: 'Go to Timesheets', icon: FiClock, action: 'navigate', target: 'timesheets' },
  { id: 'skills', label: 'Go to Skills', icon: FiZap, action: 'navigate', target: 'skills' }
];

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const commandPaletteRef = useRef(null);
  
  // Core state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [canEditProfile, setCanEditProfile] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({});
  
  // Data state
  const [teamMembers, setTeamMembers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [leavePlans, setLeavePlans] = useState([]);
  const [skills, setSkills] = useState([]);

  // Command palette handlers
  const executeCommand = useCallback((command) => {
    setShowCommandPalette(false);
    setCommandSearch('');
    
    switch (command.action) {
      case 'toggleEdit':
        if (canEditProfile) setIsEditing(!isEditing);
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'export':
        handleExport();
        break;
      case 'navigate':
        setActiveTab(command.target);
        break;
    }
  }, [canEditProfile, isEditing]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowShareModal(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsOwnProfile(!userId || userId === currentUser.id);
      setCanEditProfile(currentUser.role === 'manager' || !userId || userId === currentUser.id);
      const id = userId || currentUser.id;
      fetchProfile(id);
      fetchTeamMembers(id);
      fetchAchievements(id);
      fetchProjects(id);
      fetchTasks(id);
      fetchTimesheets(id);
      fetchLeavePlans(id);
      fetchSkills(id);
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, teams(name)')
        .eq('id', id)
        .single();
        
      if (userError) throw userError;
      
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_user_profile', { p_user_id: id });
        
      if (profileError) throw profileError;
      
      if (profileData && profileData.length > 0) {
        const mergedProfile = {
          ...profileData[0],
          avatar_url: userData.avatar_url,
          name: userData.name,
          role: userData.role,
          team_id: userData.team_id,
          team_name: userData.teams?.name
        };
        
        setProfile(mergedProfile);
        setFormData(mergedProfile);
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

  const fetchTeamMembers = async (id) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', id)
        .single();
        
      if (userError) throw userError;
      
      if (userData.team_id) {
        const { data: membersData, error: membersError } = await supabase
          .from('user_info')
          .select('*')
          .eq('team_id', userData.team_id);
          
        if (membersError) throw membersError;
        setTeamMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchAchievements = async (id) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', id)
        .order('awarded_at', { ascending: false });
        
      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchProjects = async (id) => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          id,
          role_in_project,
          projects (
            id,
            name,
            description,
            start_date,
            end_date,
            status
          )
        `)
        .eq('user_id', id);
        
      if (error) throw error;
      
      const projectData = data.map(item => ({
        id: item.projects.id,
        name: item.projects.name,
        description: item.projects.description,
        role: item.role_in_project,
        start_date: item.projects.start_date,
        end_date: item.projects.end_date,
        status: item.projects.status
      }));
      
      setProjects(projectData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async (id) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTimesheets = async (id) => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('user_id', id)
        .order('date', { ascending: false })
        .limit(30);
        
      if (error) throw error;
      setTimesheets(data || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    }
  };

  const fetchLeavePlans = async (id) => {
    try {
      const { data, error } = await supabase
        .from('leave_plans')
        .select('*')
        .eq('user_id', id)
        .order('start_date', { ascending: false });
        
      if (error) throw error;
      setLeavePlans(data || []);
    } catch (error) {
      console.error('Error fetching leave plans:', error);
    }
  };
  
  const fetchSkills = async (id) => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', id)
        .order('skill_name', { ascending: true });
        
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
      errors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !profile) return;
    
    setUploadingAvatar(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email
        })
        .eq('id', profile.id);
        
      if (userError) throw userError;
      
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
    setValidationErrors({});
    setError(null);
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleExport = () => {
    const data = {
      profile,
      projects,
      tasks: tasks.slice(0, 10),
      achievements,
      timesheets: timesheets.slice(0, 20),
      skills,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile_${profile?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const addSkill = async (skillName, proficiency = 'intermediate') => {
    if (!profile || !skillName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_skills')
        .upsert({
          user_id: profile.id,
          skill_name: skillName.trim(),
          proficiency_level: proficiency
        });
      
      if (error) throw error;
      await fetchSkills(profile.id);
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };
  
  const removeSkill = async (skillId) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);
      
      if (error) throw error;
      await fetchSkills(profile.id);
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  // Filtered data
  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(commandSearch.toLowerCase())
  );
  
  const filteredTeamMembers = teamMembers.filter(member => member.id !== profile?.id);
  
  // Stats calculation
  const stats = [
    { name: 'Projects', value: projects.length, icon: FiFolder, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: FiCheck, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { name: 'Achievements', value: achievements.length, icon: FiAward, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { name: 'Skills', value: skills.length, icon: FiZap, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
    { name: 'Team Size', value: teamMembers.length, icon: FiUsers, color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
    { name: 'Hours', value: timesheets.reduce((sum, t) => sum + (t.hours || 0), 0), icon: FiClock, color: 'bg-rose-500', bgColor: 'bg-rose-50' }
  ];
  
  // Chart data processing
  const timesheetChartData = timesheets.slice(0, 7).reverse().map(ts => ({
    date: new Date(ts.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: ts.hours || 0
  }));
  
  const taskStatusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length, color: '#94A3B8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#3B82F6' },
    { name: 'Review', value: tasks.filter(t => t.status === 'Review').length, color: '#F59E0B' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, color: '#10B981' }
  ];
  
  // Utility functions
  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'on hold': 'bg-amber-100 text-amber-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      'To Do': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Review': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getProficiencyColor = (proficiency) => {
    const colors = {
      'beginner': 'bg-red-100 text-red-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-green-100 text-green-800',
      'expert': 'bg-purple-100 text-purple-800'
    };
    return colors[proficiency] || 'bg-gray-100 text-gray-800';
  };
  
  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: FiUser },
    { id: 'team', name: 'Team', icon: FiUsers },
    { id: 'projects', name: 'Projects', icon: FiBriefcase },
    { id: 'activity', name: 'Activity', icon: FiActivity },
    { id: 'achievements', name: 'Achievements', icon: FiAward },
    { id: 'timesheets', name: 'Timesheets', icon: FiClock },
    { id: 'skills', name: 'Skills', icon: FiZap }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Profile</h3>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-6">The requested profile could not be found.</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div 
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg flex flex-col transition-all duration-300`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-gray-900 ${sidebarOpen ? 'block' : 'hidden'}`}>Profile</h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`${sidebarOpen ? 'block' : 'hidden'} font-medium`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-sm text-gray-600">{profile.job_title || profile.role}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCommandPalette(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiCommand className="w-4 h-4" />
                <span className="hidden sm:inline">Command Palette</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-white rounded border">
                  ⌘K
                </kbd>
              </button>
              
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleExport}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiDownload className="w-5 h-5" />
              </button>
              
              {canEditProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition-colors ${
                    isEditing ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'
                  }`}
                >
                  {isEditing ? <FiX className="w-5 h-5" /> : <FiEdit2 className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={index} 
                  className={`${stat.bgColor} rounded-xl p-4 border`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.name}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Edit Mode Banner */}
          {isEditing && (
            <motion.div 
              className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-indigo-900">Edit Mode Active</h3>
                  <p className="text-sm text-indigo-700">Make your changes and save when ready</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCancel} 
                    disabled={saving}
                    className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSave className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUser className="w-5 h-5 text-indigo-600" />
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name || ''}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.name ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {validationErrors.name && (
                              <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-900 font-medium">{profile.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email || ''}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.email ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {validationErrors.email && (
                              <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                            )}
                          </div>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.job_title || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone || ''}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {validationErrors.phone && (
                              <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-900">{profile.phone || 'Not specified'}</p>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profile.start_date ? new Date(profile.start_date).toLocaleDateString() : 'Not specified'}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="url"
                              name="linkedin_url"
                              value={formData.linkedin_url || ''}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.linkedin_url ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {validationErrors.linkedin_url && (
                              <p className="text-red-600 text-sm mt-1">{validationErrors.linkedin_url}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-900">{profile.linkedin_url || 'Not specified'}</p>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.slack_handle || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        {isEditing ? (
                          <textarea
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || 'No bio provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Avatar Upload */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiCamera className="w-5 h-5 text-indigo-600" />
                      Profile Picture
                    </h3>
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                            {profile.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      {canEditProfile && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Analytics Charts */}
                {timesheetChartData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours Logged (Last 7 days)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={timesheetChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="#e0e7ff" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
                  <span className="text-sm text-gray-600">{filteredTeamMembers.length} members</span>
                </div>
                
                {profile.team_name && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-2">Team: {profile.team_name}</h4>
                    <p className="text-sm text-indigo-700">
                      Department: {profile.department_name || 'Not specified'}
                    </p>
                    {profile.manager_name && (
                      <p className="text-sm text-indigo-700">
                        Manager: {profile.manager_name}
                      </p>
                    )}
                  </div>
                )}
                
                {filteredTeamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeamMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                        whileHover={{ y: -2 }}
                        onClick={() => navigate(`/profile/${member.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.job_title || member.role}</p>
                          </div>
                          <FiChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Team Members</h4>
                    <p className="text-gray-500">There are no other members in your team.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Projects</h3>
                  <span className="text-sm text-gray-600">{projects.length} projects</span>
                </div>
                
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {project.description || 'No description available'}
                            </p>
                            <p className="text-sm font-medium text-indigo-600">Role: {project.role}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <FiCalendar className="w-4 h-4 mr-2" />
                            <span>
                              {project.start_date && new Date(project.start_date).toLocaleDateString()} - 
                              {project.end_date && new Date(project.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Projects</h4>
                    <p className="text-gray-500">No projects have been assigned yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tasks.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiTarget className="w-5 h-5 text-blue-500" />
                        Recent Tasks
                      </h4>
                      <div className="space-y-3">
                        {tasks.slice(0, 8).map((task) => (
                          <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{task.title}</h5>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {task.description.substring(0, 80)}...
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(task.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {timesheets.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiClock className="w-5 h-5 text-purple-500" />
                        Recent Timesheets
                      </h4>
                      <div className="space-y-3">
                        {timesheets.slice(0, 8).map((ts) => (
                          <div key={ts.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(ts.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {ts.notes?.substring(0, 50) || 'No notes'}...
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                {ts.hours}h
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Achievements</h3>
                  <span className="text-sm text-gray-600">{achievements.length} achievements</span>
                </div>
                
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-amber-100 rounded-lg">
                            <FiAward className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{achievement.title}</h4>
                            <p className="text-gray-600 text-sm mb-3">
                              {achievement.description || 'No description available'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Awarded on {new Date(achievement.awarded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Achievements</h4>
                    <p className="text-gray-500">Keep working hard to earn achievements!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timesheets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Timesheets</h3>
                  <span className="text-sm text-gray-600">{timesheets.length} entries</span>
                </div>
                
                {timesheets.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timesheets.map((ts) => (
                            <tr key={ts.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(ts.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  {ts.hours}h
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {ts.project_id ? 'Project' : 'General'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {ts.notes?.substring(0, 60) || 'No notes'}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Timesheets</h4>
                    <p className="text-gray-500">No time entries have been recorded yet.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Skills</h3>
                  <span className="text-sm text-gray-600">{skills.length} skills</span>
                </div>
                
                {canEditProfile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">Add a new skill:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Skill name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const skillName = e.target.value.trim();
                            if (skillName) {
                              addSkill(skillName);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate" selected>Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <button
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          const select = e.target.parentElement.querySelector('select');
                          const skillName = input.value.trim();
                          if (skillName) {
                            addSkill(skillName, select.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {skills.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{skill.skill_name}</h4>
                          {canEditProfile && (
                            <button
                              onClick={() => removeSkill(skill.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}>
                          {skill.proficiency_level}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiZap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Skills Listed</h4>
                    <p className="text-gray-500">Add some skills to showcase your expertise.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={commandPaletteRef}
                    type="text"
                    placeholder="Search commands..."
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {filteredCommands.map((command) => {
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{command.label}</span>
                    </button>
                  );
                })}
                
                {filteredCommands.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No commands found
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                <span>Use ↑↓ to navigate, Enter to select</span>
                <span>Press Esc to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiShare2 className="w-5 h-5" />
                Share Profile
              </h3>
              <p className="text-gray-600 mb-6">Share this profile with others</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiCopy className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>
                
                <a
                  href={`mailto:?subject=Check out ${profile.name}'s profile&body=${encodeURIComponent(window.location.href)}`}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiMail className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Share via Email</span>
                </a>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
