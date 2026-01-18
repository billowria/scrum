import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  FiAward, FiPlus, FiFilter, FiSearch, FiInfo, FiRefreshCw,
  FiClock, FiUsers, FiStar, FiTrendingUp, FiPlusCircle,
  FiThumbsUp, FiCheckCircle, FiGift, FiBell, FiCalendar,
  FiChevronLeft, FiChevronRight, FiMaximize, FiX, FiUser, FiCode,
  FiChevronDown, FiSun, FiZap, FiCircle
} from 'react-icons/fi';
import { format, parseISO, isAfter, subDays, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Link } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../context/ThemeContext';

// Import components
import AchievementForm from '../components/AchievementForm';
import LoadingSpinner from '../components/shared/LoadingSpinner';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  }
};

const glowVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  }
};

const AchievementsPage = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  const { currentCompany } = useCompany();
  const { theme, themeMode, isAnimatedTheme } = useTheme();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('team');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

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

  // Theme-aware styling
  const getThemeAccent = () => {
    switch (themeMode) {
      case 'space': return {
        primary: 'from-violet-500 to-purple-600',
        secondary: 'from-fuchsia-500 to-pink-500',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/20',
        text: 'text-purple-400',
        bg: 'bg-purple-500/10'
      };
      case 'ocean': return {
        primary: 'from-cyan-500 to-blue-600',
        secondary: 'from-teal-500 to-cyan-500',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/20',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10'
      };
      case 'forest': return {
        primary: 'from-emerald-500 to-green-600',
        secondary: 'from-lime-500 to-emerald-500',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
      };
      default: return {
        primary: 'from-indigo-500 to-purple-600',
        secondary: 'from-pink-500 to-rose-500',
        border: 'border-white/10',
        glow: 'shadow-indigo-500/20',
        text: 'text-indigo-400',
        bg: 'bg-indigo-500/10'
      };
    }
  };

  const accent = getThemeAccent();

  // Dynamic transparency based on theme
  const getGlassBg = (opacity = 0.4) => {
    if (isAnimatedTheme) {
      return 'bg-transparent'; // Full transparency for premium themes
    }
    return `bg-slate-900/${Math.floor(opacity * 100)}`;
  };


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
            .select('id, name, email, avatar_url')
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
    { value: 'all', label: 'All Types', icon: FiStar },
    { value: 'promotion', label: 'Promotion', icon: FiTrendingUp },
    { value: 'certificate', label: 'Certificate', icon: FiCheckCircle },
    { value: 'recognition', label: 'Recognition', icon: FiStar },
    { value: 'performance', label: 'Performance', icon: FiZap },
    { value: 'milestone', label: 'Milestone', icon: FiGift },
    { value: 'teamwork', label: 'Teamwork', icon: FiUsers },
    { value: 'achievement', label: 'Achievement', icon: FiAward },
    { value: 'special', label: 'Special Award', icon: FiSun },
    { value: 'technical', label: 'Technical Excellence', icon: FiCode },
    { value: 'other', label: 'Other', icon: FiCircle }
  ];

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Handle viewing achievement details
  const handleViewAchievement = (achievement) => {
    setExpandedAchievement(achievement);
  };

  // Get current stats based on active tab
  const currentStats = activeTab === 'team' ? teamStats : personalStats;

  // Get award type icon and colors
  const getAwardConfig = (awardType) => {
    const configs = {
      recognition: { icon: FiStar, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20' },
      performance: { icon: FiTrendingUp, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/20' },
      milestone: { icon: FiGift, gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/20' },
      teamwork: { icon: FiUsers, gradient: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-500/20' },
      technical: { icon: FiCode, gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-500/20' },
      certificate: { icon: FiCheckCircle, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/20' },
      special: { icon: FiSun, gradient: 'from-fuchsia-500 to-purple-500', bg: 'bg-fuchsia-500/20' },
      promotion: { icon: FiTrendingUp, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/20' },
    };
    return configs[awardType] || { icon: FiAward, gradient: accent.primary, bg: accent.bg };
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full min-h-screen px-4 sm:px-8 lg:px-12 py-8 overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className={`absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${accent.primary} opacity-10 blur-3xl`}
          variants={glowVariants}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr ${accent.secondary} opacity-10 blur-3xl`}
          variants={glowVariants}
          initial="initial"
          animate="animate"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full mx-auto">
        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Area */}
            <div className="flex items-center gap-4">
              {/* Glowing Icon */}
              <motion.div
                className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${accent.primary} flex items-center justify-center shadow-xl ${accent.glow} shadow-2xl`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm" />
                <FiAward className="w-8 h-8 text-white relative z-10" />
                {/* Animated ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-white/30"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  <span className={`bg-gradient-to-r ${accent.primary} bg-clip-text text-transparent`}>
                    Achievements
                  </span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base">
                  Celebrating our team's successes and milestones
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <Link
                  to={`/user-achievements/${currentUser.id}`}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border ${accent.border} transition-all duration-300 hover:shadow-lg ${accent.glow}`}
                >
                  <FiAward className={accent.text} />
                  <span className="text-white font-medium text-sm">My Achievements</span>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -5 }}
                    whileHover={{ x: 0 }}
                  >
                    <FiChevronRight className="w-4 h-4 text-white/60" />
                  </motion.div>
                </Link>
              )}

              {isManager && (
                <motion.button
                  onClick={() => setShowForm(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${accent.primary} text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="w-5 h-5" />
                  Create Award
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Glass Container */}
        <motion.div
          className={`${isAnimatedTheme ? 'bg-transparent' : 'bg-slate-900/40'} ${!isAnimatedTheme ? 'backdrop-blur-[40px]' : ''} rounded-[2.5rem] border ${accent.border} overflow-hidden shadow-2xl transition-all duration-700`}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Tabs Section */}
          <div className="p-2 bg-white/5 border-b border-white/10">
            <div className="flex gap-2">
              {['team', 'personal'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === tab
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${accent.primary} opacity-80`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tab === 'team' ? <FiUsers className="w-4 h-4" /> : <FiStar className="w-4 h-4" />}
                    {tab === 'team' ? 'Team Achievements' : 'Personal Achievements'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Search, Filter, and Month Navigation */}
          <div className="p-4 bg-white/5 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all"
                >
                  <FiFilter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {awardTypeOptions.find(o => o.value === filter)?.label || 'All Types'}
                  </span>
                  <FiChevronDown className={`w-4 h-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {filterDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {awardTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilter(option.value);
                              setFilterDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${filter === option.value
                              ? 'bg-white/10 text-white'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <motion.button
                  onClick={goToPrevMonth}
                  className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </motion.button>
                <span className="px-4 py-2 text-sm font-medium text-white min-w-[140px] text-center">
                  {formatMonthYear(currentMonth)}
                </span>
                <motion.button
                  onClick={goToNextMonth}
                  className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={addMonths(currentMonth, 1) > new Date()}
                >
                  <FiChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Refresh */}
              <motion.button
                onClick={handleRefresh}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Stats Summary */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-white/5 border-b border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {[
              { label: 'Total Achievements', value: currentStats.total, icon: FiAward, gradient: accent.primary, text: accent.text },
              { label: 'This Month', value: currentStats.thisMonth, icon: FiCalendar, gradient: accent.secondary, text: 'text-white' },
              { label: 'Recognitions', value: currentStats.recognitions, icon: FiThumbsUp, gradient: 'from-pink-500 to-rose-500', text: 'text-white' }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                className={`relative p-6 rounded-3xl ${isAnimatedTheme ? 'bg-transparent' : 'bg-white/5'} border border-white/10 overflow-hidden group cursor-pointer hover:bg-white/10 transition-all duration-300`}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {/* Subtle gradient glow in background */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} />

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br ${stat.gradient} group-hover:shadow-lg`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Achievements Grid */}
          <div className="p-6 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : sortedAchievements.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${accent.primary} flex items-center justify-center mb-6 opacity-50`}>
                  <FiInfo className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white/80 mb-2">No achievements found</h3>
                <p className="text-white/50 text-center max-w-md mb-6">
                  {searchTerm || filter !== 'all'
                    ? 'Try adjusting your search or filter settings.'
                    : `No achievements for ${formatMonthYear(currentMonth)} yet.`}
                </p>
                {isManager && (
                  <motion.button
                    onClick={() => setShowForm(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${accent.primary} text-white font-medium shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="w-5 h-5" />
                    Create Achievement
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                {sortedAchievements.map((achievement, idx) => {
                  const awardConfig = getAwardConfig(achievement.award_type);
                  const AwardIcon = awardConfig.icon;

                  return (
                    <motion.div
                      key={achievement.id}
                      variants={cardVariants}
                      whileHover="hover"
                      onClick={() => handleViewAchievement(achievement)}
                      className="cursor-pointer group"
                    >
                      <div className={`relative h-full ${isAnimatedTheme ? 'bg-transparent' : 'bg-slate-800/40'} ${!isAnimatedTheme ? 'backdrop-blur-2xl' : ''} rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 group-hover:shadow-2xl ${accent.glow} flex flex-col`}>
                        {/* Top gradient bar */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${awardConfig.gradient}`} />

                        {/* Card content */}
                        <div className="p-6 flex-grow flex flex-col">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-5">
                            {/* Award icon */}
                            <motion.div
                              className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${awardConfig.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                              whileHover={{ rotate: 10, scale: 1.1 }}
                            >
                              <AwardIcon className="w-7 h-7 text-white" />
                              {/* Team badge */}
                              {activeTab === 'team' && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center">
                                  <FiUsers className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </motion.div>

                            {/* Title and type */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 italic">
                                Official {achievement.award_type}
                              </p>
                              <h4 className="text-xl font-black text-white truncate tracking-tight">
                                {achievement.title}
                              </h4>
                            </div>
                          </div>

                          {/* Description */}
                          {achievement.description && (
                            <p className="text-white/60 text-sm line-clamp-3 mb-6 leading-relaxed flex-grow">
                              {achievement.description}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                            <div className="flex items-center gap-3">
                              {achievement.users?.avatar_url ? (
                                <div className="relative">
                                  <img
                                    src={achievement.users.avatar_url}
                                    alt={achievement.users.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-white/10"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                  <span className="text-sm font-black text-white/40">
                                    {achievement.users?.name?.[0]?.toUpperCase() || 'T'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-white leading-none mb-1">
                                  {achievement.users?.name || 'Sync Team'}
                                </p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                                  Recipient
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-tighter mb-0.5">
                                {achievement.awarded_at ? format(parseISO(achievement.awarded_at), 'MMM yyyy') : '—'}
                              </p>
                              <div className="flex items-center gap-1 text-white/20">
                                <FiCalendar className="w-3 h-3" />
                                <span className="text-[9px] font-bold">VERIFIED</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover overlay effects */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        />

                        {/* Shimmer line */}
                        <motion.div
                          className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none"
                          initial={{ left: '-10%' }}
                          whileHover={{ left: '110%' }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Add Achievement Button (Manager Only) */}
            {isManager && sortedAchievements.length > 0 && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={() => setShowForm(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <FiPlusCircle className={`w-5 h-5 group-hover:${accent.text}`} />
                  Create New Achievement
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Achievement Form Modal */}
      <AchievementForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Achievement Detail Modal */}
      <AnimatePresence mode="wait">
        {expandedAchievement && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedAchievement(null)}
          >
            <motion.div
              className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-lg w-full border border-white/10 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div className={`h-2 w-full bg-gradient-to-r ${getAwardConfig(expandedAchievement.award_type).gradient}`} />

              <div className="p-6">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                  <motion.button
                    onClick={() => setExpandedAchievement(null)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="flex items-start gap-4 mb-6">
                  {(() => {
                    const config = getAwardConfig(expandedAchievement.award_type);
                    const Icon = config.icon;
                    return (
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{expandedAchievement.title}</h3>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        {expandedAchievement.awarded_at ? format(parseISO(expandedAchievement.awarded_at), 'MMMM d, yyyy') : 'No date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiUser className="w-4 h-4" />
                        {expandedAchievement.users?.name || 'Team Achievement'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <p className="text-white/80 leading-relaxed">
                    {expandedAchievement.description || 'No additional details provided.'}
                  </p>
                </div>

                {/* Award type badge */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {expandedAchievement.award_type && (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getAwardConfig(expandedAchievement.award_type).bg} text-white capitalize`}>
                      {expandedAchievement.award_type}
                    </span>
                  )}
                  {isNewAchievement(expandedAchievement) && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-rose-500/20 text-rose-400">
                      New
                    </span>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <FiThumbsUp className="w-4 h-4" />
                    <span>{expandedAchievement.reactions || 0} reactions</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setExpandedAchievement(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Close
                    </motion.button>
                    <motion.button
                      className={`px-4 py-2 rounded-xl bg-gradient-to-r ${accent.primary} text-white text-sm font-medium shadow-lg transition-all flex items-center gap-2`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiThumbsUp className="w-4 h-4" />
                      Give Recognition
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close filter dropdown */}
      {filterDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFilterDropdownOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default AchievementsPage;