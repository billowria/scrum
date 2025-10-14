import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown, FiSave, FiStar, FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import { colors } from '../../config/designSystem';

const EnhancedAnalyticsFilters = ({
  filters,
  onFiltersChange,
  availableUsers = [],
  availableTeams = [],
  availableMetrics = [],
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('quick');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Quick filter presets
  const quickFilters = [
    {
      id: 'today',
      name: 'Today',
      icon: FiClock,
      description: 'Tasks updated today',
      config: {
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      }
    },
    {
      id: 'this-week',
      name: 'This Week',
      icon: FiCalendar,
      description: 'Tasks from this week',
      config: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      }
    },
    {
      id: 'my-tasks',
      name: 'My Tasks',
      icon: FiUser,
      description: 'Tasks assigned to me',
      config: {
        userIds: ['current-user'] // This would be replaced with actual user ID
      }
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      icon: FiStar,
      description: 'High and critical priority tasks',
      config: {
        customCriteria: { priority: ['High', 'Critical'] }
      }
    }
  ];

  const handleQuickFilter = (filterConfig) => {
    onFiltersChange({ ...filters, ...filterConfig });
    setIsExpanded(false);
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName, filters);
      setFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadSavedFilter = (filterConfig) => {
    onLoadFilter(filterConfig);
    setIsExpanded(false);
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { start: null, end: null },
      userIds: [],
      teamIds: [],
      metrics: [],
      customCriteria: {}
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.dateRange.start ||
      filters.dateRange.end ||
      filters.userIds.length > 0 ||
      filters.teamIds.length > 0 ||
      filters.metrics.length > 0 ||
      Object.keys(filters.customCriteria).length > 0
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
          hasActiveFilters()
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FiFilter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters() && (
          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
            Active
          </span>
        )}
        <FiChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="absolute top-full mt-2 right-0 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Analytics Filters</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'quick', name: 'Quick Filters' },
                { id: 'advanced', name: 'Advanced' },
                { id: 'saved', name: 'Saved' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'quick' && (
                <div className="p-4 space-y-3">
                  {quickFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <motion.button
                        key={filter.id}
                        onClick={() => handleQuickFilter(filter.config)}
                        className="w-full flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Icon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{filter.name}</div>
                          <div className="text-sm text-slate-600">{filter.description}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="p-4 space-y-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={filters.dateRange.start || ''}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: e.target.value }
                        })}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={filters.dateRange.end || ''}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          dateRange: { ...filters.dateRange, end: e.target.value }
                        })}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Metrics</label>
                    <div className="space-y-2">
                      {availableMetrics.map((metric) => (
                        <label key={metric.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.metrics.includes(metric.id)}
                            onChange={(e) => {
                              const newMetrics = e.target.checked
                                ? [...filters.metrics, metric.id]
                                : filters.metrics.filter(m => m !== metric.id);
                              onFiltersChange({ ...filters, metrics: newMetrics });
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">{metric.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="p-4 space-y-3">
                  {savedFilters.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FiSave className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No saved filters yet</p>
                    </div>
                  ) : (
                    savedFilters.map((filter) => (
                      <motion.button
                        key={filter.id}
                        onClick={() => handleLoadSavedFilter(filter.config)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-medium text-slate-900">{filter.name}</span>
                        <FiChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear All
              </button>

              <div className="flex space-x-2">
                <motion.button
                  onClick={() => setSaveDialogOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiSave className="w-4 h-4" />
                  <span>Save</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Filter Dialog */}
      <AnimatePresence>
        {saveDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSaveDialogOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Save Filter</h3>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedAnalyticsFilters;