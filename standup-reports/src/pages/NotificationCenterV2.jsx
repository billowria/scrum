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

      console.log('NotificationCenter: Fetching notifications for user:', {
        userId: currentUser.id,
        role: userRole,
        teamId: companyOrTeamId,
        filters
      });

      const result = await notificationService.getNotifications({
        userId: currentUser.id,
        role: userRole,
        teamId: companyOrTeamId,
        limit: 100,
        ...filters
      });

      console.log('NotificationCenter: Fetched notifications:', {
        total: result.total,
        notifications: result.notifications.length,
        categories: result.notifications.map(n => ({
          title: n.title,
          type: n.type,
          category: n.category
        }))
      });

      setNotifications(result.notifications);

      // Get advanced stats
      const notificationStats = await notificationService.getNotificationStats(
        currentUser.id,
        userRole,
        currentUser.company_id || currentUser.team_id
      );

      console.log('NotificationCenter: Notification stats:', notificationStats);
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

    console.log('NotificationCenter: Setting up real-time subscriptions for user:', currentUser.id);

    // Subscribe to announcements (existing)
    const announcementsChannel = supabase
      .channel('announcements_nc')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          console.log('NotificationCenter: New announcement received:', payload);
          fetchNotifications();
        }
      );

    // Subscribe to tasks table changes
    const tasksChannel = supabase
      .channel('tasks_nc')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('NotificationCenter: Task table changed:', payload);
          fetchNotifications();
        }
      );

    // Subscribe to projects table changes (if exists)
    const projectsChannel = supabase
      .channel('projects_nc')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('NotificationCenter: Project table changed:', payload);
          fetchNotifications();
        }
      );

    // Subscribe to leave requests
    const leaveRequestsChannel = supabase
      .channel('leave_requests_nc')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leave_plans'
        },
        (payload) => {
          console.log('NotificationCenter: New leave request:', payload);
          fetchNotifications();
        }
      );

    // Subscribe to timesheet submissions
    const timesheetChannel = supabase
      .channel('timesheets_nc')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timesheet_submissions'
        },
        (payload) => {
          console.log('NotificationCenter: New timesheet submission:', payload);
          fetchNotifications();
        }
      );

    // Subscribe to all channels
    announcementsChannel.subscribe();
    tasksChannel.subscribe();
    projectsChannel.subscribe();
    leaveRequestsChannel.subscribe();
    timesheetChannel.subscribe();

    return () => {
      console.log('NotificationCenter: Cleaning up subscriptions');
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(leaveRequestsChannel);
      supabase.removeChannel(timesheetChannel);
    };
  }, [currentUser, fetchNotifications]);

  // Memoized values
  const filteredNotifications = useMemo(() => {
    const filtered = notifications.filter(notification => {
      // Derive category from type if not present to ensure consistent categorization
      const derivedCategory = notification.category || notificationService.getNotificationCategory(notification.type);

      // Debug filtering logic
      if (filters.category !== 'all') {
        console.log('Filtering by category:', {
          notificationTitle: notification.title,
          notificationType: notification.type,
          originalCategory: notification.category,
          derivedCategory,
          filterCategory: filters.category,
          matches: derivedCategory === filters.category
        });
      }

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

    console.log('NotificationCenter: Filtered notifications:', {
      total: notifications.length,
      filtered: filtered.length,
      filters,
      breakdown: filtered.reduce((acc, n) => {
        const category = n.category || notificationService.getNotificationCategory(n.type);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    });

    return filtered;
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

      {/* Debug Panel - Notification Categories */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="font-medium text-yellow-800">Debug: Notification Categories</span>
            <div className="flex gap-3">
              <span className="text-gray-600">
                Total: <span className="font-bold text-gray-800">{notifications.length}</span>
              </span>
              <span className="text-gray-600">
                Tasks: <span className="font-bold text-indigo-600">
                  {notifications.filter(n => {
                    const category = n.category || notificationService.getNotificationCategory(n.type);
                    return category === 'task';
                  }).length}
                </span>
              </span>
              <span className="text-gray-600">
                Projects: <span className="font-bold text-emerald-600">
                  {notifications.filter(n => {
                    const category = n.category || notificationService.getNotificationCategory(n.type);
                    return category === 'project';
                  }).length}
                </span>
              </span>
              <span className="text-gray-600">
                Other: <span className="font-bold text-gray-600">
                  {notifications.filter(n => {
                    const category = n.category || notificationService.getNotificationCategory(n.type);
                    return category !== 'task' && category !== 'project';
                  }).length}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={fetchNotifications}
            className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

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