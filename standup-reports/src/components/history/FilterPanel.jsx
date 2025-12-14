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
  onToggleCollapse = () => { }
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
        bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl
        shadow-sm overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Always Visible */}
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-between p-4 border-b border-white/40 bg-white/20 cursor-pointer hover:bg-white/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilter className="w-4 h-4" />
          </motion.button>

          <div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Filters</h2>
            {hasActiveFilters && (
              <p className="text-xs text-indigo-600 font-medium">
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
              onClick={(e) => { e.stopPropagation(); onClearFilters(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-100/80 rounded-lg transition-colors border border-rose-100"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </motion.button>
          )}

          <motion.button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-colors"
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
            <div className="p-6 space-y-6 bg-white/20">
              {/* Search */}
              <div className="relative group">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <FiSearch className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                </motion.div>
                <motion.input
                  type="text"
                  placeholder="Search reports by user, team, or content..."
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/50 bg-white/50 focus:bg-white/80 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder-slate-400 outline-none backdrop-blur-sm"
                  whileFocus={{ scale: 1.005 }}
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Column */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {datePresets.map((preset) => (
                        <motion.button
                          key={preset.label}
                          onClick={() => handlePresetClick(preset)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white/40 border border-white/60 rounded-lg hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {preset.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Team Context</label>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        onClick={() => onTeamChange?.('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${selectedTeam === 'all'
                          ? 'bg-indigo-100/80 text-indigo-700 border-indigo-200 shadow-sm'
                          : 'bg-white/40 text-slate-600 border-white/60 hover:bg-white/60'
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
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${selectedTeam === team.id
                            ? 'bg-indigo-100/80 text-indigo-700 border-indigo-200 shadow-sm'
                            : 'bg-white/40 text-slate-600 border-white/60 hover:bg-white/60'
                            }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiUsers className="inline w-3 h-3 mr-1" />
                          {team.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">User Selection</label>
                    {/* User Selector Dropdown */}
                    <div className="relative">
                      {availableUsers.length > 0 ? (
                        <motion.button
                          ref={userButtonRef}
                          onClick={handleUserMenuToggle}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-white/50 border border-white/60 rounded-xl hover:bg-white/80 transition-all shadow-sm text-slate-700"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 p-1 rounded-md text-indigo-600"><FiUser className="w-3 h-3" /></span>
                            <span>
                              {selectedUsers && selectedUsers.length > 0
                                ? `${selectedUsers.length} Users selected`
                                : 'Filter by Team Members'
                              }
                            </span>
                          </div>
                          <FiChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </motion.button>
                      ) : (
                        <div className="px-4 py-2.5 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No users available
                        </div>
                      )}

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            ref={dropdownRef}
                            className="fixed bg-white/90 backdrop-blur-xl rounded-xl border border-white/50 shadow-2xl overflow-hidden z-[9999]"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              top: `${userMenuPosition.top}px`,
                              left: `${userMenuPosition.left}px`,
                              width: `${userMenuPosition.width}px`,
                              maxHeight: '20rem',
                              overflowY: 'auto'
                            }}
                          >
                            <div className="p-2 space-y-1">
                              <motion.button
                                onClick={() => {
                                  onUserChange?.([]);
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 mb-2"
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
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-all border ${isSelected
                                      ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                                      : 'text-slate-700 hover:bg-white/60 border-transparent hover:border-white/50'
                                      }`}
                                  >
                                    <UserAvatar
                                      name={user.name}
                                      avatarUrl={user.avatar_url}
                                      size="sm"
                                    />
                                    <div className="flex-1 text-left">
                                      <div className="font-semibold">{user.name}</div>
                                      <div className="text-xs text-slate-500">{user.team_name}</div>
                                    </div>
                                    {isSelected && (
                                      <div className="bg-indigo-500 text-white p-0.5 rounded-full">
                                        <FiCheck className="w-3 h-3" />
                                      </div>
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {selectedUsers && selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUsers.map(userId => {
                          const user = availableUsers.find(u => u.id === userId);
                          if (!user) return null;
                          return (
                            <motion.button
                              key={userId}
                              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              onClick={() => {
                                const newSelection = selectedUsers.filter(id => id !== userId);
                                onUserChange?.(newSelection);
                              }}
                            >
                              <div className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <span>{user.name}</span>
                              <FiX className="w-3 h-3 opacity-60 hover:opacity-100" />
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Custom Range</label>
                    <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                      <DatePicker
                        label=""
                        value={startDate}
                        onChange={onStartDateChange}
                        className="w-full bg-white/50 border-white/60 rounded-xl"
                      />
                      <DatePicker
                        label=""
                        value={endDate}
                        onChange={onEndDateChange}
                        className="w-full bg-white/50 border-white/60 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterPanel;