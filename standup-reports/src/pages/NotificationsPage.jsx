import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiSearch, FiCheck, FiTrash2, FiFilter, FiX, 
  FiGrid, FiList, FiRefreshCw, FiCalendar, FiClock, 
  FiMessageSquare, FiInbox, FiAlertCircle, FiUser, 
  FiChevronDown, FiStar, FiTag, FiPaperclip, FiMapPin,
  FiArchive, FiCheckCircle, FiAlertTriangle, FiInfo,
  FiSettings, FiTrendingUp, FiUsers, FiEye, FiShare2, FiDownload,
  FiTarget
} from 'react-icons/fi';

// Enhanced Modal for notification details (restored from previous version)
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  
  const typeConfig = {
    announcement: {
      bg: "bg-gradient-to-r from-blue-600 to-indigo-700",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      accent: "border-l-4 border-l-blue-500"
    },
    leave_request: {
      bg: "bg-gradient-to-r from-emerald-600 to-teal-700",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      accent: "border-l-4 border-l-emerald-500"
    },
    timesheet: {
      bg: "bg-gradient-to-r from-purple-600 to-indigo-700",
      iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      accent: "border-l-4 border-l-purple-500"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.announcement;
  
  // Enhanced notification details
  const renderNotificationDetails = () => {
    if (notification.type === 'leave_request') {
      const startDate = parseISO(notification.data?.start_date);
      const endDate = parseISO(notification.data?.end_date);
      const days = differenceInDays(endDate, startDate) + 1;
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Start Date</div>
              <div className="font-medium text-gray-900">{format(startDate, 'MMM dd, yyyy')}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">End Date</div>
              <div className="font-medium text-gray-900">{format(endDate, 'MMM dd, yyyy')}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Duration</div>
              <div className="font-medium text-gray-900">{days} {days === 1 ? 'day' : 'days'}</div>
            </div>
          </div>
          
          {notification.data?.users?.teams?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiUsers className="w-4 h-4" />
              <span>Team: {notification.data.users.teams.name}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (notification.type === 'timesheet') {
      const startDate = parseISO(notification.data?.start_date);
      const endDate = parseISO(notification.data?.end_date);
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Start Date</div>
              <div className="font-medium text-gray-900">{format(startDate, 'MMM dd, yyyy')}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">End Date</div>
              <div className="font-medium text-gray-900">{format(endDate, 'MMM dd, yyyy')}</div>
            </div>
          </div>
          
          {notification.data?.users?.teams?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiUsers className="w-4 h-4" />
              <span>Team: {notification.data.users.teams.name}</span>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {notification.data?.teams?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="w-4 h-4" />
            <span>Team: {notification.data.teams.name}</span>
          </div>
        )}
      </div>
    );
  };

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Enhanced Modal */}
      <motion.div
        className="relative w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className={`relative p-6 ${config.bg} text-white overflow-hidden`}>
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  className={`p-3 ${config.iconBg} rounded-xl shadow-md text-white`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {notification.type === 'leave_request' ? 
                    <FiCalendar className="w-6 h-6" /> : 
                    notification.type === 'timesheet' ?
                    <FiClock className="w-6 h-6" /> :
                    <FiMessageSquare className="w-6 h-6" />
                  }
                </motion.div>
                
                <div>
                  <motion.h2 
                    className="text-2xl font-bold text-white mb-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {notification.title}
                  </motion.h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border border-white/30 bg-white/20`}>
                      {notification.type === 'leave_request' ? 'Leave Request' : 
                       notification.type === 'timesheet' ? 'Timesheet' : 
                       notification.type === 'task_update' ? 'Task Update' : 'Announcement'}
                    </span>
                    {notification.is_expired && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/30 px-3 py-1 rounded-full border border-red-400/40">
                        <FiAlertCircle className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <motion.button 
                onClick={onClose} 
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Info Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {(notification.created_by?.name || notification.data?.users?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {notification.created_by?.name || notification.data?.users?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {notification.created_by?.name ? "Announcer" : "Requester"}
                  </div>
                </div>
              </div>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                notification.is_read ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {notification.is_read ? "Read" : "Unread"}
              </div>
              
              {notification.expiry_date && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  notification.is_expired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  Expires {format(new Date(notification.expiry_date), "MMM d")}
                  {notification.is_expired && " (Expired)"}
                </div>
              )}
            </div>
            
            {notification.type !== 'announcement' && notification.status && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  notification.status === 'approved' ? 'bg-green-500' : 
                  notification.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <span className="text-sm font-medium capitalize">{notification.status}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-base overflow-wrap-anywhere min-h-0">
                {notification.fullMessage || notification.message}
              </div>
            </div>
            
            {renderNotificationDetails()}
          </motion.div>
        </div>
        
        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <button className="p-2.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FiShare2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FiDownload className="w-5 h-5" />
            </button>
          </div>
          <motion.button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-md"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Premium Notification Card Component
const PremiumNotificationCard = ({ 
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
      bg: "bg-gradient-to-br from-white to-blue-50",
      border: "border-blue-100",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      shadow: "shadow-blue-100/50",
      accent: "border-l-4 border-l-blue-500"
    },
    leave_request: {
      gradient: "from-emerald-500 to-teal-600", 
      bg: "bg-gradient-to-br from-white to-emerald-50",
      border: "border-emerald-100",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      shadow: "shadow-emerald-100/50",
      accent: "border-l-4 border-l-emerald-500"
    },
    timesheet: {
      gradient: "from-purple-500 to-indigo-600",
      bg: "bg-gradient-to-br from-white to-purple-50",
      border: "border-purple-100",
      iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      shadow: "shadow-purple-100/50",
      accent: "border-l-4 border-l-purple-500"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.announcement;
  
  const getIcon = (type) => {
    switch(type) {
      case "announcement": return <FiMessageSquare className="w-5 h-5" />;
      case "leave_request": return <FiCalendar className="w-5 h-5" />;
      case "timesheet": return <FiClock className="w-5 h-5" />;
      case "task_update": return <FiTarget className="w-5 h-5" />;
      default: return <FiBell className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (notification) => {
    if ((notification.type === 'leave_request' || notification.type === 'timesheet') && notification.status) {
      const statusConfig = {
        pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: <FiClock className="w-3 h-3" /> },
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

  // Enhanced notification content with metadata
  const renderNotificationContent = () => {
    if (notification.type === 'leave_request') {
      const startDate = parseISO(notification.data?.start_date);
      const endDate = parseISO(notification.data?.end_date);
      const days = differenceInDays(endDate, startDate) + 1;
      
      return (
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">{notification.message}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiCalendar className="w-4 h-4" />
              <span>{format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiClock className="w-4 h-4" />
              <span>{days} {days === 1 ? 'day' : 'days'}</span>
            </div>
            {notification.data?.users?.teams?.name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="w-4 h-4" />
                <span>{notification.data.users.teams.name}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (notification.type === 'timesheet') {
      const startDate = parseISO(notification.data?.start_date);
      const endDate = parseISO(notification.data?.end_date);
      
      return (
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">{notification.message}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiCalendar className="w-4 h-4" />
              <span>{format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}</span>
            </div>
            {notification.data?.users?.teams?.name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="w-4 h-4" />
                <span>{notification.data.users.teams.name}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (notification.type === 'task_update') {
      return (
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">{notification.message}</p>
          {notification.data?.task?.title && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiTarget className="w-4 h-4" />
              <span>Task: {notification.data.task.title}</span>
            </div>
          )}
          {notification.data?.from_status && notification.data?.to_status && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiTrendingUp className="w-4 h-4" />
              <span>Status: {notification.data.from_status} → {notification.data.to_status}</span>
            </div>
          )}
          {notification.data?.comment && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Comment</div>
              <p className="text-sm text-gray-700">{notification.data.comment}</p>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed">{notification.message}</p>
        {notification.data?.teams?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="w-4 h-4" />
            <span>{notification.data.teams.name}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={`relative group w-full overflow-hidden cursor-pointer rounded-2xl shadow-lg border ${config.border} ${config.bg} hover:shadow-xl transition-all duration-300 ${config.shadow} ${config.accent}`}
      onClick={() => onViewDetails(notification)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full translate-y-12 -translate-x-12" />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-5">
          {/* Enhanced Icon */}
          <motion.div
            className={`relative p-3 ${config.iconBg} rounded-xl shadow-md text-white flex-shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {getIcon(notification.type)}
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
          </motion.div>

          {/* Enhanced Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={`font-bold text-gray-900 ${!notification.is_read ? 'text-lg' : 'text-base'}`}>
                  {notification.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.badge} border`}>
                  {notification.type === 'leave_request' ? 'Leave Request' : 
                   notification.type === 'timesheet' ? 'Timesheet' : 
                   notification.type === 'task_update' ? 'Task Update' : 'Announcement'}
                </span>
                {getStatusBadge(notification)}
                {notification.is_expired && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    <FiAlertTriangle className="w-3 h-3" />
                    Expired
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${notification.is_read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                  {getTimeAgo(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            {renderNotificationContent()}

            {/* Enhanced Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {(notification.data?.users?.name || notification.created_by?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      {notification.data?.users?.name || notification.created_by?.name || "Unknown"}
                    </div>
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

                {/* Timesheet Actions */}
                {notification.type === 'timesheet' && notification.status === 'pending' && onTimesheetAction && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimesheetAction(notification.data?.id || notification.id, 'approved');
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
                        onTimesheetAction(notification.data?.id || notification.id, 'rejected');
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

                {/* Mark as Read Button */}
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
                
                {/* Selection Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(notification.id);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isSelected ? <FiCheck className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modern Notification Center Redesign
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [notificationType, setNotificationType] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    unread: false,
    priority: false
  });

  // Fetch notifications
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

        const leaveNotifications = leaveRequests.map(request => {
          const startDate = parseISO(request.start_date);
          const endDate = parseISO(request.end_date);
          const days = differenceInDays(endDate, startDate) + 1;
          
          return {
            id: `leave-${request.id}`,
            type: 'leave_request',
            title: 'Leave Request',
            message: `${request.users.name} requested ${days} ${days === 1 ? 'day' : 'days'} off`,
            created_at: request.created_at,
            is_read: false,
            status: request.status,
            priority: 'high',
            data: request,
            metadata: {
              startDate: format(startDate, 'MMM dd'),
              endDate: format(endDate, 'MMM dd'),
              days,
              team: request.users.teams?.name
            }
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
          message: `${sub.users?.name || 'Employee'} submitted timesheet`,
          created_at: sub.created_at || sub.start_date,
          is_read: false,
          status: sub.status,
          priority: 'medium',
          data: sub,
          metadata: {
            period: `${format(parseISO(sub.start_date), 'MMM dd')} - ${format(parseISO(sub.end_date), 'MMM dd')}`,
            team: sub.users?.teams?.name
          }
        }));
        allNotifications = [...allNotifications, ...tsNotifications];
      }

      // Fetch task updates for the current user
      const { data: taskActivities, error: taskActivityError } = await supabase
        .from('task_activities')
        .select(`
          id, task_id, user_id, action, from_status, to_status, comment, created_at,
          task:task_id (id, title, status, assignee_id, reporter_id),
          user:user_id (id, name)
        `)
        .eq('task.assignee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (taskActivityError) {
        console.error('Error fetching task activities:', taskActivityError);
        // Continue without throwing error
      } else {
        const taskNotifications = (taskActivities || []).map(activity => {
          let message = '';
          let title = 'Task Update';
          
          if (activity.action === 'status_changed') {
            title = 'Task Status Changed';
            message = `${activity.user?.name || 'Someone'} changed the status of "${activity.task?.title}" from ${activity.from_status} to ${activity.to_status}`;
          } else if (activity.action === 'assigned') {
            title = 'Task Assigned';
            message = `You were assigned to the task "${activity.task?.title}"`;
          } else {
            message = `${activity.user?.name || 'Someone'} updated the task "${activity.task?.title}"`;
          }
          
          return {
            id: `task-${activity.id}`,
            type: 'task_update',
            title: title,
            message: message,
            fullMessage: activity.comment ? `${message}\n\nComment: ${activity.comment}` : message,
            created_at: activity.created_at,
            is_read: false,
            priority: 'medium',
            data: activity,
            metadata: {
              task_id: activity.task_id,
              task_title: activity.task?.title,
              from_status: activity.from_status,
              to_status: activity.to_status,
              updater: activity.user?.name
            }
          };
        });
        
        allNotifications = [...allNotifications, ...taskNotifications];
      }

      // Fetch announcements
      const { data: announcements, error: announcementError } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          teams:team_id (id, name),
          manager:created_by (id, name),
          announcement_reads:announcement_reads (user_id, read)
        `)
        .eq('team_id', userData.team_id)
        .order('created_at', { ascending: false });
        
      if (announcementError) throw announcementError;
      
      // Transform announcements
      const announcementNotifications = (announcements || []).map(announcement => {
        const readEntry = announcement.announcement_reads?.find(r => r.user_id === user.id);
        const isExpired = new Date(announcement.expiry_date) < new Date();
        
        return {
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          message: announcement.content.length > 120 
            ? `${announcement.content.substring(0, 120)}...` 
            : announcement.content,
          fullMessage: announcement.content,
          created_at: announcement.created_at,
          expiry_date: announcement.expiry_date,
          is_read: !!readEntry?.read,
          is_expired: isExpired,
          priority: isExpired ? 'low' : 'medium',
          data: announcement,
          metadata: {
            author: announcement.manager?.name,
            team: announcement.teams?.name,
            expires: announcement.expiry_date ? format(new Date(announcement.expiry_date), 'MMM dd') : null
          }
        };
      });

      allNotifications = [...allNotifications, ...announcementNotifications];
      
      // Sort by date
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

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let result = [...notifications];
    
    // Apply type filter for new tabs
    if (notificationType === 'all') {
      // Show all notifications
    } else if (notificationType === 'task_updates') {
      result = result.filter(notification => 
        notification.type === 'leave_request' || 
        notification.type === 'timesheet' ||
        notification.type === 'task_update'
      );
    } else if (notificationType === 'announcements') {
      result = result.filter(notification => notification.type === 'announcement');
    } else {
      // For backward compatibility (e.g. if notificationType is still 'leave_request' or 'timesheet')
      result = result.filter(notification => notification.type === notificationType);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(notification => 
        notification.title.toLowerCase().includes(term) ||
        notification.message.toLowerCase().includes(term)
      );
    }
    
    // Apply read filter
    if (filterOptions.unread) {
      result = result.filter(notification => !notification.is_read);
    }
    
    // Apply priority filter
    if (filterOptions.priority) {
      result = result.filter(notification => notification.priority === 'high');
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'unread') {
      result.sort((a, b) => {
        if (a.is_read === b.is_read) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.is_read ? 1 : -1;
      });
    }
    
    return result;
  }, [notifications, notificationType, searchTerm, filterOptions, sortBy]);

  const unreadCount = filteredAndSortedNotifications.filter(n => !n.is_read).length;
  const totalCount = notifications.length;

  // Event handlers
  const handleTypeChange = (type) => {
    setNotificationType(type);
    setSelectedNotifications([]);
  };

  const handleRefresh = () => {
    fetchNotifications();
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
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Dynamic Gradient Header */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_40%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]"></div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/30 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/20 rounded-full"
          animate={{ 
            y: [0, -30, 0],
            x: [0, -15, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white/40 rounded-full"
          animate={{ 
            y: [0, 25, 0],
            x: [0, 20, 0],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center">
              <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                <FiBell className="w-8 h-8 text-white" />
                {unreadCount > 0 && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </div>
              
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
                  Stay connected with your team's activities
                </motion.p>
              </div>
            </div>
            
            {/* Stats Dashboard */}
            <motion.div 
              className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-300">{unreadCount}</div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">
                  {notifications.filter(n => n.status === 'pending').length}
                </div>
                <div className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Pending</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className={`flex-1 ${sidebarOpen ? 'lg:w-3/4' : 'w-full'}`}>
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'all', label: 'All Notifications', count: totalCount },
                    { key: 'task_updates', label: 'Task Updates', count: notifications.filter(n => n.type === 'leave_request' || n.type === 'timesheet' || n.type === 'task_update').length },
                    { key: 'announcements', label: 'Announcements', count: notifications.filter(n => n.type === 'announcement').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTypeChange(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        notificationType === tab.key
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notificationType === tab.key
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Search and Filters */}
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <FiList className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <FiGrid className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="unread">Unread first</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <FiChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiFilter className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  {selectedNotifications.length} {selectedNotifications.length === 1 ? 'notification' : 'notifications'} selected
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('markRead')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FiCheck className="w-4 h-4 mr-1" />
                    Mark as read
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <FiTrash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            )}
            
            {/* Notifications List */}
            {filteredAndSortedNotifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FiInbox className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm ? 'No notifications match your search' : 'You\'re all caught up!'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : 'space-y-5'}>
                {filteredAndSortedNotifications.map((notification) => (
                  <PremiumNotificationCard
                    key={notification.id}
                    notification={notification}
                    isSelected={selectedNotifications.includes(notification.id)}
                    onSelect={handleSelectNotification}
                    onMarkAsRead={handleMarkAsRead}
                    onViewDetails={handleViewDetails}
                    onLeaveAction={currentUserRole === 'manager' ? handleLeaveAction : null}
                    onTimesheetAction={currentUserRole === 'manager' ? handleTimesheetAction : null}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:w-1/4"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Type Filter - Updated for new tabs */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Type</h3>
                      <div className="space-y-2">
                        {[
                          { key: 'all', label: 'All Notifications' },
                          { key: 'task_updates', label: 'Task Updates' },
                          { key: 'announcements', label: 'Announcements' }
                        ].map((type) => (
                          <button
                            key={type.key}
                            onClick={() => handleTypeChange(type.key)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                              notificationType === type.key 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{type.label}</span>
                            <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                              {type.key === 'all' 
                                ? totalCount 
                                : type.key === 'task_updates'
                                ? notifications.filter(n => n.type === 'leave_request' || n.type === 'timesheet' || n.type === 'task_update').length
                                : notifications.filter(n => n.type === 'announcement').length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Status</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filterOptions.unread}
                            onChange={(e) => setFilterOptions(prev => ({ ...prev, unread: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Unread only</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filterOptions.priority}
                            onChange={(e) => setFilterOptions(prev => ({ ...prev, priority: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">High priority</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={handleRefresh}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                          <FiRefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </button>
                        <button
                          onClick={handleClearAll}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Clear all
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Notification Detail Modal */}
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