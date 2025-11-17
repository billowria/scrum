import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUser,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiClock,
  FiTag,
  FiSearch
} from 'react-icons/fi';
import UserAvatar from '../history/UserAvatar';

// Animation variants
const pillVariants = {
  initial: { opacity: 0, scale: 0.8, x: -10 },
  animate: { opacity: 1, scale: 1, x: 0 },
  exit: { opacity: 0, scale: 0.8, x: 10 }
};

const containerVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, y: -10 }
};

export const ActiveFilters = ({ filters, onFilterChange, employees = [], teams = [], projects = [], sprints = [], currentUser }) => {
  const getFilterLabel = useCallback((key, value) => {
    switch (key) {
      case 'search':
        return {
          icon: FiSearch,
          label: 'Search',
          value: value,
          color: 'from-gray-500 to-gray-600'
        };

      case 'status':
        return {
          icon: FiTarget,
          label: 'Status',
          value: value,
          color: value === 'To Do' ? 'from-gray-500 to-gray-600' :
                 value === 'In Progress' ? 'from-blue-500 to-cyan-500' :
                 value === 'Review' ? 'from-amber-500 to-orange-500' :
                 value === 'Completed' ? 'from-green-500 to-emerald-500' :
                 'from-gray-500 to-gray-600'
        };

      case 'assignee':
        if (value === 'current') {
          return {
            icon: FiUser,
            label: 'Assignee',
            value: currentUser?.name || 'Me',
            avatar: currentUser?.avatar_url,
            color: 'from-purple-500 to-pink-500'
          };
        } else if (value === 'unassigned') {
          return {
            icon: FiUser,
            label: 'Assignee',
            value: 'Unassigned',
            color: 'from-gray-500 to-gray-600'
          };
        } else {
          const employee = employees.find(emp => emp.id === value);
          return {
            icon: FiUser,
            label: 'Assignee',
            value: employee?.name || 'Unknown',
            avatar: employee?.avatar_url,
            color: 'from-purple-500 to-pink-500'
          };
        }

      case 'team':
        if (value === 'all') return null;
        const team = teams.find(t => t.id === value);
        return {
          icon: FiUsers,
          label: 'Team',
          value: team?.name || 'Unknown',
          color: 'from-emerald-500 to-teal-500'
        };

      case 'sprint':
        if (value === 'all') return null;
        if (value === 'no-sprint') {
          return {
            icon: FiTag,
            label: 'Sprint',
            value: 'No Sprint',
            color: 'from-gray-500 to-gray-600'
          };
        }
        const sprint = sprints.find(s => s.id === value);
        return {
          icon: FiTag,
          label: 'Sprint',
          value: sprint?.name || 'Unknown',
          color: 'from-indigo-500 to-purple-500'
        };

      case 'dueDate':
        return {
          icon: FiCalendar,
          label: 'Due',
          value: value === 'today' ? 'Today' :
                 value === 'tomorrow' ? 'Tomorrow' :
                 value === 'this-week' ? 'This Week' :
                 value === 'next-week' ? 'Next Week' :
                 value === 'this-month' ? 'This Month' :
                 value === 'overdue' ? 'Overdue' :
                 value,
          color: value === 'overdue' ? 'from-red-500 to-rose-500' : 'from-amber-500 to-orange-500'
        };

      default:
        return null;
    }
  }, [employees, teams, projects, sprints, currentUser]);

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => {
      if (key === 'search') return value && value.trim() !== '';
      return value !== 'all' && value !== undefined && value !== null;
    })
    .map(([key, value]) => getFilterLabel(key, value))
    .filter(Boolean);

  if (activeFilters.length === 0) {
    return null;
  }

  const removeFilter = (key) => {
    if (key === 'search') {
      onFilterChange(key, '');
    } else {
      onFilterChange(key, 'all');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-wrap items-center gap-2 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/40 rounded-xl"></div>

      <div className="relative flex flex-wrap items-center gap-2">
        {/* Active filter pills */}
        <AnimatePresence mode="popLayout">
          {activeFilters.map((filter, index) => {
            const Icon = filter.icon;

            return (
              <motion.div
                key={`${filter.label}-${filter.value}`}
                variants={pillVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout="position"
                className="relative group"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${filter.color.split(' ').join(', ')})`,
                    opacity: 0.3
                  }}
                />

                <motion.div
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white border border-white/20 shadow-md hover:shadow-lg transition-all cursor-pointer`}
                  style={{
                    background: `linear-gradient(135deg, ${filter.color.split(' ').join(', ')})`
                  }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeFilter(Object.keys(filters).find(key => getFilterLabel(key, filters[key]) === filter))}
                >
                  {/* Icon or Avatar */}
                  {filter.avatar ? (
                    <UserAvatar
                      name={filter.value}
                      avatarUrl={filter.avatar}
                      size="xs"
                      className="border-2 border-white/50"
                    />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-white/90" />
                  )}

                  {/* Label text */}
                  <span className="text-xs font-medium text-white/95 max-w-24 truncate">
                    {filter.label}: {filter.value}
                  </span>

                  {/* Remove button */}
                  <motion.button
                    className="ml-1 p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFilter(Object.keys(filters).find(key => getFilterLabel(key, filters[key]) === filter));
                    }}
                  >
                    <FiX className="w-3 h-3 text-white/90" />
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Clear all button */}
        {activeFilters.length > 1 && (
          <motion.button
            variants={pillVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => {
              Object.keys(filters).forEach(key => {
                if (key === 'search') {
                  onFilterChange(key, '');
                } else {
                  onFilterChange(key, 'all');
                }
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiX className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ActiveFilters;