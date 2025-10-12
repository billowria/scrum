import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiMessageCircle, FiUsers, FiTarget, FiSettings, FiTrendingUp,
  FiBell, FiCalendar, FiClock, FiStar, FiAlertTriangle, FiFolder,
  FiZap, FiHeart, FiActivity, FiBarChart, FiPieChart
} from 'react-icons/fi';
import { NOTIFICATION_CATEGORIES } from '../../services/notificationService';

// Category configuration
const CATEGORY_CONFIG = {
  [NOTIFICATION_CATEGORIES.COMMUNICATION]: {
    name: 'Communication',
    icon: FiMessageCircle,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Announcements and messages'
  },
  [NOTIFICATION_CATEGORIES.ADMINISTRATIVE]: {
    name: 'Administrative',
    icon: FiCalendar,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Leave requests and approvals'
  },
  [NOTIFICATION_CATEGORIES.PROJECT]: {
    name: 'Projects',
    icon: FiFolder,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Project updates and milestones'
  },
  [NOTIFICATION_CATEGORIES.TASK]: {
    name: 'Tasks',
    icon: FiTarget,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Task assignments and updates'
  },
  [NOTIFICATION_CATEGORIES.SYSTEM]: {
    name: 'System',
    icon: FiSettings,
    color: 'from-gray-500 to-slate-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    description: 'System alerts and maintenance'
  },
  [NOTIFICATION_CATEGORIES.ACHIEVEMENT]: {
    name: 'Achievements',
    icon: FiStar,
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    description: 'Badges and recognition'
  }
};

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    
    let current = 0;
    const increment = value / (duration / 50);
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span>{count}</span>;
};

// Category card component
const CategoryCard = ({ category, config, count, unreadCount, onClick, index }) => {
  const Icon = config.icon;
  const hasNotifications = count > 0;
  const percentage = count > 0 ? Math.min((unreadCount / count) * 100, 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(category)}
      className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${
        hasNotifications 
          ? `${config.bgColor} ${config.borderColor} hover:shadow-lg hover:shadow-${config.color.split('-')[1]}-200/20`
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      {/* Background gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      {/* Floating particles effect for active categories */}
      {hasNotifications && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 ${config.bgColor} rounded-full opacity-40`}
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${hasNotifications ? `bg-gradient-to-br ${config.color}` : 'bg-gray-200'} shadow-md`}>
          <Icon className={`w-6 h-6 ${hasNotifications ? 'text-white' : 'text-gray-500'}`} />
        </div>
        
        {unreadCount > 0 && (
          <motion.div
            className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            {unreadCount}
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className={`text-xl font-bold ${hasNotifications ? config.textColor : 'text-gray-600'}`}>
            {config.name}
          </h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${hasNotifications ? config.textColor : 'text-gray-400'}`}>
                <AnimatedCounter value={count} duration={800 + index * 100} />
              </div>
              <div className="text-xs text-gray-500 font-medium">Total</div>
            </div>
            
            {hasNotifications && (
              <div className="text-center">
                <div className="text-lg font-semibold text-amber-600">
                  <AnimatedCounter value={unreadCount} duration={600 + index * 100} />
                </div>
                <div className="text-xs text-gray-500 font-medium">Unread</div>
              </div>
            )}
          </div>
          
          {/* Activity indicator */}
          {hasNotifications && (
            <div className="flex items-center gap-1">
              <motion.div
                className={`w-2 h-2 rounded-full ${config.color.includes('blue') ? 'bg-blue-400' : 
                  config.color.includes('purple') ? 'bg-purple-400' :
                  config.color.includes('emerald') ? 'bg-emerald-400' :
                  config.color.includes('orange') ? 'bg-orange-400' :
                  config.color.includes('yellow') ? 'bg-yellow-400' :
                  'bg-gray-400'}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-gray-500 font-medium">Active</span>
            </div>
          )}
        </div>
        
        {/* Progress bar for unread ratio */}
        {hasNotifications && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Read Progress</span>
              <span className={config.textColor}>{Math.round(100 - percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-2 bg-gradient-to-r ${config.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${100 - percentage}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

// Quick stats overview
const QuickStats = ({ stats, notifications }) => {
  const totalNotifications = stats.total || 0;
  const unreadNotifications = stats.unread || 0;
  const engagementRate = stats.engagementRate || 0;
  const responseTime = stats.responseTime || 0;
  
  const quickStats = [
    {
      icon: FiBell,
      label: 'Total Notifications',
      value: totalNotifications,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      icon: FiActivity,
      label: 'Unread',
      value: unreadNotifications,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '-5%'
    },
    {
      icon: FiTrendingUp,
      label: 'Engagement',
      value: `${engagementRate}%`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+8%'
    },
    {
      icon: FiClock,
      label: 'Avg Response',
      value: `${responseTime}m`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '-2m'
    }
  ];
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickStats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl ${stat.bgColor} border border-gray-200/50 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-white/80 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stat.change}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {typeof stat.value === 'number' ? (
                <AnimatedCounter value={stat.value} duration={600 + index * 100} />
              ) : (
                stat.value
              )}
            </div>
            <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function CategoryDashboard({ notifications, stats, onCategorySelect }) {
  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const counts = {};
    const unreadCounts = {};
    
    // Initialize all categories
    Object.keys(CATEGORY_CONFIG).forEach(category => {
      counts[category] = 0;
      unreadCounts[category] = 0;
    });
    
    // Count notifications by category
    notifications.forEach(notification => {
      const category = notification.category || NOTIFICATION_CATEGORIES.COMMUNICATION;
      if (counts.hasOwnProperty(category)) {
        counts[category]++;
        if (!notification.read) {
          unreadCounts[category]++;
        }
      }
    });
    
    return { counts, unreadCounts };
  }, [notifications]);
  
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <motion.h2
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Notification Categories
        </motion.h2>
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Organize and manage your notifications by category
        </motion.p>
      </div>
      
      {/* Quick Stats Overview */}
      <QuickStats stats={stats} notifications={notifications} />
      
      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(CATEGORY_CONFIG).map(([category, config], index) => (
          <CategoryCard
            key={category}
            category={category}
            config={config}
            count={categoryStats.counts[category]}
            unreadCount={categoryStats.unreadCounts[category]}
            onClick={onCategorySelect}
            index={index}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {notifications.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBell className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Your notification center is empty. New notifications will appear here organized by category.
          </p>
        </motion.div>
      )}
      
      {/* Activity Visualization */}
      {notifications.length > 0 && stats.dailyActivity && (
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
              <FiBarChart className="w-5 h-5 text-indigo-600" />
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {stats.dailyActivity.map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <motion.div
                  className="bg-indigo-100 rounded-lg mx-auto"
                  style={{ 
                    width: '100%', 
                    height: Math.max(20, Math.min(80, (day.count / Math.max(...stats.dailyActivity.map(d => d.count))) * 80)) 
                  }}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: Math.max(20, Math.min(80, (day.count / Math.max(...stats.dailyActivity.map(d => d.count))) * 80)) 
                  }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                />
                <div className="text-xs text-gray-700 mt-1 font-medium">{day.count}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}