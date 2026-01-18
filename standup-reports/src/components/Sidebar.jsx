import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiHome, FiCalendar, FiList, FiAward, FiUser, FiChevronLeft,
  FiChevronRight, FiBriefcase, FiUsers, FiClipboard, FiClock,
  FiBell, FiUserPlus, FiSettings, FiLogOut, FiSun, FiMoon,
  FiTrendingUp, FiShield, FiZap, FiHeart, FiSearch, FiStar,
  FiActivity, FiBookmark, FiCpu, FiDatabase, FiFolder, FiCheckSquare, FiX,
  FiMessageSquare, FiFileText, FiTarget, FiGrid, FiBarChart2, FiArchive, FiCreditCard
} from 'react-icons/fi';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import ThemeToggle from './shared/ThemeToggle';
import { useTheme } from '../context/ThemeContext';



// Enhanced navigation configuration with unique colors for each tab
const createNavLinks = (counts, user) => {
  const baseLinks = [
    {
      to: '/dashboard',
      icon: <FiHome />,
      label: 'Dashboard',
      description: 'Overview & Analytics',
      badge: null,
      colors: {
        gradient: 'from-blue-400 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
        activeBg: 'bg-blue-100 dark:bg-blue-900/40',
        activeText: 'text-blue-700 dark:text-blue-400',
        activeBorder: 'border-blue-500',
        iconBg: 'bg-blue-500 dark:bg-blue-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/standup-reports',
      icon: <FiFileText />,
      label: 'Standups',
      description: 'Daily Updates',
      badge: null,
      colors: {
        gradient: 'from-indigo-400 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
        activeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        activeText: 'text-indigo-700 dark:text-indigo-400',
        activeBorder: 'border-indigo-500',
        iconBg: 'bg-indigo-500 dark:bg-indigo-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/tasks',
      icon: <FiList />,
      label: 'Tasks',
      description: 'Project Workflow',
      badge: counts.tasks,
      colors: {
        gradient: 'from-purple-400 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        activeBg: 'bg-purple-100 dark:bg-purple-900/40',
        activeText: 'text-purple-700 dark:text-purple-400',
        activeBorder: 'border-purple-500',
        iconBg: 'bg-purple-500 dark:bg-purple-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/projects',
      icon: <FiFolder />,
      label: 'Projects',
      description: 'View assigned projects',
      badge: counts.projects,
      colors: {
        gradient: 'from-orange-400 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-white/10',
        activeBg: 'bg-orange-100 dark:bg-orange-900/40',
        activeText: 'text-orange-700 dark:text-orange-400',
        activeBorder: 'border-orange-500',
        iconBg: 'bg-orange-500 dark:bg-orange-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/leave-calendar',
      icon: <FiCalendar />,
      label: 'Leave Calendar',
      description: 'Time Management',
      badge: counts.leaveRequests > 0 ? counts.leaveRequests : null,
      colors: {
        gradient: 'from-green-400 to-green-600',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
        activeBg: 'bg-green-100 dark:bg-green-900/40',
        activeText: 'text-green-700 dark:text-green-400',
        activeBorder: 'border-green-500',
        iconBg: 'bg-green-500 dark:bg-green-600',
        iconText: 'text-white'
      }
    },

    {
      to: '/notifications',
      icon: <FiBell />,
      label: 'Notifications',
      description: 'Stay updated',
      badge: counts.notifications,
      colors: {
        gradient: 'from-red-400 to-red-600',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        activeBg: 'bg-red-100 dark:bg-red-900/40',
        activeText: 'text-red-700 dark:text-red-400',
        activeBorder: 'border-red-500',
        iconBg: 'bg-red-500 dark:bg-red-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/notes',
      icon: <FiFileText />,
      label: 'Quick Notes',
      description: 'Personal notes & ideas',
      badge: null,
      colors: {
        gradient: 'from-pink-400 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
        activeBg: 'bg-pink-100 dark:bg-pink-900/40',
        activeText: 'text-pink-700 dark:text-pink-400',
        activeBorder: 'border-pink-500',
        iconBg: 'bg-pink-500 dark:bg-pink-600',
        iconText: 'text-white'
      }
    },
    {
      to: '/achievements',
      icon: <FiAward />,
      label: 'Achievements',
      description: 'Recognition & Goals',
      badge: counts.achievements > 0 ? 'new' : null,
      colors: {
        gradient: 'from-yellow-400 to-yellow-600',
        hoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        activeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        activeText: 'text-yellow-700 dark:text-yellow-400',
        activeBorder: 'border-yellow-500',
        iconBg: 'bg-yellow-500 dark:bg-yellow-600',
        iconText: 'text-white'
      }
    },
  ];

  // Add Manager Portal as a single tab for managers (no dropdown)
  if (['manager', 'admin'].includes(user?.role)) {
    const extraLinks = [];

    // Divider and Manager Portal for both Managers and Admins
    extraLinks.push({ isDivider: true });

    const managerPortalLink = {
      to: '/manager-dashboard?tab=team-management',
      icon: <FiBriefcase />,
      label: 'Manager Portal',
      description: 'Leadership tools & insights',
      badge: counts.teamMembers > 0 ? counts.teamMembers : null,
      isManager: true,
      colors: {
        gradient: 'from-indigo-400 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
        activeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        activeText: 'text-indigo-700 dark:text-indigo-400',
        activeBorder: 'border-indigo-500',
        iconBg: 'bg-indigo-500 dark:bg-indigo-600',
        iconText: 'text-white'
      }
    };
    extraLinks.push(managerPortalLink);

    // Billing ONLY for Admins
    if (user?.role === 'admin') {
      const subscriptionLink = {
        to: '/subscription',
        icon: <FiCreditCard />,
        label: 'Billing & Plans',
        description: 'Manage subscription',
        badge: null,
        isManager: true,
        colors: {
          gradient: 'from-emerald-400 to-teal-600',
          hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
          activeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          activeText: 'text-emerald-700 dark:text-emerald-400',
          activeBorder: 'border-emerald-500',
          iconBg: 'bg-emerald-500 dark:bg-emerald-600',
          iconText: 'text-white'
        }
      };
      extraLinks.push(subscriptionLink);
    }

    return [...baseLinks, ...extraLinks];
  }

  return baseLinks;
};

// Simplified animation configurations
const smoothTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const textAnimationVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ...smoothTransition,
      delay: 0.1
    }
  },
  hidden: {
    opacity: 0,
    x: -10,
    transition: smoothTransition
  }
};

// Enhanced Badge Component
const Badge = ({ count, className = "" }) => {
  if (typeof count === 'number' && count > 0) {
    return (
      <span
        className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium ${className}`}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  if (count === 'new') {
    return (
      <span
        className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ${className}`}
      />
    );
  }

  return null;
};

// Enhanced Tooltip Component for collapsed sidebar - Portal-based
const Tooltip = ({ show, label, colors, elementRef }) => {
  // Disable tooltips on mobile
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate position based on element reference
  useEffect(() => {
    if (show && elementRef?.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const sidebarWidth = elementRef.current.closest('aside')?.offsetWidth || 100;

      setPosition({
        x: rect.right + 8, // 8px offset from sidebar edge (moved closer)
        y: rect.top + rect.height / 2 - 12 // 12px higher than center
      });
    }
  }, [show, elementRef]);

  const tooltipContent = show ? (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed z-[60] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)'
      }}
    >
      {/* Clean tooltip with glassmorphism - no arrow */}
      <div className={`
        px-3 py-2 rounded-xl text-sm font-medium text-white shadow-xl
        bg-gradient-to-r ${colors.gradient} bg-opacity-80
        border border-white/20 backdrop-blur-lg
        relative overflow-hidden
      `}>
        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />

        {/* Content */}
        <span className="relative z-10">{label}</span>

        {/* Subtle glow effect */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-r ${colors.gradient}
          opacity-20 blur-sm
        `} />
      </div>
    </motion.div>
  ) : null;

  // Use React Portal to render tooltip at document body level
  return createPortal(
    <AnimatePresence>
      {tooltipContent}
    </AnimatePresence>,
    document.body
  );
};


// Modern simplified sidebar component
export default function Sidebar({ mode, setMode, user }) {
  const { theme, themeMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isDark = theme === 'dark';

  const open = mode === 'expanded';

  // Real-time counts state
  const [counts, setCounts] = useState({
    tasks: 0,
    notifications: 0,
    leaveRequests: 0,
    projects: 0,
    achievements: 0,
    teamMembers: 0,
    reports: 0,
    unreadMessages: 0
  });

  // Fetch counts function
  const fetchCounts = useCallback(async () => {
    if (!user || !user.id) return;

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

      // Fetch unread messages count
      try {
        const { data: conversationsData } = await supabase
          .from('chat_conversation_list')
          .select('unread_count')
          .eq('participant_user_id', user.id);

        countsData.unreadMessages = conversationsData?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
      } catch (err) {
        // If chat tables don't exist yet, set to 0
        countsData.unreadMessages = 0;
      }

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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const prefersReducedMotion = useReducedMotion();

  // Create refs for navigation items to position tooltips
  const navItemRefs = useRef({});

  const getSidebarWidth = () => {
    if (mode === 'hidden') return 0;
    if (mode === 'collapsed') return 100;
    return 272;
  };

  const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);

  return (
    <aside className="fixed top-14 md:top-16 left-0 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] flex flex-col z-50 transition-all duration-300 ease-in-out"
      style={{
        width: getSidebarWidth(),
        transform: mode === 'hidden' ? 'translateX(-100%)' : 'translateX(0)',
        opacity: mode === 'hidden' ? 0 : 1
      }}>

      {/* Ultra-transparent glassmorphism - Only show for non-premium themes */}
      {!isPremiumTheme && (
        <>
          <div className="absolute inset-0 bg-white/[0.02] dark:bg-slate-950/[0.05] backdrop-blur-sm border-r border-white/5 dark:border-white/[0.03]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.02] dark:from-slate-800/[0.02] dark:to-slate-900/[0.02]" />

          {/* Animated glass reflection - ultra subtle */}
          <div className="absolute inset-0 opacity-5 dark:opacity-[0.02]">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] dark:via-slate-700/[0.02] to-transparent transform skew-y-12" />
          </div>
        </>
      )}




      <nav className="relative flex-1 px-4 py-2 space-y-3 overflow-y-auto custom-scrollbar">
        {navLinks.map((link, index) => {
          if (link.isDivider) {
            return (
              <div key="divider" className="my-6 px-3">
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            );
          }

          const isActiveLink = link.to ? isActive(link.to) : false;

          return (
            <div key={link.to || index} className="relative">
              <button
                ref={(el) => { navItemRefs.current[link.to || index] = el; }}
                onClick={() => {
                  link.to && navigate(link.to);
                  if (window.innerWidth < 1024) setMode('hidden');
                }}
                className={`
                  w-full flex items-center ${open ? 'px-3 py-3' : 'px-4 py-4'} rounded-2xl transition-all duration-300 relative group
                  backdrop-blur-sm border border-white/10 dark:border-white/5
                  ${isActiveLink
                    ? `${link.colors.activeBg} ${link.colors.activeText} border-l-4 ${link.colors.activeBorder} shadow-lg dark:shadow-${link.colors.iconBg.split('-')[1]}-900/20`
                    : `${link.colors.hoverBg} text-slate-800 dark:text-slate-200 hover:scale-105 hover:shadow-md dark:hover:text-white`
                  }
                `}
                onMouseEnter={() => setHoveredItem(link.to || index)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  background: isActiveLink
                    ? (isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.4))' : 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))')
                    : (isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.1), rgba(15, 23, 42, 0.2))' : 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))')
                }}
              >
                {/* Enhanced icon container */}
                <div className={`
                  flex items-center justify-center ${open ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl transition-all duration-300
                  ${isActiveLink
                    ? `${link.colors.iconBg} ${link.colors.iconText} shadow-lg scale-110`
                    : `bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:scale-105 group-hover:shadow-md`
                  }
                `}>
                  <span className={`${open ? 'text-lg' : 'text-xl'} relative transition-all duration-300`}>
                    {link.icon}
                    <Badge count={link.badge} />
                  </span>
                </div>

                {/* Text content with smooth animation */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      variants={textAnimationVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="ml-4 flex-1 text-left"
                    >
                      <div className={`font-semibold ${open ? 'text-sm' : 'text-base'} leading-none transition-all duration-300 ${isActiveLink ? link.colors.activeText : 'text-slate-900 dark:text-gray-100'
                        }`}>
                        {link.label}
                      </div>
                      <div className={`${open ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-gray-300 mt-1 leading-none opacity-90 transition-all duration-300`}>
                        {link.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover glow effect - Matching chat tab style */}
                {hoveredItem === (link.to || index) && !isActiveLink && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${link.colors.gradient} opacity-20`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Tooltip for collapsed state */}
                {!open && (
                  <Tooltip
                    show={hoveredItem === (link.to || index)}
                    label={link.label}
                    colors={link.colors}
                    elementRef={{ current: navItemRefs.current[link.to || index] }}
                  />
                )}
              </button>
            </div>
          );
        })}

        {/* Chat Portal - Always visible */}
        <div className="relative">
          <button
            ref={(el) => { navItemRefs.current['chat'] = el; }}
            onClick={() => {
              navigate('/chat');
              if (window.innerWidth < 1024) setMode('hidden');
            }}
            className={`
              w-full flex items-center ${open ? 'px-3 py-3' : 'px-4 py-4'} rounded-2xl transition-all duration-300 relative group
              backdrop-blur-sm border border-white/10 dark:border-white/5
              ${location.pathname === '/chat'
                ? 'bg-cyan-100/50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-l-4 border-cyan-500 shadow-lg dark:shadow-cyan-900/20'
                : 'hover:bg-cyan-50/50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200 hover:scale-105 hover:shadow-md dark:hover:text-cyan-400'
              }
            `}
            onMouseEnter={() => setHoveredItem('chat')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: location.pathname === '/chat'
                ? (isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.4))' : 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))')
                : (isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.1), rgba(15, 23, 42, 0.2))' : 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))')
            }}
          >
            <div className={`
              flex items-center justify-center ${open ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl transition-all duration-300
              ${location.pathname === '/chat'
                ? 'bg-cyan-500 text-white shadow-lg scale-110'
                : 'bg-white/80 text-slate-600 group-hover:scale-105 group-hover:shadow-md'
              }
            `}>
              <span className={`${open ? 'text-lg' : 'text-xl'} relative transition-all duration-300`}>
                <FiMessageSquare />
                {counts.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                    {counts.unreadMessages > 9 ? '9+' : counts.unreadMessages}
                  </span>
                )}
              </span>
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  variants={textAnimationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="ml-4 flex-1 text-left"
                >
                  <div className={`font-semibold ${open ? 'text-sm' : 'text-base'} leading-none transition-all duration-300 ${location.pathname === '/chat' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-900 dark:text-gray-100'
                    }`}>
                    Chat
                  </div>
                  <div className={`${open ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-gray-300 mt-1 leading-none opacity-90 transition-all duration-300`}>
                    Team messaging & DMs
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hover glow effect */}
            {hoveredItem === 'chat' && location.pathname !== '/chat' && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-600 opacity-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Tooltip for collapsed state */}
            {!open && (
              <Tooltip
                show={hoveredItem === 'chat'}
                label="Chat"
                colors={{
                  gradient: 'from-cyan-400 to-cyan-600'
                }}
                elementRef={{ current: navItemRefs.current['chat'] }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* Love Footer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="p-4 pb-6 text-center"
          >
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold tracking-widest flex items-center justify-center gap-1.5 uppercase">
              Made with <FiHeart className="w-3 h-3 text-rose-500 fill-current animate-pulse" /> by Akhil Billowria
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
