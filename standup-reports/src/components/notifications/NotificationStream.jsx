import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRefreshCw, FiCheckCircle, FiArchive, FiTrash2, FiArrowUp,
  FiBell, FiCheck, FiX, FiExternalLink, FiCalendar, FiPlus, FiEdit,
  FiUser, FiMessageSquare, FiFolder, FiTarget, FiAlertTriangle, FiMessageCircle, FiClock
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import notificationService from '../../services/notificationService';
import NotificationDetailModal from './NotificationDetailModal';
import NotificationCard from './NotificationCard';

const LOAD_MORE_THRESHOLD = 200;

export default function NotificationStream({
  filters = {},
  onNotificationAction,
  realTimeEnabled = true,
  notifications = [],
  loading = false
}) {
  const [localNotifications, setLocalNotifications] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const streamRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, role, team_id')
            .eq('id', user.id)
            .single();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Update local notifications when parent notifications change
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  // Real-time subscription
  useEffect(() => {
    if (!currentUser || !realTimeEnabled) return;

    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          // Check if this announcement is relevant to current user
          const announcement = payload.new;
          if (notificationService.isNotificationRelevant(announcement, currentUser)) {
            // Transform announcement to notification format
            const notification = {
              id: announcement.id,
              title: announcement.title,
              message: announcement.content,
              type: announcement.notification_type || 'general',
              priority: announcement.priority || 'Medium',
              created_at: announcement.created_at,
              updated_at: announcement.updated_at,
              read: false,
              sender_name: 'System', // Would need to fetch user details
              team_id: announcement.team_id,
              task_id: announcement.task_id,
              metadata: announcement.metadata
            };
            setLocalNotifications(prev => [notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, realTimeEnabled]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (!streamRef.current) return;

      const { scrollTop } = streamRef.current;
      setShowScrollTop(scrollTop > 500);
    };

    const element = streamRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setLocalNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      onNotificationAction?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
      onNotificationAction?.();
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
      onNotificationAction?.();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Quick actions
  const handleQuickAction = async (action, notificationId) => {
    switch (action) {
      case 'markRead':
        await markAsRead(notificationId);
        break;
      case 'archive':
        await archiveNotification(notificationId);
        break;
      case 'delete':
        await deleteNotification(notificationId);
        break;
      case 'view':
        const notification = localNotifications.find(n => n.id === notificationId);
        setSelectedNotification(notification);
        setShowModal(true);
        if (!notification.read) {
          await markAsRead(notificationId);
        }
        break;
      case 'refresh':
        // Remove the notification from the local list when leave request is approved/rejected
        setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
        onNotificationAction?.();
        break;
    }
  };

  // Refresh
  const refresh = () => {
    fetchNotifications(true);
  };

  // Scroll to top
  const scrollToTop = () => {
    streamRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get notification icon and colors
  const getNotificationIcon = (type) => {
    const iconMap = {
      announcement: FiBell,
      leave_request: FiCalendar,
      timesheet_submission: FiClock,
      task_created: FiPlus,
      task_updated: FiEdit,
      task_assigned: FiUser,
      task_comment: FiMessageSquare,
      project_update: FiFolder,
      sprint_update: FiTarget,
      system_alert: FiAlertTriangle,
      general: FiMessageCircle,
      meeting: FiCalendar,
      task_status_change: FiEdit,
      // Fallback for unknown types
      default: FiBell
    };
    const Icon = iconMap[type] || iconMap.default;
    return <Icon className="w-4 h-4" />;
  };

  const getNotificationColors = (type, priority) => {
    const baseColors = {
      announcement: 'border-blue-200 bg-blue-50 text-blue-700',
      leave_request: 'border-purple-200 bg-purple-50 text-purple-700',
      timesheet_submission: 'border-green-200 bg-green-50 text-green-700',
      task_created: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      task_updated: 'border-amber-200 bg-amber-50 text-amber-700',
      task_assigned: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      task_comment: 'border-teal-200 bg-teal-50 text-teal-700',
      project_update: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      sprint_update: 'border-rose-200 bg-rose-50 text-rose-700',
      system_alert: 'border-red-200 bg-red-50 text-red-700'
    };

    return baseColors[type] || 'border-gray-200 bg-gray-50 text-gray-700';
  };

  if (loading && localNotifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <motion.div
            className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="mt-3 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (localNotifications.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p className="text-gray-600">You're all caught up! Check back later for new notifications.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stream Container */}
      <div
        ref={streamRef}
        className="h-[calc(100vh-8rem)] overflow-y-auto space-y-3 pr-2"
      >
        <AnimatePresence>
          {localNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NotificationCard
                notification={notification}
                onAction={handleQuickAction}
                currentUser={currentUser}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <motion.div
              className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* End of notifications */}
        {localNotifications.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            Showing all {localNotifications.length} notifications
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedNotification && (
          <NotificationDetailModal
            isOpen={showModal}
            notification={selectedNotification}
            onClose={() => {
              setShowModal(false);
              setSelectedNotification(null);
            }}
            onAction={handleQuickAction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}