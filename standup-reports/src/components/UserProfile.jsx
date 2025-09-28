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
  FiEyeOff,
  FiUserCheck,
  FiUserPlus,
  FiUserMinus,
  FiBook,
  FiTarget,
  FiZap,
  FiHeart,
  FiShield,
  FiLock,
  FiUnlock,
  FiDollarSign,
  FiBarChart2,
  FiFolder,
  FiTag,
  FiUserX,
  FiBell,
  FiCompass,
  FiHome,
  FiNavigation,
  FiFlag,
  FiMessageSquare,
  FiFileText,
  FiClipboard,
  FiBox,
  FiDatabase,
  FiServer,
  FiCode,
  FiLayout,
  FiImage,
  FiVideo,
  FiMusic,
  FiFilm,
  FiHeadphones,
  FiMic,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiWatch,
  FiPrinter,
  FiCpu,
  FiHardDrive,
  FiKey,
  FiCreditCard,
  FiPercent,
  FiShoppingCart,
  FiGift,
  FiPackage,
  FiTruck,
  FiMap,
  FiAnchor,
  FiAtSign,
  FiDroplet,
  FiSun,
  FiMoon,
  FiCloud,
  FiCloudRain,
  FiCloudSnow,
  FiCloudLightning,
  FiWind,
  FiSunrise,
  FiSunset,
  FiThermometer,
  FiUmbrella,
  FiFeather,
  FiFrown,
  FiMeh,
  FiSmile,
  FiThumbsUp,
  FiThumbsDown,
  FiBookmark,
  FiShare,
  FiShare2,
  FiPaperclip,
  FiScissors,
  FiCopy,
  FiCrop,
  FiEdit,
  FiEdit3,
  FiPenTool,
  FiType,
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiLink,
  FiLink2
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
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [leavePlans, setLeavePlans] = useState([]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsOwnProfile(!userId || userId === currentUser.id);
      setCanEditProfile(currentUser.role === 'manager');
      const id = userId || currentUser.id;
      fetchProfile(id);
      fetchTeamMembers(id);
      fetchAchievements(id);
      fetchProjects(id);
      fetchTasks(id);
      fetchTimesheets(id);
      fetchLeavePlans(id);
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
      // First get the basic user data with avatar_url from users table (like navbar does)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, teams(name)')
        .eq('id', id)
        .single();
        
      if (userError) throw userError;
      
      // Then get the detailed profile data from the RPC
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_user_profile', { p_user_id: id });
        
      if (profileError) throw profileError;
      
      if (profileData && profileData.length > 0) {
        // Merge the user data (with avatar_url) with profile data
        const mergedProfile = {
          ...profileData[0],
          avatar_url: userData.avatar_url, // Use avatar_url from users table
          name: userData.name, // Use name from users table
          role: userData.role, // Use role from users table
          team_id: userData.team_id, // Use team_id from users table
          team_name: userData.teams?.name // Use team_name from teams table
        };
        
        console.log('Profile data:', mergedProfile);
        console.log('Avatar URL:', mergedProfile.avatar_url);
        console.log('All profile fields:', Object.keys(mergedProfile));
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
      // Get user's team_id first
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
        .limit(10);
        
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
        .limit(10);
        
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

  // Stats cards data with more colorful and diverse icons
  const stats = [
    { name: 'Projects', value: projects.length, icon: <FiFolder className="w-6 h-6" />, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { name: 'Tasks Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: <FiCheck className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { name: 'Achievements', value: achievements.length, icon: <FiAward className="w-6 h-6" />, color: 'from-purple-500 to-fuchsia-600', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { name: 'Attendance', value: `${100 - (leavePlans.length > 0 ? Math.round((leavePlans.filter(l => l.status === 'approved').length / 365) * 100) : 0)}%`, icon: <FiTrendingUp className="w-6 h-6" />, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    { name: 'Team Members', value: teamMembers.length, icon: <FiUsers className="w-6 h-6" />, color: 'from-cyan-500 to-teal-600', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600' },
    { name: 'Hours Logged', value: timesheets.reduce((sum, t) => sum + (t.hours || 0), 0), icon: <FiClock className="w-6 h-6" />, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-100', textColor: 'text-rose-600' },
  ];

  // Social links data with more diverse icons
  const socialLinks = [
    { name: 'LinkedIn', icon: <FiLinkedin className="w-5 h-5" />, url: formData.linkedin_url, color: 'bg-blue-600', bgColor: 'bg-blue-100' },
    { name: 'GitHub', icon: <FiGithub className="w-5 h-5" />, url: '#', color: 'bg-gray-800', bgColor: 'bg-gray-100' },
    { name: 'Twitter', icon: <FiTwitter className="w-5 h-5" />, url: '#', color: 'bg-sky-500', bgColor: 'bg-sky-100' },
    { name: 'Slack', icon: <FiSlack className="w-5 h-5" />, value: formData.slack_handle, color: 'bg-purple-500', bgColor: 'bg-purple-100' },
  ];

  // Team members excluding current user
  const filteredTeamMembers = teamMembers.filter(member => member.id !== profile?.id);

  // Project status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Task status colors
  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Review': return 'bg-amber-100 text-amber-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading Profile</h3>
          <p className="text-gray-600">Please wait while we fetch your profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAlertCircle className="w-12 h-12 text-red-600" />
          </motion.div>
          <h3 className="text-3xl font-bold text-red-800 mb-4">Something went wrong</h3>
          <p className="text-red-600 mb-8 text-lg">{error}</p>
          <motion.button
            onClick={handleGoBack}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-medium text-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowLeft className="inline mr-2" />
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
          className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FiUser className="w-12 h-12 text-gray-400" />
          </motion.div>
          <h3 className="text-3xl font-bold text-gray-800 mb-4">Profile Not Found</h3>
          <p className="text-gray-600 mb-8 text-lg">The requested profile could not be found.</p>
          <motion.button
            onClick={handleGoBack}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium text-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowLeft className="inline mr-2" />
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">

      <div className="py-8 px-4">
        {/* Profile Header */}
        <motion.div
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl overflow-hidden mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-fuchsia-400/30 blur-3xl rounded-full"></div>
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-tr from-amber-300/25 to-rose-400/25 blur-3xl rounded-full"></div>
          
          <div className="relative h-96">
            <div className="absolute inset-0 bg-black/10"></div>
            {/* Animated accents */}
            <motion.div
              className="absolute left-10 top-8 w-28 h-28 rounded-full bg-white/10"
              animate={{ y: [0, -8, 0], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-10 bottom-10 w-36 h-36 rounded-full bg-white/10"
              animate={{ y: [0, 10, 0], opacity: [0.7, 0.95, 0.7] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
            <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
              {(profile?.email) && (
                <a href={`mailto:${profile.email}`} className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white text-sm hover:bg-white/25 transition-colors shadow">
                  Email
                </a>
              )}
              {(profile?.phone) && (
                <a href={`tel:${profile.phone}`} className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white text-sm hover:bg-white/25 transition-colors shadow">
                  Call
                </a>
              )}
              {(profile?.slack_handle || profile?.linkedin_url) && (
                <a href={profile?.linkedin_url || '#'} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white text-sm hover:bg-white/25 transition-colors shadow">
                  Connect
                </a>
              )}
            </div>
            
            {/* Profile Picture */}
            <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 z-10">
              <div className="relative">
                <div className="p-[3px] rounded-3xl bg-gradient-to-br from-white/70 via-rose-200 to-indigo-300 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                  <div className="w-60 h-60 sm:w-64 sm:h-64 rounded-3xl bg-white p-2 shadow-2xl">
                    {(() => {
                      const avatarUrl = profile?.avatar_url || profile?.avatar || profile?.image_url;
                      const userInitial = profile?.name?.charAt(0)?.toUpperCase() || 'U';
                      return avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={profile.name}
                          className="w-full h-full rounded-xl object-cover shadow-md border-2 border-white"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    <div style={{ display: (profile?.avatar_url || profile?.avatar || profile?.image_url) ? 'none' : 'flex' }} className="w-full h-full rounded-xl bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 flex items-center justify-center text-white font-bold text-5xl sm:text-6xl shadow-md border-2 border-white">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute bottom-3 right-3 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-colors">
                    <FiCamera className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-24 pb-8 px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
                  <div className="mt-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-4xl font-extrabold bg-white/20 rounded-xl px-4 py-2 mb-2 w-full text-white placeholder-white/70"
                      />
                    ) : (
                      <h1 className="text-4xl font-extrabold text-white">{profile.name}</h1>
                    )}
                    
                    {isEditing ? (
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        placeholder="Job title"
                        className="text-xl text-white/90 bg-white/20 rounded-lg px-4 py-1 w-full"
                      />
                    ) : (
                      <p className="text-xl text-white/90">{profile.job_title || profile.role}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              <span className="px-4 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                {profile.role}
              </span>
              {profile.team_name && (
                <span className="px-4 py-1.5 bg-purple-500/30 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                  {profile.team_name}
                </span>
              )}
              {isOwnProfile && (
                <span className="px-4 py-1.5 bg-green-500/30 text-white rounded-full text-sm font-medium flex items-center backdrop-blur-sm">
                  <FiCheck className="mr-1" />
                  You
                </span>
              )}
              {canEditProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors shadow-md"
                  title="Edit Profile"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
              )}
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="p-2 border-2 border-white/30 text-white rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                    title="Cancel"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-md flex items-center justify-center"
                    title="Save Changes"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSave className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                    className="mt-6 w-full p-4 bg-white/20 rounded-xl text-white placeholder-white/70 backdrop-blur-sm"
                  />
                ) : (
                  <p className="mt-6 text-white/90 max-w-3xl text-lg">
                    {profile.bio || 'No bio available.'}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {profile?.email && (
                    <span className="px-3 py-1.5 rounded-full text-sm bg-white/15 text-white border border-white/20">
                      {profile.email}
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="px-3 py-1.5 rounded-full text-sm bg-white/15 text-white border border-white/20">
                      {profile.phone}
                    </span>
                  )}
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-sm bg-white/15 text-white border border-white/20 hover:bg-white/25 transition-colors">
                      LinkedIn
                    </a>
                  )}
                  {profile?.start_date && (
                    <span className="px-3 py-1.5 rounded-full text-sm bg-white/15 text-white border border-white/20">
                      Started: {new Date(profile.start_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
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
                        className={`w-12 h-12 ${social.color} rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-lg`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                // Navigate to the corresponding section
                switch(stat.name) {
                  case 'Projects':
                    setActiveTab('projects');
                    break;
                  case 'Tasks Completed':
                    setActiveTab('activity');
                    break;
                  case 'Achievements':
                    setActiveTab('achievements');
                    break;
                  case 'Team Members':
                    setActiveTab('team');
                    break;
                  case 'Hours Logged':
                    setActiveTab('timesheets');
                    break;
                  default:
                    setActiveTab('overview');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {[
                { id: 'overview', name: 'Overview', icon: <FiUser className="mr-2 w-4 h-4" /> },
                { id: 'team', name: 'Team', icon: <FiUsers className="mr-2 w-4 h-4" /> },
                { id: 'projects', name: 'Projects', icon: <FiBriefcase className="mr-2 w-4 h-4" /> },
                { id: 'activity', name: 'Activity', icon: <FiActivity className="mr-2 w-4 h-4" /> },
                { id: 'achievements', name: 'Achievements', icon: <FiAward className="mr-2 w-4 h-4" /> },
                { id: 'timesheets', name: 'Timesheets', icon: <FiClock className="mr-2 w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FiUser className="w-5 h-5 text-indigo-600" />
                      </div>
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiUser className="w-4 h-4 text-indigo-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{profile.name}</p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiMail className="w-4 h-4 text-indigo-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{profile.email}</p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiBriefcase className="w-4 h-4 text-indigo-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Job Title</label>
                        </div>
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
                          <p className="text-gray-900 font-medium">{profile.job_title || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiCalendar className="w-4 h-4 text-indigo-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="date"
                            name="start_date"
                            value={formData.start_date || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : profile.start_date ? (
                          <p className="text-gray-900 font-medium">
                            {new Date(profile.start_date).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-gray-900 font-medium">Not specified</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiBook className="w-4 h-4 text-indigo-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Bio</label>
                        </div>
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
                
                {/* Contact & Team Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl border border-cyan-100 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <FiMail className="w-5 h-5 text-cyan-600" />
                      </div>
                      Contact Information
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiPhone className="w-4 h-4 text-cyan-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Your phone number"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{profile.phone || 'Not provided'}</p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiSlack className="w-4 h-4 text-cyan-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Slack Handle</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="slack_handle"
                            value={formData.slack_handle || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Your Slack handle"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">
                            {profile.slack_handle ? `@${profile.slack_handle}` : 'Not provided'}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiLinkedin className="w-4 h-4 text-cyan-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                        </div>
                        {isEditing ? (
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : profile.linkedin_url ? (
                          <a 
                                href={profile.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-600 hover:underline font-medium flex items-center"
                              >
                                View LinkedIn Profile
                                <FiLink2 className="ml-1" />
                              </a>
                        ) : (
                          <p className="text-gray-900 font-medium">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiUsers className="w-5 h-5 text-purple-600" />
                      </div>
                      Team Information
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiUsers className="w-4 h-4 text-purple-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Team</label>
                        </div>
                        <p className="text-gray-900 font-medium">{profile.team_name || 'Not assigned'}</p>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiHome className="w-4 h-4 text-purple-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                        </div>
                        <p className="text-gray-900 font-medium">{profile.department_name || 'Not specified'}</p>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <FiUserCheck className="w-4 h-4 text-purple-500 mr-2" />
                          <label className="block text-sm font-medium text-gray-700">Manager</label>
                        </div>
                        <p className="text-gray-900 font-medium">{profile.manager_name || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills */}
                  <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FiStar className="w-5 h-5 text-amber-600" />
                      </div>
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Node.js', 'UI/UX', 'Project Management', 'JavaScript', 'Python', 'SQL', 'Agile'].map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center"
                        >
                          <FiStar className="w-3 h-3 mr-1" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'team' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiUsers className="w-6 h-6 text-indigo-600" />
                  </div>
                  Team Members
                </h3>
                
                {filteredTeamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTeamMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer"
                        whileHover={{ y: -5 }}
                        onClick={() => navigate(`/profile/${member.id}`)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center">
                          {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover shadow border-2 border-indigo-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{member.name}</h4>
                            <p className="text-gray-600 text-sm mb-1">{member.job_title || member.role}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <FiBriefcase className="w-3 h-3 mr-1" />
                              {member.team_name || 'Team'}
                            </div>
                          </div>
                          <FiChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <FiUsers className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Team Members</h4>
                    <p className="text-gray-500">There are no other members in your team.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'projects' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiBriefcase className="w-6 h-6 text-indigo-600" />
                  </div>
                  Projects
                </h3>
                
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {projects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                        whileHover={{ y: -3 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg flex items-center">
                              <FiFolder className="w-5 h-5 text-indigo-500 mr-2" />
                              {project.name}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">{project.description || 'No description available'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                          <div className="text-sm">
                            <p className="text-gray-700 font-medium">Role: <span className="text-gray-900">{project.role}</span></p>
                            <div className="flex items-center text-gray-500 mt-1">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              <span>
                                {project.start_date && new Date(project.start_date).toLocaleDateString()} - 
                                {project.end_date && new Date(project.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center">
                            View Details
                            <FiChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <FiBriefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Projects Assigned</h4>
                    <p className="text-gray-500">You haven't been assigned to any projects yet.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiActivity className="w-6 h-6 text-indigo-600" />
                  </div>
                  Recent Activity
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks */}
                  {tasks.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-5 flex items-center">
                        <FiTarget className="w-5 h-5 text-blue-500 mr-2" />
                        Recent Tasks
                      </h4>
                      <div className="space-y-4">
                        {tasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{task.description?.substring(0, 60)}...</p>
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <FiCalendar className="w-3 h-3 mr-1" />
                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ml-3 ${getTaskStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timesheets */}
                  {timesheets.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-5 flex items-center">
                        <FiClock className="w-5 h-5 text-purple-500 mr-2" />
                        Recent Timesheets
                      </h4>
                      <div className="space-y-4">
                        {timesheets.slice(0, 5).map((timesheet) => (
                          <div key={timesheet.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                              <p className="font-medium text-gray-900">{new Date(timesheet.date).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-600 mt-1">{timesheet.notes?.substring(0, 40) || 'No notes'}...</p>
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {timesheet.hours} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiAward className="w-6 h-6 text-indigo-600" />
                  </div>
                  Achievements
                </h3>
                
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-6 hover:shadow-lg transition-all"
                        whileHover={{ y: -3 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start">
                          <div className="p-3 bg-amber-100 rounded-xl mr-4">
                            <FiAward className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{achievement.title}</h4>
                            <p className="text-gray-600 mt-2">{achievement.description || 'No description available'}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-3">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              <span>Awarded on {new Date(achievement.awarded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <FiAward className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Achievements Yet</h4>
                    <p className="text-gray-500">You haven't received any achievements yet. Keep up the good work!</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'timesheets' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiClock className="w-6 h-6 text-indigo-600" />
                  </div>
                  Timesheets
                </h3>
                
                {timesheets.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timesheets.map((timesheet) => (
                            <tr key={timesheet.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(timesheet.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  {timesheet.hours} hrs
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {timesheet.project_id ? 'Project Name' : 'General'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {timesheet.notes?.substring(0, 50) || 'No notes'}
                                {timesheet.notes && timesheet.notes.length > 50 ? '...' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <FiClock className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Timesheets Recorded</h4>
                    <p className="text-gray-500">You haven't recorded any timesheets yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;