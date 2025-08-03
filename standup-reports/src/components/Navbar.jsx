import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiChevronDown, FiLogOut, FiShield, FiBell, FiSettings, FiZap } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

export default function Navbar({ user = { name: '', role: '', avatar: null, avatar_url: null } }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Use avatar_url if present, fallback to avatar, then fallback to initial
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
    <nav className="fixed top-0 left-0 right-0 w-full z-40 bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50 flex items-center justify-between px-6 h-16">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 flex items-center justify-center shadow-lg">
            <FiZap className="text-white text-sm" />
          </div>
          <span className="font-bold text-slate-800 text-lg">SquadSync</span>
        </motion.div>
      </div>

      {/* Right Side - Actions & User */}
      <div className="relative flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell userRole={user.role} />

        {/* User Profile */}
        <motion.button
          ref={buttonRef}
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:text-slate-800 hover:bg-white/70 transition-all duration-200"
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

        {/* Enhanced Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div 
              key="dropdown"
              ref={dropdownRef}
              initial={{ opacity: 0, y: -16, scaleY: 0.8 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -16, scaleY: 0.8 }}
              transition={{ 
                duration: 0.22, 
                ease: [0.4, 0, 0.2, 1],
                type: 'spring',
                stiffness: 400,
                damping: 30
              }}
              className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50 origin-top"
              style={{ 
                transformOrigin: 'top',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200/50" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 flex items-center justify-center text-white font-medium">
                      {userInitial}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{user.name}</div>
                    <div className="text-slate-500 text-xs capitalize">{user.role}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-3"
                >
                  <FiLogOut className="text-lg" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
