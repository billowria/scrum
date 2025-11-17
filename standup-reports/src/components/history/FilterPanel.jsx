import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiCalendar, FiRotateCcw, FiSearch, FiUser, FiUsers, FiChevronDown, FiCheck } from 'react-icons/fi';
import DatePicker from './DatePicker';
import TeamSelector from './TeamSelector';
import UserAvatar from './UserAvatar';
import './design-tokens.css';

// Quick date presets
const datePresets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'This Month', days: 0, isThisMonth: true },
  { label: 'Last 3 Months', days: 90 }
];

export const FilterPanel = ({
  startDate,
  endDate,
  selectedTeam,
  teams,
  selectedUsers,
  reports,
  onStartDateChange,
  onEndDateChange,
  onTeamChange,
  onUserChange,
  onSearchChange,
  searchTerm,
  onClearFilters,
  className = '',
  isCollapsed = false,
  onToggleCollapse = () => {}
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const userButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Extract unique users from reports for user filter
  const availableUsers = useMemo(() => {
    if (!reports) return [];

    const usersMap = new Map();
    reports.forEach(report => {
      if (report.users && !usersMap.has(report.users.id)) {
        usersMap.set(report.users.id, {
          id: report.users.id,
          name: report.users.name,
          avatar_url: report.users.avatar_url,
          team_id: report.users.team_id,
          team_name: report.users.teams?.name
        });
      }
    });

    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reports]);

  const handlePresetClick = useCallback((preset) => {
    const today = new Date();
    let start, end;

    if (preset.isThisMonth) {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else {
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - preset.days);
    }

    const formatDate = (date) => date.toISOString().split('T')[0];

    onStartDateChange(formatDate(start));
    onEndDateChange(formatDate(end));
    setIsPresetMenuOpen(false);
  }, [onStartDateChange, onEndDateChange]);

  const handleUserMenuToggle = useCallback(() => {
    if (userButtonRef.current && !isUserMenuOpen) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: 256
      });
    }
    setIsUserMenuOpen(!isUserMenuOpen);
  }, [isUserMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isUserMenuOpen &&
        userButtonRef.current &&
        dropdownRef.current &&
        !userButtonRef.current.contains(event.target) &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const hasActiveFilters = startDate || endDate || selectedTeam !== 'all' || (selectedUsers && selectedUsers.length > 0) || searchTerm;

  return (
    <motion.div
      className={`
        bg-white border border-gray-200 rounded-xl
        shadow-md overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: 'var(--light-shadow-md)'
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/30 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onToggleCollapse}
            className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilter className="w-4 h-4" />
          </motion.button>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <p className="text-xs text-primary-600 font-medium">
                {[
                  startDate && 'Date range',
                  selectedTeam !== 'all' && 'Team',
                  selectedUsers && selectedUsers.length > 0 && `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`,
                  searchTerm && 'Search'
                ].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <motion.button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </motion.button>
          )}

          <motion.button
            onClick={onToggleCollapse}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-6 space-y-6 bg-gray-50/50">
              {/* Search */}
              <div className="relative">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <FiSearch className="text-gray-400 w-5 h-5" />
                </motion.div>
                <motion.input
                  type="text"
                  placeholder="Search reports by user, team, or content..."
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 transition-all text-gray-900 placeholder-gray-400"
                  whileFocus={{
                    scale: 1.005,
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {/* Date Range Presets */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-600">Date:</span>
                  {datePresets.map((preset) => (
                    <motion.button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>

                {/* Team Filter Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-600">Team:</span>
                  <motion.button
                    onClick={() => onTeamChange?.('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedTeam === 'all'
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    All Teams
                  </motion.button>
                  {teams.map((team) => (
                    <motion.button
                      key={team.id}
                      onClick={() => onTeamChange?.(team.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        selectedTeam === team.id
                          ? 'bg-primary-100 text-primary-700 border border-primary-200'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiUsers className="inline w-3 h-3 mr-1" />
                      {team.name}
                    </motion.button>
                  ))}
                </div>

                {/* User Filter Pills */}
                {availableUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-gray-600">Users:</span>

                    {/* User Selector Dropdown */}
                    <div className="relative">
                      <motion.button
                        ref={userButtonRef}
                        onClick={handleUserMenuToggle}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiUser className="w-3 h-3" />
                        <span>
                          {selectedUsers && selectedUsers.length > 0
                            ? `${selectedUsers.length} selected`
                            : 'Select Users'
                          }
                        </span>
                        <FiChevronDown className={`w-3 h-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </motion.button>

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            ref={dropdownRef}
                            className="fixed bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden z-[9999]"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              top: `${userMenuPosition.top}px`,
                              left: `${userMenuPosition.left}px`,
                              width: `${userMenuPosition.width}px`,
                              maxHeight: '16rem',
                              overflowY: 'auto'
                            }}
                          >
                            <div className="p-2 space-y-1">
                              <motion.button
                                onClick={() => {
                                  onUserChange?.([]);
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                whileHover={{ backgroundColor: 'var(--gray-50)' }}
                              >
                                Clear Selection
                              </motion.button>
                              {availableUsers.map((user) => {
                                const isSelected = selectedUsers?.includes(user.id);
                                return (
                                  <motion.button
                                    key={user.id}
                                    onClick={() => {
                                      const newSelection = isSelected
                                        ? selectedUsers.filter(id => id !== user.id)
                                        : [...(selectedUsers || []), user.id];
                                      onUserChange?.(newSelection);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                      isSelected
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    whileHover={{ backgroundColor: isSelected ? 'var(--primary-100)' : 'var(--gray-50)' }}
                                  >
                                    <UserAvatar
                                      name={user.name}
                                      avatarUrl={user.avatar_url}
                                      size="sm"
                                    />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium">{user.name}</div>
                                      <div className="text-xs text-gray-500">{user.team_name}</div>
                                    </div>
                                    {isSelected && (
                                      <FiCheck className="w-4 h-4 text-primary-600" />
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Selected Users Display */}
                {selectedUsers && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-gray-600">Selected:</span>
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find(u => u.id === userId);
                      if (!user) return null;
                      return (
                        <motion.div
                          key={userId}
                          className="flex items-center gap-2 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <UserAvatar
                            name={user.name}
                            avatarUrl={user.avatar_url}
                            size="xs"
                          />
                          <span>{user.name}</span>
                          <motion.button
                            onClick={() => {
                              const newSelection = selectedUsers.filter(id => id !== userId);
                              onUserChange?.(newSelection);
                            }}
                            className="ml-1 hover:text-primary-900"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            <FiX className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <DatePicker
                  label="Custom Start Date"
                  value={startDate}
                  onChange={onStartDateChange}
                />
                <DatePicker
                  label="Custom End Date"
                  value={endDate}
                  onChange={onEndDateChange}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterPanel;