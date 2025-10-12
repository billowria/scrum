import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiCalendar, FiCheckSquare, FiMessageCircle, FiClock, 
  FiArrowRight, FiCheck, FiX 
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

// Simple animation variants
const bellVariants = {
  idle: { rotate: 0 },
  ring: {
    rotate: [0, -15, 15, -10, 10, 0],
    transition: { duration: 0.6 }
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

// Category icons and colors
const CATEGORY_CONFIG = {
  task: {
    icon: FiCheckSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Tasks',
    route: '/notifications?category=task'
  },
  leave: {
    icon: FiCalendar,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Leave Requests',
    route: '/notifications?category=leave'
  },
  announcement: {
    icon: FiMessageCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Announcements',
    route: '/notifications?category=announcement'
  },
  timesheet: {
    icon: FiClock,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Timesheets',
    route: '/notifications?category=timesheet'
  }
};

const NotificationBellRefactored = ({ userRole }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Fetch user and notifications
  useEffect(() => {
    fetchUserAndNotifications();
    
    // Set up real-time subscriptions
    const subscription = supabase
      .channel('notification_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leave_plans' }, 
        () => fetchUserAndNotifications()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' }, 
        () => fetchUserAndNotifications()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        () => fetchUserAndNotifications()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'timesheet_submissions' }, 
        () => fetchUserAndNotifications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userRole]);

  const fetchUserAndNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id, team_id')
        .eq('id', user.id)
        .single();

      setCurrentUserId(userData.id);
      setTeamId(userData.team_id);

      // Fetch notifications using the service
      const result = await notificationService.getNotifications({
        userId: userData.id,
        role: userRole,
        teamId: userData.team_id,
        limit: 5 // Just get recent ones for preview
      });

      // Categorize notifications
      const counts = {
        task: 0,
        leave: 0,
        announcement: 0,
        timesheet: 0
      };

      result.notifications.forEach(notif => {
        const category = notificationService.getNotificationCategory(notif.type);
        if (counts.hasOwnProperty(category.toLowerCase())) {
          counts[category.toLowerCase()]++;
        }
      });

      setCategoryCounts(counts);
      setTotalUnread(result.unreadCount);
      setRecentNotifications(result.notifications.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(CATEGORY_CONFIG[category].route);
    setShowDropdown(false);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setShowDropdown(false);
  };

  const getCategoryFromType = (type) => {
    const category = notificationService.getNotificationCategory(type);
    return category.toLowerCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
        variants={bellVariants}
        animate={totalUnread > 0 ? "ring" : "idle"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiBell className="w-6 h-6" />
        {totalUnread > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                  <span className="text-sm text-gray-600">{totalUnread} unread</span>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const count = categoryCounts[key] || 0;
                  const Icon = config.icon;
                  
                  return (
                    <motion.button
                      key={key}
                      onClick={() => handleCategoryClick(key)}
                      className={`${config.bg} ${config.border} border-2 rounded-xl p-4 hover:shadow-md transition-all group`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        {count > 0 && (
                          <span className={`${config.color} font-bold text-lg`}>{count}</span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${config.color} group-hover:underline text-left`}>
                        {config.label}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Recent Notifications Preview */}
              {recentNotifications.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recent</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentNotifications.map((notif, index) => {
                      const category = getCategoryFromType(notif.type);
                      const config = CATEGORY_CONFIG[category];
                      const Icon = config?.icon || FiBell;
                      
                      return (
                        <motion.div
                          key={notif.id}
                          className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleCategoryClick(category)}
                          whileHover={{ x: 4 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`${config?.bg} ${config?.color} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-600 truncate mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(parseISO(notif.created_at), 'MMM dd, h:mm a')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* View All Button */}
              <div className="border-t border-gray-200">
                <motion.button
                  className="w-full px-5 py-4 text-center text-primary-600 font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  onClick={handleViewAll}
                  whileHover={{ x: 4 }}
                >
                  View All Notifications
                  <FiArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBellRefactored;
