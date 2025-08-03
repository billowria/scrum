import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiGrid, FiX } from 'react-icons/fi';
import { 
  TbLayoutDashboard,
  TbCalendarEvent,
  TbUsers,
  TbSettings,
  TbClipboardText,
  TbBell,
  TbHistory,
  TbUserPlus,
  TbFolder
} from 'react-icons/tb';

// Shooting Star Component
const ShootingStar = ({ isVisible }) => {
  return (
    <motion.div
      className="absolute w-4 h-4"
      initial={{ 
        scale: 0,
        opacity: 0,
        pathLength: 0,
        rotate: 0,
      }}
      animate={isVisible ? {
        scale: [0, 1, 1, 0],
        opacity: [0, 1, 1, 0],
        rotate: 360,
        transition: {
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.2, 0.8, 1]
        }
      } : {}}
      style={{
        background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(56,189,248,0) 70%)",
        boxShadow: "0 0 20px 2px rgba(56,189,248,0.5)",
        borderRadius: "50%"
      }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 w-[300%] h-0.5 -translate-x-1/2 -translate-y-1/2 origin-left"
        style={{
          background: "linear-gradient(90deg, rgb(56,189,248) 0%, rgba(56,189,248,0) 100%)",
          filter: "blur(1px)"
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isVisible ? {
          scaleX: [0, 1, 0],
          opacity: [0, 1, 0],
          transition: {
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }
        } : {}}
      />
    </motion.div>
  );
};

// Orbit Path Component
const OrbitPath = ({ children, isVisible }) => {
  return (
    <motion.div
      className="absolute inset-0"
      initial={false}
      animate={isVisible ? {
        rotate: 360
      } : {}}
      transition={{
        duration: 2,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Toggle Button Icon with hover micro-options
const ToggleIcon = ({ isOpen, isHover }) => (
  <motion.div
    className="relative w-full h-full flex items-center justify-center text-xl"
    initial={false}
    animate={{ 
      rotate: isOpen ? 90 : 0,
      scale: isHover && !isOpen ? 1.15 : 1 
    }}
    transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
  >
    {isOpen ? <FiX className="text-white" /> : <FiGrid className="text-sky-500" />}
  </motion.div>
);

// --------------------
// Burst Effect Component
// --------------------
const BurstEffect = ({ isVisible }) => {
  const circles = Array.from({ length: 10 });
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {circles.map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-2 h-2 rounded-full bg-sky-400"
              style={{ backgroundColor: i % 2 === 0 ? '#38bdf8' : '#0ea5e9' }}
              initial={{
                scale: 0,
                opacity: 1,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                x: (Math.cos((i / circles.length) * Math.PI * 2) * 120) || 0,
                y: (Math.sin((i / circles.length) * Math.PI * 2) * 120) || 0,
                transition: {
                  duration: 3,
                  ease: 'easeOut',
                  delay: 0.05 * i,
                },
              }}
              exit={{ opacity: 0 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FloatingNav = ({ activeTab, setActiveTab, context = 'leave-calendar', onTabClick, userRole }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [toggleHover, setToggleHover] = useState(false);
  const navigate = useNavigate();
  
  // Define tab configurations for different contexts
  const tabConfigs = {
    'leave-calendar': [
      { id: 'calendar', icon: TbCalendarEvent, label: 'Calendar', path: '/leave-calendar' },
      { id: 'team', icon: TbUsers, label: 'Overview', path: '/leave-calendar?tab=team' },
      { id: 'analytics', icon: TbLayoutDashboard, label: 'Analytics', path: '/leave-calendar?tab=analytics' },
      { id: 'requests', icon: TbSettings, label: 'My Requests', path: '/leave-calendar?tab=requests' }
    ],
    'manager-dashboard': [
      { id: 'leave-requests', icon: TbClipboardText, label: 'Leave Requests', path: '/manager-dashboard?tab=leave-requests' },
      { id: 'team-management', icon: TbUsers, label: 'Team', path: '/manager-dashboard?tab=team-management' },
      { id: 'add-member', icon: TbUserPlus, label: 'Add Member', path: '/manager-dashboard?tab=add-member' },
      { id: 'project-manager', icon: TbFolder, label: 'Project Manager', path: '/project-management' },
      { id: 'announcements', icon: TbBell, label: 'Announcements', path: '/manager-dashboard?tab=announcements' },
      { id: 'leave-history', icon: TbHistory, label: 'History', path: '/manager-dashboard?tab=leave-history' },
      { id: 'report-history', icon: TbHistory, label: 'Reports', path: '/manager-dashboard?tab=report-history' }
    ]
  };

  let tabs = tabConfigs[context] || tabConfigs['leave-calendar'];
  
  // Filter tabs based on user role
  if (context === 'manager-dashboard' && userRole) {
    tabs = tabs.filter(tab => {
      // Show Project Manager tab only for managers and admins
      if (tab.id === 'project-manager') {
        return userRole === 'manager' || userRole === 'admin';
      }
      return true;
    });
  }

  useEffect(() => {
    if (isVisible) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
    
    // Call the scroll function if provided
    if (onTabClick) {
      onTabClick(tab.id);
    }
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6">
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ 
              y: 100,
              opacity: 0,
              scale: 0.6,
              borderRadius: "100%" 
            }}
            animate={{ 
              y: 0,
              opacity: 1,
              scale: 1,
              borderRadius: "2rem",
              transition: {
                duration: 0.7,
                ease: [0.76, 0, 0.24, 1]
              }
            }}
            exit={{ 
              y: 100,
              opacity: 0,
              scale: 0.6,
              borderRadius: "100%",
              transition: {
                duration: 0.5,
                ease: [0.76, 0, 0.24, 1]
              }
            }}
            className="relative overflow-visible"
          >
            {/* Refined Glassy Container */}
            <div 
              className="relative rounded-[2rem] overflow-visible shadow-xl border border-indigo-200/60"
              style={{
                background: 'linear-gradient(135deg, rgba(40,48,80,0.82) 0%, rgba(67,56,202,0.72) 60%, rgba(59,130,246,0.60) 100%)',
                backdropFilter: 'blur(22px)',
                boxShadow: '0 16px 32px -8px rgba(59,130,246,0.10), 0 1.5px 6px rgba(36,41,81,0.08)',
                border: '1.5px solid rgba(99,102,241,0.10)',
              }}
            >
              {/* Burst Effect on Open */}
              <BurstEffect isVisible={showBurst} />
              
              {/* Navigation Content */}
              <div className="flex items-center gap-4 p-6 relative z-20">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 1,
                      y: [0, -10, 0],
                      scale: [1, 1.08, 1],
                      transition: {
                        delay: 0.5 + index * 0.13,
                        duration: 0.5,
                        ease: 'easeOut'
                      }
                    }}
                    exit={{
                      opacity: 0,
                      y: 16,
                      transition: { duration: 0.18 }
                    }}
                    onClick={() => handleTabClick(tab)}
                    className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl overflow-visible group focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {/* Active Tab Indicator */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-2xl overflow-visible z-10"
                        initial={false}
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                      >
                        {/* Soft glassy highlight for active tab */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/30 via-blue-400/20 to-indigo-600/30"
                          style={{ filter: 'blur(10px)' }}
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 rounded-2xl border border-indigo-300/40 shadow-lg" style={{ boxShadow: '0 2px 12px 0 rgba(99,102,241,0.10)' }} />
                      </motion.div>
                    )}
                    
                    {/* Icon Container */}
                    <motion.div
                      className={`text-3xl mb-2 relative z-20 transition-transform duration-300 ${
                        activeTab === tab.id ? 'text-white scale-110 drop-shadow-[0_2px_8px_rgba(99,102,241,0.18)]' : 'text-indigo-200 group-hover:text-white'
                      }`}
                      whileHover={{ scale: 1.13, color: '#6366f1' }}
                    >
                      <tab.icon />
                    </motion.div>
                    
                    {/* Label */}
                    <span className={`text-sm font-semibold relative z-20 ${
                      activeTab === tab.id ? 'text-white drop-shadow-[0_1px_4px_rgba(99,102,241,0.13)]' : 'text-indigo-100 group-hover:text-white'
                    }`}>
                      {tab.label}
                    </span>
                    
                    {/* Hover Effect */}
                    <motion.div
                      className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                      style={{ 
                        background: 'linear-gradient(45deg, rgba(99,102,241,0.08), rgba(59,130,246,0.08))'
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="w-16 h-16 rounded-full relative overflow-hidden shadow-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gradient-to-br from-white/70 via-indigo-50 to-indigo-100"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isVisible ? 180 : 0,
          transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
        }}
        onMouseEnter={() => setToggleHover(true)}
        onMouseLeave={() => setToggleHover(false)}
      >
        {/* Glassy background and animated ring on hover/focus */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            background: isVisible
              ? 'linear-gradient(45deg, rgba(99,102,241,0.12), rgba(59,130,246,0.10))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(99,102,241,0.08) 100%)',
            boxShadow: toggleHover && !isVisible
              ? '0 0 0 6px rgba(99,102,241,0.18), 0 8px 32px rgba(59,130,246,0.10)'
              : '0 8px 32px rgba(59,130,246,0.10)'
          }}
          style={{
            border: '1.5px solid rgba(99,102,241,0.13)',
            backdropFilter: 'blur(12px)',
            transition: 'box-shadow 0.3s, background 0.3s',
          }}
        />
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {/* Professional icon: larger, indigo, soft glow */}
          <motion.div
            className="relative w-8 h-8 flex items-center justify-center"
            animate={{
              scale: toggleHover && !isVisible ? 1.13 : 1,
              filter: !isVisible && toggleHover ? 'drop-shadow(0 0 8px #6366f1cc)' : 'drop-shadow(0 1px 4px #6366f133)'
            }}
            transition={{ duration: 0.22 }}
          >
            {isVisible
              ? <FiX className="w-8 h-8 text-white" />
              : <FiGrid className="w-8 h-8 text-indigo-600" />}
          </motion.div>
        </div>

        {/* "More" text on hover when closed */}
        <AnimatePresence>
          {toggleHover && !isVisible && (
            <motion.span
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-xs font-medium text-gray-400/70 select-none"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              More
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FloatingNav;
