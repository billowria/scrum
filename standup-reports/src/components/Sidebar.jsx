import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiHome, FiCalendar, FiList, FiAward, FiUser, FiChevronLeft, 
  FiChevronRight, FiBriefcase, FiUsers, FiClipboard, FiClock, 
  FiBell, FiUserPlus, FiSettings, FiLogOut, FiSun, FiMoon,
  FiTrendingUp, FiShield, FiZap, FiHeart, FiSearch, FiStar,
  FiActivity, FiBookmark, FiCpu, FiDatabase, FiFolder, FiCheckSquare, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';



// Enhanced navigation configuration with real-time counts
const createNavLinks = (counts, user) => [
  { 
    to: '/dashboard', 
    icon: <FiHome />, 
    label: 'Dashboard', 
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    description: 'Overview & Analytics',
    badge: null
  },
  { 
    to: '/leave-calendar', 
    icon: <FiCalendar />, 
    label: 'Leave Calendar', 
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    shadowColor: 'rgba(20, 184, 166, 0.5)',
    description: 'Time Management',
    badge: counts.leaveRequests > 0 ? counts.leaveRequests : null
  },
  { 
    to: '/tasks', 
    icon: <FiList />, 
    label: 'Tasks', 
    gradient: 'from-pink-400 via-purple-500 to-indigo-600',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    description: 'Project Workflow',
    badge: counts.tasks
  },
  { 
    to: '/achievements', 
    icon: <FiAward />, 
    label: 'Achievements', 
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    shadowColor: 'rgba(251, 146, 60, 0.5)',
    description: 'Recognition & Goals',
    badge: counts.achievements > 0 ? 'new' : null
  },
  { 
    to: '/projects', 
    icon: <FiFolder />, 
    label: 'Projects', 
    gradient: 'from-indigo-500 to-purple-600',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    description: 'View assigned projects',
    badge: counts.projects
  },
  { 
    to: '/notifications', 
    icon: <FiBell />, 
    label: 'Notifications', 
    gradient: 'from-red-400 via-pink-500 to-purple-600',
    shadowColor: 'rgba(239, 68, 68, 0.5)',
    description: 'Stay updated',
    badge: counts.notifications
  },
];

const createManagerPortalSubtasks = (counts, user) => [
  { 
    label: 'Team Management', 
    icon: <FiUsers />, 
    to: '/manager-dashboard?tab=team-management',
    gradient: 'from-blue-500 to-indigo-600',
    description: 'Manage team structure',
    status: 'active',
    badge: counts.teamMembers
  },
  { 
    label: 'Add Member', 
    icon: <FiUserPlus />, 
    to: '/manager-dashboard?tab=add-member',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Onboard new talent',
    status: 'normal'
  },
  { 
    label: 'Leave Requests', 
    icon: <FiClipboard />, 
    to: '/manager-dashboard?tab=leave-requests',
    gradient: 'from-yellow-500 to-orange-600',
    description: 'Review time-off requests',
    status: counts.leaveRequests > 0 ? 'urgent' : 'normal',
    badge: counts.leaveRequests
  },
  { 
    label: 'Leave History', 
    icon: <FiClock />, 
    to: '/manager-dashboard?tab=leave-history',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Historical records',
    status: 'normal'
  },
  { 
    label: 'Announcements', 
    icon: <FiBell />, 
    to: '/manager-dashboard?tab=announcements',
    gradient: 'from-indigo-500 to-purple-600',
    description: 'Team communications',
    status: 'normal'
  },
  { 
    label: 'Report History', 
    icon: <FiTrendingUp />, 
    to: '/manager-dashboard?tab=report-history',
    gradient: 'from-emerald-500 to-teal-600',
    description: 'Performance insights',
    status: 'normal',
    badge: counts.reports
  },
  { 
    label: 'Projects', 
    icon: <FiFolder />, 
    to: '/manager-dashboard?tab=projects',
    gradient: 'from-orange-500 to-red-600',
    description: 'Project overview',
    status: 'normal',
    badge: counts.projects
  },
  { 
    label: 'Project Manager', 
    icon: <FiBriefcase />, 
    to: '/manager-dashboard?tab=project-manager',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Project management',
    status: 'normal',
    badge: counts.projects
  },
];

// Premium animation configurations
const premiumSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const sidebarVariants = {
  expanded: {
    width: 320,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.03,
      delayChildren: 0.1
    }
  },
  collapsed: {
    width: 88,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.8,
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      ...premiumSpring,
      delay: 0.1
    }
  },
  collapsed: {
    opacity: 0,
    x: -30,
    scale: 0.8,
    transition: {
      ...premiumSpring,
      duration: 0.3
    }
  }
};

// Enhanced Badge Component
const Badge = ({ type, count, className = "" }) => {
  const getBadgeStyles = () => {
    switch (type) {
      case 'new':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'urgent':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-bounce';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    }
  };

  if (typeof count === 'number' && count > 0) {
    return (
      <motion.div
        className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-lg ${getBadgeStyles()} ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {count > 99 ? '99+' : count}
      </motion.div>
    );
  }

  if (type && typeof type === 'string') {
    return (
      <motion.div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getBadgeStyles()} ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    );
  }

  return null;
};

// Enhanced Search Component
const SearchBar = ({ open, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={itemVariants}
          className="relative mb-4"
        >
          <motion.div
            className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
              isFocused 
                ? 'bg-white/15 border-blue-400/50 shadow-lg shadow-blue-500/20' 
                : isDarkMode 
                  ? 'bg-gray-800/30 border-gray-600/30 hover:border-gray-500/50' 
                  : 'bg-white/10 border-slate-300/30 hover:border-slate-400/50'
            }`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <FiSearch className={`ml-4 transition-colors ${
              isFocused ? 'text-blue-400' : isDarkMode ? 'text-gray-400' : 'text-slate-500'
            }`} size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`flex-1 bg-transparent border-none outline-none px-3 py-3 text-sm placeholder-gray-400 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
            />
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setSearchTerm('')}
                className="mr-3 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <FiX size={14} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced User Profile Component - Minimal Design
const UserProfile = ({ open, user, isDarkMode, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div 
      className="relative"
      onHoverStart={() => setShowMenu(true)}
      onHoverEnd={() => setShowMenu(false)}
    >
      <motion.div 
        className={`flex items-center p-3 rounded-xl backdrop-blur-sm border cursor-pointer transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/5' 
            : 'bg-white/40 border-slate-200/20'
        }`}
        whileHover={{ 
          scale: 1.02,
          y: -1,
          boxShadow: isDarkMode 
            ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
            : '0 4px 16px rgba(0, 0, 0, 0.05)'
        }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div 
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow overflow-hidden"
          whileHover={{ 
            scale: 1.05,
            transition: { type: 'spring', stiffness: 400 }
          }}
        >
          {/* Simplified background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400" />
          <FiUser className="relative z-10" size={16} />
        </motion.div>
        
        <AnimatePresence>
          {open && (
            <motion.div
              variants={itemVariants}
              className="ml-3 flex-1"
            >
              <div className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.name || 'User'}
              </div>
              <div className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {user?.role || 'Member'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              variants={itemVariants}
              className="flex space-x-1"
            >
              <motion.button
                onClick={onLogout}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                    : 'text-red-500 hover:text-red-600 hover:bg-red-100/50'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiLogOut size={14} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Simplified menu popup */}
      <AnimatePresence>
        {showMenu && open && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg"
          >
            <div className="space-y-1">
              <button className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/20 transition-colors text-sm">
                Profile
              </button>
              <button className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/20 transition-colors text-sm">
                Settings
              </button>
              <button className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/20 transition-colors text-sm text-red-600">
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Enhanced sidebar component with premium interactions
export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [managerDropdown, setManagerDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  
  // Real-time counts state
  const [counts, setCounts] = useState({
    tasks: 0,
    notifications: 0,
    leaveRequests: 0,
    projects: 0,
    achievements: 0,
    teamMembers: 0,
    reports: 0
  });
  
  // Fetch counts function
  const fetchCounts = useCallback(async () => {
    if (!user) return;

    try {
      const countsData = {};

      // Fetch tasks count (schema: assignee_id + task_status enum)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', user.id)
        .in('status', ['To Do', 'In Progress']);
      countsData.tasks = tasksData?.length || 0;

      // Unread notifications proxy via announcement_reads
      const { data: readsData } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);
      countsData.notifications = readsData?.length || 0;

      // Fetch projects count (for managers: all projects, for others: assigned projects)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id');
        countsData.projects = projectsData?.length || 0;
      } else {
        const { data: projectsData } = await supabase
          .from('project_assignments')
          .select('id')
          .eq('user_id', user.id);
        countsData.projects = projectsData?.length || 0;
      }

      // Fetch achievements count
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id);
      countsData.achievements = achievementsData?.length || 0;

      // Fetch team members count (for managers only)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: teamMembersData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'developer');
        countsData.teamMembers = teamMembersData?.length || 0;
      }

      // Fetch pending leave requests count (for managers only)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: leaveRequestsData } = await supabase
          .from('leave_plans')
          .select('id')
          .eq('status', 'pending');
        countsData.leaveRequests = leaveRequestsData?.length || 0;
      }

      // Fetch recent daily_reports for this user (last 7 days)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: reportsData } = await supabase
        .from('daily_reports')
        .select('id')
        .gte('created_at', since)
        .eq('user_id', user.id);
      countsData.reports = reportsData?.length || 0;

      setCounts(countsData);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, [user]);

  // Fetch counts on mount and set up interval
  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user, fetchCounts]);
  
  // Create navigation links with real-time counts
  const navLinks = useMemo(() => createNavLinks(counts, user), [counts, user]);
  const managerPortalSubtasks = useMemo(() => createManagerPortalSubtasks(counts, user), [counts, user]);
  
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 25, mass: 0.1 };
  const mouseSpringX = useSpring(mouseX, springConfig);
  const mouseSpringY = useSpring(mouseY, springConfig);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isManagerDashboard = location.pathname.startsWith('/manager-dashboard');

  const handleMouseMove = useCallback((e) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY, prefersReducedMotion]);

  const handleToggle = useCallback(() => {
    setIsCollapsing(!open);
    setTimeout(() => {
      setOpen(prev => !prev);
      setIsCollapsing(false);
    }, 150);
  }, [open, setOpen]);

  // Dynamic background calculation
  const dynamicBackground = useMemo(() => {
    if (!isDarkMode) {
      // Professional white background in light mode
      return {
        background: open ? '#ffffff' : 'rgba(255,255,255,0.95)',
        backdropFilter: open ? 'blur(4px) saturate(120%)' : 'blur(8px) saturate(110%)',
        borderRight: `1px solid rgba(226, 232, 240, ${open ? 1 : 0.8})`,
        boxShadow: `0 25px 50px -12px rgba(0,0,0,${open ? 0.06 : 0.1}), 0 1px 2px rgba(0,0,0,0.04)`
      };
    }
    // Subtle gradient for dark mode
    const baseOpacity = open ? 0.15 : 0.2;
    return {
      background: `linear-gradient(145deg, 
        rgba(23,23,23, ${baseOpacity}), 
        rgba(38,38,38, ${baseOpacity - 0.05}), 
        rgba(64,64,64, ${baseOpacity - 0.1})
      )`,
      backdropFilter: `blur(${open ? 32 : 24}px) saturate(${open ? 200 : 180}%)`,
      borderRight: `1px solid rgba(64,64,64, ${open ? 0.3 : 0.4})`,
      boxShadow: `0 25px 50px -12px rgba(0,0,0,${open ? 0.4 : 0.5}), 0 0 0 1px rgba(255,255,255,${open ? 0.05 : 0.08}), inset 0 1px 0 rgba(255,255,255,${open ? 0.1 : 0.15}), inset 0 -1px 0 rgba(64,64,64,${open ? 0.2 : 0.25})`
    };
  }, [open, isDarkMode]);

  return (
    <>
      {/* Backdrop overlay to prevent content overlap */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        onMouseMove={handleMouseMove}
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col ${open ? 'overflow-hidden' : 'overflow-visible'} z-50 select-none ${
          isCollapsing ? 'pointer-events-none' : ''
        }`}
        style={{
          ...dynamicBackground,
          width: open ? 320 : 88
        }}
        animate={{
          width: open ? 320 : 88
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        initial={false}
      >
      {/* Enhanced ambient background effects */}
      <motion.div
        className="absolute inset-0"
        animate={{ 
          opacity: open ? (isDarkMode ? 0.3 : 0) : (isDarkMode ? 0.1 : 0),
          scale: open ? 1 : 0.4,
          x: open ? 0 : -30,
          scaleX: open ? 1 : 0.3
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        style={{
          background: !prefersReducedMotion 
            ? `radial-gradient(${open ? '800px' : '200px'} circle at ${mouseSpringX}px ${mouseSpringY}px, 
                ${isDarkMode 
                  ? `rgba(64, 64, 64, ${open ? '0.2' : '0.08'}), rgba(96, 96, 96, ${open ? '0.15' : '0.05'})` 
                  : `rgba(59, 130, 246, ${open ? '0.15' : '0.06'}), rgba(147, 197, 253, ${open ? '0.1' : '0.03'})`
                }, 
                transparent 60%)`
            : `radial-gradient(300px circle at 50% 50%, ${
                isDarkMode 
                  ? 'rgba(64, 64, 64, 0.08)' 
                  : 'rgba(59, 130, 246, 0.08)'
              }, transparent 60%)`,
          transformOrigin: 'center center'
        }}
      />
      
      {/* Gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{ 
          opacity: open ? (isDarkMode ? 0.15 : 0) : (isDarkMode ? 0.05 : 0),
          scaleY: open ? 1 : 0.3,
          y: open ? 0 : 20,
          scaleX: open ? 1 : 0.4
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        style={{
          background: `linear-gradient(180deg, 
            ${isDarkMode 
              ? `rgba(64, 64, 64, ${open ? '0.12' : '0.04'}) 0%, rgba(96, 96, 96, ${open ? '0.08' : '0.02'}) 50%` 
              : `rgba(59, 130, 246, ${open ? '0.12' : '0.04'}) 0%, rgba(147, 197, 253, ${open ? '0.08' : '0.02'}) 50%`
            }, 
            transparent 100%)`,
          transformOrigin: 'top center'
        }}
      />
      
      {/* Header with enhanced toggle button */}
      <motion.div 
        className={`relative flex items-center justify-center border-b ${
          isDarkMode ? 'border-gray-600/30' : 'border-slate-200/20'
        }`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          paddingLeft: open ? 24 : 12,
          paddingRight: open ? 24 : 12,
          paddingTop: 20,
          paddingBottom: 20
        }}
        transition={{ 
          delay: 0.1, 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
      >
    

        {/* Enhanced toggle button */}
        <motion.button
          onClick={handleToggle}
          className={`relative group p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 focus:outline-none focus:ring-2 ${
            isDarkMode 
              ? 'bg-white/10 border-gray-600/40 hover:border-gray-500/60 focus:ring-gray-400/50' 
              : 'bg-white/15 border-slate-200/30 hover:border-slate-300/50 focus:ring-slate-400/50'
          }`}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
            rotate: 5
          }}
          whileTap={{ scale: 0.95 }}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' 
                : 'bg-gradient-to-r from-slate-300/20 to-gray-300/20'
            }`}
            initial={false}
          />
          
          <motion.div
            animate={{ rotate: open ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`relative z-10 transition-colors ${
              isDarkMode 
                ? 'text-gray-300 group-hover:text-white' 
                : 'text-slate-600 group-hover:text-slate-800'
            }`}
          >
            <FiChevronLeft size={20} />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Search bar */}
      <motion.div
        animate={{ 
          paddingLeft: open ? 20 : 12,
          paddingRight: open ? 20 : 12,
          paddingTop: 16
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
      >
        {/* SearchBar removed to save space for main components */}
      </motion.div>

      {/* Main navigation */}
      <motion.nav 
        className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent"
        animate={{ 
          paddingLeft: open ? 20 : 12,
          paddingRight: open ? 20 : 12,
          paddingBottom: 20
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? 'rgba(156, 163, 175, 0.5) transparent' : 'rgba(156, 163, 175, 0.3) transparent'
        }}
      >
        {navLinks.map((link, index) => {
          const isActiveLink = isActive(link.to);
          return (
            <motion.div
              key={link.to}
              variants={itemVariants}
              className="relative"
              onHoverStart={() => setHoveredItem(link.to)}
              onHoverEnd={() => setHoveredItem(null)}
              initial={false}
            >
              <motion.button
                type="button"
                onClick={() => navigate(link.to)}
                className={`
                  group relative w-full flex items-center p-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50
                  ${isActiveLink 
                    ? 'bg-gradient-to-r ' + link.gradient + ' text-white shadow-2xl' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
                  }
                `}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { type: 'spring', stiffness: 400, damping: 30 }
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: isActiveLink 
                    ? `0 12px 40px ${link.shadowColor}, 0 0 0 1px rgba(255, 255, 255, 0.1)` 
                    : undefined
                }}
                aria-current={isActiveLink ? 'page' : undefined}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActiveLink && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-2xl bg-white/10"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon with enhanced hover effects */}
                <motion.div
                  className={`
                    relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                    ${isActiveLink 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-white/5 group-hover:bg-white/15'
                    }
                  `}
                  whileHover={{ 
                    rotate: isActiveLink ? 10 : 5,
                    scale: 1.1,
                    transition: { type: 'spring', stiffness: 400 }
                  }}
                >
                  <span className="text-xl relative">
                    {link.icon}
                    <Badge type={link.badge} count={typeof link.badge === 'number' ? link.badge : null} />
                  </span>
                </motion.div>

                {/* Label and description */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      variants={itemVariants}
                      className="ml-4 flex-1 text-left"
                    >
                      <div className="font-bold text-base tracking-wide">
                        {link.label}
                      </div>
                      <div className={`text-sm mt-1 transition-colors ${
                        isActiveLink ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-600'
                      }`}>
                        {link.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover glow effect */}
                <AnimatePresence>
                  {hoveredItem === link.to && !isActiveLink && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/15"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Premium tooltip for collapsed state */}

            </motion.div>
          );
        })}

       
        {/* Premium divider with animated gradient */}
        <motion.div
          variants={itemVariants}
          className="my-8 relative"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />
          <motion.div
            className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
            animate={{ 
              scaleX: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 2
            }}
          />
        </motion.div>

        {/* Enhanced Manager Portal (hidden for non-manager/admin) */}
        {['manager', 'admin'].includes(user?.role) && (
        <motion.div 
          variants={itemVariants} 
          className="relative"
          onHoverStart={() => setHoveredItem('manager-portal')}
          onHoverEnd={() => setHoveredItem(null)}
        >
          <motion.button
            type="button"
            onClick={() => {
              if (!open) {
                // When sidebar is closed, redirect to team management
                navigate('/manager-dashboard?tab=team-management');
              } else {
                // When sidebar is open, toggle dropdown
                setManagerDropdown(prev => !prev);
              }
            }}
            className={`
              group relative w-full flex items-center p-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50
              ${isManagerDashboard 
                ? 'bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 text-white shadow-2xl' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
              }
            `}
            whileHover={{ 
              scale: 1.02, 
              y: -2,
              transition: { type: 'spring', stiffness: 400, damping: 30 }
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: isManagerDashboard 
                ? '0 12px 40px rgba(71, 85, 105, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                : undefined
            }}
            aria-haspopup="true"
            aria-expanded={managerDropdown}
          >
            {/* Special animated background for manager portal */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-400/10 to-gray-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={{
                opacity: managerDropdown ? [0.3, 0.6, 0.3] : 0,
                scale: managerDropdown ? [1, 1.02, 1] : 1
              }}
              transition={{
                duration: 2,
                repeat: managerDropdown ? Infinity : 0,
                ease: "easeInOut"
              }}
            />

            <motion.div
              className={`
                relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                ${isManagerDashboard 
                  ? 'bg-white/20 shadow-lg' 
                  : 'bg-white/5 group-hover:bg-white/15'
                }
              `}
              whileHover={{ 
                rotate: 15,
                scale: 1.1,
                transition: { type: 'spring', stiffness: 400 }
              }}
            >
              <FiBriefcase className="text-xl" />
              {/* Crown icon for manager */}
              <motion.div
                className="absolute -top-1 -right-1 text-yellow-400"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiStar size={12} />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {open && (
                <motion.div
                  variants={itemVariants}
                  className="ml-4 flex-1 text-left"
                >
                  <div className="font-bold text-base tracking-wide flex items-center justify-between">
                    Manager Portal
                    <motion.div
                      animate={{ rotate: managerDropdown ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <FiChevronRight className="text-sm" />
                    </motion.div>
                  </div>
                  <div className={`text-sm mt-1 transition-colors ${
                    isManagerDashboard ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-600'
                  }`}>
                    Leadership tools & insights
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Enhanced dropdown menu with better positioning */}
          <AnimatePresence>
            {managerDropdown && (
              <motion.div
                initial={{ 
                  opacity: 0, 
                  y: -20, 
                  scale: 0.95,
                  filter: 'blur(4px)'
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  filter: 'blur(0px)'
                }}
                exit={{ 
                  opacity: 0, 
                  y: -20, 
                  scale: 0.95,
                  filter: 'blur(4px)'
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
                className={`
                  absolute ${
                    open 
                      ? 'left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto' 
                      : 'left-full ml-6 top-0 w-80 max-h-80 overflow-y-auto'
                  } 
                  backdrop-blur-2xl rounded-2xl border shadow-2xl z-50 p-3 ${
                    isDarkMode ? 'border-gray-600/40' : 'border-slate-200/30'
                  }
                  scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent
                `}
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))',
                  boxShadow: isDarkMode
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkMode ? 'rgba(156, 163, 175, 0.6) transparent' : 'rgba(156, 163, 175, 0.4) transparent'
                }}
              >
                <div className="space-y-2">
                  {managerPortalSubtasks.map((item, index) => (
                    <motion.button
                      key={item.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        transition: { delay: index * 0.05 }
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => {
                        navigate(item.to);
                        setManagerDropdown(false);
                      }}
                      className={`w-full flex items-center p-4 rounded-2xl text-left transition-all duration-200 group ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                          : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        y: -1,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white shadow-lg relative`}
                        whileHover={{ 
                          rotate: 8,
                          scale: 1.1,
                          transition: { type: 'spring', stiffness: 400 }
                        }}
                      >
                        {item.icon}
                        {item.status === 'urgent' && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                        {item.badge && (
                          <Badge type="urgent" count={item.badge} className="absolute -top-1 -right-1" />
                        )}
                      </motion.div>
                      <div className="ml-4 flex-1">
                        <div className="font-bold text-sm flex items-center justify-between">
                          {item.label}
                          {item.status === 'active' && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">
                              Active
                            </span>
                          )}
                        </div>
                        <div className={`text-xs mt-1 transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 group-hover:text-gray-300' 
                            : 'text-slate-500 group-hover:text-slate-600'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manager Portal tooltip for collapsed state */}
          {!open && (
            <AnimatePresence>
              {hoveredItem === 'manager-portal' && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.9 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 30,
                    duration: 0.2 
                  }}
                  className="absolute left-full ml-6 top-1/2 -translate-y-1/2 z-[60] pointer-events-none"
                >
                  <div className="bg-gray-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10">
                    <div className="font-bold text-sm whitespace-nowrap flex items-center">
                      Manager Portal
                      <FiStar className="ml-2 text-yellow-400" size={12} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">Leadership tools & insights</div>
                    {/* Enhanced tooltip arrow with glow */}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-l border-b border-white/10 shadow-lg" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
        )}
      </motion.nav>

      {/* Enhanced footer section */}
      <motion.div 
        className="border-t border-slate-200/20 backdrop-blur-sm"
        animate={{ 
          paddingLeft: open ? 20 : 12,
          paddingRight: open ? 20 : 12,
          paddingTop: 20,
          paddingBottom: 20
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
      >
        {/* Quick actions and theme toggle - removed to save space for main components */}

        {/* Enhanced user profile */}
        <UserProfile 
          open={open}
          user={user}
          isDarkMode={isDarkMode}
          onLogout={() => console.log('Logout')}
        />
      </motion.div>

             {/* Floating elements for extra premium feel */}
       <motion.div
         animate={{
           y: [-3, 3, -3],
           scale: open ? 1 : 0.5,
           opacity: open ? (isDarkMode ? 0.3 : 0.4) : (isDarkMode ? 0.1 : 0.2),
           x: open ? 0 : -10
         }}
         transition={{
           y: {
             duration: 6,
             repeat: Infinity,
             ease: "easeInOut"
           },
           scale: { type: 'spring', stiffness: 400, damping: 40 },
           opacity: { type: 'spring', stiffness: 400, damping: 40 },
           x: { type: 'spring', stiffness: 400, damping: 40 }
         }}
         className={`absolute top-1/3 left-1/2 rounded-full blur-3xl pointer-events-none ${
           isDarkMode 
             ? 'bg-gradient-to-r from-gray-400/10 to-slate-400/10' 
             : 'bg-gradient-to-r from-blue-400/10 to-purple-400/10'
         }`}
         style={{ 
           transform: 'translate(-50%, -50%)',
           width: open ? 160 : 60,
           height: open ? 160 : 60
         }}
       />

             {/* Secondary floating element */}
       <motion.div
         animate={{
           y: [3, -3, 3],
           x: [-2, 2, -2],
           scale: open ? 1 : 0.3,
           opacity: open ? (isDarkMode ? 0.2 : 0.3) : (isDarkMode ? 0.05 : 0.1),
         }}
         transition={{
           y: {
             duration: 8,
             repeat: Infinity,
             ease: "easeInOut"
           },
           x: {
             duration: 5,
             repeat: Infinity,
             ease: "easeInOut"
           },
           scale: { type: 'spring', stiffness: 400, damping: 40 },
           opacity: { type: 'spring', stiffness: 400, damping: 40 }
         }}
         className={`absolute bottom-1/4 right-1/4 rounded-full blur-2xl pointer-events-none ${
           isDarkMode 
             ? 'bg-gradient-to-r from-slate-400/10 to-gray-400/10' 
             : 'bg-gradient-to-r from-pink-400/10 to-orange-400/10'
         }`}
         style={{ 
           width: open ? 120 : 40,
           height: open ? 120 : 40
         }}
       />
      </motion.aside>
    </>
  );
}
