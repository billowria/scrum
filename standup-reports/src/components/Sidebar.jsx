import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiHome, FiCalendar, FiList, FiAward, FiUser, FiChevronLeft, 
  FiChevronRight, FiBriefcase, FiUsers, FiClipboard, FiClock, 
  FiBell, FiUserPlus, FiSettings, FiLogOut, FiSun, FiMoon,
  FiTrendingUp, FiShield, FiZap, FiHeart
} from 'react-icons/fi';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

// Enhanced navigation configuration with premium visual elements
const navLinks = [
  { 
    to: '/dashboard', 
    icon: <FiHome />, 
    label: 'Dashboard', 
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    description: 'Overview & Analytics'
  },
  { 
    to: '/leave-calendar', 
    icon: <FiCalendar />, 
    label: 'Leave Calendar', 
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    shadowColor: 'rgba(20, 184, 166, 0.5)',
    description: 'Time Management'
  },
  { 
    to: '/tasks', 
    icon: <FiList />, 
    label: 'Tasks', 
    gradient: 'from-pink-400 via-purple-500 to-indigo-600',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    description: 'Project Workflow'
  },
  { 
    to: '/achievements', 
    icon: <FiAward />, 
    label: 'Achievements', 
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    shadowColor: 'rgba(251, 146, 60, 0.5)',
    description: 'Recognition & Goals'
  },
];

const managerPortalSubtasks = [
  { 
    label: 'Team Management', 
    icon: <FiUsers />, 
    to: '/manager-dashboard?tab=team-management',
    gradient: 'from-blue-500 to-indigo-600',
    description: 'Manage team structure'
  },
  { 
    label: 'Add Member', 
    icon: <FiUserPlus />, 
    to: '/manager-dashboard?tab=add-member',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Onboard new talent'
  },
  { 
    label: 'Leave Requests', 
    icon: <FiClipboard />, 
    to: '/manager-dashboard?tab=leave-requests',
    gradient: 'from-yellow-500 to-orange-600',
    description: 'Review time-off requests'
  },
  { 
    label: 'Leave History', 
    icon: <FiClock />, 
    to: '/manager-dashboard?tab=leave-history',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Historical records'
  },
  { 
    label: 'Announcements', 
    icon: <FiBell />, 
    to: '/manager-dashboard?tab=announcements',
    gradient: 'from-red-500 to-pink-600',
    description: 'Team communications'
  },
  { 
    label: 'Report History', 
    icon: <FiList />, 
    to: '/manager-dashboard?tab=report-history',
    gradient: 'from-indigo-500 to-purple-600',
    description: 'Analytics & insights'
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
    width: 280,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.05,
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
      staggerChildren: 0.03,
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

const floatingVariants = {
  float: {
    y: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Enhanced sidebar component with premium interactions
export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [managerDropdown, setManagerDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 25, mass: 0.1 };
  const mouseSpringX = useSpring(mouseX, springConfig);
  const mouseSpringY = useSpring(mouseY, springConfig);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isManagerDashboard = location.pathname.startsWith('/manager-dashboard');

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  // Premium notification component
  const NotificationBadge = ({ count }) => (
    <motion.div
      className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {count}
    </motion.div>
  );

  return (
    <motion.aside
      animate={open ? 'expanded' : 'collapsed'}
      onMouseMove={handleMouseMove}
      className="fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col overflow-hidden z-50 select-none"
      style={{
        background: `linear-gradient(145deg, rgba(255, 255, 255, ${open ? 0.25 : 0.3}), rgba(248, 250, 252, ${open ? 0.2 : 0.25}), rgba(241, 245, 249, ${open ? 0.15 : 0.2}))`,
        backdropFilter: `blur(${open ? 32 : 24}px) saturate(${open ? 200 : 180}%)`,
        borderRight: `1px solid rgba(148, 163, 184, ${open ? 0.15 : 0.2})`,
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, ${open ? 0.08 : 0.12}),
          0 0 0 1px rgba(255, 255, 255, ${open ? 0.1 : 0.15}),
          inset 0 1px 0 rgba(255, 255, 255, ${open ? 0.3 : 0.4}),
          inset 0 -1px 0 rgba(148, 163, 184, ${open ? 0.1 : 0.15})
        `,
        width: open ? 280 : 88
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 0.8
      }}
      initial={false}
    >
      {/* Ambient background effects */}
      <motion.div
        className="absolute inset-0"
        animate={{ 
          opacity: open ? 0.3 : 0.15,
          scale: open ? 1 : 0.7
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        style={{
          background: `radial-gradient(${open ? '600px' : '250px'} circle at ${mouseSpringX}px ${mouseSpringY}px, rgba(148, 163, 184, ${open ? '0.15' : '0.08'}), rgba(203, 213, 225, ${open ? '0.1' : '0.05'}), transparent 50%)`,
          transformOrigin: 'center center'
        }}
      />
      
      {/* Additional soft glow overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{ 
          opacity: open ? 0.15 : 0.08,
          scaleY: open ? 1 : 0.5
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        style={{
          background: `radial-gradient(ellipse at top, rgba(226, 232, 240, ${open ? '0.12' : '0.06'}), transparent ${open ? '60%' : '35%'})`,
          transformOrigin: 'top center'
        }}
      />
      
      {/* Header with centered toggle button */}
      <motion.div 
        className={`relative flex items-center justify-center border-b ${isDarkMode ? 'border-gray-600/30' : 'border-slate-200/20'}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          paddingLeft: open ? 24 : 12,
          paddingRight: open ? 24 : 12,
          paddingTop: 16,
          paddingBottom: 16
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
          onClick={() => setOpen(prev => !prev)}
          className={`relative group p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 focus:outline-none focus:ring-2 ${
            isDarkMode 
              ? 'bg-white/10 border-gray-600/40 hover:border-gray-500/60 focus:ring-gray-400/50' 
              : 'bg-white/15 border-slate-200/30 hover:border-slate-300/50 focus:ring-slate-400/50'
          }`}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
          }}
          whileTap={{ scale: 0.95 }}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
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
            <FiChevronLeft size={18} />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Main navigation */}
      <motion.nav 
        className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        animate={{ 
          paddingLeft: open ? 16 : 8,
          paddingRight: open ? 16 : 8,
          paddingTop: 16,
          paddingBottom: 16
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
            >
              <motion.button
                type="button"
                onClick={() => navigate(link.to)}
                className={`
                  group relative w-full flex items-center p-3 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50
                  ${isActiveLink 
                    ? 'bg-gradient-to-r ' + link.gradient + ' text-white shadow-xl' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
                  }
                `}
                whileHover={{ 
                  scale: 1.02, 
                  y: -1,
                  transition: { type: 'spring', stiffness: 400, damping: 30 }
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: isActiveLink 
                    ? `0 8px 32px ${link.shadowColor}, 0 0 0 1px rgba(255, 255, 255, 0.1)` 
                    : undefined
                }}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActiveLink && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-2xl bg-white/15"
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
                    relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300
                    ${isActiveLink 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-white/5 group-hover:bg-white/10'
                    }
                  `}
                  whileHover={{ 
                    rotate: 5,
                    scale: 1.1,
                    transition: { type: 'spring', stiffness: 400 }
                  }}
                >
                  <span className="text-xl relative">
                    {link.icon}
                    {link.to === '/tasks' && notifications > 0 && (
                      <NotificationBadge count={notifications} />
                    )}
                  </span>
                </motion.div>

                {/* Label and description */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      variants={itemVariants}
                      className="ml-4 flex-1 text-left"
                    >
                      <div className="font-semibold text-sm tracking-wide">
                        {link.label}
                      </div>
                                        <div className={`text-xs mt-0.5 transition-colors ${
                    isActiveLink ? 'text-white/70' : 'text-slate-500 group-hover:text-slate-600'
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
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Premium tooltip for collapsed state */}
              {!open && (
                <AnimatePresence>
                  {hoveredItem === link.to && (
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
                      className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[60] pointer-events-none"
                    >
                      <div className="bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10">
                        <div className="font-semibold text-sm whitespace-nowrap">{link.label}</div>
                        <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">{link.description}</div>
                        {/* Enhanced tooltip arrow */}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-l border-b border-white/10" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}

        {/* Premium divider */}
        <motion.div
          variants={itemVariants}
          className="my-6 h-px bg-gradient-to-r from-transparent via-slate-300/30 to-transparent"
        />

        {/* Enhanced Manager Portal */}
        <motion.div 
          variants={itemVariants} 
          className="relative"
          onHoverStart={() => setHoveredItem('manager-portal')}
          onHoverEnd={() => setHoveredItem(null)}
        >
          <motion.button
            type="button"
            onClick={() => setManagerDropdown(prev => !prev)}
            className={`
              group relative w-full flex items-center p-3 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50
              ${isManagerDashboard 
                ? 'bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 text-white shadow-xl' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
              }
            `}
            whileHover={{ 
              scale: 1.02, 
              y: -1,
              transition: { type: 'spring', stiffness: 400, damping: 30 }
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: isManagerDashboard 
                ? '0 8px 32px rgba(71, 85, 105, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                : undefined
            }}
            aria-haspopup="true"
            aria-expanded={managerDropdown}
          >
            {/* Special glow for manager portal */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-400/10 to-gray-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={{
                opacity: managerDropdown ? [0.5, 0.8, 0.5] : 0
              }}
              transition={{
                duration: 2,
                repeat: managerDropdown ? Infinity : 0,
                ease: "easeInOut"
              }}
            />

            <motion.div
              className={`
                relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300
                ${isManagerDashboard 
                  ? 'bg-white/20 shadow-lg' 
                  : 'bg-white/5 group-hover:bg-white/10'
                }
              `}
              whileHover={{ 
                rotate: 10,
                scale: 1.1,
                transition: { type: 'spring', stiffness: 400 }
              }}
            >
              <FiBriefcase className="text-xl" />
            </motion.div>

            <AnimatePresence>
              {open && (
                <motion.div
                  variants={itemVariants}
                  className="ml-4 flex-1 text-left"
                >
                  <div className="font-bold text-sm tracking-wide flex items-center">
                    Manager Portal
                    <motion.div
                      animate={{ rotate: managerDropdown ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="ml-auto"
                    >
                      <FiChevronRight className="text-sm" />
                    </motion.div>
                  </div>
                  <div className={`text-xs mt-0.5 transition-colors ${
                    isManagerDashboard ? 'text-white/70' : 'text-slate-500 group-hover:text-slate-600'
                  }`}>
                    Leadership tools & insights
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Enhanced dropdown menu */}
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
                  absolute ${open ? 'left-0 right-0 top-16 max-h-64 overflow-y-auto' : 'left-20 top-0 w-72 max-h-64 overflow-y-auto'} 
                  backdrop-blur-xl rounded-2xl border shadow-2xl z-50 p-2 ${
                    isDarkMode ? 'border-gray-600/40' : 'border-slate-200/30'
                  }
                  scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                `}
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(145deg, rgba(23, 23, 23, 0.95), rgba(38, 38, 38, 0.9))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.85))',
                  boxShadow: isDarkMode
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkMode ? 'rgba(156, 163, 175, 0.6) transparent' : 'rgba(156, 163, 175, 0.4) transparent'
                }}
              >
                {managerPortalSubtasks.map((item, index) => (
                  <motion.button
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => {
                      navigate(item.to);
                      setManagerDropdown(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-xl text-left transition-all duration-200 group ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white shadow-md`}
                      whileHover={{ 
                        rotate: 5,
                        scale: 1.1,
                        transition: { type: 'spring', stiffness: 400 }
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className={`text-xs transition-colors ${
                        isDarkMode 
                          ? 'text-gray-400 group-hover:text-gray-300' 
                          : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                ))}
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
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[60] pointer-events-none"
                >
                  <div className="bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10">
                    <div className="font-semibold text-sm whitespace-nowrap">Manager Portal</div>
                    <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">Leadership tools & insights</div>
                    {/* Enhanced tooltip arrow */}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-l border-b border-white/10" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.nav>

      {/* Premium footer section */}
      <motion.div 
        variants={itemVariants}
        className="border-t border-slate-200/20"
        animate={{ 
          paddingLeft: open ? 16 : 8,
          paddingRight: open ? 16 : 8,
          paddingTop: 16,
          paddingBottom: 16
        }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
      >
        {/* Settings and theme toggle */}
        <div className="flex items-center space-x-2 mb-4">
          <motion.button
            className="flex-1 flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(prev => !prev)}
          >
            <motion.div
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {isDarkMode ? <FiMoon size={16} /> : <FiSun size={16} />}
            </motion.div>
          </motion.button>
          
          <motion.button
            className="flex-1 flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings size={16} />
          </motion.button>
        </div>

        {/* Enhanced user profile */}
        <motion.div 
          className={`flex items-center p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-white/10' 
              : 'bg-gradient-to-r from-white/50 to-slate-100/50 border-slate-200/30'
          }`}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(255, 255, 255, 0.8)'
          }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg relative overflow-hidden"
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              transition: { type: 'spring', stiffness: 400 }
            }}
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <FiUser className="relative z-10" size={16} />
          </motion.div>
          
          <AnimatePresence>
            {open && (
              <motion.div
                variants={itemVariants}
                className="ml-3 flex-1"
              >
                <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || 'User'}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user?.role || 'member'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {open && (
              <motion.button
                variants={itemVariants}
                className={`ml-2 p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiLogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Floating elements for extra premium feel */}
      <motion.div
        animate={{
          y: [-2, 2, -2],
          scale: open ? 1 : 0.5,
          opacity: open ? 1 : 0.6
        }}
        transition={{
          y: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          scale: { type: 'spring', stiffness: 400, damping: 40 },
          opacity: { type: 'spring', stiffness: 400, damping: 40 }
        }}
        className="absolute top-1/2 left-1/2 bg-gradient-to-r from-slate-300/20 to-gray-300/20 rounded-full blur-2xl pointer-events-none"
        style={{ 
          transform: 'translate(-50%, -50%)',
          width: open ? 128 : 64,
          height: open ? 128 : 64
        }}
      />
    </motion.aside>
  );
} 