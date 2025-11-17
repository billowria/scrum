import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiUser,
  FiTag,
  FiBookmark,
  FiRotateCcw,
  FiDownload,
  FiPlus,
  FiStar
} from 'react-icons/fi';
import UserAvatar from '../history/UserAvatar';

// Animation variants
const panelVariants = {
  hidden: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

const filterItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

// Filter presets for quick access
const filterPresets = [
  {
    id: 'my-tasks',
    name: 'My Tasks',
    icon: FiUser,
    description: 'Tasks assigned to me',
    filters: { assignee: 'current', status: 'all', sprint: 'all', team: 'all' },
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: FiTrendingUp,
    description: 'Currently active tasks',
    filters: { status: 'In Progress', assignee: 'all', sprint: 'all', team: 'all' },
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'this-week',
    name: 'This Week',
    icon: FiCalendar,
    description: 'Due this week',
    filters: { dueDate: 'this-week', assignee: 'all', status: 'all', sprint: 'all', team: 'all' },
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'overdue',
    name: 'Overdue',
    icon: FiAlertCircle,
    description: 'Past due date',
    filters: { dueDate: 'overdue', assignee: 'all', status: 'all', sprint: 'all', team: 'all' },
    color: 'from-red-500 to-rose-500'
  }
];

export const FilterSystem = ({
  isOpen,
  onToggle,
  filters,
  onFilterChange,
  onClearAll,
  onApplyFilters,
  hasPendingFilters = false,
  employees = [],
  teams = [],
  projects = [],
  sprints = [],
  currentUser,
  userRole,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    time: true,
    people: true,
    status: true,
    project: true
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  const panelRef = useRef(null);
  const overlayRef = useRef(null);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return value && value.trim() !== '';
      return value !== 'all' && value !== undefined && value !== null;
    }).length;
  }, [filters]);

  // Calculate filtered results count (this would be passed from parent)
  const resultsCount = 0; // This should come from parent component

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        overlayRef.current &&
        overlayRef.current.contains(event.target)
      ) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggle]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const applyPreset = useCallback((preset) => {
    Object.entries(preset.filters).forEach(([key, value]) => {
      if (key === 'assignee' && value === 'current' && currentUser) {
        onFilterChange(key, currentUser.id);
      } else {
        onFilterChange(key, value);
      }
    });
    setActivePreset(preset.id);
  }, [currentUser, onFilterChange]);

  const clearAllFilters = useCallback(() => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key, key === 'search' ? '' : 'all');
    });
    setActivePreset(null);
  }, [filters, onFilterChange]);

  const saveCurrentFilter = useCallback(() => {
    if (!newFilterName.trim()) return;

    const newFilter = {
      id: Date.now().toString(),
      name: newFilterName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    setSavedFilters(prev => [...prev, newFilter]);
    setNewFilterName('');
    setShowSaveDialog(false);
  }, [newFilterName, filters]);

  const applySavedFilter = useCallback((savedFilter) => {
    Object.entries(savedFilter.filters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
    setActivePreset(null);
  }, [onFilterChange]);

  const deleteSavedFilter = useCallback((filterId) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Filter Panel */}
          <motion.div
            ref={panelRef}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-2xl border-l border-white/30 shadow-2xl z-[9999] overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Gradient glow layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/40"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50/30 via-blue-50/40 to-emerald-50/30"></div>

              {/* Animated floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-sm"
                  animate={{
                    x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                    y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                />
              ))}
            </div>

            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-60"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-xl">
                      <FiFilter className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    <p className="text-sm text-gray-600">
                      {activeFiltersCount} active • {resultsCount} results
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <motion.button
                      onClick={clearAllFilters}
                      className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiRotateCcw className="w-4 h-4" />
                      Clear All
                    </motion.button>
                  )}

                  <motion.button
                    onClick={onToggle}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Filter Presets */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Quick Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {filterPresets.map((preset) => (
                      <motion.button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`relative p-3 rounded-xl border transition-all group ${
                          activePreset === preset.id
                            ? 'border-transparent shadow-lg text-white'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                        }`}
                        style={activePreset === preset.id ? {
                          background: `linear-gradient(135deg, ${preset.color.split(' ').join(', ')})`
                        } : {}}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        variants={filterItemVariants}
                        custom={0}
                      >
                        {activePreset === preset.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                        )}
                        <div className="relative flex items-center gap-2">
                          <preset.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{preset.name}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Filters */}
                <FilterSection
                  title="Time"
                  icon={FiClock}
                  isExpanded={expandedSections.time}
                  onToggle={() => toggleSection('time')}
                  custom={1}
                >
                  <div className="space-y-3">
                    <FilterSelect
                      label="Due Date"
                      value={filters.dueDate || 'all'}
                      onChange={(value) => onFilterChange('dueDate', value)}
                      options={[
                        { value: 'all', label: 'Any Time' },
                        { value: 'today', label: 'Today' },
                        { value: 'tomorrow', label: 'Tomorrow' },
                        { value: 'this-week', label: 'This Week' },
                        { value: 'next-week', label: 'Next Week' },
                        { value: 'this-month', label: 'This Month' },
                        { value: 'overdue', label: 'Overdue' }
                      ]}
                    />
                  </div>
                </FilterSection>

                {/* People Filters */}
                <FilterSection
                  title="People"
                  icon={FiUsers}
                  isExpanded={expandedSections.people}
                  onToggle={() => toggleSection('people')}
                  custom={2}
                >
                  <div className="space-y-3">
                    <FilterSelect
                      label="Team"
                      value={filters.team || 'all'}
                      onChange={(value) => onFilterChange('team', value)}
                      options={[
                        { value: 'all', label: 'All Teams' },
                        ...teams.map(team => ({
                          value: team.id,
                          label: team.name
                        }))
                      ]}
                    />

                    <FilterSelect
                      label="Assignee"
                      value={filters.assignee || 'all'}
                      onChange={(value) => onFilterChange('assignee', value)}
                      options={[
                        { value: 'all', label: 'Anyone' },
                        { value: 'unassigned', label: 'Unassigned' },
                        { value: 'current', label: 'Assigned to Me' },
                        ...employees.map(emp => ({
                          value: emp.id,
                          label: emp.name,
                          avatar: emp.avatar_url
                        }))
                      ]}
                      showAvatars={true}
                    />
                  </div>
                </FilterSection>

                {/* Status Filters */}
                <FilterSection
                  title="Status"
                  icon={FiTarget}
                  isExpanded={expandedSections.status}
                  onToggle={() => toggleSection('status')}
                  custom={3}
                >
                  <div className="space-y-3">
                    <FilterSelect
                      label="Status"
                      value={filters.status || 'all'}
                      onChange={(value) => onFilterChange('status', value)}
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        { value: 'To Do', label: 'To Do', color: 'text-gray-600' },
                        { value: 'In Progress', label: 'In Progress', color: 'text-blue-600' },
                        { value: 'Review', label: 'Review', color: 'text-amber-600' },
                        { value: 'Completed', label: 'Completed', color: 'text-green-600' }
                      ]}
                      showColors={true}
                    />
                  </div>
                </FilterSection>

                {/* Project Filters */}
                <FilterSection
                  title="Project"
                  icon={FiTag}
                  isExpanded={expandedSections.project}
                  onToggle={() => toggleSection('project')}
                  custom={4}
                >
                  <div className="space-y-3">
                    <FilterSelect
                      label="Sprint"
                      value={filters.sprint || 'all'}
                      onChange={(value) => onFilterChange('sprint', value)}
                      options={[
                        { value: 'all', label: 'All Sprints' },
                        { value: 'no-sprint', label: 'No Sprint' },
                        ...sprints.map(sprint => ({
                          value: sprint.id,
                          label: sprint.name,
                          status: sprint.status
                        }))
                      ]}
                    />
                  </div>
                </FilterSection>

                {/* Saved Filters */}
                {savedFilters.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Saved Filters</h3>
                    <div className="space-y-2">
                      {savedFilters.map((saved) => (
                        <motion.div
                          key={saved.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          whileHover={{ scale: 1.02, x: 2 }}
                          variants={filterItemVariants}
                          custom={5}
                        >
                          <button
                            onClick={() => applySavedFilter(saved)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium text-gray-900">{saved.name}</div>
                            <div className="text-xs text-gray-500">
                              Saved {new Date(saved.createdAt).toLocaleDateString()}
                            </div>
                          </button>
                          <button
                            onClick={() => deleteSavedFilter(saved.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200/50 bg-gray-50/80">
                <div className="flex gap-2">
                  {hasPendingFilters && onApplyFilters && (
                    <motion.button
                      onClick={onApplyFilters}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{
                        scale: [1, 1.05, 1],
                        transition: { duration: 2, repeat: Infinity }
                      }}
                    >
                      <FiSearch className="w-4 h-4" />
                      Apply Filters
                    </motion.button>
                  )}

                  <motion.button
                    onClick={() => setShowSaveDialog(true)}
                    className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                      hasPendingFilters ? 'flex-1' : 'flex-1'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="w-4 h-4" />
                    Save Current
                  </motion.button>

                  <motion.button
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiDownload className="w-4 h-4" />
                    Export
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Save Filter Dialog */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[10000]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter</h3>
                    <input
                      type="text"
                      value={newFilterName}
                      onChange={(e) => setNewFilterName(e.target.value)}
                      placeholder="Enter filter name..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setShowSaveDialog(false);
                          setNewFilterName('');
                        }}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveCurrentFilter}
                        disabled={!newFilterName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Filter Section Component
const FilterSection = ({ title, icon: Icon, isExpanded, onToggle, children, custom }) => (
  <motion.div
    variants={filterItemVariants}
    custom={custom}
    className="overflow-hidden"
  >
    <motion.button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-900">{title}</span>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <FiChevronDown className="w-4 h-4 text-gray-400" />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// Filter Select Component
const FilterSelect = ({ label, value, onChange, options, showAvatars = false, showColors = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="space-y-1">
      {options.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
            value === option.value
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.99 }}
        >
          {showAvatars && option.avatar && (
            <UserAvatar name={option.label} avatarUrl={option.avatar} size="sm" />
          )}
          {showColors && option.color && (
            <div className={`w-3 h-3 rounded-full ${option.color.replace('text-', 'bg-')}`}></div>
          )}
          <span className="flex-1">{option.label}</span>
          {value === option.value && (
            <FiCheckCircle className="w-4 h-4 text-blue-600" />
          )}
        </motion.button>
      ))}
    </div>
  </div>
);

export default FilterSystem;