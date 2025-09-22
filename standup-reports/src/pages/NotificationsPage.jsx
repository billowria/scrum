import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiFilter, FiSearch, FiCheck, FiTrash2, FiAlertCircle, FiInfo, 
  FiEye, FiClock, FiMessageSquare, FiCheckSquare, FiAlertTriangle, FiX, 
  FiGrid, FiList, FiUser, FiRefreshCw, FiCalendar, FiUsers, FiSettings, 
  FiTrendingUp, FiActivity, FiMail, FiInbox, FiArchive, FiStar,
  FiChevronDown, FiMoreVertical, FiShare2, FiDownload
} from 'react-icons/fi';
import ContentLoader from '../components/ContentLoader';

// Enhanced Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 25 
    } 
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Professional Enhanced Header Component
const NotificationsHeader = ({ 
  notifications, 
  unreadCount, 
  selectedType, 
  onTypeChange, 
  onRefresh, 
  onBulkAction,
  selectedNotifications,
  onClearAll,
  totalCount,
  hasMore,
  onLoadMore,
  loading,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange
}) => {
  const typeStats = {
    all: notifications.length,
    announcement: notifications.filter(n => n.type === 'announcement').length,
    leave_request: notifications.filter(n => n.type === 'leave_request').length,
    timesheet: notifications.filter(n => n.type === 'timesheet').length
  };

  return (
    <div className="relative mb-4">
      {/* Stunning Gradient Header */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-2xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
        </div>

        {/* Floating Animation Elements */}
        <motion.div
          className="absolute top-6 right-12 w-3 h-3 bg-blue-400/70 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 left-12 w-2 h-2 bg-indigo-400/60 rounded-full"
          animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-2.5 h-2.5 bg-purple-400/50 rounded-full"
          animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
        />

        <div className="relative p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Enhanced Left Section */}
            <div className="flex items-center gap-6">
              <motion.div
                className="relative p-5 bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 shadow-xl"
                whileHover={{ scale: 1.08, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FiBell className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-3xl blur-xl" />
                {unreadCount > 0 && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </motion.div>

              <div>
                <motion.h1
                  className="text-4xl lg:text-5xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Notification Center
                </motion.h1>
                <motion.p
                  className="text-blue-100/90 text-lg lg:text-xl"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Stay connected with your team's activities
                </motion.p>
              </div>
            </div>

            {/* Enhanced Stats Dashboard */}
            <motion.div
              className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20 shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{notifications.length}</div>
                <div className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">Total</div>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300">{unreadCount}</div>
                <div className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">Unread</div>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300">
                  {notifications.filter(n => n.type === 'leave_request' && n.status === 'pending').length}
                </div>
                <div className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">Pending</div>
              </div>
              {totalCount > notifications.length && (
                <>
                  <div className="w-px h-10 bg-white/30" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-300">{totalCount}</div>
                    <div className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">Available</div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Control Panel */}
      <motion.div
        className="mt-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Enhanced Search & Filter Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All', icon: <FiBell className="w-4 h-4" />, count: typeStats.all, color: 'indigo' },
                { key: 'announcement', label: 'Announcements', icon: <FiMessageSquare className="w-4 h-4" />, count: typeStats.announcement, color: 'blue' },
                { key: 'leave_request', label: 'Leave Requests', icon: <FiCalendar className="w-4 h-4" />, count: typeStats.leave_request, color: 'emerald' },
                { key: 'timesheet', label: 'Timesheets', icon: <FiClock className="w-4 h-4" />, count: typeStats.timesheet, color: 'purple' }
              ].map((type) => (
                <motion.button
                  key={type.key}
                  onClick={() => onTypeChange(type.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    selectedType === type.key
                      ? `bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200 shadow-sm`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {type.icon}
                  <span className="text-sm font-medium hidden sm:inline">{type.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedType === type.key
                      ? `bg-${type.color}-200 text-${type.color}-800`
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {type.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Enhanced Action Section */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiGrid size={18} />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiList size={18} />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-sm text-gray-600 font-medium">
                  {selectedNotifications.length} selected
                </span>
                <motion.button
                  onClick={() => onBulkAction('markRead')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiCheck className="w-4 h-4" />
                  Mark Read
                </motion.button>
                <motion.button
                  onClick={() => onBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </motion.button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onRefresh}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh notifications"
              >
                <FiRefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              
              {hasMore && (
                <motion.button
                  onClick={onLoadMore}
                  disabled={loading}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Load More</span>
                </motion.button>
              )}
              
              {notifications.length > 0 && (
                <motion.button
                  onClick={onClearAll}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm font-medium">Clear All</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced Professional Notification Card
const NotificationCard = ({ 
  notification, 
  isSelected, 
  onSelect, 
  onMarkAsRead, 
  onViewDetails, 
  onLeaveAction,
  onTimesheetAction,
  viewMode = 'list'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const typeConfig = {
    announcement: {
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-gradient-to-br from-blue-50/80 to-indigo-50/80",
      border: "border-blue-200/60",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      shadow: "shadow-blue-100/50"
    },
    leave_request: {
      gradient: "from-emerald-500 to-teal-600", 
      bg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/80",
      border: "border-emerald-200/60",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      shadow: "shadow-emerald-100/50"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.announcement;
  
  const getIcon = (type) => {
    switch(type) {
      case "announcement": return <FiMessageSquare className="w-5 h-5" />;
      case "leave_request": return <FiCalendar className="w-5 h-5" />;
      default: return <FiBell className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (notification) => {
    if (notification.type === 'leave_request' && notification.status) {
      const statusConfig = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <FiClock className="w-3 h-3" /> },
        approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <FiCheck className="w-3 h-3" /> },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <FiX className="w-3 h-3" /> }
      };
      const statusStyle = statusConfig[notification.status] || statusConfig.pending;
      return (
        <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
          {statusStyle.icon}
          {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
        </span>
      );
    }
    if (notification.type === 'timesheet' && notification.status) {
      const statusConfig = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <FiClock className="w-3 h-3" /> },
        approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <FiCheck className="w-3 h-3" /> },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <FiX className="w-3 h-3" /> }
      };
      const statusStyle = statusConfig[notification.status] || statusConfig.pending;
      return (
        <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
          {statusStyle.icon}
          {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
        </span>
      );
    }
    return null;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now - notificationDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return format(notificationDate, "MMM d");
  };

  return (
    <motion.div
      className={`relative group w-full overflow-hidden cursor-pointer rounded-2xl shadow-lg border ${config.border} ${config.bg} hover:shadow-xl transition-all duration-300 ${config.shadow}`}
      onClick={() => onViewDetails(notification)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -4 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/30 to-transparent rounded-full translate-y-12 -translate-x-12" />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-5">
          {/* Enhanced Icon */}
          <motion.div
            className={`relative p-4 ${config.iconBg} rounded-2xl shadow-lg text-white`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            {getIcon(notification.type)}
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-white/30"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Enhanced Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">{notification.title}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.badge} border`}>
                  {notification.type === 'leave_request' ? 'Leave Request' : 'Announcement'}
                </span>
                {getStatusBadge(notification)}
                {notification.is_expired && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    <FiAlertTriangle className="w-3 h-3" />
                    Expired
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 font-medium">{getTimeAgo(notification.created_at)}</span>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">{notification.message}</p>

            {/* Enhanced Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {(notification.data?.users?.name || notification.created_by?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {notification.data?.users?.name || notification.created_by?.name || "Unknown"}
                    </div>
                    {notification.data?.users?.teams?.name && (
                      <div className="text-xs text-gray-500">{notification.data.users.teams.name}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Leave Request Actions */}
                {notification.type === 'leave_request' && notification.status === 'pending' && onLeaveAction && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveAction(notification.data?.id || notification.id, 'approved');
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiCheck className="w-4 h-4" />
                      Approve
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveAction(notification.data?.id || notification.id, 'rejected');
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiX className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </div>
                )}

                {/* Timesheet Actions */}
                {notification.type === 'timesheet' && notification.status === 'pending' && onTimesheetAction && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimesheetAction(notification.data?.id || notification.id, 'approved');
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiCheck className="w-4 h-4" />
                      Approve
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimesheetAction(notification.data?.id || notification.id, 'rejected');
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiX className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </div>
                )}

                {/* Mark as Read Button */}
                {!notification.is_read && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCheck className="w-4 h-4" />
                    Mark Read
                  </motion.button>
                )}
                
                {/* Selection Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(notification.id);
                  }}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSelected ? <FiCheck className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Unread Indicator */}
      {!notification.is_read && (
        <motion.div
          className="absolute top-4 right-4 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-lg"
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.8, 1, 0.8],
            boxShadow: ['0 0 0 0 rgba(251, 146, 60, 0.4)', '0 0 0 6px rgba(251, 146, 60, 0)', '0 0 0 0 rgba(251, 146, 60, 0.4)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Priority Indicator */}
      {notification.type === 'leave_request' && notification.status === 'pending' && (
        <motion.div
          className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// Enhanced Modal for notification details
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  
  const typeConfig = {
    announcement: {
      bg: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      accent: "from-blue-500 to-indigo-600"
    },
    leave_request: {
      bg: "bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      accent: "from-emerald-500 to-teal-600"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.announcement;
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Enhanced Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Enhanced Modal */}
      <motion.div
        className="relative w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className={`relative p-8 ${config.bg} text-white overflow-hidden`}>
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                className={`p-4 ${config.iconBg} rounded-2xl shadow-lg text-white`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                {notification.type === 'leave_request' ? 
                  <FiCalendar className="w-8 h-8" /> : 
                  <FiMessageSquare className="w-8 h-8" />
                }
              </motion.div>
              
              <div>
                <motion.h2 
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {notification.title}
                </motion.h2>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full border border-white/30 bg-white/20">
                    {notification.type === 'leave_request' ? 'Leave Request' : 'Announcement'}
                  </span>
                  {notification.is_expired && (
                    <span className="flex items-center gap-1 text-xs bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30">
                      <FiAlertCircle className="w-3 h-3" />
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <motion.button 
              onClick={onClose} 
              className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
        
        {/* Enhanced Info Bar */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span className="font-medium">
                  {notification.created_by?.name || notification.data?.users?.name || "Unknown"}
                </span>
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                notification.is_read ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {notification.is_read ? "Read" : "Unread"}
              </span>
              {notification.expiry_date && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  notification.is_expired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  Expires {format(new Date(notification.expiry_date), "MMM d")}
                  {notification.is_expired && " (Expired)"}
                </span>
              )}
            </div>
            {notification.type === 'leave_request' && notification.status && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  notification.status === 'approved' ? 'bg-green-500' : 
                  notification.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium capitalize">{notification.status}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-lg overflow-wrap-anywhere min-h-0">
                {notification.fullMessage || notification.message}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <FiShare2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <FiDownload className="w-5 h-5" />
            </button>
          </div>
          <motion.button
            onClick={onClose}
            className={`px-8 py-3 bg-gradient-to-r ${config.accent} text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Enhanced NotificationsPage Component
export default function NotificationsPage({ sidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [notificationType, setNotificationType] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [processingLeaveRequest, setProcessingLeaveRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Enhanced notification fetching with pagination
  const fetchNotifications = async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unable to get current user');
      
      setCurrentUserId(user.id);
      
      // Get user's role and team information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id, role')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      setCurrentUserRole(userData.role);
      
      let allNotifications = [];
      
      // Fetch pending leave requests (for managers only)
      if (userData.role === 'manager') {
        const { data: leaveRequests, error: leaveError } = await supabase
          .from('leave_plans')
          .select(`
            id, start_date, end_date, status, created_at,
            users:user_id (id, name, teams:team_id(id, name))
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (leaveError) throw leaveError;

        const leaveNotifications = leaveRequests.map(request => {
          const startDate = parseISO(request.start_date);
          const endDate = parseISO(request.end_date);
          const days = differenceInDays(endDate, startDate) + 1;
          
          return {
            id: `leave-${request.id}`,
            type: 'leave_request',
            title: 'Leave Request',
            message: `${request.users.name} requested ${days} ${days === 1 ? 'day' : 'days'} off (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})`,
            created_at: request.created_at,
            is_read: false,
            status: request.status,
            data: request
          };
        });
        
        allNotifications = [...leaveNotifications];
      }
      
      // Timesheet submissions (for managers only)
      if (userData.role === 'manager') {
        const { data: timesheetSubs, error: tsErr } = await supabase
          .from('timesheet_submissions')
          .select(`
            id, user_id, start_date, end_date, status, created_at,
            users:user_id ( id, name, teams:team_id ( id, name ) )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (tsErr) throw tsErr;
        const tsNotifications = timesheetSubs.map(sub => ({
          id: `timesheet-${sub.id}`,
          type: 'timesheet',
          title: 'Timesheet Submission',
          message: `${sub.users?.name || 'Employee'} submitted timesheet for ${format(parseISO(sub.start_date), 'MMM dd')} - ${format(parseISO(sub.end_date), 'MMM dd')}`,
          created_at: sub.created_at || sub.start_date,
          is_read: false,
          status: sub.status,
          data: sub,
        }));
        allNotifications = [...allNotifications, ...tsNotifications];
      }

      // Get total count for pagination
      const { count: totalAnnouncements } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', userData.team_id);
      
      setTotalCount((allNotifications.length || 0) + (totalAnnouncements || 0));
      
      // Fetch announcements with pagination
      const pageSize = 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data: announcements, error: announcementError } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          teams:team_id (id, name),
          manager:created_by (id, name),
          announcement_reads:announcement_reads (user_id, read)
        `)
        .eq('team_id', userData.team_id)
        .order('created_at', { ascending: false })
        .range(start, end);
        
      if (announcementError) throw announcementError;
      
      // Transform announcements
      const announcementNotifications = (announcements || []).map(announcement => {
        const readEntry = announcement.announcement_reads?.find(r => r.user_id === user.id);
        const isExpired = new Date(announcement.expiry_date) < new Date();
        
        return {
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          message: announcement.content.length > 100 
            ? `${announcement.content.substring(0, 100)}...` 
            : announcement.content,
          fullMessage: announcement.content, // Store the full message for modal
          created_at: announcement.created_at,
          expiry_date: announcement.expiry_date,
          is_read: !!readEntry?.read,
          is_expired: isExpired,
          team: announcement.teams,
          created_by: announcement.manager,
          data: announcement
        };
      });

      allNotifications = [...allNotifications, ...announcementNotifications];
      
      // Sort by date
      allNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      if (append) {
        setNotifications(prev => [...prev, ...allNotifications]);
      } else {
        setNotifications(allNotifications);
      }
      
      const totalLoaded = (page * pageSize) + (allNotifications.length - announcementNotifications.length);
      setHasMore(totalLoaded < totalCount);
      setCurrentPage(page);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchNotifications(1, false);
    
    const leaveRequestsSubscription = supabase
      .channel('leave_requests_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leave_plans' 
        }, 
        () => fetchNotifications(1, false)
      )
      .subscribe();
      
    const announcementsSubscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        () => fetchNotifications(1, false)
      )
      .subscribe();

    return () => {
      leaveRequestsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
    };
  }, []);

  // Filter notifications with search
  const filteredNotifications = notifications.filter(notification => {
    if (notificationType !== 'all' && notification.type !== notificationType) {
      return false;
    }
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

  // Event handlers
  const handleTypeChange = (type) => {
    setNotificationType(type);
    setSelectedNotifications([]);
  };

  const handleRefresh = () => {
    fetchNotifications(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  const handleTimesheetAction = async (submissionId, action) => {
    try {
      const id = typeof submissionId === 'string' && submissionId.startsWith('timesheet-')
        ? submissionId.replace('timesheet-', '')
        : submissionId;
      const { error } = await supabase
        .from('timesheet_submissions')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      setNotifications(prev => prev
        .map(n => n.id === `timesheet-${id}` ? { ...n, status: action } : n)
        .filter(n => !(n.id === `timesheet-${id}` && action !== 'pending')));
    } catch (error) {
      console.error(`Error ${action} timesheet submission:`, error);
    }
  };

  const handleBulkAction = (action) => {
    if (action === 'markRead') {
      setNotifications(prev => 
        prev.map(n => selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n)
      );
    } else if (action === 'delete') {
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.includes(n.id))
      );
    }
    setSelectedNotifications([]);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleMarkAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    
    if (notificationId.startsWith('announcement-')) {
      const announcementId = notificationId.replace('announcement-', '');
      try {
        await supabase.from('announcement_reads').upsert({
          announcement_id: announcementId,
          user_id: currentUserId,
          read: true,
          read_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error marking announcement as read:', error);
      }
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    handleMarkAsRead(notification.id);
  };

  const handleLeaveAction = async (leaveId, action) => {
    setProcessingLeaveRequest(leaveId);
    try {
      const { error } = await supabase
        .from('leave_plans')
        .update({ status: action })
        .eq('id', leaveId);
        
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === `leave-${leaveId}` ? { ...n, status: action } : n
        ).filter(n => !(n.id === `leave-${leaveId}` && action !== 'pending'))
      );
      
    } catch (error) {
      console.error(`Error ${action} leave request:`, error);
    } finally {
      setProcessingLeaveRequest(null);
    }
  };

  if (loading && notifications.length === 0) {
    return <ContentLoader type="notifications" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <motion.button
            onClick={handleRefresh}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }
  console.log(notifications);       
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 pt-1 pb-1">
        {/* Enhanced Header */}
        <NotificationsHeader
          notifications={notifications}
          unreadCount={unreadCount}
          selectedType={notificationType}
          onTypeChange={handleTypeChange}
          onRefresh={handleRefresh}
          onBulkAction={handleBulkAction}
          selectedNotifications={selectedNotifications}
          onClearAll={handleClearAll}
          totalCount={totalCount}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loading={loading || loadingMore}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Enhanced Content */}
        <div className="relative min-h-[calc(100vh-400px)]">
          {filteredNotifications.length === 0 ? (
            <motion.div
              className="flex items-center justify-center h-[calc(100vh-400px)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center max-w-md mx-auto">
                <motion.div
                  className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FiInbox className="w-12 h-12 text-gray-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No notifications found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for updates'}
                </p>
                {searchTerm && (
                  <motion.button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear Search
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className={`${viewMode === 'grid' 
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
                : 'space-y-6'
              }`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredNotifications.map((notification) => (
                <motion.div key={notification.id} variants={itemVariants}>
                  <NotificationCard
                    notification={notification} 
                    isSelected={selectedNotifications.includes(notification.id)}
                    onSelect={handleSelectNotification}
                    onMarkAsRead={handleMarkAsRead}
                    onViewDetails={handleViewDetails}
                    onLeaveAction={currentUserRole === 'manager' ? handleLeaveAction : null}
                    onTimesheetAction={currentUserRole === 'manager' ? handleTimesheetAction : null}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Enhanced Load More Section */}
          {hasMore && filteredNotifications.length > 0 && (
            <motion.div
              className="flex justify-center py-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-3 shadow-lg disabled:opacity-50"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {loadingMore ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="font-medium">Loading...</span>
                  </>
                ) : (
                  <>
                    <FiTrendingUp className="w-5 h-5" />
                    <span className="font-medium">Load More Notifications</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* End indicator */}
          {!hasMore && notifications.length > 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full" />
                <span className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200">
                  All notifications loaded
                </span>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Notification Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <NotificationModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
