import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter, FiSearch, FiCalendar, FiUser, FiTag, FiClock, FiStar,
  FiCheckCircle, FiX, FiRefreshCw, FiBookmark, FiEye
} from 'react-icons/fi';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '../../services/notificationService';

const FilterSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SmartFilters({ filters, onFilterChange, stats }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  
  const handleFilterToggle = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };
  
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onFilterChange({ search: value });
  };
  
  const clearAllFilters = () => {
    setSearchTerm('');
    onFilterChange({
      category: 'all',
      priority: 'all',
      status: 'all',
      search: ''
    });
  };
  
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-6 max-h-[80vh] overflow-y-auto"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiFilter className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Smart Filters</h3>
        </div>
        <motion.button
          onClick={clearAllFilters}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiRefreshCw className="w-4 h-4" />
        </motion.button>
      </div>
      
      {/* Search */}
      <FilterSection title="Search" icon={FiSearch}>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </FilterSection>
      
      {/* Categories */}
      <FilterSection title="Categories" icon={FiTag}>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="radio"
              name="category"
              checked={filters.category === 'all'}
              onChange={() => handleFilterToggle('category', 'all')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">All Categories</span>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {stats.total || 0}
            </span>
          </label>
          {Object.values(NOTIFICATION_CATEGORIES).map(category => (
            <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="category"
                checked={filters.category === category}
                onChange={() => handleFilterToggle('category', category)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {stats.byCategory?.[category] || 0}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* Priority */}
      <FilterSection title="Priority" icon={FiStar}>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="radio"
              name="priority"
              checked={filters.priority === 'all'}
              onChange={() => handleFilterToggle('priority', 'all')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">All Priorities</span>
          </label>
          {Object.values(NOTIFICATION_PRIORITIES).map(priority => (
            <label key={priority} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="priority"
                checked={filters.priority === priority}
                onChange={() => handleFilterToggle('priority', priority)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  priority === 'urgent' ? 'bg-red-500' :
                  priority === 'high' ? 'bg-orange-500' :
                  priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm capitalize">{priority}</span>
              </div>
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {stats.byPriority?.[priority] || 0}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* Status */}
      <FilterSection title="Status" icon={FiEye}>
        <div className="space-y-2">
          {[
            { key: 'all', label: 'All Notifications' },
            { key: 'unread', label: 'Unread Only' },
            { key: 'read', label: 'Read Only' }
          ].map(status => (
            <label key={status.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="status"
                checked={filters.status === status.key}
                onChange={() => handleFilterToggle('status', status.key)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">{status.label}</span>
              {status.key === 'unread' && (
                <span className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                  {stats.unread || 0}
                </span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* Quick Stats */}
      {stats.total > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-indigo-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{stats.unread}</div>
              <div className="text-xs text-gray-600">Unread</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">{stats.engagementRate}%</div>
              <div className="text-xs text-gray-600">Engagement</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{stats.responseTime}m</div>
              <div className="text-xs text-gray-600">Response</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}