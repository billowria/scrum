import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  FiAward, FiPlus, FiFilter, FiSearch, FiInfo, FiRefreshCw,
  FiClock, FiUsers, FiStar, FiTrendingUp, FiPlusCircle,
  FiThumbsUp, FiCheckCircle, FiGift, FiBell, FiCalendar,
  FiChevronLeft, FiChevronRight, FiMaximize, FiX, FiUser, FiCode
} from 'react-icons/fi';
import { format, parseISO, isAfter, subDays, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Link } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';

// Import components
import AchievementForm from '../components/AchievementForm';

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

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } },
  active: {
    scale: 1.05,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

const tabVariants = {
  inactive: { opacity: 0.7, y: 0 },
  active: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scaleY: 0.8, transformOrigin: "top" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scaleY: 1,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scaleY: 0.8,
    transition: { duration: 0.2 } 
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.95 },
  active: { backgroundColor: '#4F46E5', color: '#ffffff' }
};

const AchievementsPage = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const { currentCompany } = useCompany();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('team');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  
  // Month pagination state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [teamStats, setTeamStats] = useState({
    total: 0,
    thisMonth: 0,
    recognitions: 0
  });
  const [personalStats, setPersonalStats] = useState({
    total: 0,
    thisMonth: 0,
    recognitions: 0
  });
  
  // Fetch current user and achievements on component mount
  useEffect(() => {
    if (currentCompany) {
      fetchCurrentUser();
      fetchAchievements();
    }
  }, [refreshTrigger, currentMonth, currentCompany]);
  
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && currentCompany) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .eq('company_id', currentCompany.id)
          .single();

        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error.message);
    }
  };
  
  const fetchAchievements = async () => {
    try {
      setLoading(true);

      if (!currentCompany) {
        setAchievements([]);
        setLoading(false);
        return;
      }

      // Calculate start and end of current month for filtering
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      // First get achievements filtered by company_id
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          id,
          title,
          description,
          award_type,
          awarded_at,
          image_url,
          user_id,
          created_by,
          company_id
        `)
        .eq('company_id', currentCompany.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;

      // Then fetch the user details for each achievement
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))];
        const creatorIds = [...new Set(data.map(item => item.created_by).filter(Boolean))];
        const allIds = [...new Set([...userIds, ...creatorIds])];

        // Fetch all users in one query with company filtering
        if (allIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', allIds)
            .eq('company_id', currentCompany.id);

          if (userError) throw userError;

          // Create a map of user data for quick lookup
          const userMap = {};
          if (userData) {
            userData.forEach(user => {
              userMap[user.id] = user;
            });
          }

          // Attach user data to achievements
          const enhancedData = data.map(achievement => ({
            ...achievement,
            users: userMap[achievement.user_id] || null,
            creator: userMap[achievement.created_by] || null
          }));

          // Filter achievements by month range
          const currentMonthAchievements = enhancedData.filter(achievement => {
            if (!achievement.awarded_at) return false;
            const achievementDate = parseISO(achievement.awarded_at);
            return isWithinInterval(achievementDate, { start: startDate, end: endDate });
          });

          setAchievements(currentMonthAchievements);

          // Calculate stats
          const allTeamAchievements = enhancedData.filter(a => !a.user_id || (a.user_id && a.user_id !== currentUser?.id));
          const allPersonalAchievements = currentUser ? enhancedData.filter(a => a.user_id === currentUser.id) : [];

          // Team stats
          setTeamStats({
            total: allTeamAchievements.length,
            thisMonth: allTeamAchievements.filter(a => {
              if (!a.awarded_at) return false;
              const achievementDate = parseISO(a.awarded_at);
              return isWithinInterval(achievementDate, { start: startDate, end: endDate });
            }).length,
            recognitions: allTeamAchievements.reduce((count, a) => count + (a.reactions || 0), 0)
          });

          // Personal stats
          setPersonalStats({
            total: allPersonalAchievements.length,
            thisMonth: allPersonalAchievements.filter(a => {
              if (!a.awarded_at) return false;
              const achievementDate = parseISO(a.awarded_at);
              return isWithinInterval(achievementDate, { start: startDate, end: endDate });
            }).length,
            recognitions: allPersonalAchievements.reduce((count, a) => count + (a.reactions || 0), 0)
          });
        } else {
          setAchievements([]);
        }
      } else {
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleFormSuccess = () => {
    handleRefresh();
  };
  
  // Month pagination handlers
  const goToPrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };
  
  const formatMonthYear = (date) => {
    return format(date, 'MMMM yyyy');
  };
  
  // Filter and search achievements
  const filteredAchievements = achievements.filter(achievement => {
    // Apply award type filter
    const typeMatch = filter === 'all' || achievement.award_type === filter;
    
    // Apply tab filter (team vs personal)
    const tabMatch = activeTab === 'team' 
      ? (!achievement.user_id || (currentUser && achievement.user_id !== currentUser.id))
      : (currentUser && achievement.user_id === currentUser.id);
    
    // Apply search term
    const searchMatch = !searchTerm || 
      achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (achievement.description && achievement.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (achievement.users && achievement.users.name && achievement.users.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return typeMatch && tabMatch && searchMatch;
  });
  
  // Function to check if an achievement is new (less than 7 days old)
  const isNewAchievement = (achievement) => {
    if (!achievement.awarded_at) return false;
    const achievementDate = parseISO(achievement.awarded_at);
    const sevenDaysAgo = subDays(new Date(), 7);
    return isAfter(achievementDate, sevenDaysAgo);
  };
  
  // Sort achievements by date
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    return new Date(b.awarded_at) - new Date(a.awarded_at);
  });
  
  // Award type options for filtering
  const awardTypeOptions = [
    { value: 'all', label: 'All Types' },
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
  
  const isManager = currentUser?.role === 'manager';
  
  // Handle viewing achievement details
  const handleViewAchievement = (achievement) => {
    setExpandedAchievement(achievement);
  };
  
  // Get current stats based on active tab
  const currentStats = activeTab === 'team' ? teamStats : personalStats;
  
  // Floating decoration elements - only visible on desktop
  const FloatingDecorations = () => (
    <>
      <motion.div 
        className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-purple-100 opacity-30 z-0 hidden lg:block"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 45, 0],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <motion.div 
        className="absolute -left-16 bottom-10 h-28 w-28 rounded-full bg-pink-100 opacity-30 z-0 hidden lg:block"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -30, 0],
          opacity: [0.3, 0.15, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", delay: 2 }}
      />
    </>
  );
  
  return (
    <motion.div 
      ref={containerRef}
      className="w-full px-8 overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header section */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-center sm:text-left font-display bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-2">
            Achievement Tracking
          </h1>
          <p className="text-gray-600 text-center sm:text-left">
            Celebrating our team's successes and milestones
          </p>
        </div>
        
        {currentUser && (
          <Link
            to={`/user-achievements/${currentUser.id}`}
            className="mt-4 sm:mt-0 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors inline-flex items-center justify-center group relative"
          >
            <FiAward className="mr-2" />
            View My Achievements
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 w-44 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              View and download your certificates
            </span>
          </Link>
        )}
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiAward className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Achievement Tracking</h3>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button 
                className="text-white bg-white/20 p-2 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </motion.button>
              {isManager && (
                <motion.button 
                  className="text-white bg-white/20 p-2 rounded-full"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                >
                  <FiPlus className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="p-2 flex">
            <motion.button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg relative overflow-hidden ${
                activeTab === 'team' ? 'text-purple-700 bg-purple-50 border-2 border-transparent team-tab-gradient' : 'text-gray-600 bg-white'
              }`}
              onClick={() => setActiveTab('team')}
              variants={tabVariants}
              animate={activeTab === 'team' ? 'active' : 'inactive'}
              whileHover={{ backgroundColor: activeTab === 'team' ? '#F5F3FF' : '#F9FAFB' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center">
                <FiUsers className="mr-2" />
                Team Achievements
              </div>
              {activeTab === 'team' && (
                <div className="text-xs text-gray-500 mt-1 font-normal">Recognizing outstanding contributions across the team.</div>
              )}
            </motion.button>
            <motion.button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
                activeTab === 'personal' ? 'text-pink-700 bg-pink-50' : 'text-gray-600 bg-white'
              }`}
              onClick={() => setActiveTab('personal')}
              variants={tabVariants}
              animate={activeTab === 'personal' ? 'active' : 'inactive'}
              whileHover={{ backgroundColor: activeTab === 'personal' ? '#FDF2F8' : '#F9FAFB' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center">
                <FiStar className="mr-2" />
                Personal Achievements
              </div>
            </motion.button>
          </div>
        </div>
        
        {/* Search and filter toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-8 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              {awardTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiFilter className="absolute ml-3 text-gray-400 pointer-events-none" />
            
            {/* Month navigation */}
            <div className="flex items-center rounded-lg overflow-hidden border border-gray-300">
              <motion.button 
                onClick={goToPrevMonth}
                className="p-2 bg-white hover:bg-gray-100 border-r border-gray-300"
                whileHover={{ backgroundColor: "#F3F4F6" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronLeft />
              </motion.button>
              <div className="px-3 py-2 font-medium text-sm">
                {formatMonthYear(currentMonth)}
              </div>
              <motion.button 
                onClick={goToNextMonth}
                className="p-2 bg-white hover:bg-gray-100 border-l border-gray-300"
                whileHover={{ backgroundColor: "#F3F4F6" }}
                whileTap={{ scale: 0.95 }}
                disabled={addMonths(currentMonth, 1) > new Date()}
              >
                <FiChevronRight />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Stats summary */}
        <motion.div 
          className="grid grid-cols-3 gap-4 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="bg-purple-50 rounded-lg p-3 border border-purple-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(139, 92, 246, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-purple-700 mb-1">Total Achievements</div>
                <div className="text-xl font-bold text-purple-900">{currentStats.total}</div>
              </div>
              <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <FiAward />
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-pink-50 rounded-lg p-3 border border-pink-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(236, 72, 153, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-pink-700 mb-1">This Month</div>
                <div className="text-xl font-bold text-pink-900">{currentStats.thisMonth}</div>
              </div>
              <div className="bg-pink-100 p-2 rounded-full text-pink-600">
                <FiClock />
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-indigo-50 rounded-lg p-3 border border-indigo-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-indigo-700 mb-1">Recognitions</div>
                <div className="text-xl font-bold text-indigo-900">{currentStats.recognitions}</div>
              </div>
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <FiThumbsUp />
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Achievements list */}
        <motion.div 
          className="p-4 overflow-y-auto max-h-[400px]"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : sortedAchievements.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                <FiInfo className="text-gray-400 h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No achievements found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' ? 
                    'Try adjusting your search or filter settings.' : 
                    `No achievements for ${formatMonthYear(currentMonth)} yet.`}
                </p>
                {isManager && (
                  <motion.button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white rounded-lg py-2 px-4 inline-flex items-center justify-center hover:bg-purple-700 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiPlus className="mr-1" />
                    <span>Create Achievement</span>
                  </motion.button>
                )}
              </div>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {sortedAchievements.map((achievement) => (
                <motion.div 
                  key={achievement.id}
                  className="relative team-achievement-card"
                  variants={itemVariants}
                  layoutId={`achievement-${achievement.id}`}
                  onClick={() => handleViewAchievement(achievement)}
                >
                  <motion.div 
                    className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer h-[150px] flex flex-col ${activeTab === 'team' ? 'team-card-gradient-border' : ''}`}
                    whileHover={{ 
                      y: -3, 
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="flex h-full">
                      {/* Left colored bar */}
                      <div className={`w-2 ${
                        achievement.award_type === 'recognition' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                        achievement.award_type === 'performance' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 
                        achievement.award_type === 'milestone' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 
                        achievement.award_type === 'teamwork' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        achievement.award_type === 'technical' ? 'bg-gradient-to-br from-gray-700 to-gray-800' :
                        achievement.award_type === 'certificate' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        achievement.award_type === 'special' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                        'bg-gradient-to-br from-primary-500 to-primary-600'
                      }`} />
                      {/* Main content */}
                      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex items-start">
                          {/* Icon */}
                          <div className={`h-10 w-10 shrink-0 rounded-full ${
                            achievement.award_type === 'recognition' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                            achievement.award_type === 'performance' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 
                            achievement.award_type === 'milestone' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 
                            achievement.award_type === 'teamwork' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                            achievement.award_type === 'technical' ? 'bg-gradient-to-br from-gray-700 to-gray-800' :
                            achievement.award_type === 'certificate' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                            achievement.award_type === 'special' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                            'bg-gradient-to-br from-primary-500 to-primary-600'
                          } text-white flex items-center justify-center mr-3 relative`}>
                            {achievement.award_type === 'recognition' ? <FiStar /> : 
                             achievement.award_type === 'performance' ? <FiTrendingUp /> : 
                             achievement.award_type === 'teamwork' ? <FiUsers /> :
                             achievement.award_type === 'milestone' ? <FiGift /> :
                             achievement.award_type === 'certificate' ? <FiCheckCircle /> :
                             achievement.award_type === 'technical' ? <FiCode /> :
                             <FiAward />}
                            {/* Team badge for team achievements */}
                            {activeTab === 'team' && (
                              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-1 shadow-md flex items-center justify-center" style={{ fontSize: '0.7rem' }}>
                                <FiUsers />
                              </span>
                            )}
                          </div>
                          {/* Achievement details */}
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900 truncate">{achievement.title}</h4>
                              {isNewAchievement(achievement) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 shrink-0 ml-1">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                          <span className="flex items-center">
                            <FiCalendar className="mr-1" size={12} />
                            {achievement.awarded_at ? format(parseISO(achievement.awarded_at), 'MMM d, yyyy') : 'No date'}
                          </span>
                          <span className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                            <FiUser className="mr-1 shrink-0" size={12} />
                            <span className="truncate">{achievement.users?.name || 'Team'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* "New" indicator with animation */}
                  {isNewAchievement(achievement) && (
                    <motion.div 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 border-2 border-white"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* Add new achievement button */}
          {isManager && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button 
                className="bg-white border border-dashed border-gray-300 rounded-xl p-3 w-full flex items-center justify-center text-sm text-gray-500"
                whileHover={{ 
                  scale: 1.02, 
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D1D5DB",
                  color: "#4B5563"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
              >
                <FiPlusCircle className="mr-2" />
                Create New Achievement
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
      
      {/* Add floating decorations */}
      <FloatingDecorations />
      
      {/* Achievement Form Modal */}
      <AchievementForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />
      
      {/* Achievement detail modal */}
      <AnimatePresence mode="wait">
        {expandedAchievement && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedAchievement(null)}
          >
            <motion.div
              layoutId={`achievement-${expandedAchievement.id}`}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`h-2 w-full ${
                expandedAchievement.award_type === 'recognition' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                expandedAchievement.award_type === 'performance' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 
                expandedAchievement.award_type === 'milestone' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 
                expandedAchievement.award_type === 'teamwork' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                expandedAchievement.award_type === 'technical' ? 'bg-gradient-to-br from-gray-700 to-gray-800' :
                expandedAchievement.award_type === 'certificate' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                expandedAchievement.award_type === 'special' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                'bg-gradient-to-br from-primary-500 to-primary-600'
              }`}></div>
              
              <div className="p-6">
                <div className="flex mb-4">
                  <div className={`h-12 w-12 rounded-full ${
                    expandedAchievement.award_type === 'recognition' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                    expandedAchievement.award_type === 'performance' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 
                    expandedAchievement.award_type === 'milestone' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 
                    expandedAchievement.award_type === 'teamwork' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    expandedAchievement.award_type === 'technical' ? 'bg-gradient-to-br from-gray-700 to-gray-800' :
                    expandedAchievement.award_type === 'certificate' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    expandedAchievement.award_type === 'special' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                    'bg-gradient-to-br from-primary-500 to-primary-600'
                  } text-white flex items-center justify-center mr-4 shrink-0`}>
                    {expandedAchievement.award_type === 'recognition' ? <FiStar /> : 
                     expandedAchievement.award_type === 'performance' ? <FiTrendingUp /> : 
                     expandedAchievement.award_type === 'teamwork' ? <FiUsers /> :
                     expandedAchievement.award_type === 'milestone' ? <FiGift /> :
                     expandedAchievement.award_type === 'certificate' ? <FiCheckCircle /> :
                     expandedAchievement.award_type === 'technical' ? <FiCode /> :
                     <FiAward />}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{expandedAchievement.title}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500 flex items-center">
                        <FiCalendar className="mr-1 h-3.5 w-3.5" />
                        {expandedAchievement.awarded_at ? format(parseISO(expandedAchievement.awarded_at), 'MMMM d, yyyy') : 'No date'}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <FiUser className="mr-1 h-3.5 w-3.5" />
                        {expandedAchievement.users?.name || 'Team Achievement'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-gray-600">
                  {expandedAchievement.description || 'No additional details provided.'}
                </div>
                
                <div className="mt-2 mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {expandedAchievement.award_type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                        {expandedAchievement.award_type}
                      </span>
                    )}
                    {isNewAchievement(expandedAchievement) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        New
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiThumbsUp className="mr-1" />
                    <span>{expandedAchievement.reactions || 0} reactions</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <motion.button
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center"
                      whileHover={{ scale: 1.05, backgroundColor: "#F3F4F6" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setExpandedAchievement(null)}
                    >
                      Close
                    </motion.button>
                    <motion.button
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm flex items-center"
                      whileHover={{ scale: 1.05, backgroundColor: "#EEF2FF" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiThumbsUp className="mr-1" />
                      Give Recognition
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AchievementsPage; 