import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiChevronDown, FiLogOut, FiShield, FiBell, FiSettings, FiZap } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar({ user = { name: '', role: '', avatar: null, avatar_url: null } }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

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
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 flex items-center justify-between px-6 h-16">
      {/* Left side - empty for spacing */}
      <div className="w-24"></div>

      {/* Brand - Centered */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
        {/* Cool Animated Logo */}
        <div className="flex items-center gap-3">
          {/* Dynamic Animated Logo */}
          <motion.div
            className="w-10 h-10 relative"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {/* Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
            />
            
            {/* Middle Ring */}
            <motion.div
              className="absolute inset-1 rounded-full border border-purple-400"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Inner Element */}
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Pulsing Center Dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500 opacity-20 blur-md"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          {/* Animated Brand Name */}
          <div className="relative overflow-hidden">
            <motion.h1 
              className="text-xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-700 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ 
                backgroundSize: "200% auto",
                backgroundImage: "linear-gradient(90deg, #1e293b, #2563eb, #7c3aed, #1e293b)"
              }}
            >
              Sync
            </motion.h1>
            
            {/* Subtle underline animation */}
            <motion.div
              className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{
                width: ["0%", "100%", "0%"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Actions & User */}
      <div className="relative flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell userRole={user.role} />

        {/* User Profile */}
        <motion.button
          ref={buttonRef}
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:text-slate-800 hover:bg-white/70 transition-all duration-200 shadow-sm"
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

        {/* Enhanced Cool Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div 
              key="dropdown"
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ 
                duration: 0.25, 
                ease: "easeOut",
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50 origin-top"
              style={{ 
                transformOrigin: 'top right',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* User Info Header with Gradient */}
              <div className="px-4 py-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <motion.img 
                      src={avatarUrl} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    />
                  ) : (
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    >
                      {userInitial}
                    </motion.div>
                  )}
                  <div>
                    <motion.div 
                      className="font-bold text-slate-800 text-base"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {user.name}
                    </motion.div>
                    <motion.div 
                      className="text-slate-500 text-sm capitalize"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {user.role}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Menu Items with Cool Design */}
              <div className="py-2">
                {/* Profile Menu Item */}
                <motion.button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors flex items-center gap-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <FiUser size={16} />
                  </div>
                  <span>My Profile</span>
                </motion.button>
                
                {/* Settings Menu Item */}
                <motion.button
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors flex items-center gap-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <FiSettings size={16} />
                  </div>
                  <span>Settings</span>
                </motion.button>
                
                {/* Divider */}
                <div className="border-t border-slate-100/50 my-2 mx-4"></div>
                
                {/* Sign Out Menu Item */}
                <motion.button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                    <FiLogOut size={16} />
                  </div>
                  <span>Sign out</span>
                </motion.button>
              </div>
              
              {/* Footer with Status */}
              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500">Online</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    v2.1.0
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}