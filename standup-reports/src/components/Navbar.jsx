import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Components
import NotificationBell from './NotificationBell';
import Announcements from './Announcements';
import AnnouncementModal from './AnnouncementModal';

// Icons
import { FiHome, FiFileText, FiClock, FiLogOut, FiMenu, FiX, FiUser, FiCalendar, FiChevronDown, FiUsers, FiCheckSquare, FiActivity, FiBell, FiAward, FiBriefcase, FiList, FiShield } from 'react-icons/fi';

// Enhanced Animation variants
const navItemVariants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
  hover: { y: -4, scale: 1.05, transition: { duration: 0.3 } }
};

// Staggered children animation for nav items
const navContainerVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const logoVariants = {
  initial: { opacity: 0, scale: 0.8, rotate: -10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { 
      type: 'spring', 
      stiffness: 600, 
      damping: 30, 
      delay: 0.1
    }
  }
};

const mobileMenuVariants = {
  closed: { opacity: 0, scale: 0.95, y: -20, transformOrigin: "top" },
  open: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 500, 
      damping: 30,
      staggerChildren: 0.07,
      delayChildren: 0.03
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

const dropdownItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
};

// Animated tab indicator variants
const indicatorTransition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

const navLinks = [
  { to: '/dashboard', icon: <FiHome />, text: 'Dashboard' },
  { to: '/leave-calendar', icon: <FiCalendar />, text: 'Leave Calendar' },
  { to: '/tasks', icon: <FiList />, text: 'Tasks' },
  { to: '/achievements', icon: <FiAward />, text: 'Achievements' },
];

// Transparent color themes for each tab (RGBA only)
const tabThemes = [
  {
    bg: 'bg-transparent',
    motion: 'linear-gradient(90deg, rgba(56,189,248,0.18) 0%, rgba(186,230,253,0.10) 100%)',
    bubble: 'rgba(56,189,248,0.55)',
  },
  {
    bg: 'bg-transparent',
    motion: 'linear-gradient(90deg, rgba(45,212,191,0.15) 0%, rgba(186,230,253,0.10) 100%)',
    bubble: 'rgba(45,212,191,0.48)',
  },
  {
    bg: 'bg-transparent',
    motion: 'linear-gradient(90deg, rgba(244,114,182,0.15) 0%, rgba(199,210,254,0.10) 100%)',
    bubble: 'rgba(244,114,182,0.48)',
  },
  {
    bg: 'bg-transparent',
    motion: 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(244,114,182,0.10) 100%)',
    bubble: 'rgba(139,92,246,0.48)',
  },
];

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Notification state
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userTeamId, setUserTeamId] = useState(null);
  const notificationDropdownRef = useRef(null);
  
  // Announcement modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // For bubble squeeze effect
  const tabRefs = useRef([]);
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0 });
  const [bubbleRadius, setBubbleRadius] = useState(18);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user profile if session exists
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('name, role, team_id, avatar_url, teams(name)')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
          setUserTeamId(data.team_id);
        }
      }
    };

    fetchUserProfile();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Close mobile menu and dropdown when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotificationDropdownOpen(false);
  }, [location.pathname]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if a nav link is active
  const isActive = (path) => {
    // For paths with query parameters (like manager-dashboard), just check the base path
    if (path.includes('?')) {
      const basePath = path.split('?')[0];
      return location.pathname === basePath || location.pathname.startsWith(basePath + '/');
    }
    // For regular paths, check exact match or if it's a sub-path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Announcement handling functions
  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
    setNotificationDropdownOpen(false);
  };
  
  const handleDismissAnnouncement = (announcementId) => {
    // This will be called after an announcement is dismissed from the modal
    // We don't need to do anything special here as the NotificationBell component
    // will automatically update its count by re-fetching
  };

  // Add a check for director role
  const isDirector = userProfile?.role === 'director';

  // Find active nav index for indicator
  const activeIndex = navLinks.findIndex(link => isActive(link.to));
  const activeTheme = useMemo(() => tabThemes[activeIndex] || tabThemes[0], [activeIndex]);

  useLayoutEffect(() => {
    if (tabRefs.current[activeIndex]) {
      const el = tabRefs.current[activeIndex];
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentNode.getBoundingClientRect();
      setBubbleStyle({ left: rect.left - parentRect.left, width: rect.width });
      setBubbleRadius(rect.height / 2);
    }
  }, [activeIndex, tabRefs, window.innerWidth]);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/20 mb-4`}
        style={{ background: activeTheme.motion, transition: 'background 0.7s cubic-bezier(.4,0,.2,1)' }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 md:h-24 items-center">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0 flex items-center"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30, delay: 0.1 }}
            >
              <Link to="/" className="flex items-center">
                <img
                  src="/src/assets/brand/squadsync-logo.png"
                  alt="SquadSync"
                  className="w-40 h-12 object-contain drop-shadow-lg"
                />
              </Link>
            </motion.div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 relative" style={{ minWidth: 400, fontFamily: 'Inter, Segoe UI, Roboto, system-ui, sans-serif' }}>
              <div className="flex gap-2 lg:gap-4 relative" style={{ position: 'relative' }}>
                {/* Bubble indicator */}
                <motion.div
                  layout
                  layoutId="nav-bubble"
                  className="absolute top-0 h-full"
                  style={{
                    left: bubbleStyle.left,
                    width: bubbleStyle.width,
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                  animate={{
                    borderRadius: [bubbleRadius, bubbleRadius * 1.2, bubbleRadius],
                    scaleX: [1, 1.15, 1],
                    scaleY: [1, 0.85, 1],
                    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                  }}
                  transition={{
                    layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                    default: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(120deg, ${activeTheme.bubble} 60%, rgba(255,255,255,0.10) 100%)`,
                      boxShadow: '0 8px 32px 0 rgba(80,120,255,0.10)',
                      filter: 'blur(0.5px)',
                      borderRadius: bubbleRadius,
                      border: '1.5px solid rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      opacity: 0.85,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
                      borderRadius: 'inherit',
                      filter: 'blur(2px)',
                    }} />
                  </div>
                </motion.div>
                {navLinks.map((link, idx) => {
                  const active = isActive(link.to);
                  return (
                    <motion.div
                      key={link.to}
                      ref={el => tabRefs.current[idx] = el}
                      style={{ zIndex: 2, display: 'flex', alignItems: 'center' }}
                      animate={active ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                      whileHover={{ scale: 1.08, filter: 'brightness(1.08)', color: '#374151' }}
                    >
                      <Link
                        to={link.to}
                        className={`relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300
                          ${active
                            ? 'text-gray-800'
                            : 'text-gray-700 hover:text-gray-800'}
                        `}
                        style={{
                          background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                          transition: 'color 0.3s, background 0.3s',
                          zIndex: 2,
                          fontFamily: 'Inter, Segoe UI, Roboto, system-ui, sans-serif',
                        }}
                      >
                        <span className="text-lg transition-colors duration-300">{link.icon}</span>
                        <span className="hidden sm:inline-block text-base font-bold tracking-tight transition-colors duration-300">
                          {link.text}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Manager Portal Button (Phase 1) */}
            {userProfile?.role === 'manager' && (
              <motion.button
                className="ml-3 px-4 py-2 rounded-full font-semibold text-base border border-indigo-300 bg-gradient-to-r from-indigo-600/80 to-blue-500/80 text-white flex items-center gap-2 shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                style={{
                  fontFamily: 'Inter, Segoe UI, Roboto, system-ui, sans-serif',
                  letterSpacing: '0.01em',
                  minHeight: '40px',
                  minWidth: '0',
                  transition: 'background 0.18s cubic-bezier(.4,0,.2,1), border 0.18s cubic-bezier(.4,0,.2,1), filter 0.18s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                }}
                initial={{ opacity: 0, scale: 0.88, y: -10 }}
                animate={{ opacity: 1, scale: 1.1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22, duration: 0.5, delay: 0.5 }}
                whileHover={{ 
                  scale: 1.18, 
                  background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
                  borderColor: '#6366f1',
                  filter: 'brightness(1.06)',
                  transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
                }}
                whileTap={{ scale: 1.05 }}
                onClick={() => navigate('/manager-dashboard')}
              >
                <FiShield className="w-4 h-4 text-indigo-100" />
                <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>Manager Portal</span>
              </motion.button>
            )}

            {/* Notification Bell, Profile, etc. (unchanged) */}
            <div className="flex items-center space-x-2">
              {session && userTeamId && (
                <div ref={notificationDropdownRef} className="relative">
                  <NotificationBell 
                    userRole={userProfile?.role}
                  />
                </div>
              )}
              
              {userProfile && (
                <div className="relative" ref={profileDropdownRef}>
                  <motion.button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`ml-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${profileDropdownOpen ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}
                    variants={navItemVariants}
                    whileHover="hover"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white overflow-hidden">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={userProfile?.name || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        userProfile?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <span className="text-sm">{userProfile?.name?.split(' ')[0] || 'Profile'}</span>
                      {userProfile?.teams?.name && (
                        <span className="text-xs block text-gray-500">
                          {userProfile.teams.name}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: profileDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <FiChevronDown />
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div 
                        className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-xl py-1 z-[9999] border border-gray-100 overflow-hidden"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                          {userProfile?.teams?.name && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <FiUsers className="mr-1 h-3 w-3" /> 
                              Team: {userProfile.teams.name}
                            </p>
                          )}
                        </div>
                        {userProfile?.role === 'manager' ? (
                          <>
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Manager Portal</div>
                            <motion.div variants={dropdownItemVariants}>
                              <Link 
                                to="/team-management" 
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                                onClick={() => setProfileDropdownOpen(false)}
                              >
                                <FiUsers className="mr-2 h-4 w-4" /> 
                                <span>Workforce Management</span>
                              </Link>
                            </motion.div>
                            <motion.div variants={dropdownItemVariants}>
                              <Link 
                                to="/manager-dashboard?tab=leave-requests" 
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                                onClick={() => setProfileDropdownOpen(false)}
                              >
                                <FiCheckSquare className="mr-2 h-4 w-4" /> 
                                <span>Leave Approvals</span>
                              </Link>
                            </motion.div>
                            <motion.div variants={dropdownItemVariants}>
                              <Link 
                                to="/manager-dashboard?tab=leave-history" 
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                                onClick={() => setProfileDropdownOpen(false)}
                              >
                                <FiClock className="mr-2 h-4 w-4" /> 
                                <span>Leave History</span>
                              </Link>
                            </motion.div>
                            <motion.div variants={dropdownItemVariants}>
                              <Link 
                                to="/history" 
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                                onClick={() => setProfileDropdownOpen(false)}
                              >
                                <FiClock className="mr-2 h-4 w-4" /> 
                                <span>Report History</span>
                              </Link>
                            </motion.div>
                            <motion.div variants={dropdownItemVariants}>
                              <Link 
                                to="/manager-dashboard?tab=announcements" 
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                                onClick={() => setProfileDropdownOpen(false)}
                              >
                                <FiBell className="mr-2 h-4 w-4" /> 
                                <span>Announcements</span>
                              </Link>
                            </motion.div>
                          </>
                        ) : null}
                        <motion.div 
                          className="border-t border-gray-100 mt-1"
                          variants={dropdownItemVariants}
                        >
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                          >
                            <FiLogOut className="mr-2 h-4 w-4" /> Sign out
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-white/95 backdrop-blur-md shadow-2xl rounded-xl mx-3 mt-2 overflow-hidden border border-gray-100"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="px-3 pt-3 pb-4 space-y-1.5">
              {session ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive('/dashboard') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    <div className="flex items-center">
                      <FiHome className="mr-3 h-5 w-5" />
                      Dashboard
                    </div>
                  </Link>
                  <Link 
                    to="/leave-calendar" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive('/leave-calendar') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    <div className="flex items-center">
                      <FiCalendar className="mr-3 h-5 w-5" />
                      Leave Calendar
                    </div>
                  </Link>
                  <Link 
                    to="/tasks" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive('/tasks') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    <div className="flex items-center">
                      <FiList className="mr-3 h-5 w-5" />
                      Tasks
                    </div>
                  </Link>
                  <Link 
                    to="/achievements" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive('/achievements') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    <div className="flex items-center">
                      <FiAward className="mr-3 h-5 w-5" />
                      Achievements
                    </div>
                  </Link>
                  
                  {/* Manager-specific links for mobile */}
                  {userProfile?.role === 'manager' && (
                    <>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Actions</div>
                      </div>
                      
                      {/* Special manager dashboard button for mobile */}
                      <motion.div
                        className="px-2 py-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Link 
                          to="/manager-dashboard" 
                          className="block relative overflow-hidden rounded-lg shadow-md"
                        >
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600"
                            animate={{ 
                              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          />
                          <motion.div 
                            className="absolute inset-0 bg-white opacity-0"
                            animate={{ 
                              opacity: [0, 0.1, 0],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <div className="relative px-4 py-3 flex items-center">
                            <motion.div
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="mr-3 text-white"
                            >
                              <FiUsers className="h-5 w-5" />
                            </motion.div>
                            <span className="font-medium text-white">Manager Portal</span>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <MobileNavLink to="/team-management" isActive={isActive('/team-management')} icon={<FiUsers />} text="Workforce Management" />
                      <MobileNavLink to="/manager-dashboard?tab=leave-requests" isActive={isActive('/manager-dashboard')} icon={<FiCheckSquare />} text="Leave Approvals" />
                      <MobileNavLink to="/manager-dashboard?tab=leave-history" isActive={isActive('/manager-dashboard')} icon={<FiClock />} text="Leave History" />
                      <MobileNavLink to="/history" isActive={isActive('/history')} icon={<FiClock />} text="Report History" />
                      <MobileNavLink to="/manager-dashboard?tab=announcements" isActive={isActive('/manager-dashboard')} icon={<FiBell />} text="Announcements" />
                    </>
                  )}
                  
                  <div className="pt-4 pb-2 border-t border-gray-200">
                    <div className="flex items-center px-4 py-2">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-primary-700">
                          <FiUser className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{userProfile?.name || 'User'}</div>
                        <div className="text-sm font-medium text-gray-500 capitalize">{userProfile?.role || 'member'}</div>
                      </div>
                    </div>
                    <div className="mt-3 px-2">
                      <motion.button
                        onClick={handleSignOut}
                        className="block w-full px-4 py-2 text-base font-medium text-left text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="flex items-center">
                          <FiLogOut className="mr-3 h-5 w-5" />
                          Sign out
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-2 text-base font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-md shadow-sm hover:from-primary-700 hover:to-primary-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Announcement Modal - moved outside the nav element to avoid stacking context issues */}
      {selectedAnnouncement && (
        <AnnouncementModal 
          announcement={selectedAnnouncement}
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          onDismiss={handleDismissAnnouncement}
          userId={session?.user?.id}
        />
      )}
    </>
  );
}

// Desktop Navigation Link Component
function NavLink({ to, isActive, icon, text }) {
  const navigate = useNavigate();
  
  // Handle click manually to avoid multiple navigation attempts
  const handleClick = (e) => {
    e.preventDefault();
    
    // Only navigate if not already on this page
    if (!isActive) {
      navigate(to);
    }
  };
  
  return (
    <motion.div variants={navItemVariants}>
      <a 
        href={to}
        onClick={handleClick}
        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all relative overflow-hidden group ${
          isActive 
            ? 'text-primary-700 bg-primary-50/80' 
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50/80'
        }`}
      >
        <span className="text-lg relative z-10">
          {icon}
        </span>
        <span className="relative z-10">{text}</span>
        
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
        )}
        
        <div 
          className={`absolute inset-0 bg-primary-100/50 rounded-lg transition-opacity duration-200 ${
            isActive ? 'opacity-0 group-hover:opacity-20' : 'opacity-0 group-hover:opacity-50'
          }`}
        />
      </a>
    </motion.div>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ to, isActive, icon, text }) {
  const navigate = useNavigate();
  
  // Handle click manually to avoid multiple navigation attempts
  const handleClick = (e) => {
    e.preventDefault();
    
    // Only navigate if not already on this page
    if (!isActive) {
      navigate(to);
    }
  };
  
  return (
    <motion.div
      variants={dropdownItemVariants}
      whileTap={{ scale: 0.97 }}
    >
      <a 
        href={to}
        onClick={handleClick}
        className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center ${
          isActive 
            ? 'text-primary-700 bg-primary-50' 
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center">
          <span className="mr-3 text-lg">
            {icon}
          </span>
          <span>{text}</span>
        </div>
        
        {isActive && (
          <div className="ml-auto h-2 w-2 rounded-full bg-primary-500" />
        )}
      </a>
    </motion.div>
  );
}
