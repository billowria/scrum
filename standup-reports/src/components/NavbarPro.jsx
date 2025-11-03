import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { supabase } from '../supabaseClient';
import { FiUser, FiGrid, FiAward, FiUsers, FiShield, FiLogOut, FiHome, FiCalendar, FiList, FiCheckSquare, FiClock, FiBell, FiChevronDown, FiMenu, FiTarget } from 'react-icons/fi';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { to: '/leave-calendar', label: 'Leave Calendar', icon: <FiCalendar /> },
  { to: '/tasks', label: 'Tasks', icon: <FiList /> },
  { to: '/achievements', label: 'Achievements', icon: <FiAward /> },
];

const managerLinks = [
  { to: '/team-management', label: 'Team Management', icon: <FiUsers /> },

  { to: '/history', label: 'Report History', icon: <FiClock /> },
  { to: '/manager-dashboard?tab=announcements', label: 'Announcements', icon: <FiBell /> },
];

const NavbarPro = ({ session }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pillOpen, setPillOpen] = useState(false);
  const pillMenuRef = useRef(null);

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
        }
      }
    };
    fetchUserProfile();
  }, [session]);

  // Close pill menu when clicking outside or on route change
  useEffect(() => {
    if (!pillOpen) return;
    function handleClick(e) {
      if (pillMenuRef.current && !pillMenuRef.current.contains(e.target)) {
        setPillOpen(false);
      }
    }
    function handleResize() {
      if (window.innerWidth >= 768) setPillOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [pillOpen]);

  // Close pill menu on route change
  useEffect(() => {
    setPillOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* Animated Sync Logo */}
          <motion.div 
            className="relative flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-md"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Main logo container */}
            <motion.div
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg"
              animate={{
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Sync icon elements */}
              <div className="relative w-6 h-6">
                {/* Top curve */}
                <motion.div
                  className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl-full"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                
                {/* Bottom curve */}
                <motion.div
                  className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white rounded-br-full"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
                />
                
                {/* Center dot */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    delay: 0.6
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Animated Text */}
          <motion.div
            className="overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
          >
            <motion.h1 
              className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
              whileHover={{ 
                backgroundPosition: ["0%", "100%", "0%"],
                transition: { duration: 2, repeat: Infinity }
              }}
              style={{ 
                backgroundSize: "200% auto",
                backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed, #4f46e5, #2563eb)"
              }}
            >
              Sync
            </motion.h1>
          </motion.div>
        </div>

        {/* Animated Pill Navbar for first 4 links */}
        <div className="flex-1 flex justify-center">
          {/* Mobile: Hamburger and pill menu (only render on mobile) */}
          <div className="relative flex items-center md:hidden" ref={pillMenuRef}>
            {typeof window !== 'undefined' && window.innerWidth < 768 && (
              <>
                <button
                  className="relative z-20 w-12 h-12 flex flex-col justify-center items-center focus:outline-none"
                  onClick={() => setPillOpen((v) => !v)}
                  aria-label="Toggle navigation"
                >
                  <span className={`block w-8 h-1 rounded-full bg-gray-600 transition-all duration-500 ${pillOpen ? 'bg-pink-400 translate-y-0 rotate-[-45deg]' : '-translate-y-2'}`}></span>
                  <span className={`block w-8 h-1 rounded-full bg-gray-600 transition-all duration-500 my-1 ${pillOpen ? 'bg-pink-400 opacity-0' : ''}`}></span>
                  <span className={`block w-8 h-1 rounded-full bg-gray-600 transition-all duration-500 ${pillOpen ? 'bg-pink-400 translate-y-0 rotate-[45deg]' : 'translate-y-2'}`}></span>
                </button>
                <ul
                  className={`absolute left-0 top-14 menu flex items-center gap-2 bg-white rounded-full shadow-lg px-2 py-1 transition-all duration-500 overflow-hidden border border-gray-200
                    ${pillOpen ? 'w-96 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'}`}
                  style={{ minWidth: pillOpen ? 320 : undefined }}
                >
                  {navLinks.map((link) => (
                    <li key={link.to} className="list-none mx-2">
                      <Link
                        to={link.to}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-base uppercase tracking-wide transition-all duration-300
                          ${isActive(link.to)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'}
                        `}
                        onClick={() => setPillOpen(false)}
                      >
                        <span className="text-lg">{link.icon}</span>
                        <span className="hidden sm:inline">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {/* Desktop: Inline nav links */}
          <ul className="hidden md:flex items-center gap-2 bg-white rounded-full shadow-lg px-6 py-1 border border-gray-200">
            {navLinks.map((link) => (
              <li key={link.to} className="list-none mx-2">
                <Link
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-base uppercase tracking-wide transition-all duration-300
                    ${isActive(link.to)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'}
                  `}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Notification, Profile, Manager Portal */}
        <div className="flex items-center gap-4">
          {session && userProfile && (
            <NotificationBell userRole={userProfile?.role} />
          )}

          {/* Manager Portal */}
          {userProfile?.role === 'manager' && (
            <button
              onClick={() => navigate('/manager-dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition-all"
            >
              <FiShield className="text-lg" />
              <span>Manager Portal</span>
            </button>
          )}

          {/* Profile Dropdown */}
          {session && userProfile && (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition-all"
              >
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={userProfile.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <FiUser className="text-lg" />
                )}
                <span className="hidden sm:inline">{userProfile.name?.split(' ')[0]}</span>
                <FiChevronDown className="ml-1" />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    {userProfile.teams?.name && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <FiUsers className="mr-1 h-3 w-3" />
                        Team: {userProfile.teams.name}
                      </p>
                    )}
                  </div>
                  {userProfile.role === 'manager' && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Manager Portal</div>
                      {managerLinks.map(link => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <span className="mr-2 h-4 w-4">{link.icon}</span>
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button for rest of nav (if needed) */}
          <button className="md:hidden flex items-center px-2 py-2 rounded-lg hover:bg-indigo-50" onClick={() => setMobileMenuOpen(v => !v)}>
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md shadow-2xl rounded-xl mx-3 mt-2 overflow-hidden border border-gray-100 z-40">
          <div className="px-3 pt-3 pb-4 space-y-1.5">
            {session ? (
              <>
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive(link.to) ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 h-5 w-5">{link.icon}</span>
                      {link.label}
                    </div>
                  </Link>
                ))}
                {/* Manager-specific links for mobile */}
                {userProfile?.role === 'manager' && (
                  <>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Actions</div>
                    </div>
                    {managerLinks.map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${isActive(link.to) ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3 h-5 w-5">{link.icon}</span>
                          {link.label}
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                <div className="pt-4 pb-2 border-t border-gray-200">
                  <div className="flex items-center px-4 py-2">
                    <div className="flex-shrink-0">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt={userProfile.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-primary-700">
                          <FiUser className="h-5 w-5 text-white" />
                        </div>
                      )}
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-md shadow-sm hover:from-primary-700 hover:to-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarPro; 