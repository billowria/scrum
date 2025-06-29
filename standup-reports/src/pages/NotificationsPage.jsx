import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';
import {
  FiBell,
  FiSearch,
  FiFilter,
  FiCheck,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiCalendar,
  FiClock,
  FiX,
  FiChevronDown,
  FiMoreVertical,
  FiMessageCircle,
  FiPlus,
  FiUser,
  FiMail,
  FiInbox,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import AnnouncementFormModal from '../components/AnnouncementFormModal';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const filterVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

// Enhanced animation variants for cards
const vibrantItemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: (i = 1) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.07,
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  }),
  exit: { y: -30, opacity: 0, transition: { duration: 0.3 } },
  hover: {
    scale: 1.03,
    boxShadow: '0 8px 32px 0 rgba(80, 120, 255, 0.10)',
    background: 'linear-gradient(90deg, #f0f7ff 0%, #e0f7fa 100%)',
    transition: { duration: 0.25 }
  }
};

// Animated badge for new/unread
const AnimatedBadge = ({ children, color }) => (
  <motion.span
    className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${color}`}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.span>
);

// Helper for notification type icon and color
const getNotificationIcon = (type, read) => {
  switch (type) {
    case 'announcement':
      return {
        icon: <FiMail className={`w-6 h-6 ${read ? 'text-gray-400' : 'text-blue-600'}`} />, // Lucide: Megaphone
        bg: read ? 'bg-gray-100' : 'bg-blue-100',
        border: read ? 'border-gray-200' : 'border-blue-500'
      };
    case 'leave_request':
      return {
        icon: <FiCalendar className={`w-6 h-6 ${read ? 'text-gray-400' : 'text-green-600'}`} />, // Lucide: CalendarCheck
        bg: read ? 'bg-gray-100' : 'bg-green-100',
        border: read ? 'border-gray-200' : 'border-green-500'
      };
    default:
      return {
        icon: <FiInbox className="w-6 h-6 text-gray-400" />, // Lucide: Inbox
        bg: 'bg-gray-100',
        border: 'border-gray-200'
      };
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Reset to first page whenever data set or filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, notifications]);

  useEffect(() => {
    fetchNotifications();
    // Subscribe to new notifications
    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, handleNewNotification)
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch announcements with read status
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select(`
          id, created_at, updated_at, title, content, team_id (id, name), created_by (id, name, avatar_url), expiry_date,
          announcement_reads:announcement_reads!announcement_reads_announcement_id_fkey(user_id, read, read_at)
        `)
        .order('created_at', { ascending: false });
      if (annError) throw annError;

      // Map announcements to notification objects
      const announcementNotifications = (announcements || []).map(a => {
        const readEntry = (a.announcement_reads || []).find(r => r.user_id === user.id);
        return {
          id: `announcement-${a.id}`,
          type: 'announcement',
          title: a.title,
          content: a.content,
          created_at: a.created_at,
          expiry_date: a.expiry_date,
          team: a.team_id,
          created_by: a.created_by,
          read: !!readEntry?.read,
          read_at: readEntry?.read_at || null,
        };
      });

      // Fetch leave requests for this user (or for managers, all team requests)
      let leaveNotifications = [];
      const { data: userProfileData } = await supabase
        .from('users')
        .select('role, team_id')
        .eq('id', user.id)
        .single();
      setUserProfile(userProfileData);
      if (userProfileData?.role === 'manager') {
        // Manager: show all team leave requests
        const { data: leaveRequests, error: leaveError } = await supabase
          .from('leave_plans')
          .select(`id, start_date, end_date, status, created_at, user_id, users:user_id (id, name, team_id)`)
          .eq('status', 'pending')
          .eq('users.team_id', userProfileData.team_id)
          .order('created_at', { ascending: false });
        if (leaveError) throw leaveError;
        leaveNotifications = (leaveRequests || []).map(lr => ({
          id: `leave-${lr.id}`,
          type: 'leave_request',
          title: 'Leave Request',
          content: `${lr.users?.name || 'Someone'} requested leave (${lr.start_date} to ${lr.end_date})`,
          created_at: lr.created_at,
          status: lr.status,
          user: lr.users,
          read: false, // Optionally implement per-user read for leave requests
        }));
      } else {
        // Regular user: show their own leave requests
        const { data: leaveRequests, error: leaveError } = await supabase
          .from('leave_plans')
          .select(`id, start_date, end_date, status, created_at, user_id`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (leaveError) throw leaveError;
        leaveNotifications = (leaveRequests || []).map(lr => ({
          id: `leave-${lr.id}`,
          type: 'leave_request',
          title: 'Your Leave Request',
          content: `Leave from ${lr.start_date} to ${lr.end_date} (${lr.status})`,
          created_at: lr.created_at,
          status: lr.status,
          read: true, // User's own requests are always read
        }));
      }

      // Merge and sort notifications
      const allNotifications = [...announcementNotifications, ...leaveNotifications].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (payload) => {
    if (payload.new) {
      setNotifications(prev => [payload.new, ...prev]);
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.type === 'announcement' && !notification.read) {
      try {
        await supabase.from('announcement_reads').upsert({
          announcement_id: notification.id.replace('announcement-', ''),
          user_id: currentUserId,
          read: true,
          read_at: new Date().toISOString(),
        });
        // Optimistically update UI
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString(), justRead: true } : n
          )
        );
        setToast({
          message: 'Marked as read',
          type: 'success',
        });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 2000);
      } catch (error) {
        setToast({ message: 'Failed to mark as read', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 2000);
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleDeleteNotification = async (notification) => {
    const [type, rawId] = notification.id.split('-');
    try {
      if (type === 'announcement') {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', rawId);
        if (error) throw error;
      }
      // For other types, simply remove locally (or implement backend deletion if desired)
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'unread') return !notification.read && matchesSearch;
    if (selectedFilter === 'read') return notification.read && matchesSearch;
    if (selectedFilter === 'expired') {
      return new Date(notification.expiry_date) < new Date() && matchesSearch;
    }
    return matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(indexOfFirst, indexOfLast);

  const handleCardClick = (notification) => {
    handleMarkAsRead(notification);
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleSelectNotification = (e, notificationId) => {
    e.stopPropagation(); // Prevent card click when selecting
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Helper for leave status badge
  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">Rejected</span>;
      case 'pending':
      default:
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">Pending</span>;
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === `leave-${leaveId}` ? { ...n, processing: true } : n
      )
    );
    try {
      const { error } = await supabase
        .from('leave_plans')
        .update({ status: action })
        .eq('id', leaveId);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === `leave-${leaveId}` ? { ...n, status: action, processing: false } : n
        )
      );
      setToast({ message: `Leave request ${action}`, type: 'success' });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast({ message: `Failed to ${action} leave request`, type: 'error' });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2000);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === `leave-${leaveId}` ? { ...n, processing: false } : n
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <FiBell className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {notifications.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                className="relative px-5 py-2.5 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-full font-semibold flex items-center gap-2 drop-shadow-lg transition-all hover:from-primary-600 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
                whileHover={{ scale: 1.07, rotate: 0.5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAnnouncementForm(true)}
              >
                <FiPlus />
                New Announcement
              </motion.button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              >
                <FiFilter className="w-5 h-5 text-gray-500" />
                <span>Filter</span>
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              </motion.button>

              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10"
                  >
                    <div className="py-1">
                      {['all', 'unread', 'read', 'expired'].map((filter) => (
                        <button
                          key={filter}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                            selectedFilter === filter ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedFilter(filter);
                            setIsFilterMenuOpen(false);
                          }}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {loading ? (
              // Skeleton loading state
              [...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white rounded-xl p-6 shadow-sm animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : paginatedNotifications.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl p-8 shadow-sm text-center"
              >
                <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">There are no notifications matching your criteria.</p>
              </motion.div>
            ) : (
              paginatedNotifications.map((notification, i) => {
                const { icon, bg, border } = getNotificationIcon(notification.type, notification.read);
                const isUnread = notification.type === 'announcement' && !notification.read;
                return (
                  <motion.div
                    key={notification.id}
                    custom={i}
                    variants={vibrantItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 24px 0 rgba(80,120,255,0.10)' }}
                    layoutId={notification.id}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl shadow-md transition-all cursor-pointer bg-white ${border} border-l-4 group
                      ${isUnread ? 'ring-2 ring-blue-100' : ''}
                      ${isUnread ? 'bg-blue-50' : 'bg-white'}
                    `}
                    onClick={() => handleCardClick(notification)}
                  >
                    {/* Left: Icon with colored background */}
                    <div className={`flex-shrink-0 rounded-full p-3 ${bg} border ${border} shadow-sm transition-all`}>
                      {icon}
                    </div>
                    {/* Center: Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-base truncate ${isUnread ? 'text-blue-900' : 'text-gray-900'}`}>{notification.title}</span>
                        {isUnread && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread" />}
                      </div>
                      <div className="text-gray-700 text-sm line-clamp-2 mb-1">{notification.content}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        {notification.created_at && !isNaN(new Date(notification.created_at)) && (
                          <span className="flex items-center gap-1"><FiClock className="w-4 h-4" />{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        )}
                        {notification.team && notification.team.name && (
                          <span className="flex items-center gap-1"><FiUser className="w-4 h-4" />{notification.team.name}</span>
                        )}
                        {notification.expiry_date && !isNaN(new Date(notification.expiry_date)) && (
                          <span className="flex items-center gap-1"><FiInfo className="w-4 h-4" />Expires {format(new Date(notification.expiry_date), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 ml-2">
                      {isUnread ? (
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: '#2563eb', color: '#fff' }}
                          whileTap={{ scale: 0.95 }}
                          className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs shadow hover:bg-blue-600 hover:text-white transition-all"
                          onClick={e => { e.stopPropagation(); handleMarkAsRead(notification); }}
                        >
                          Mark as Read
                        </motion.button>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><FiCheckCircle className="w-4 h-4" />Read</span>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-red-600 rounded-full transition-colors"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification); }}
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                          <FiMoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination Controls */}
        {filteredNotifications.length > itemsPerPage && (
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </p>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg border ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={`p-2 rounded-lg border ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedNotification.created_by?.avatar_url ? (
                      <img
                        src={selectedNotification.created_by.avatar_url}
                        alt={selectedNotification.created_by.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium text-lg">
                          {selectedNotification.created_by?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedNotification.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        By {selectedNotification.created_by?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedNotification.content}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {selectedNotification && selectedNotification.created_at && !isNaN(new Date(selectedNotification.created_at)) && (
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                        </div>
                      )}
                      {selectedNotification && selectedNotification.team && selectedNotification.team.name && (
                        <div className="flex items-center">
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                            {selectedNotification.team.name}
                          </span>
                        </div>
                      )}
                      {selectedNotification && selectedNotification.expiry_date && !isNaN(new Date(selectedNotification.expiry_date)) && (
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          Expires {format(new Date(selectedNotification.expiry_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast/Snackbar */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-white
              ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for creating announcement */}
      <AnnouncementFormModal
        open={showAnnouncementForm}
        onClose={() => setShowAnnouncementForm(false)}
        onSuccess={() => { setShowAnnouncementForm(false); fetchNotifications(); }}
      />
    </div>
  );
};

export default NotificationsPage; 