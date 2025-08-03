import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiFilter, FiSearch, FiCheck, FiTrash2, FiAlertCircle, FiInfo, 
  FiEye, FiClock, FiMessageSquare, FiCheckSquare, FiAlertTriangle, FiX, 
  FiGrid, FiList, FiRefreshCw, FiCalendar, FiUsers, FiSettings, FiTrendingUp, FiActivity 
} from 'react-icons/fi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Professional Notifications Header Component
const NotificationsHeader = ({ 
  notifications, 
  unreadCount, 
  selectedType, 
  onTypeChange, 
  onRefresh, 
  onBulkAction,
  selectedNotifications,
  onClearAll 
}) => {
  const typeStats = {
    all: notifications.length,
    announcement: notifications.filter(n => n.type === 'announcement').length,
    leave_request: notifications.filter(n => n.type === 'leave_request').length
  };

  return (
    <div className="relative">
      {/* Main Header */}
      <motion.div
        className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.2),transparent_50%)]" />
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-4 right-8 w-2 h-2 bg-blue-400/60 rounded-full"
          animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-6 left-8 w-1 h-1 bg-indigo-400/40 rounded-full"
          animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-6">
              <motion.div
                className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FiBell className="w-8 h-8 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
              </motion.div>

              <div>
                <motion.h1
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Notification Center
                </motion.h1>
                <motion.p
                  className="text-blue-100/80 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Stay updated with team activities and requests
                </motion.p>
              </div>
            </div>

            {/* Right Section - Quick Stats */}
            <div className="flex items-center gap-4">
              <motion.div
                className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{notifications.length}</div>
                  <div className="text-xs text-blue-100/70 font-medium">Total</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-300">{unreadCount}</div>
                  <div className="text-xs text-blue-100/70 font-medium">Unread</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">
                    {notifications.filter(n => n.type === 'leave_request' && n.status === 'pending').length}
                  </div>
                  <div className="text-xs text-blue-100/70 font-medium">Pending</div>
                </div>
              </motion.div>

              <motion.button
                onClick={onRefresh}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh notifications"
              >
                <FiRefreshCw className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Type Toggle and Actions */}
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          {/* Type Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              {[
                { key: 'all', label: 'All Notifications', icon: <FiBell className="w-4 h-4" />, count: typeStats.all },
                { key: 'announcement', label: 'Announcements', icon: <FiMessageSquare className="w-4 h-4" />, count: typeStats.announcement },
                { key: 'leave_request', label: 'Leave Requests', icon: <FiCalendar className="w-4 h-4" />, count: typeStats.leave_request }
              ].map((type) => (
                <motion.button
                  key={type.key}
                  onClick={() => onTypeChange(type.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    selectedType === type.key
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedType === type.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {type.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3">
            {selectedNotifications.length > 0 && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-sm text-gray-600">
                  {selectedNotifications.length} selected
                </span>
                <motion.button
                  onClick={() => onBulkAction('markRead')}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiCheck className="w-3 h-3" />
                  Mark Read
                </motion.button>
                <motion.button
                  onClick={() => onBulkAction('delete')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrash2 className="w-3 h-3" />
                  Delete
                </motion.button>
              </motion.div>
            )}
            
            {notifications.length > 0 && (
              <motion.button
                onClick={onClearAll}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear All
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Professional Notification Card Component
const NotificationCard = ({ notification, isSelected, onSelect, onMarkAsRead, onViewDetails, onLeaveAction }) => {
  // Enhanced color schemes
  const typeConfig = {
    announcement: {
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      border: "border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200"
    },
    leave_request: {
      gradient: "from-emerald-500 to-teal-600", 
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200"
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
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
        approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
      };
      const statusStyle = statusConfig[notification.status] || statusConfig.pending;
      return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
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

  // Render leave request card
  if (notification.type === 'leave_request') {
    return (
      <motion.div
        className={`relative group w-full overflow-hidden cursor-pointer rounded-xl shadow-sm border ${config.border} ${config.bg} hover:shadow-lg transition-all duration-300`}
        onClick={() => onViewDetails(notification)}
        whileHover={{ scale: 1.01, y: -2 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-10 translate-x-10" />
        </div>

        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              className={`relative p-3 ${config.iconBg} rounded-xl shadow-lg text-white`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <FiCalendar className="w-5 h-5" />
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 text-base">{notification.title}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.badge} border`}>
                    Leave Request
                  </span>
                  {getStatusBadge(notification)}
                </div>
                <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
              </div>

              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{notification.message}</p>

              {/* Footer with user info and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {(notification.data?.users?.name || notification.created_by?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">
                    {notification.data?.users?.name || notification.created_by?.name || "Unknown"}
                  </span>
                  {notification.data?.users?.teams?.name && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{notification.data.users.teams.name}</span>
                    </>
                  )}
                </div>

                {/* Action buttons for leave requests */}
                {notification.status === 'pending' && onLeaveAction && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveAction(notification.data?.id || notification.id, 'approved');
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiCheck className="w-3 h-3" />
                      Approve
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveAction(notification.data?.id || notification.id, 'rejected');
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiX className="w-3 h-3" />
                      Reject
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Selection checkbox */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(notification.id);
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isSelected 
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSelected ? <FiCheck className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <motion.div
            className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  }

  // Render announcement card
  return (
    <motion.div
      className={`relative group w-full overflow-hidden cursor-pointer rounded-xl shadow-sm border ${config.border} ${config.bg} hover:shadow-lg transition-all duration-300`}
      onClick={() => onViewDetails(notification)}
      whileHover={{ scale: 1.01, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-10 translate-x-10" />
      </div>

      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            className={`relative p-3 ${config.iconBg} rounded-xl shadow-lg text-white`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            {getIcon(notification.type)}
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-900 text-base">{notification.title}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.badge} border`}>
                  Announcement
                </span>
              </div>
              <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
            </div>

            <p className="text-sm text-gray-700 mb-3 leading-relaxed line-clamp-2">{notification.message}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {(notification.created_by?.name || notification.data?.manager?.name || "U").charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">
                  {notification.created_by?.name || notification.data?.manager?.name || "Unknown"}
                </span>
                {notification.team?.name && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{notification.team.name}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCheck className="w-3 h-3" />
                    Mark Read
                  </motion.button>
                )}
                
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(notification.id);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? "bg-blue-100 text-blue-700 border border-blue-200" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSelected ? <FiCheck className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <motion.div
          className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// Modal for notification details
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  const typeConfig = {
    announcement: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200"
    },
    leave_request: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.announcement;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-11/12 max-w-2xl mx-auto overflow-hidden bg-white rounded-2xl shadow-2xl max-h-[80vh]"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 ${config.bg} border-b border-gray-200/50`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={`p-4 ${config.iconBg} rounded-xl shadow-lg text-white`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {notification.type === 'leave_request' ? 
                  <FiCalendar className="w-6 h-6" /> : 
                  <FiMessageSquare className="w-6 h-6" />
                }
              </motion.div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${config.badge}`}>
                    {notification.type === 'leave_request' ? 'Leave Request' : 'Announcement'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {format(new Date(notification.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
            </div>
            
            <motion.button 
              onClick={onClose} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-auto max-h-[50vh]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Message</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Posted by:</span>
                  <span className="font-medium">
                    {notification.created_by?.name || notification.data?.users?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{notification.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${notification.is_read ? 'text-green-600' : 'text-orange-600'}`}>
                    {notification.is_read ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            </div>
            
            {notification.type === 'leave_request' && notification.status && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Leave Status</h4>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      notification.status === 'approved' ? 'bg-green-500' : 
                      notification.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium capitalize">{notification.status}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200/50">
          <motion.button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main NotificationsPage Component
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

  // Enhanced notification fetching with leave requests
  const fetchNotifications = async () => {
    setLoading(true);
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

        // Transform leave requests into notifications
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
      
      // Fetch announcements for user's team
      const today = new Date().toISOString();
      
      const { data: announcements, error: announcementError } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          teams:team_id (id, name),
          manager:created_by (id, name),
          announcement_reads:announcement_reads (user_id, read)
        `)
        .eq('team_id', userData.team_id)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });
        
      if (announcementError) throw announcementError;
      
      // Transform announcements
      const announcementNotifications = (announcements || []).map(announcement => {
        const readEntry = announcement.announcement_reads?.find(r => r.user_id === user.id);
        return {
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          message: announcement.content.length > 100 
            ? `${announcement.content.substring(0, 100)}...` 
            : announcement.content,
          created_at: announcement.created_at,
          is_read: !!readEntry?.read,
          team: announcement.teams,
          created_by: announcement.manager,
          data: announcement
        };
      });
        
      // Add announcements to notifications
      allNotifications = [...allNotifications, ...announcementNotifications];
      
      // Sort all notifications by date (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setNotifications(allNotifications);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new leave requests
    const leaveRequestsSubscription = supabase
      .channel('leave_requests_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leave_plans' 
        }, 
        () => fetchNotifications()
      )
      .subscribe();
      
    // Subscribe to new announcements
    const announcementsSubscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      leaveRequestsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
    };
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (notificationType !== 'all' && notification.type !== notificationType) {
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
    fetchNotifications();
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
    
    // Handle marking announcements as read in database
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
      
      // Update local state
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading notifications</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="pt-8">
        <NotificationsHeader
          notifications={notifications}
          unreadCount={unreadCount}
          selectedType={notificationType}
          onTypeChange={handleTypeChange}
          onRefresh={handleRefresh}
          onBulkAction={handleBulkAction}
          selectedNotifications={selectedNotifications}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6">
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No notifications found</p>
              <p className="text-gray-500 text-sm">Check back later for updates</p>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-4 pb-6"
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
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Notification Modal */}
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