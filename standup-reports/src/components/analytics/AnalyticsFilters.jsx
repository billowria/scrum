import React, { useState, useEffect } from 'react';
import { FiFilter, FiX, FiSave, FiCalendar, FiUser, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AnalyticsFilters = ({
  filters,
  onFiltersChange,
  availableUsers = [],
  availableTeams = [],
  availableMetrics = [],
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateRange: { start: null, end: null },
      userIds: [],
      teamIds: [],
      metrics: [],
      customCriteria: {}
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim(), tempFilters);
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const updateFilter = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const activeFiltersCount = Object.values(filters).reduce((count, filter) => {
    if (Array.isArray(filter)) return count + (filter.length > 0 ? 1 : 0);
    if (typeof filter === 'object' && filter !== null) {
      return count + (Object.values(filter).some(v => v !== null && v !== '') ? 1 : 0);
    }
    return count + (filter ? 1 : 0);
  }, 0);

  return (
    <>
      {/* Filter Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`flex items-center px-4 py-2 rounded-lg border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50 ${activeFiltersCount > 0 ? 'ring-2 ring-blue-500' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiFilter className="mr-2" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Analytics Filters
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FiX className="text-gray-600" />
                  </button>
                </div>

                {/* Date Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <FiCalendar className="inline mr-2" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1 text-gray-500">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={tempFilters.dateRange?.start || ''}
                        onChange={(e) => updateFilter('dateRange', {
                          ...tempFilters.dateRange,
                          start: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-gray-500">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={tempFilters.dateRange?.end || ''}
                        onChange={(e) => updateFilter('dateRange', {
                          ...tempFilters.dateRange,
                          end: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* User Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <FiUser className="inline mr-2" />
                    Users
                  </label>
                  <select
                    multiple
                    value={tempFilters.userIds || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      updateFilter('userIds', values);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                    size={4}
                  >
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Teams
                  </label>
                  <select
                    multiple
                    value={tempFilters.teamIds || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      updateFilter('teamIds', values);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                    size={3}
                  >
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metrics Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <FiSettings className="inline mr-2" />
                    Metrics
                  </label>
                  <div className="space-y-2">
                    {availableMetrics.map(metric => (
                      <label key={metric.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tempFilters.metrics?.includes(metric.id) || false}
                          onChange={(e) => {
                            const current = tempFilters.metrics || [];
                            if (e.target.checked) {
                              updateFilter('metrics', [...current, metric.id]);
                            } else {
                              updateFilter('metrics', current.filter(id => id !== metric.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {metric.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Saved Filters */}
                {savedFilters.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Saved Filters
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const filter = savedFilters.find(f => f.id === e.target.value);
                          if (filter) {
                            setTempFilters(filter.config);
                            onLoadFilter(filter.config);
                          }
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                    >
                      <option value="">Load saved filter...</option>
                      {savedFilters.map(filter => (
                        <option key={filter.id} value={filter.id}>
                          {filter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <motion.button
                    onClick={handleApplyFilters}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply Filters
                  </motion.button>
                  <motion.button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-4 py-2 rounded-lg font-medium border transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiSave className="inline mr-1" />
                    Save
                  </motion.button>
                  <motion.button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-lg font-medium transition-colors text-red-600 hover:bg-red-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Filter Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 rounded-lg shadow-xl max-w-md w-full mx-4 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Save Filter Configuration
              </h3>
              <input
                type="text"
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4 bg-white border-gray-300"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveFilter}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AnalyticsFilters;