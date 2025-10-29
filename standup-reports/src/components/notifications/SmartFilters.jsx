import React, { useState } from 'react';
import {
  FiFilter, FiCalendar, FiTag, FiX, FiRefreshCw, FiCheck,
  FiChevronDown, FiChevronUp, FiSliders, FiMessageCircle,
  FiFolder, FiTarget, FiAlertTriangle, FiStar
} from 'react-icons/fi';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '../../services/notificationService';

export default function SmartFilters({ filters, onFilterChange, stats }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // State for each collapsible section
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    category: true,
    priority: true,
    stats: true
  });

  const handleFilterUpdate = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleSearchUpdate = (value) => {
    setLocalSearch(value);
    onFilterChange({ search: value });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFilterChange({
      category: 'all',
      priority: 'all',
      status: 'all',
      search: ''
    });
  };

  const hasActiveFilters = filters.category !== 'all' ||
                          filters.priority !== 'all' ||
                          filters.status !== 'all' ||
                          filters.search !== '';

  // Simple collapsible section component without animations
  const CollapsibleSection = ({
    title,
    icon: Icon,
    children,
    sectionKey,
    badge = null
  }) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {badge && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          <div className="text-gray-500">
            {isExpanded ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-3 pt-0">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <div className="bg-white rounded-lg p-3 border border-gray-200 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiSliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-red-50 rounded"
            >
              <FiRefreshCw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* Status Filter */}
          <CollapsibleSection
            title="Status"
            icon={FiCalendar}
            sectionKey="status"
            badge={
              filters.status !== 'all' ?
                (filters.status === 'unread' ? stats.unread || 0 : (stats.total || 0) - (stats.unread || 0)) :
                stats.total || 0
            }
          >
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All Notifications', count: stats.total || 0 },
                { value: 'unread', label: 'Unread', count: stats.unread || 0 },
                { value: 'read', label: 'Read', count: (stats.total || 0) - (stats.unread || 0) }
              ].map(({ value, label, count }) => (
                <button
                  key={value}
                  onClick={() => handleFilterUpdate('status', value)}
                  className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                    filters.status === value
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {filters.status === value && <FiCheck className="w-3 h-3" />}
                    <span className="font-medium">{label}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Category Filter */}
          <CollapsibleSection
            title="Categories"
            icon={FiTag}
            sectionKey="category"
          >
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All Categories', icon: FiTag },
                { value: NOTIFICATION_CATEGORIES.COMMUNICATION, label: 'Communication', icon: FiMessageCircle },
                { value: NOTIFICATION_CATEGORIES.ADMINISTRATIVE, label: 'Administrative', icon: FiCalendar },
                { value: NOTIFICATION_CATEGORIES.PROJECT, label: 'Projects', icon: FiFolder },
                { value: NOTIFICATION_CATEGORIES.TASK, label: 'Tasks', icon: FiTarget },
                { value: NOTIFICATION_CATEGORIES.SYSTEM, label: 'System', icon: FiAlertTriangle },
                { value: NOTIFICATION_CATEGORIES.ACHIEVEMENT, label: 'Achievements', icon: FiStar }
              ].map(({ value, label, icon: Icon }) => {
                // Get count for this category from stats
                const count = value === 'all'
                  ? (stats.total || 0)
                  : (stats.byCategory?.[value] || 0);

                // Special styling for Projects and Tasks categories
                const isSpecialCategory = value === NOTIFICATION_CATEGORIES.PROJECT || value === NOTIFICATION_CATEGORIES.TASK;
                const specialColor = value === NOTIFICATION_CATEGORIES.PROJECT
                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                  : value === NOTIFICATION_CATEGORIES.TASK
                  ? 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                  : '';

                return (
                  <button
                    key={value}
                    onClick={() => handleFilterUpdate('category', value)}
                    className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                      filters.category === value
                        ? isSpecialCategory
                          ? specialColor
                          : 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {filters.category === value && <FiCheck className="w-3 h-3" />}
                      {Icon && <Icon className="w-3 h-3" />}
                      <span className="font-medium">{label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        filters.category === value
                          ? isSpecialCategory
                            ? value === NOTIFICATION_CATEGORIES.PROJECT
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-indigo-200 text-indigo-800'
                            : 'bg-indigo-200 text-indigo-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Priority Filter */}
          <CollapsibleSection
            title="Priority"
            icon={FiFilter}
            sectionKey="priority"
          >
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All Priorities' },
                { value: NOTIFICATION_PRIORITIES.URGENT, label: 'Critical', color: 'text-red-600' },
                { value: NOTIFICATION_PRIORITIES.HIGH, label: 'High', color: 'text-amber-600' },
                { value: NOTIFICATION_PRIORITIES.NORMAL, label: 'Medium', color: 'text-green-600' },
                { value: NOTIFICATION_PRIORITIES.LOW, label: 'Low', color: 'text-blue-600' }
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleFilterUpdate('priority', value)}
                  className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                    filters.priority === value
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {filters.priority === value && <FiCheck className="w-3 h-3" />}
                    <span className={`font-medium ${color}`}>{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Quick Stats */}
          <CollapsibleSection
            title="Statistics"
            icon={FiFilter}
            sectionKey="stats"
            badge={Object.keys(stats).length > 0 ? Object.keys(stats).length : 0}
          >
            {stats && Object.keys(stats).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded border border-blue-200">
                  <div className="text-base font-bold text-blue-700">{stats.total || 0}</div>
                  <div className="text-xs text-blue-600 font-medium">Total</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded border border-amber-200">
                  <div className="text-base font-bold text-amber-700">{stats.unread || 0}</div>
                  <div className="text-xs text-amber-600 font-medium">Unread</div>
                </div>
                {stats.responseTime && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded border border-green-200 col-span-2">
                    <div className="text-base font-bold text-green-700">{stats.responseTime}m</div>
                    <div className="text-xs text-green-600 font-medium">Avg Response</div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}