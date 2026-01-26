import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiChevronDown, FiLogOut, FiShield, FiBell, FiSettings, FiZap, FiSun, FiMenu, FiMoon, FiCpu, FiX, FiSidebar, FiLayout, FiEyeOff, FiChevronLeft, FiChevronRight, FiGlobe, FiStar } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import CompactThemeToggle from './CompactThemeToggle';
import AnimatedSyncLogo from './shared/AnimatedSyncLogo';

export default function Navbar({ user = { name: '', role: '', avatar: null, avatar_url: null }, sidebarMode, setSidebarMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { theme, themeMode, setThemeMode } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setThemeMode('ocean');
    navigate('/login');
  };

  const avatarUrl = user.avatar_url || user.avatar;
  const userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 pointer-events-none">
      <div
        className="pointer-events-auto relative bg-white/10 dark:bg-slate-900/70 backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-white/20 dark:border-white/5 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 md:h-16 w-full group transition-colors duration-300"
        style={{
          boxShadow: `0 4px 30px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)`
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
        }}
      >
        {/* Liquid Sheen Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 160, 90, 0.25)'}, transparent 40%)`
          }}
        />

        {/* Chromatic Edge Simulation */}
        <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />

        {/* Left side - Sidebar Control */}
        <div className="flex items-center relative z-10 w-1/3">
          <AnimatePresence mode="wait">
            {sidebarMode === 'hidden' ? (
              <motion.button
                key="show-sidebar"
                onClick={() => setSidebarMode('expanded')}
                className="relative p-2 sm:p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all duration-200 shadow-sm group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Show Sidebar"
              >
                <FiMenu size={24} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Show Sidebar
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="sidebar-controls"
                className="flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 rounded-xl p-1 shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={() => setSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')}
                  className={`p-2 rounded-lg transition-all duration-200 ${sidebarMode === 'expanded'
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={sidebarMode === 'expanded' ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  {sidebarMode === 'expanded' ? <FiChevronLeft size={18} /> : <FiMenu size={18} />}
                </motion.button>
                <div className="w-px h-4 bg-slate-300/50 mx-1" />
                <motion.button
                  onClick={() => setSidebarMode('hidden')}
                  className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Hide Sidebar"
                >
                  <FiEyeOff size={18} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="ml-2">
            <CompactThemeToggle />
          </div>
        </div>

        {/* Brand - Absolutely Centered */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group/brand z-10" onClick={() => window.location.href = '/'}>
          <AnimatedSyncLogo size="md" showText={true} />
        </div>

        {/* Right Side - Actions & User */}
        <div className="relative flex items-center gap-3">
          <NotificationBell userRole={user.role} />

          <motion.button
            ref={buttonRef}
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/50 transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="w-7 h-7 rounded-lg object-cover shadow-sm border border-slate-200/50" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {userInitial}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium">{user.name?.split(' ')[0]}</span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <FiChevronDown size={14} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                key="dropdown"
                ref={dropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut", type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden z-50 origin-top"
                style={{ transformOrigin: 'top right', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}
              >
                <div className="px-4 py-4 bg-gradient-to-r from-indigo-500/10 to-indigo-500/10 border-b border-slate-100/50 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <motion.img src={avatarUrl} alt={user.name} className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-white" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }} />
                    ) : (
                      <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}>
                        {userInitial}
                      </motion.div>
                    )}
                    <div>
                      <motion.div className="font-bold text-slate-800 dark:text-white text-base" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>{user.name}</motion.div>
                      <motion.div className="text-slate-500 dark:text-gray-400 text-sm capitalize" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>{user.role}</motion.div>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <motion.button
                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-3 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                      <FiUser size={16} />
                    </div>
                    <span>My Profile</span>
                  </motion.button>

                  <motion.button
                    onClick={() => { setDropdownOpen(false); navigate('/subscription'); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-3 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                      <FiZap size={16} />
                    </div>
                    <span>Billing & Plans</span>
                  </motion.button>

                  <div className="px-4 py-3 border-b border-slate-100/50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 tracking-[0.1em] uppercase">Appearance</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'light', icon: <FiSun size={14} />, label: 'Light', color: 'text-amber-500' },
                        { id: 'dark', icon: <FiMoon size={14} />, label: 'Dark', color: 'text-indigo-400' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setThemeMode(mode.id)}
                          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 border ${theme === mode.id
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 shadow-sm'
                            : 'bg-slate-100/50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-white/5'
                            }`}
                        >
                          <span className={`relative z-10 ${theme === mode.id ? mode.color : 'text-slate-600 dark:text-slate-400'}`}>
                            {mode.icon}
                          </span>
                          <span className={`relative z-10 ${theme === mode.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {mode.label}
                          </span>
                          {theme === mode.id && (
                            <motion.div
                              layoutId="activeThemeDropdown"
                              className="absolute inset-0 border-2 border-indigo-500/20 dark:border-indigo-400/20 rounded-xl"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100/50 dark:border-white/5 my-2 mx-4"></div>

                  <motion.button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/30 transition-colors flex items-center gap-3 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                      <FiLogOut size={16} />
                    </div>
                    <span>Sign out</span>
                  </motion.button>
                </div>

                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100/50 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-500 dark:text-gray-400">Online</span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-gray-500">
                      {currentCompany?.name || 'v2.1.0'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}