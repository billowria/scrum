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
  TbHistory
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

const FloatingNav = ({ activeTab, setActiveTab, context = 'leave-calendar', onTabClick }) => {
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
      { id: 'announcements', icon: TbBell, label: 'Announcements', path: '/manager-dashboard?tab=announcements' },
      { id: 'leave-history', icon: TbHistory, label: 'History', path: '/manager-dashboard?tab=leave-history' },
      { id: 'report-history', icon: TbHistory, label: 'Reports', path: '/manager-dashboard?tab=report-history' }
    ]
  };

  const tabs = tabConfigs[context] || tabConfigs['leave-calendar'];

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
                duration: 0.8,
                ease: [0.76, 0, 0.24, 1]
              }
            }}
            exit={{ 
              y: 100,
              opacity: 0,
              scale: 0.6,
              borderRadius: "100%",
              transition: {
                duration: 0.6,
                ease: [0.76, 0, 0.24, 1]
              }
            }}
            className="relative overflow-hidden"
          >
            {/* Glass Container */}
            <div 
              className="relative rounded-[2rem] overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15)'
              }}
            >
              {/* Burst Effect on Open */}
              <BurstEffect isVisible={showBurst} />
              
              {/* Navigation Content */}
              <div className="flex items-center gap-4 p-6 relative z-10">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 1,
                      y: [0, -14, 0],
                      scale: [1, 1.15, 1],
                      transition: {
                        delay: 0.6 + index * 0.15,
                        duration: 0.6,
                        ease: 'easeOut'
                      }
                    }}
                    exit={{
                      opacity: 0,
                      y: 20,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => handleTabClick(tab)}
                    className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-xl overflow-hidden group`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Active Tab Indicator */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl overflow-hidden"
                        initial={false}
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                      >
                        {/* Gooey animated gradient */}
                        <motion.div
                          className="absolute -inset-2 bg-gradient-to-br from-sky-400 via-sky-300 to-blue-500"
                          style={{ filter: 'blur(20px)' }}
                          animate={{
                            scale: [1, 1.2, 1],
                            borderRadius: ['30%', '50%', '30%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/40 to-blue-500/40 opacity-70" />
                      </motion.div>
                    )}
                    
                    {/* Icon Container */}
                    <motion.div
                      className={`text-3xl mb-2 relative z-10 transition-transform duration-300 ${
                        activeTab === tab.id ? 'text-white scale-110' : 'text-gray-400'
                      }`}
                      whileHover={{ scale: 1.2 }}
                    >
                      <tab.icon />
                    </motion.div>
                    
                    {/* Label */}
                    <span className={`text-sm font-medium relative z-10 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-400'
                    }`}>
                      {tab.label}
                    </span>
                    
                    {/* Hover Effect */}
                    <motion.div
                      className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ 
                        background: 'linear-gradient(45deg, rgba(56,189,248,0.2), rgba(14,165,233,0.2))'
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
        className="w-16 h-16 rounded-full relative overflow-hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isVisible ? 180 : 0,
          transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
        }}
        onMouseEnter={() => setToggleHover(true)}
        onMouseLeave={() => setToggleHover(false)}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: isVisible
              ? 'linear-gradient(45deg, rgba(56,189,248,0.6), rgba(14,165,233,0.6))'
              : 'rgba(255, 255, 255, 0.08)'
          }}
          style={{
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.25)'
          }}
        />
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <ToggleIcon isOpen={isVisible} isHover={toggleHover} />
        </div>

        {/* Micro-options on hover when nav closed */}
        {toggleHover && !isVisible && (
          <AnimatePresence>
            {[0, 1, 2, 3].map((i) => {
              const positions = [
                { top: '8%', left: '8%' },
                { top: '8%', right: '8%' },
                { bottom: '8%', left: '8%' },
                { bottom: '8%', right: '8%' },
              ];
              return (
                <motion.span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-sky-400"
                  style={positions[i]}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 * i }}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* "More" text on hover when closed */}
        <AnimatePresence>
          {toggleHover && !isVisible && (
            <motion.span
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-xs font-medium text-gray-400 select-none"
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
