import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiHome, FiCalendar, FiList, FiAward, FiUser, FiChevronLeft,
  FiChevronRight, FiBriefcase, FiUsers, FiClipboard, FiClock,
  FiBell, FiUserPlus, FiSettings, FiLogOut, FiSun, FiMoon,
  FiTrendingUp, FiShield, FiZap, FiHeart, FiSearch, FiStar,
  FiActivity, FiBookmark, FiCpu, FiDatabase, FiFolder, FiCheckSquare, FiX,
  FiMessageSquare, FiFileText, FiTarget, FiGrid, FiBarChart2, FiArchive
} from 'react-icons/fi';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';



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
        hoverBg: 'hover:bg-blue-50',
        activeBg: 'bg-blue-100',
        activeText: 'text-blue-700',
        activeBorder: 'border-blue-500',
        iconBg: 'bg-blue-500',
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
        hoverBg: 'hover:bg-purple-50',
        activeBg: 'bg-purple-100',
        activeText: 'text-purple-700',
        activeBorder: 'border-purple-500',
        iconBg: 'bg-purple-500',
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
        hoverBg: 'hover:bg-orange-50',
        activeBg: 'bg-orange-100',
        activeText: 'text-orange-700',
        activeBorder: 'border-orange-500',
        iconBg: 'bg-orange-500',
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
        hoverBg: 'hover:bg-green-50',
        activeBg: 'bg-green-100',
        activeText: 'text-green-700',
        activeBorder: 'border-green-500',
        iconBg: 'bg-green-500',
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
        hoverBg: 'hover:bg-yellow-50',
        activeBg: 'bg-yellow-100',
        activeText: 'text-yellow-700',
        activeBorder: 'border-yellow-500',
        iconBg: 'bg-yellow-500',
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
        hoverBg: 'hover:bg-red-50',
        activeBg: 'bg-red-100',
        activeText: 'text-red-700',
        activeBorder: 'border-red-500',
        iconBg: 'bg-red-500',
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
        hoverBg: 'hover:bg-pink-50',
        activeBg: 'bg-pink-100',
        activeText: 'text-pink-700',
        activeBorder: 'border-pink-500',
        iconBg: 'bg-pink-500',
        iconText: 'text-white'
      }
    },
  ];

  // Add Manager Portal as a single tab for managers (no dropdown)
  if (['manager', 'admin'].includes(user?.role)) {
    const managerPortalLink = {
      to: '/manager-dashboard?tab=team-management',
      icon: <FiBriefcase />,
      label: 'Manager Portal',
      description: 'Leadership tools & insights',
      badge: counts.teamMembers > 0 ? counts.teamMembers : null,
      isManager: true,
      colors: {
        gradient: 'from-indigo-400 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50',
        activeBg: 'bg-indigo-100',
        activeText: 'text-indigo-700',
        activeBorder: 'border-indigo-500',
        iconBg: 'bg-indigo-500',
        iconText: 'text-white'
      }
    };

    // Insert divider before manager portal
    return [...baseLinks, { isDivider: true }, managerPortalLink];
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

// Tooltip Component for collapsed sidebar
const Tooltip = ({ show, label, colors }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className={`
            px-3 py-2 rounded-lg text-sm font-medium text-white shadow-lg
            bg-gradient-to-r ${colors.gradient}
            border border-white/20 backdrop-blur-sm
          `}>
            {label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2
                      bg-inherit border-t border-l border-white/20 rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced User Profile Component with glassmorphism
const UserProfile = ({ open, user, onLogout }) => {
  return (
    <div className="flex items-center p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/60">
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg">
        <FiUser size={18} />
        {/* Glass reflection on avatar */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={textAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 flex-1"
          >
            <div className="font-semibold text-base text-slate-900 truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-sm text-slate-600 truncate opacity-80">
              {user?.role || 'Member'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.button
            variants={textAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onLogout}
            className="p-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/50 transition-all duration-200"
          >
            <FiLogOut size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// Modern simplified sidebar component
export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

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

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col z-50 transition-all duration-300 ease-in-out"
          style={{ width: open ? 320 : 100 }}>

      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-xl border-r border-white/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />

      {/* Animated glass reflection */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform skew-y-12" />
      </div>

      {/* Main navigation container */}
      <nav className="relative flex-1 px-4 py-6 space-y-3 overflow-y-auto">
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
                onClick={() => link.to && navigate(link.to)}
                className={`
                  w-full flex items-center px-4 py-4 rounded-2xl transition-all duration-300 relative group
                  backdrop-blur-sm border border-white/20
                  ${isActiveLink
                    ? `${link.colors.activeBg} ${link.colors.activeText} border-l-4 ${link.colors.activeBorder} shadow-lg`
                    : `${link.colors.hoverBg} text-slate-700 hover:scale-105 hover:shadow-md`
                  }
                `}
                onMouseEnter={() => setHoveredItem(link.to || index)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  background: isActiveLink
                    ? `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`
                    : `linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))`
                }}
              >
                {/* Enhanced icon container */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
                  ${isActiveLink
                    ? `${link.colors.iconBg} ${link.colors.iconText} shadow-lg scale-110`
                    : `bg-white/80 text-slate-600 group-hover:scale-105 group-hover:shadow-md`
                  }
                `}>
                  <span className="text-xl relative">
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
                      <div className={`font-semibold text-base leading-none ${
                        isActiveLink ? link.colors.activeText : 'text-slate-800'
                      }`}>
                        {link.label}
                      </div>
                      <div className="text-sm text-slate-600 mt-1 leading-none opacity-80">
                        {link.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover glow effect */}
                {hoveredItem === (link.to || index) && !isActiveLink && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20"
                    style={{ backgroundImage: `linear-gradient(135deg, ${link.colors.gradient.split(' ')[1].replace('to-', '')}, ${link.colors.gradient.split(' ')[3]})` }}
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
                  />
                )}
              </button>
            </div>
          );
        })}

        {/* Chat Portal - Always visible */}
        <div className="relative">
          <button
            onClick={() => navigate('/chat')}
            className={`
              w-full flex items-center px-4 py-4 rounded-2xl transition-all duration-300 relative group
              backdrop-blur-sm border border-white/20
              ${location.pathname === '/chat'
                ? 'bg-cyan-100 text-cyan-700 border-l-4 border-cyan-500 shadow-lg'
                : 'hover:bg-cyan-50 text-slate-700 hover:scale-105 hover:shadow-md'
              }
            `}
            onMouseEnter={() => setHoveredItem('chat')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: location.pathname === '/chat'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))'
            }}
          >
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
              ${location.pathname === '/chat'
                ? 'bg-cyan-500 text-white shadow-lg scale-110'
                : 'bg-white/80 text-slate-600 group-hover:scale-105 group-hover:shadow-md'
              }
            `}>
              <span className="text-xl relative">
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
                  <div className={`font-semibold text-base leading-none ${
                    location.pathname === '/chat' ? 'text-cyan-700' : 'text-slate-800'
                  }`}>
                    Chat
                  </div>
                  <div className="text-sm text-slate-600 mt-1 leading-none opacity-80">
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
              />
            )}
          </button>
        </div>
      </nav>

      {/* Enhanced user profile section with glass effect */}
      <div className="relative border-t border-white/20 p-4">
        <div className="bg-white/30 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
          <UserProfile
            open={open}
            user={user}
            onLogout={() => console.log('Logout')}
          />
        </div>
      </div>
    </aside>
  );
}
