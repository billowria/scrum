import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiRefreshCw, FiCheckCircle, FiArchive, FiTrash2, FiMoreHorizontal,
  FiArrowUp, FiSettings, FiPlay, FiPause, FiVolume2, FiVolumeX
} from 'react-icons/fi';
import NotificationCard from './NotificationCard';
import NotificationDetailModal from './NotificationDetailModal';
import { useNotifications } from '../../hooks/useNotifications';

const LOAD_MORE_THRESHOLD = 200; // px from bottom

export default function NotificationStream({ 
  filters = {}, 
  onNotificationAction,
  realTimeEnabled = true 
}) {
  const {
    notifications,
    loading,
    hasMore,
    markAsRead,
    archiveNotification,
    deleteNotification,
    bookmarkNotification,
    loadMore,
    refresh
  } = useNotifications({ filters, realTime: realTimeEnabled });
  
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(realTimeEnabled);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const streamRef = useRef(null);
  const loadMoreRef = useRef(null);
  const autoRefreshInterval = useRef(null);
  const notificationSound = useRef(null);
  
  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio('/sounds/notification.mp3');
    notificationSound.current.volume = 0.3;
  }, []);
  
  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && realTimeEnabled) {
      autoRefreshInterval.current = setInterval(() => {
        refresh();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh, realTimeEnabled, refresh]);
  
  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!streamRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = streamRef.current;
      
      // Show scroll to top button
      setShowScrollTop(scrollTop > 500);
      
      // Load more when near bottom
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD && hasMore && !loading) {
        loadMore();
      }
    };
    
    const streamElement = streamRef.current;
    if (streamElement) {
      streamElement.addEventListener('scroll', handleScroll);
      return () => streamElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading, loadMore]);
  
  // Play notification sound for new notifications
  useEffect(() => {
    if (soundEnabled && notifications.length > 0) {
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount > 0) {
        notificationSound.current?.play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
    }
  }, [notifications.length, soundEnabled]);
  
  const scrollToTop = () => {
    streamRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleNotificationSelect = (notificationId, selected) => {
    const newSelection = new Set(selectedNotifications);
    if (selected) {
      newSelection.add(notificationId);
    } else {
      newSelection.delete(notificationId);
    }
    setSelectedNotifications(newSelection);
  };
  
  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };
  
  const handleBulkAction = async (action) => {
    const notificationIds = Array.from(selectedNotifications);
    setBulkActionsOpen(false);
    
    try {
      switch (action) {
        case 'read':
          await Promise.all(notificationIds.map(id => markAsRead(id)));
          break;
        case 'archive':
          await Promise.all(notificationIds.map(id => archiveNotification(id)));
          break;
        case 'delete':
          await Promise.all(notificationIds.map(id => deleteNotification(id)));
          break;
      }
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  
  const handleNotificationAction = useCallback(async (action, notificationId) => {
    try {
      switch (action) {
        case 'read':
          await markAsRead(notificationId);
          break;
        case 'archive':
          await archiveNotification(notificationId);
          break;
        case 'delete':
          await deleteNotification(notificationId);
          break;
        case 'bookmark':
          await bookmarkNotification(notificationId);
          break;
      }
      onNotificationAction?.(action, notificationId);
    } catch (error) {
      console.error('Notification action failed:', error);
    }
  }, [markAsRead, archiveNotification, deleteNotification, bookmarkNotification, onNotificationAction]);
  
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Open modal with notification details
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };
  
  const handleModalAction = async (action, notification) => {
    // Refresh the notification list after an action
    await refresh();
  };
  
  const filteredNotifications = notifications.filter(notification => {
    if (filters && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase();
      const title = (notification.title || '').toLowerCase();
      const content = (notification.content || notification.message || '').toLowerCase();
      const sender = (notification.sender || '').toLowerCase();
      return title.includes(searchTerm) || content.includes(searchTerm) || sender.includes(searchTerm);
    }
    return true;
  });
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Stream Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Stream
            </h2>
            
            {filteredNotifications.length > 0 && (
              <span className="text-sm text-gray-500">
                {filteredNotifications.length} notifications
              </span>
            )}
            
            {realTimeEnabled && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <motion.button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefresh ? <FiPlay className="w-4 h-4" /> : <FiPause className="w-4 h-4" />}
            </motion.button>
            
            {/* Sound toggle */}
            <motion.button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
            </motion.button>
            
            {/* Refresh button */}
            <motion.button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh notifications"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
        
        {/* Bulk actions bar */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-900">
                  {selectedNotifications.size} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {selectedNotifications.size === notifications.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => handleBulkAction('read')}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Mark read
                </motion.button>
                
                <motion.button
                  onClick={() => handleBulkAction('archive')}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiArchive className="w-4 h-4" />
                  Archive
                </motion.button>
                
                <motion.button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Notification List */}
      <div 
        ref={streamRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              className="relative"
            >
              {/* Selection checkbox */}
              <div className="absolute left-2 top-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedNotifications.has(notification.id)}
                  onChange={(e) => handleNotificationSelect(notification.id, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </div>
              
              <div 
                className="pl-8 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationCard
                  notification={notification}
                  onRead={(id) => handleNotificationAction('read', id)}
                  onArchive={(id) => handleNotificationAction('archive', id)}
                  onDelete={(id) => handleNotificationAction('delete', id)}
                  onBookmark={(id) => handleNotificationAction('bookmark', id)}
                  onReply={(notification) => console.log('Reply to:', notification)}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Empty state */}
        {!loading && filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </motion.div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8">
            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        )}
        
        {/* Load more trigger */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="h-4" />
        )}
      </div>
      
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAction={handleModalAction}
      />
    </div>
  );
}
