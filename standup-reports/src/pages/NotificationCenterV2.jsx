import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import notificationService from '../services/notificationService';
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

// Components
import NotificationCard from '../components/notifications/NotificationCard';
import NotificationSidebar from '../components/notifications/NotificationSidebar';
import NotificationStats from '../components/notifications/NotificationStats';
import NotificationCreator from '../components/notifications/NotificationCreator';
import NotificationSettingsModal from '../components/notifications/NotificationSettingsModal';

// Icons
import { FiCheck, FiRefreshCw, FiBell, FiPlus, FiSearch, FiArrowLeft, FiFilter, FiChevronLeft } from 'react-icons/fi';

export default function NotificationCenterV2() {
  const { isAnimatedTheme } = useTheme();
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ unread: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch User
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, role, team_id, company_id')
          .eq('id', user.id)
          .single();
        setCurrentUser(userData);
      }
    };
    fetchUser();
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const result = await notificationService.getNotifications({
        userId: currentUser.id,
        role: currentUser.role,
        teamId: currentUser.company_id || currentUser.team_id,
        limit: 100 // Fetch more for client-side filtering feeling smooth
      });

      setNotifications(result.notifications);

      // Calculate stats
      const unreadCount = result.notifications.filter(n => !n.read).length;
      setStats({
        total: result.total,
        unread: unreadCount,
        // Calculate counts for filters
        task: result.notifications.filter(n => n.category === 'task').length,
        project: result.notifications.filter(n => n.category === 'project').length,
        mention: result.notifications.filter(n => n.type === 'mention').length,
        system: result.notifications.filter(n => n.category === 'system').length,
        achievement: result.notifications.filter(n => n.category === 'achievement').length,
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  // Initial Fetch & Real-time Subscription
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();

      // Subscribe to real-time updates
      const subscriptionKey = notificationService.subscribeToNotifications(
        currentUser.id,
        currentUser.role,
        currentUser.team_id,
        () => {
          // Debounce or just refetch
          fetchNotifications();
        }
      );

      return () => {
        notificationService.unsubscribeFromNotifications(subscriptionKey);
      };
    }
  }, [currentUser, fetchNotifications]);

  // Filter Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Text Search (Title, Message, Sender Name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const senderName = n.created_by_user?.name?.toLowerCase() || '';
        const matchesSearch =
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          senderName.includes(query);

        if (!matchesSearch) return false;
      }

      // 2. Category Filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !n.read;
      if (activeFilter === 'mention') return n.type === 'mention';
      return n.category === activeFilter; // task, project, system, achievement
    });
  }, [notifications, activeFilter, searchQuery]);

  // Group Notifications by Date
  const groupedNotifications = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      week: [],
      older: []
    };

    const oneWeekAgo = subDays(new Date(), 7);

    filteredNotifications.forEach(n => {
      const date = new Date(n.created_at);
      if (isToday(date)) {
        groups.today.push(n);
      } else if (isYesterday(date)) {
        groups.yesterday.push(n);
      } else if (isAfter(date, oneWeekAgo)) {
        groups.week.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Actions
  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    await notificationService.markAsRead(id, currentUser.id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => notificationService.markAsRead(id, currentUser.id)));
    fetchNotifications();
  };

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
  };

  const handleAction = async (notification, action) => {
    try {
      if (notification.type === 'leave_request') {
        const leaveId = notification.id.replace('leave-', '');
        await notificationService.handleLeaveAction(leaveId, action);
        fetchNotifications();
      } else {
        console.log('Action not implemented for this type', notification.type);
      }
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  if (loading && !notifications.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isAnimatedTheme ? 'bg-transparent' : 'bg-gray-50 dark:bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isAnimatedTheme ? 'border-white' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  const GroupHeader = ({ label, count }) => (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <h3 className={`text-sm font-bold uppercase tracking-wider ${isAnimatedTheme ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>{label}</h3>
      <div className={`h-px flex-1 ${isAnimatedTheme ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-800'}`} />
      <span className={`text-xs font-medium ${isAnimatedTheme ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'}`}>{count}</span>
    </div>
  );

  return (
    <div className={`min-h-screen ${isAnimatedTheme ? 'bg-transparent' : (isMobile ? 'bg-white dark:bg-slate-950' : 'bg-gray-50/50 dark:bg-slate-950')}`}>
      <div className={`w-full max-w-[1920px] mx-auto ${isMobile ? 'px-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>

        {/* Mobile Header */}
        {isMobile ? (
          <div className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 py-4 ${isAnimatedTheme ? 'bg-black/30 border-white/10' : 'bg-white/80 dark:bg-slate-950/80 border-gray-100 dark:border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className={`p-2 -ml-2 ${isAnimatedTheme ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
                <h1 className={`text-xl font-bold ${isAnimatedTheme ? '!text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>Notifications</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className={`p-2 rounded-full transition-colors ${isAnimatedTheme ? 'text-white/80 active:bg-white/10' : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-slate-800'}`}
                >
                  <FiCheck className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={`p-2 rounded-full transition-colors ${isAnimatedTheme ? 'text-white/80 active:bg-white/10' : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-slate-800'}`}
                >
                  <FiFilter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="relative group">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isAnimatedTheme ? 'text-white/50 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none w-full transition-all ${isAnimatedTheme ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40' : 'bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
              />
            </div>
          </div>
        ) : (
          /* Desktop Header Section */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-bold ${isAnimatedTheme ? '!text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>Notification Center</h1>
              <p className={`text-sm mt-1 ${isAnimatedTheme ? '!text-white/80 drop-shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                You have {stats.unread} unread notifications
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative group">
                <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isAnimatedTheme ? 'text-white/50 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                <input
                  type="text"
                  placeholder="Search by text or sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none w-full sm:w-64 transition-all backdrop-blur-sm ${isAnimatedTheme ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40' : 'bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                />
              </div>

              <button
                onClick={() => setShowCreator(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${isAnimatedTheme ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-blue-200 dark:shadow-indigo-950/50'}`}
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Notification</span>
              </button>

              <button
                onClick={handleMarkAllRead}
                className={`p-2 rounded-lg transition-colors ${isAnimatedTheme ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                title="Mark all as read"
              >
                <FiCheck className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'gap-8'} relative`}>
          {/* Sidebar Navigation */}
          {isMobile ? (
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`fixed inset-y-0 right-0 z-50 w-72 shadow-2xl overflow-y-auto ${isAnimatedTheme ? 'bg-black/60 backdrop-blur-xl border-l border-white/10' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <div className={`p-4 border-b flex items-center justify-between ${isAnimatedTheme ? 'border-white/10' : 'border-gray-100 dark:border-slate-800'}`}>
                      <h2 className={`font-bold ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Filters</h2>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 text-gray-500"
                      >
                        <FiCheck className="w-5 h-5 rotate-45" /> {/* Just using an icon for close for now or FiPlus rotate */}
                      </button>
                    </div>
                    <div className="p-2">
                      <NotificationSidebar
                        activeFilter={activeFilter}
                        onFilterChange={(f) => { setActiveFilter(f); setIsSidebarOpen(false); }}
                        counts={stats}
                        onOpenSettings={() => { setShowSettings(true); setIsSidebarOpen(false); }}
                        isOpen={true}
                        onToggle={() => { }}
                        hideToggle={true}
                        isAnimatedTheme={isAnimatedTheme}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          ) : (
            <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} shrink-0`}>
              <NotificationSidebar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={stats}
                onOpenSettings={() => setShowSettings(true)}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                isAnimatedTheme={isAnimatedTheme}
              />
            </div>
          )}

          {/* Main Feed */}
          <div className={`${isMobile ? 'px-4' : 'flex-1 min-w-0'}`}>
            <AnimatePresence mode="popLayout">
              {filteredNotifications.length > 0 ? (
                <div className={`space-y-1 ${isMobile ? 'pb-24 pt-4' : 'pb-20'}`}>
                  {/* Today */}
                  {groupedNotifications.today.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <GroupHeader label="Today" count={groupedNotifications.today.length} />
                      {groupedNotifications.today.map(n => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          onClick={() => { }}
                          onAction={handleAction}
                        />
                      ))}
                    </motion.div>
                  )}


                  {/* Yesterday */}
                  {groupedNotifications.yesterday.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <GroupHeader label="Yesterday" count={groupedNotifications.yesterday.length} />
                      {groupedNotifications.yesterday.map(n => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          onClick={() => { }}
                          onAction={handleAction}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* This Week */}
                  {groupedNotifications.week.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <GroupHeader label="Earlier This Week" count={groupedNotifications.week.length} />
                      {groupedNotifications.week.map(n => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          onClick={() => { }}
                          onAction={handleAction}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <GroupHeader label="Older" count={groupedNotifications.older.length} />
                      {groupedNotifications.older.map(n => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          onClick={() => { }}
                          onAction={handleAction}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed backdrop-blur-sm ${isAnimatedTheme ? 'bg-white/5 border-white/20' : 'bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isAnimatedTheme ? 'bg-white/10' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                    <FiBell className={`w-8 h-8 ${isAnimatedTheme ? 'text-white/50' : 'text-blue-300 dark:text-blue-400'}`} />
                  </div>
                  <h3 className={`text-lg font-medium mb-1 ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    No notifications found
                  </h3>
                  <p className={`max-w-sm ${isAnimatedTheme ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                    {searchQuery
                      ? `No matches found for "${searchQuery}"`
                      : activeFilter === 'all'
                        ? "You're all caught up! Check back later."
                        : `No notifications in ${activeFilter}.`}
                  </p>
                  {(activeFilter !== 'all' || searchQuery) && (
                    <button
                      onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                      className={`mt-4 font-medium ${isAnimatedTheme ? 'text-white hover:text-white/80' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Clear filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={currentUser?.id}
      />

      {/* Creator Modal */}
      <NotificationCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onSuccess={() => {
          fetchNotifications();
        }}
        currentUser={currentUser}
      />
    </div>
  );
}