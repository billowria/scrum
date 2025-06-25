import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Components
import NotificationBell from './NotificationBell';
import Announcements from './Announcements';
import AnnouncementModal from './AnnouncementModal';

// Icons
import { FiHome, FiFileText, FiClock, FiLogOut, FiMenu, FiX, FiUser, FiCalendar, FiChevronDown, FiUsers, FiCheckSquare, FiActivity, FiBell, FiAward, FiBriefcase, FiList } from 'react-icons/fi';

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

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white/60 backdrop-blur-sm'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center">
              <motion.div 
                className="flex-shrink-0 flex items-center"
                variants={logoVariants}
                initial="initial"
                animate="animate"
              >
                <Link to="/">
                  <div className="relative h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg mr-3 overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0.9, 0.7],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.span 
                      className="text-white text-sm font-bold relative z-10"
                      animate={{ 
                        textShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 10px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      AP
                    </motion.span>
                  </div>
                </Link>
                <Link to="/">
                  <motion.span 
                    className="font-display font-bold text-xl bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    AgilePulse
                  </motion.span>
                </Link>
              </motion.div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {session ? (
                <motion.div 
                  className="flex items-center gap-3 lg:gap-4" 
                  variants={navContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <NavLink to="/dashboard" isActive={isActive('/dashboard')} icon={<FiHome />} text="Dashboard" />
                  <NavLink to="/leave-calendar" isActive={isActive('/leave-calendar')} icon={<FiCalendar />} text="Leave Calendar" />
                  <NavLink to="/achievements" isActive={isActive('/achievements')} icon={<FiAward />} text="Achievements" />
                  <NavLink to="/tasks" isActive={isActive('/tasks')} icon={<FiList />} text="Tasks" />
                  
                  {/* Add the department management link for directors */}
                  {isDirector && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                    >
                      <Link to="/department-management">
                        <motion.div
                          className="relative px-4 py-2 rounded-lg overflow-hidden group"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Background gradient with animation */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600"
                            animate={{ 
                              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          />
                          
                          {/* Pulsing effect */}
                          <motion.div 
                            className="absolute inset-0 bg-white opacity-0"
                            animate={{ 
                              opacity: [0, 0.1, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          
                          {/* Button content */}
                          <div className="relative flex items-center space-x-2 text-white font-medium">
                            <motion.div
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <FiBriefcase className="w-4 h-4" />
                            </motion.div>
                            <span>Department Management</span>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}
                  
                  {userProfile?.role === 'manager' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                    >
                      <Link to="/manager-dashboard">
                        <motion.div
                          className="relative px-4 py-2 rounded-lg overflow-hidden group"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Background gradient with animation */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600"
                            animate={{ 
                              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          />
                          
                          {/* Pulsing effect */}
                          <motion.div 
                            className="absolute inset-0 bg-white opacity-0"
                            animate={{ 
                              opacity: [0, 0.1, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          
                          {/* Button content */}
                          <div className="relative flex items-center space-x-2 text-white font-medium">
                            <motion.div
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <FiUsers className="w-4 h-4" />
                            </motion.div>
                            <span>Manager Portal</span>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}
                  
                  <div className="ml-4 pl-4 border-l border-gray-200 flex items-center">
                    {/* Notification Bell - Only show if user is logged in and has team assigned */}
                    {session && userTeamId && (
                      <div ref={notificationDropdownRef} className="relative">
                        <NotificationBell 
                          userRole={userProfile?.role}
                        />
                      </div>
                    )}
                    
                    {/* Profile dropdown for all users */}
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
                </motion.div>
              ) : (
                <motion.div 
                  className="flex items-center space-x-3" 
                  variants={navContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={navItemVariants}>
                    <Link 
                      to="/login" 
                      className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      Sign in
                    </Link>
                  </motion.div>
                  <motion.div variants={navItemVariants}>
                    <Link 
                      to="/signup" 
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-md hover:shadow-lg hover:from-primary-700 hover:to-primary-600 transition-all"
                    >
                      Sign up
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiX className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMenu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
                    to="/tasks" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive('/tasks') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    <div className="flex items-center">
                      <FiList className="mr-3 h-5 w-5" />
                      Tasks
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
