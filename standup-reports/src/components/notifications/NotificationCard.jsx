import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock, FiUser, FiCheckCircle, FiExternalLink, FiCalendar,
  FiMessageCircle, FiTarget, FiFolder, FiPlus, FiEdit, FiAlertTriangle, FiBell,
  FiStar, FiArchive, FiTrash2, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import notificationService from '../../services/notificationService';

export default function NotificationCard({
  notification,
  onAction, // Unified action handler
  compact = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Enhanced notification icons with different sizes
  const getNotificationIcon = (type, size = 'normal') => {
    const iconMap = {
      announcement: FiBell,
      leave_request: FiCalendar,
      timesheet_submission: FiClock,
      task_created: FiPlus,
      task_updated: FiEdit,
      task_assigned: FiUser,
      task_comment: FiMessageCircle,
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
    const sizeClass = size === 'large' ? 'w-6 h-6' : 'w-5 h-5';
    return <Icon className={sizeClass} />;
  };

  // Enhanced color schemes with gradients and better visual hierarchy
  const getNotificationDesign = (type, isRead, priority) => {
    const baseDesign = {
      announcement: {
        gradient: 'from-blue-400 via-blue-500 to-indigo-600',
        lightBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        textColor: 'text-blue-900',
        subTextColor: 'text-blue-700',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        shadowColor: 'shadow-blue-100',
        glowColor: 'from-blue-400/20 to-indigo-600/20'
      },
      leave_request: {
        gradient: 'from-purple-400 via-purple-500 to-pink-600',
        lightBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
        borderColor: 'border-purple-200',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
        textColor: 'text-purple-900',
        subTextColor: 'text-purple-700',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        shadowColor: 'shadow-purple-100',
        glowColor: 'from-purple-400/20 to-pink-600/20'
      },
      timesheet_submission: {
        gradient: 'from-green-400 via-emerald-500 to-teal-600',
        lightBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
        textColor: 'text-green-900',
        subTextColor: 'text-green-700',
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
        shadowColor: 'shadow-green-100',
        glowColor: 'from-green-400/20 to-emerald-600/20'
      },
      task_created: {
        gradient: 'from-indigo-400 via-indigo-500 to-blue-600',
        lightBg: 'bg-gradient-to-br from-indigo-50 to-blue-50',
        borderColor: 'border-indigo-200',
        iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
        textColor: 'text-indigo-900',
        subTextColor: 'text-indigo-700',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        shadowColor: 'shadow-indigo-100',
        glowColor: 'from-indigo-400/20 to-blue-600/20'
      },
      task_updated: {
        gradient: 'from-amber-400 via-orange-500 to-yellow-600',
        lightBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        textColor: 'text-amber-900',
        subTextColor: 'text-amber-700',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        shadowColor: 'shadow-amber-100',
        glowColor: 'from-amber-400/20 to-orange-600/20'
      },
      task_assigned: {
        gradient: 'from-cyan-400 via-teal-500 to-blue-600',
        lightBg: 'bg-gradient-to-br from-cyan-50 to-teal-50',
        borderColor: 'border-cyan-200',
        iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        textColor: 'text-cyan-900',
        subTextColor: 'text-cyan-700',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        shadowColor: 'shadow-cyan-100',
        glowColor: 'from-cyan-400/20 to-teal-600/20'
      },
      task_comment: {
        gradient: 'from-teal-400 via-green-500 to-emerald-600',
        lightBg: 'bg-gradient-to-br from-teal-50 to-green-50',
        borderColor: 'border-teal-200',
        iconBg: 'bg-gradient-to-br from-teal-500 to-green-600',
        textColor: 'text-teal-900',
        subTextColor: 'text-teal-700',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        shadowColor: 'shadow-teal-100',
        glowColor: 'from-teal-400/20 to-green-600/20'
      },
      project_update: {
        gradient: 'from-emerald-400 via-green-500 to-teal-600',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
        borderColor: 'border-emerald-200',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        textColor: 'text-emerald-900',
        subTextColor: 'text-emerald-700',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        shadowColor: 'shadow-emerald-100',
        glowColor: 'from-emerald-400/20 to-green-600/20'
      },
      sprint_update: {
        gradient: 'from-rose-400 via-pink-500 to-red-600',
        lightBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
        borderColor: 'border-rose-200',
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
        textColor: 'text-rose-900',
        subTextColor: 'text-rose-700',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        shadowColor: 'shadow-rose-100',
        glowColor: 'from-rose-400/20 to-pink-600/20'
      },
      system_alert: {
        gradient: 'from-red-400 via-red-500 to-rose-600',
        lightBg: 'bg-gradient-to-br from-red-50 to-rose-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
        textColor: 'text-red-900',
        subTextColor: 'text-red-700',
        badgeColor: 'bg-red-100 text-red-800 border-red-200',
        shadowColor: 'shadow-red-100',
        glowColor: 'from-red-400/20 to-rose-600/20'
      },
      // Add fallback for general and other types
      general: {
        gradient: 'from-gray-400 via-gray-500 to-slate-600',
        lightBg: 'bg-gradient-to-br from-gray-50 to-slate-50',
        borderColor: 'border-gray-200',
        iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
        textColor: 'text-gray-900',
        subTextColor: 'text-gray-700',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
        shadowColor: 'shadow-gray-100',
        glowColor: 'from-gray-400/20 to-slate-600/20'
      },
      meeting: {
        gradient: 'from-violet-400 via-purple-500 to-indigo-600',
        lightBg: 'bg-gradient-to-br from-violet-50 to-indigo-50',
        borderColor: 'border-violet-200',
        iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-600',
        textColor: 'text-violet-900',
        subTextColor: 'text-violet-700',
        badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
        shadowColor: 'shadow-violet-100',
        glowColor: 'from-violet-400/20 to-indigo-600/20'
      }
    };

    const design = baseDesign[type] || baseDesign.general;

    // Apply read state modifications
    if (isRead) {
      return {
        ...design,
        lightBg: 'bg-white',
        borderColor: 'border-gray-200',
        iconBg: 'bg-gray-100',
        textColor: 'text-gray-700',
        subTextColor: 'text-gray-500',
        badgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
        shadowColor: 'shadow-gray-100',
        glowColor: 'from-gray-400/10 to-gray-600/10'
      };
    }

    return design;
  };

  // Enhanced priority indicator with animations
  const getPriorityIndicator = (priority) => {
    if (priority === 'urgent') {
      return (
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex items-center gap-1"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm" />
          <div className="w-2 h-2 bg-red-400 rounded-full shadow-sm -ml-1" />
        </motion.div>
      );
    } else if (priority === 'high') {
      return (
        <motion.div
          animate={{
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-2 h-2 bg-amber-500 rounded-full"
        />
      );
    }
    return null;
  };

  // Handle click to view details
  const handleCardClick = () => {
    onAction('view', notification.id);
    if (!notification.read) {
      // Also mark as read if unread
      setTimeout(() => onAction('markRead', notification.id), 100);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action, e) => {
    e.stopPropagation();
    onAction(action, notification.id);
  };

  const design = getNotificationDesign(notification.type, notification.read, notification.priority);
  const category = notificationService.getNotificationCategory(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{
        scale: 1.02,
        y: -4,
        boxShadow: `0 20px 60px -15px ${notification.read ? 'rgba(0,0,0,0.1)' : 'rgba(59, 130, 246, 0.15)'}`,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className={`
        group relative border-2 rounded-2xl p-5 transition-all duration-300 cursor-pointer
        ${design.lightBg} ${design.borderColor}
        ${!notification.read ? `shadow-lg ${design.shadowColor}` : 'shadow-sm'}
        hover:shadow-2xl
        ${compact ? 'p-4' : 'p-5'}
        overflow-hidden
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Enhanced unread indicator line */}
      {!notification.read && (
        <motion.div
          className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${design.gradient} rounded-l-xl`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        />
      )}

      {/* Animated glow effect for unread notifications */}
      {!notification.read && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${design.glowColor} rounded-2xl opacity-0`}
          animate={{
            opacity: isHovered ? 0.6 : 0.1,
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Enhanced icon with gradient and animation */}
        <motion.div
          className={`
            w-12 h-12 rounded-xl ${design.iconBg}
            flex items-center justify-center text-white shadow-lg
            flex-shrink-0 transition-all duration-300
          `}
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: 1,
            rotate: 0,
            boxShadow: isHovered ? '0 10px 25px -5px rgba(0,0,0,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
          whileHover={{
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.2 }
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1
          }}
        >
          {getNotificationIcon(notification.type, 'large')}
        </motion.div>

        {/* Enhanced content section */}
        <div className="flex-1 min-w-0">
          {/* Header with title and priority */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <motion.h4
                  className={`font-bold text-base truncate ${design.textColor}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {notification.title}
                </motion.h4>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  {getPriorityIndicator(notification.priority)}
                </motion.div>
              </div>

              {/* Enhanced message preview */}
              <motion.p
                className={`text-sm ${design.subTextColor} leading-relaxed overflow-hidden font-medium`}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {notification.message}
              </motion.p>
            </div>

            {/* Enhanced quick actions with better visibility */}
            <motion.div
              className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              {!notification.read && (
                <motion.button
                  onClick={(e) => handleQuickAction('markRead', e)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 border border-gray-100"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Mark as read"
                >
                  <FiCheckCircle className="w-4 h-4 text-green-600" />
                </motion.button>
              )}

              <motion.button
                onClick={(e) => handleQuickAction('view', e)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 border border-gray-100"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                title="View details"
              >
                <FiExternalLink className="w-4 h-4 text-blue-600" />
              </motion.button>
            </motion.div>
          </div>

          {/* Enhanced footer with better styling */}
          <motion.div
            className="flex items-center justify-between gap-4 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Enhanced metadata */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                <FiUser className={`w-3.5 h-3.5 ${design.subTextColor}`} />
                <span className={`font-medium ${design.subTextColor}`}>
                  {notification.sender_name || 'System'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                <FiClock className={`w-3.5 h-3.5 ${design.subTextColor}`} />
                <span className={`font-medium ${design.subTextColor}`}>
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Enhanced category badge */}
            <motion.div
              className={`
                px-3 py-1.5 rounded-full text-xs font-semibold border
                ${design.badgeColor}
                shadow-sm
              `}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {category}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Activity indicator for real-time updates */}
      {isHovered && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FiActivity className={`w-3 h-3 ${design.subTextColor} opacity-50`} />
        </motion.div>
      )}
    </motion.div>
  );
}