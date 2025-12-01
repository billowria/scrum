import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiSettings, FiBell, FiMessageSquare, FiUsers,
  FiFilter, FiX, FiPlus, FiUser, FiChevronDown
} from 'react-icons/fi';

const ChatHeader = ({
  currentUser,
  searchQuery,
  onSearchChange,
  conversationFilter,
  onFilterChange,
  showNotifications,
  onToggleNotifications,
  unreadCount,
  onStartDirectMessage,
  onOpenSettings,
  className = ""
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Conversations', icon: FiMessageSquare },
    { value: 'unread', label: 'Unread', icon: FiMessageSquare },
    { value: 'direct', label: 'Direct Messages', icon: FiUser },
    { value: 'team', label: 'Team Chats', icon: FiUsers }
  ];

  const getCurrentFilter = () => {
    return filterOptions.find(option => option.value === conversationFilter) || filterOptions[0];
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left Side - Search and Filters */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl min-w-0">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown - Hidden on small screens to save space */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              {(() => {
                const Icon = getCurrentFilter().icon;
                return Icon && <Icon className="w-4 h-4" />;
              })()}
              <span>{getCurrentFilter().label}</span>
              <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''
                }`} />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFilterChange(option.value);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${conversationFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                    >
                      {option.icon && <option.icon className="w-4 h-4" />}
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - App Title (Desktop) */}
        <div className="hidden md:flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">Sync Chat</h1>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* New Direct Message */}
          <button
            onClick={onStartDirectMessage}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Start Direct Message"
          >
            <FiPlus className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={onToggleNotifications}
              className={`p-2 rounded-lg transition-colors relative ${showNotifications
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-700 truncate max-w-[80px]">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </span>
              <FiChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiSettings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        // Handle logout
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiMessageSquare className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Active Indicator */}
      {searchQuery && (
        <div className="mt-2 text-xs text-gray-500">
          Searching for "{searchQuery}" in {getCurrentFilter().label}
        </div>
      )}
    </header>
  );
};

export default ChatHeader;