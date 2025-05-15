import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Icons
import { FiHome, FiFileText, FiClock, FiLogOut, FiMenu, FiX, FiUser, FiCalendar, FiChevronDown, FiUsers, FiCheckSquare } from 'react-icons/fi';

// Animation variants
const navItemVariants = {
  initial: { y: -10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  exit: { y: -10, opacity: 0 },
  hover: { y: -2, transition: { duration: 0.2 } }
};

const mobileMenuVariants = {
  closed: { opacity: 0, scale: 0.95, y: -10 },
  open: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

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
          .select('name, role')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
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
  }, [location.pathname]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if a nav link is active
  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-sm shadow-md' : 'bg-white/60 backdrop-blur-xs'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div 
              className="flex-shrink-0 flex items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-md mr-2">
                <span className="text-white text-sm font-bold">SR</span>
              </div>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent">
                Standup Reports
              </span>
            </motion.div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {session ? (
              <motion.div className="flex items-center space-x-1" initial="initial" animate="animate">
                <NavLink to="/dashboard" isActive={isActive('/dashboard')} icon={<FiHome />} text="Dashboard" />
                <NavLink to="/report" isActive={isActive('/report')} icon={<FiFileText />} text="Submit Report" />
                <NavLink to="/history" isActive={isActive('/history')} icon={<FiClock />} text="History" />
                <NavLink to="/leave-calendar" isActive={isActive('/leave-calendar')} icon={<FiCalendar />} text="Leave Calendar" />
                
                <div className="ml-4 pl-4 border-l border-gray-200 flex items-center">
                  {/* Profile dropdown for manager features */}
                  {userProfile?.role === 'manager' && (
                    <div className="relative" ref={profileDropdownRef}>
                      <motion.button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-all ${profileDropdownOpen ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}
                        variants={navItemVariants}
                        whileHover="hover"
                      >
                        <span className="text-lg"><FiUser /></span>
                        <span>{userProfile?.name || 'Profile'}</span>
                        <FiChevronDown className={`transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                      </motion.button>
                      
                      <AnimatePresence>
                        {profileDropdownOpen && (
                          <motion.div 
                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">Manager Portal</div>
                            
                            <Link 
                              to="/team-management" 
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between group"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <div className="flex items-center">
                                <FiUsers className="mr-2" /> Workforce Management
                              </div>
                            </Link>
                            
                            <Link 
                              to="/team-management?tab=staff-oversight" 
                              className="block px-4 py-2 pl-10 text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-400 mr-2"></span> Staff Oversight
                            </Link>
                            
                            <Link 
                              to="/team-management?tab=team-assignment" 
                              className="block px-4 py-2 pl-10 text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-400 mr-2"></span> Team Assignment
                            </Link>
                            
                            <Link 
                              to="/team-management?tab=manager-delegation" 
                              className="block px-4 py-2 pl-10 text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-400 mr-2"></span> Manager Delegation
                            </Link>
                            
                            <Link 
                              to="/leave-requests" 
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <FiCheckSquare className="mr-2" /> Leave Approvals
                            </Link>
                            
                            <div className="border-t border-gray-100 mt-1">
                              <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <FiLogOut className="mr-2" /> Sign out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  {/* Regular sign out button for non-managers */}
                  {(!userProfile || userProfile?.role !== 'manager') && (
                    <motion.button
                      onClick={handleSignOut}
                      className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-1 transition-all"
                      variants={navItemVariants}
                      whileHover="hover"
                    >
                      <span className="text-lg"><FiLogOut /></span>
                      <span>Sign out</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div className="flex items-center space-x-2" initial="initial" animate="animate">
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
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-sm hover:from-primary-700 hover:to-primary-600 transition-colors"
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
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-white shadow-lg rounded-b-lg mx-4 overflow-hidden"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {session ? (
                <>
                  <MobileNavLink to="/dashboard" isActive={isActive('/dashboard')} icon={<FiHome />} text="Dashboard" />
                  <MobileNavLink to="/report" isActive={isActive('/report')} icon={<FiFileText />} text="Submit Report" />
                  <MobileNavLink to="/history" isActive={isActive('/history')} icon={<FiClock />} text="History" />
                  <MobileNavLink to="/leave-calendar" isActive={isActive('/leave-calendar')} icon={<FiCalendar />} text="Leave Calendar" />
                  
                  {/* Manager-specific links for mobile */}
                  {userProfile?.role === 'manager' && (
                    <>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="px-4 py-1 text-xs text-gray-500">Manager Actions</div>
                      </div>
                      <MobileNavLink to="/team-management" isActive={isActive('/team-management')} icon={<FiUsers />} text="Team Management" />
                      <MobileNavLink to="/leave-requests" isActive={isActive('/leave-requests')} icon={<FiCheckSquare />} text="Leave Requests" />
                    </>
                  )}
                  
                  <div className="pt-4 pb-2 border-t border-gray-200">
                    <div className="flex items-center px-4 py-2">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                          <FiUser className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{userProfile?.name || 'User'}</div>
                        <div className="text-sm font-medium text-gray-500 capitalize">{userProfile?.role || 'member'}</div>
                      </div>
                    </div>
                    <div className="mt-3 px-2">
                      <button
                        onClick={handleSignOut}
                        className="block w-full px-4 py-2 text-base font-medium text-left text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center">
                          <FiLogOut className="mr-3 h-5 w-5" />
                          Sign out
                        </div>
                      </button>
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
    </motion.nav>
  );
}

// Desktop Navigation Link Component
function NavLink({ to, isActive, icon, text }) {
  return (
    <motion.div variants={navItemVariants}>
      <Link 
        to={to} 
        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-all ${
          isActive 
            ? 'text-primary-700 bg-primary-50' 
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg">{icon}</span>
        <span>{text}</span>
        {isActive && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
            layoutId="navbar-indicator"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ to, isActive, icon, text }) {
  return (
    <Link 
      to={to} 
      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive 
          ? 'text-primary-700 bg-primary-50' 
          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center">
        <span className="mr-3 text-lg">{icon}</span>
        <span>{text}</span>
      </div>
    </Link>
  );
}
