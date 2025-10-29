import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import notificationService from '../services/notificationService';

// Import components
import NotificationCreator from '../components/notifications/NotificationCreator';
import NotificationStream from '../components/notifications/NotificationStream';
import SmartFilters from '../components/notifications/SmartFilters';
import NotificationHeader from '../components/notifications/NotificationHeader';


export default function NotificationCenterV2() {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
    search: ''
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [stats, setStats] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toggle filters visibility
  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, role, team_id, company_id, avatar_url')
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
      const companyOrTeamId = currentUser.company_id || currentUser.team_id;

      const result = await notificationService.getNotifications({
        userId: currentUser.id,
        role: userRole,
        teamId: companyOrTeamId,
        limit: 100,
        ...filters
      });
      
      setNotifications(result.notifications);
      
      // Get advanced stats
      const notificationStats = await notificationService.getNotificationStats(
        currentUser.id,
        userRole,
        currentUser.company_id || currentUser.team_id
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleToggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
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
      {/* Compact Header */}
      <NotificationHeader
        unreadCount={unreadCount}
        totalNotifications={stats.total || 0}
        responseTime={stats.responseTime}
        onCreateNotification={handleCreateNotification}
        onRefresh={handleRefresh}
        onToggleFilters={handleToggleFilters}
        showFilters={isFiltersVisible}
        onSearch={handleSearch}
        searchQuery={filters.search}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Smart Filters */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <SmartFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            stats={stats}
          />
        </div>

          {/* Main Content - Notification Stream */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <NotificationStream
                filters={filters}
                onNotificationAction={fetchNotifications}
                realTimeEnabled={true}
                notifications={notifications}
                loading={loading}
              />
            </motion.div>
          </div>
        </div>
      </div>

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