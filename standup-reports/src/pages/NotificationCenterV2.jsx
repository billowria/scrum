import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiBell, FiSettings, FiSearch, FiFilter, FiGrid, FiList,
  FiTrendingUp, FiZap, FiEye, FiEyeOff, FiRefreshCw, FiDownload,
  FiStar, FiHeart, FiMessageCircle, FiUsers, FiCalendar, FiClock,
  FiTarget, FiBookmark, FiShare2, FiMoreVertical, FiChevronDown,
  FiActivity, FiBarChart, FiPieChart, FiTrendingDown
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import notificationService from '../services/notificationService';

// Import components (we'll create these)
import NotificationCreator from '../components/notifications/NotificationCreator';
import CategoryDashboard from '../components/notifications/CategoryDashboard';
import NotificationStream from '../components/notifications/NotificationStream';
import SmartFilters from '../components/notifications/SmartFilters';
import NotificationInsights from '../components/notifications/NotificationInsights';

// Floating Action Button with morphing animation
const FloatingActionButton = ({ onClick, isCreating }) => {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.button
        onClick={onClick}
        className="relative w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 text-white overflow-hidden group"
        animate={isCreating ? { scale: 0 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 border-2 border-indigo-400 rounded-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Icon with rotation */}
        <motion.div
          className="relative z-10 flex items-center justify-center w-full h-full"
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <FiPlus className="w-6 h-6" />
        </motion.div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
      
      {/* Tooltip */}
      <motion.div
        className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ y: 10, opacity: 0 }}
        whileHover={{ y: 0, opacity: 1 }}
      >
        Create Notification
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </motion.div>
    </motion.div>
  );
};

// Animated Stats Counter
const AnimatedCounter = ({ value, label, icon: Icon, color = "text-blue-600" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (value === 0) return;
    let current = 0;
    const increment = value / 30;
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
  }, [value]);
  
  return (
    <motion.div
      className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color.replace('text-', 'from-').replace('-600', '-100')} ${color.replace('text-', 'to-').replace('-600', '-200')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <motion.div 
          className="text-2xl font-bold text-gray-900"
          key={count}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {count}
        </motion.div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
      </div>
    </motion.div>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon: Icon, label, onClick, variant = "default" }) => {
  const variants = {
    default: "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent",
    danger: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all duration-200 ${variants[variant]}`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </motion.button>
  );
};

export default function NotificationCenterV2() {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [viewMode, setViewMode] = useState('stream'); // 'dashboard', 'stream', 'insights'
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
    search: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({});

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, role, team_id, avatar_url')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(userData);
        setUserRole(userData.role);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user information');
      }
    };
    
    fetchUser();
  }, []);

  // Fetch notifications and stats
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        userId: currentUser.id,
        role: userRole,
        teamId: currentUser.team_id,
        limit: 100,
        ...filters
      });
      
      setNotifications(result.notifications);
      
      // Get advanced stats
      const notificationStats = await notificationService.getNotificationStats(
        currentUser.id,
        userRole,
        currentUser.team_id
      );
      setStats(notificationStats);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole, filters]);

  // Initial fetch
  useEffect(() => {
    if (currentUser && userRole) {
      fetchNotifications();
    }
  }, [currentUser, userRole, fetchNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const subscriptionKey = notificationService.subscribeToNotifications(
      currentUser.id,
      userRole,
      currentUser.team_id,
      (type) => {
        console.log('Real-time notification update:', type);
        fetchNotifications();
      }
    );

    return () => {
      notificationService.unsubscribeFromNotifications(subscriptionKey);
    };
  }, [currentUser, userRole, fetchNotifications]);

  // Memoized values
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Derive category from type if not present to ensure consistent categorization
      const derivedCategory = notification.category || notificationService.getNotificationCategory(notification.type);
      if (filters.category !== 'all' && derivedCategory !== filters.category) return false;
      if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
      if (filters.status === 'unread' && notification.read) return false;
      if (filters.status === 'read' && !notification.read) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (notification.title || '').toLowerCase().includes(search) || 
               (notification.message || '').toLowerCase().includes(search);
      }
      return true;
    });
  }, [notifications, filters]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Event handlers
  const handleCreateNotification = () => {
    setShowCreator(true);
  };

  const handleNotificationCreated = (notification) => {
    // Refresh notifications to get the latest data
    fetchNotifications();
    setShowCreator(false);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="mt-4 text-gray-600 font-medium">Loading Notification Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBell className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Stunning Header */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
        </div>
        
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Title Section */}
            <div className="flex items-center">
              <motion.div
                className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FiBell className="w-8 h-8 text-white" />
                {unreadCount > 0 && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </motion.div>
              
              <div className="ml-6">
                <motion.h1
                  className="text-3xl lg:text-4xl font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Notification Center
                </motion.h1>
                <motion.p
                  className="text-indigo-100 text-lg mt-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Stay connected with intelligent insights
                </motion.p>
              </div>
            </div>
            
            {/* Stats Dashboard */}
            <motion.div
              className="grid grid-cols-4 gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total || 0}</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-300">{stats.unread || 0}</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">{stats.engagementRate || 0}%</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Engaged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-300">{stats.responseTime || 0}m</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Response</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* View Mode Selector & Quick Actions */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* View Mode Tabs */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: FiGrid },
                  { key: 'stream', label: 'Stream', icon: FiList },
                  { key: 'insights', label: 'Insights', icon: FiBarChart }
                ].map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => handleViewModeChange(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      viewMode === key
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <QuickActionButton
                  icon={FiRefreshCw}
                  label="Refresh"
                  onClick={handleRefresh}
                />
                <QuickActionButton
                  icon={FiFilter}
                  label={sidebarOpen ? "Hide Filters" : "Show Filters"}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <QuickActionButton
                  icon={FiSettings}
                  label="Settings"
                  onClick={() => {/* TODO: Open settings */}}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Sidebar - Smart Filters */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="hidden lg:block w-80 flex-shrink-0"
              >
                <SmartFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  stats={stats}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-h-[600px]">
            <AnimatePresence mode="wait">
              {viewMode === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CategoryDashboard
                    notifications={filteredNotifications}
                    stats={stats}
                    onCategorySelect={(category) => handleFilterChange({ category })}
                  />
                </motion.div>
              )}
              
              {viewMode === 'stream' && (
                <motion.div
                  key="stream"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <NotificationStream
                    filters={filters}
                    onNotificationAction={() => {}}
                    realTimeEnabled={true}
                  />
                </motion.div>
              )}
              
              {viewMode === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <NotificationInsights
                    stats={stats}
                    notifications={filteredNotifications}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={handleCreateNotification}
        isCreating={showCreator}
      />

      {/* Notification Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <NotificationCreator
            isOpen={showCreator}
            onClose={() => setShowCreator(false)}
            onSuccess={handleNotificationCreated}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}