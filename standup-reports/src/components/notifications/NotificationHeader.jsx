import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiSearch, FiPlus, FiSettings, FiX, FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

const NotificationHeader = ({
  unreadCount,
  totalNotifications,
  responseTime,
  onCreateNotification,
  onRefresh,
  onToggleFilters,
  showFilters,
  onSearch,
  searchQuery,
  isRefreshing
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <motion.header
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-lg border-b border-white/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Logo, Title, and Stats */}
          <div className="flex items-center space-x-6">
            <motion.div
              className="relative p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FiBell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.div>
              )}
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-white">Notification Center</h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-indigo-100 text-sm">
                  {totalNotifications || 0} total
                </span>
                {unreadCount > 0 && (
                  <span className="text-amber-200 text-sm font-medium">
                    {unreadCount} unread
                  </span>
                )}
                {responseTime && (
                  <span className="text-emerald-200 text-sm">
                    {responseTime}m avg response
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <motion.div
                className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  searchFocused ? 'text-indigo-300' : 'text-indigo-200'
                } transition-colors`}
              >
                <FiSearch className="w-5 h-5" />
              </motion.div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search notifications..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  searchFocused
                    ? 'bg-white/90 border-white/40 placeholder-indigo-300 text-indigo-900'
                    : 'bg-white/10 border-white/20 placeholder-indigo-200 text-white'
                } focus:outline-none focus:ring-2 focus:ring-white/30`}
              />
              {searchQuery && (
                <motion.button
                  onClick={() => onSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <motion.button
              onClick={onRefresh}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/20 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRefreshing}
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>

            {/* Toggle Filters Button */}
            <motion.button
              onClick={onToggleFilters}
              className={`relative p-2.5 rounded-xl text-white border transition-all duration-200 ${
                showFilters
                  ? 'bg-white/25 border-white/40'
                  : 'bg-white/10 hover:bg-white/20 border-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <FiFilter className="w-5 h-5" />
              {!showFilters && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.button>

            {/* Settings Button */}
            <motion.button
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/20 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>

            {/* Create Notification Button */}
            <motion.button
              onClick={onCreateNotification}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95, y: 0 }}
            >
              <FiPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Create</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default NotificationHeader;