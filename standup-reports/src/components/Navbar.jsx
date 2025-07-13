import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiChevronDown, FiLogOut, FiShield } from 'react-icons/fi';
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
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow border-b border-gray-200 flex items-center justify-between px-6 h-16">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <img src="/src/assets/brand/squadsync-logo.png" alt="Logo" className="h-9 w-16 rounded-lg shadow" />
      </div>

      {/* Center (Manager Portal) */}
      <div className="flex-1 flex justify-center">
        {user.role === 'manager' && (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition-all"
            onClick={() => window.location.href = '/manager-dashboard'}
          >
            <FiShield className="text-lg" />
            <span>Manager Portal</span>
          </button>
        )}
                </div>

      {/* User Dropdown */}
      <div className="relative flex items-center gap-2">
        <NotificationBell userRole={user.role} />
        <button
          ref={buttonRef}
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition-all"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow border-2 border-indigo-100" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium text-base shadow border-2 border-indigo-100">
              {userInitial}
                        </span>
                      )}
          <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
          <FiChevronDown className="ml-1" />
        </button>
                  <AnimatePresence>
          {dropdownOpen && (
                      <motion.div 
              key="dropdown"
              ref={dropdownRef}
              initial={{ opacity: 0, y: -16, scaleY: 0.8 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -16, scaleY: 0.8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top"
              style={{ transformOrigin: 'top' }}
                        >
                          <button
                            onClick={handleSignOut}
                className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                          >
                <FiLogOut className="text-lg" /> Sign out
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
    </nav>
  );
}
