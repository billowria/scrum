import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import NotificationListItem from '../components/NotificationListItem';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiFilter, FiSearch, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiChevronLeft, FiChevronRight, FiEye, FiZap, FiStar, FiClock, FiMessageSquare, FiCheckSquare, FiAlertTriangle, FiX, FiGrid, FiList, FiRefreshCw, FiCalendar, FiChevronDown } from 'react-icons/fi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const filterVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

// Custom Header for Notifications Page
const NotificationsHeader = ({ title, subtitle, icon: Icon, color = "indigo", quickStats = [], quickActions = [], badge }) => {
  const colorSchemes = {
    blue: {
      gradient: "from-blue-600 via-indigo-700 to-purple-700",
      glow: "shadow-blue-600/30",
      accent: "from-cyan-500 to-blue-600",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-blue-100",
      border: "border-blue-500/40",
      pulse: "bg-blue-500"
    },
    green: {
      gradient: "from-emerald-600 via-teal-700 to-cyan-700",
      glow: "shadow-emerald-600/30",
      accent: "from-green-500 to-emerald-600",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-emerald-100",
      border: "border-emerald-500/40",
      pulse: "bg-emerald-500"
    },
    purple: {
      gradient: "from-purple-600 via-violet-700 to-indigo-700",
      glow: "shadow-purple-600/30",
      accent: "from-violet-500 to-purple-600",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
      text: "text-purple-100",
      border: "border-purple-500/40",
      pulse: "bg-purple-500"
    },
    orange: {
      gradient: "from-orange-600 via-red-600 to-pink-700",
      glow: "shadow-orange-600/30",
      accent: "from-orange-500 to-red-600",
      iconBg: "bg-gradient-to-br from-orange-500 to-red-600",
      text: "text-orange-100",
      border: "border-orange-500/40",
      pulse: "bg-orange-500"
    },
    indigo: {
      gradient: "from-indigo-600 via-purple-700 to-pink-700",
      glow: "shadow-indigo-600/30",
      accent: "from-indigo-500 to-purple-600",
      iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      text: "text-indigo-100",
      border: "border-indigo-500/40",
      pulse: "bg-indigo-500"
    }
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl mb-10 shadow-2xl ${scheme.glow} border ${scheme.border} backdrop-blur-sm`}
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient} opacity-80`} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.2),transparent_50%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)] opacity-60" />
      </div>

      {/* Animated particles */}
      <motion.div
        className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-6 left-6 w-1 h-1 bg-white/40 rounded-full"
        animate={{ scale: [1, 2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white/50 rounded-full"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />

      <div className="relative p-8">
        {/* Main Content */}
        <div className="flex items-start justify-between">
          {/* Left Section - Icon and Title */}
          <div className="flex items-start space-x-5 flex-1">
            <motion.div
              className={`relative p-5 ${scheme.iconBg} rounded-3xl shadow-lg backdrop-blur-sm border ${scheme.border}`}
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className={`w-8 h-8 ${scheme.text}`} />
              <div className={`absolute inset-0 ${scheme.iconBg} rounded-3xl blur-xl opacity-50`} />
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <motion.h2
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h2>
                {badge && (
                  <motion.span
                    className={`px-4 py-1.5 text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/30 rounded-full ${scheme.text}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {badge}
                  </motion.span>
                )}
              </div>

              <motion.p
                className="text-white/90 text-xl font-medium mb-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>

              {/* Quick Stats with enhanced design */}
              {quickStats.length > 0 && (
                <div className="flex flex-wrap items-center gap-6">
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      onClick={stat.onClick}
                      className={`flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 ${stat.onClick ? 'cursor-pointer' : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={stat.onClick ? { scale: 1.05, y: -2 } : {}}
                      whileTap={stat.onClick ? { scale: 0.98 } : {}}
                    >
                      <span className="text-white/70 text-base font-medium">{stat.label}:</span>
                      <span className="text-white font-bold text-xl">{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Quick Actions */}
          {quickActions.length > 0 && (
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  className={`relative p-4 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/25 transition-all duration-300 group ${scheme.text}`}
                  onClick={action.onClick}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  title={action.tooltip}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="relative z-10">
                    {action.icon}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <motion.div
                    className={`absolute inset-0 ${scheme.pulse} rounded-xl opacity-20`}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transform: 'translateZ(-10px)', transformStyle: 'preserve-3d' }}
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bottom Section - Enhanced Features */}
        <motion.div
          className="mt-8 pt-5 border-t border-white/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/80">
                <FiEye className="w-5 h-5" />
                <span className="text-base font-medium">Interactive Dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiZap className="w-5 h-5" />
                <span className="text-base font-medium">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiStar className="w-5 h-5" />
                <span className="text-base font-medium">Smart Insights</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className={`w-4 h-4 ${scheme.pulse} rounded-full`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white/80 text-base font-medium">Live</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Notification card component with modern light design
const NotificationCard = ({ notification, isSelected, onSelect, onMarkAsRead, onViewDetails }) => {
  const priorityColors = {
    critical: "border-red-500 bg-gradient-to-r from-red-50 to-red-100",
    high: "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100",
    medium: "border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100",
    low: "border-green-500 bg-gradient-to-r from-green-50 to-green-100"
  };
  
  const getIcon = (type) => {
    switch(type) {
      case "announcement": return <FiBell className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "leave": return <FiCalendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "task": return <FiCheckSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "meeting": return <FiMessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case "alert": return <FiAlertTriangle className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      default: return <FiInfo className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
    }
  };
  
  return (
    <motion.div
      className={`border-l-4 w-full h-32 overflow-hidden cursor-pointer rounded-md shadow-sm border ${priorityColors[notification.priority]} dark:bg-gray-700 bg-opacity-50 hover:shadow-lg transition-all duration-300`}
      onClick={() => onViewDetails(notification)}
      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center h-full p-4">
        <div className="mr-3">{getIcon(notification.type)}</div>
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{notification.title}</h3>
            <span className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
          <p className="text-sm truncate text-gray-800 dark:text-gray-200">{notification.message}</p>
          <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="mr-2">Posted by: {notification.created_by_user?.name || "Unknown"}</span>
            {notification.team && <span className="mr-2">Team: {notification.team.name}</span>}
          </div>
        </div>
        <div className="flex flex-col ml-3 space-y-1">
          {notification.is_read ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Read</span>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1 text-xs border border-transparent rounded-full text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              title="Mark as read"
            >
              <FiCheck className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(notification.id);
            }}
            className={`p-1 border rounded-full text-xs ${isSelected ? "border-indigo-400 bg-indigo-100 text-indigo-600 dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" : "border-transparent text-purple-600 dark:text-purple-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"}`}
            title={isSelected ? "Deselect" : "Select"}
          >
            {isSelected ? <FiX className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Modal for full notification details
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  
  const priorityColors = {
    critical: "border-red-500 bg-gradient-to-r from-red-50 to-red-100",
    high: "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100",
    medium: "border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100",
    low: "border-green-500 bg-gradient-to-r from-green-50 to-green-100"
  };
  
  const getIcon = (type) => {
    switch(type) {
      case "announcement": return <FiBell className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
      case "leave": return <FiCalendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
      case "task": return <FiCheckSquare className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
      case "meeting": return <FiMessageSquare className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
      case "alert": return <FiAlertTriangle className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
      default: return <FiInfo className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
    }
  };
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-11/12 max-w-2xl p-6 mx-auto overflow-auto bg-white rounded-lg shadow-xl dark:bg-gray-800 max-h-[80vh]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`border-l-4 p-4 rounded-t-lg ${priorityColors[notification.priority]} dark:bg-gray-700 bg-opacity-30`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="mr-2">{getIcon(notification.type)}</div>
              <h2 className="text-xl font-bold text-black dark:text-white">{notification.title}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="mb-1">Posted by: {notification.created_by_user?.name || "Unknown"}</div>
            <div className="mb-1">Posted on: {format(new Date(notification.created_at), "MMM d, yyyy h:mm a")}</div>
            {notification.team && <div className="mb-1">Team: {notification.team.name}</div>}
            <div className="mb-1">Priority: {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}</div>
            <div>Status: {notification.is_read ? "Read" : "Unread"}</div>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[50vh]">
          <p className="text-black dark:text-gray-200">{notification.message}</p>
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          {!notification.is_read && (
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="px-4 py-2 mr-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <span className="flex items-center"><FiCheck className="mr-1" /> Mark as Read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function NotificationsPage({ sidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const loadMoreRef = useRef(null);
  const paginationRef = useRef(null);

  // Fetch announcements with pagination
  const fetchAnnouncements = async (page = 1) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unable to get current user');
      
      setCurrentUserId(user.id);
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date,
          created_by ( id, name, avatar_url ),
          team_id ( id, name ),
          announcement_reads:announcement_reads ( user_id, read )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);
        
      if (error) throw error;

      const mapped = (data || []).map(a => {
        const readEntry = a.announcement_reads?.find(r => r.user_id === user.id);
        return {
          id: a.id,
          title: a.title,
          message: a.content,
          type: 'announcement',
          priority: 'medium',
          is_read: !!readEntry?.read,
          created_at: a.created_at,
          expiry_date: a.expiry_date,
          team: a.team_id,
          created_by: a.created_by,
        };
      });

      setNotifications(prev => page === 1 ? mapped : [...prev, ...mapped]);
      setHasMore(data.length === 10);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          fetchAnnouncements(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loading, hasMore, currentPage]);

  // Initial load
  useEffect(() => {
    fetchAnnouncements(1);
  }, []);

  // Filtered notifications logic
  const filteredNotifications = notifications
    .filter(n => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!n.title.toLowerCase().includes(term) && !n.message.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (filterRead !== 'all' && (filterRead === 'read' ? !n.is_read : n.is_read)) return false;
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      if (dateRange !== 'all') {
        const now = new Date();
        const notificationDate = new Date(n.created_at);
        
        if (dateRange === 'today') {
          return notificationDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return notificationDate >= oneWeekAgo;
        } else if (dateRange === 'month') {
          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return notificationDate >= oneMonthAgo;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dateAsc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'dateDesc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'priority') return ['critical', 'high', 'medium', 'low'].indexOf(a.priority) - 
                                      ['critical', 'high', 'medium', 'low'].indexOf(b.priority);
      return 0;
    });

  // Refresh notifications function
  const refreshNotifications = () => {
    setLoading(true);
    setError(null);
    fetchAnnouncements();
  };

  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      if (!currentUserId) return;
      await supabase.from('announcement_reads').upsert({
        announcement_id: id,
        user_id: currentUserId,
        read: true,
        read_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const handleMarkSelectedAsRead = () => {
    setNotifications(notifications.map(n =>
      selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n
    ));
    setSelectedNotifications([]);
  };

  const handleDeleteSelected = () => {
    if (!window.confirm('Are you sure you want to delete the selected notifications?')) return;
    setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
  };

  const handleCloseModal = () => {
    setSelectedNotification(null);
  };

  // Real-time subscription setup
  useEffect(() => {
    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, (payload) => {
        handleRealtimeUpdate(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleRealtimeUpdate = (payload) => {
    // Handle different event types
    switch (payload.eventType) {
      case 'INSERT':
        setNotifications(prev => [mapAnnouncement(payload.new), ...prev]);
        break;
      case 'UPDATE':
        setNotifications(prev => prev.map(n =>
          n.id === payload.new.id ? mapAnnouncement(payload.new) : n
        ));
        break;
      case 'DELETE':
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        break;
      default:
        break;
    }
  };

  // View mode toggle
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.created_at);
      let groupKey;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = format(date, 'MMMM d, yyyy');
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
      return groups;
    }, {});
  };

  // Render grouped notifications
  const renderGroupedNotifications = () => {
    const grouped = groupNotificationsByDate(filteredNotifications);

    return Object.entries(grouped).map(([date, notifications]) => (
      <div key={date} className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <FiCalendar className="mr-2" /> {date}
        </h3>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notifications.map(notification => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                isSelected={selectedNotifications.includes(notification.id)}
                onSelect={() => handleSelectNotification(notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onViewDetails={() => handleViewDetails(notification)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-4xl mx-auto">
            {notifications.map(notification => (
              <NotificationListItem 
                key={notification.id} 
                notification={notification} 
                isSelected={selectedNotifications.includes(notification.id)}
                onSelect={() => handleSelectNotification(notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onViewDetails={() => handleViewDetails(notification)}
              />
            ))}
          </div>
        )}
      </div>
    ));
  };

  // New Notification List Item Component
  const NotificationListItem = ({ notification, isSelected, onSelect, onMarkAsRead, onViewDetails }) => {
    const priorityColors = {
      critical: "border-red-500 bg-gradient-to-r from-red-50 to-red-100",
      high: "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100",
      medium: "border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100",
      low: "border-green-500 bg-gradient-to-r from-green-50 to-green-100"
    };
    
    const getIcon = (type) => {
      switch(type) {
        case "announcement": return <FiBell className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
        case "leave": return <FiCalendar className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
        case "task": return <FiCheckSquare className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
        case "meeting": return <FiMessageSquare className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
        case "alert": return <FiAlertTriangle className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
        default: return <FiInfo className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
      }
    };
    
    return (
      <motion.div
        className={`border-l-4 w-full max-w-full h-20 overflow-hidden cursor-pointer rounded-md shadow-sm border ${priorityColors[notification.priority]} dark:bg-gray-700 bg-opacity-50 hover:shadow-lg transition-all duration-300`}
        onClick={() => onViewDetails(notification)}
        whileHover={{ scale: 1.01, boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.1)" }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ minWidth: '100%', maxWidth: '100%' }}
      >
        <div className="flex items-center h-full p-3">
          <div className="mr-2">{getIcon(notification.type)}</div>
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{notification.title}</h3>
              <span className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
            </div>
            <p className="text-sm truncate text-gray-800 dark:text-gray-200">{notification.message}</p>
            <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
              <span className="truncate">Posted by: {notification.created_by_user?.name || "Unknown"}</span>
            </div>
          </div>
          <div className="flex ml-2 space-x-1">
            {notification.is_read ? (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Read</span>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="p-1 text-xs border border-transparent rounded-full text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                title="Mark as read"
              >
                <FiCheck className="w-3 h-3" />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(notification.id);
              }}
              className={`p-1 border rounded-full text-xs ${isSelected ? "border-indigo-400 bg-indigo-100 text-indigo-600 dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" : "border-transparent text-purple-600 dark:text-purple-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"}`}
              title={isSelected ? "Deselect" : "Select"}
            >
              {isSelected ? <FiX className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced header with view controls
  return (
    <div className={`flex flex-col h-full ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
      {/* ... existing header code ... */}
      
      <div className="flex-1 overflow-y-auto p-6">
        {renderGroupedNotifications()}
        
        <div ref={loadMoreRef} className="flex justify-center p-4">
          {loading && (
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          )}
          {!hasMore && !loading && (
            <div className="text-gray-500 text-sm py-4">
              You've reached the end of your notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}