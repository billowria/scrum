import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock, FiUser, FiCheckCircle, FiExternalLink, FiCalendar,
  FiMessageCircle, FiTarget, FiFolder, FiPlus, FiEdit, FiAlertTriangle, FiBell,
  FiStar, FiArchive, FiTrash2, FiArrowRight, FiActivity, FiCheck, FiX
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import notificationService from '../../services/notificationService';
import { approveLeaveRequestFromNotification, rejectLeaveRequestFromNotification } from '../../utils/notificationHelper';

export default function NotificationCard({
  notification,
  onAction, // Unified action handler
  compact = false,
  currentUser // Add current user for role checking
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

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
        gradient: 'from-indigo-500 via-purple-500 to-pink-500',
        lightBg: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
        borderColor: 'border-indigo-200',
        iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        textColor: 'text-indigo-900',
        subTextColor: 'text-indigo-700',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        shadowColor: 'shadow-indigo-100',
        glowColor: 'from-indigo-400/20 to-purple-600/20'
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

  // Handle leave request actions
  const handleLeaveAction = async (action, e) => {
    e.stopPropagation();

    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
      console.error('Only managers and admins can approve or reject leave requests');
      return;
    }

    setActionLoading(action);

    try {
      const leaveRequestId = notification.data?.id || notification.id?.replace('leave-', '');
      let success = false;

      if (action === 'approve') {
        success = await approveLeaveRequestFromNotification(leaveRequestId, currentUser.id);
      } else if (action === 'reject') {
        success = await rejectLeaveRequestFromNotification(leaveRequestId, currentUser.id);
      }

      if (success) {
        // Notify parent component to refresh notifications
        onAction('refresh', notification.id);
      }
    } catch (error) {
      console.error('Error handling leave action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const design = getNotificationDesign(notification.type, notification.read, notification.priority);
  const category = notificationService.getNotificationCategory(notification.type);

  // Special render for leave requests with compact enhanced structure
  if (notification.type === 'leave_request') {
    const leaveData = notification.data;
    const startDate = leaveData?.start_date ? new Date(leaveData.start_date) : null;
    const endDate = leaveData?.end_date ? new Date(leaveData.end_date) : null;
    const daysCount = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        whileHover={{
          scale: 1.01,
          y: -2,
          boxShadow: `0 15px 40px -10px ${notification.read ? 'rgba(0,0,0,0.1)' : 'rgba(99, 102, 241, 0.2)'}`,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className={`
          group relative border-2 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
          ${!notification.read
            ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-lg shadow-indigo-100/40'
            : 'bg-white border-gray-200 shadow-sm'
          }
          hover:shadow-xl
          ${compact ? 'p-4' : 'p-5'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Compact unread indicator */}
        {!notification.read && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-l-2xl"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          />
        )}

        {/* Subtle glow effect for unread notifications */}
        {!notification.read && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 via-purple-400/5 to-pink-400/5 rounded-2xl"
            animate={{
              opacity: isHovered ? 0.8 : 0.2,
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        <div className="relative">
          <div className="flex items-start gap-3">
            {/* Compact Calendar Icon */}
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                boxShadow: isHovered ? '0 8px 20px -3px rgba(99, 102, 241, 0.25)' : '0 4px 8px -1px rgba(0,0,0,0.1)'
              }}
              whileHover={{
                scale: 1.05,
                rotate: 5,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.05
              }}
            >
              <FiCalendar className="w-5 h-5" />
            </motion.div>

            {/* Compact Content Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <motion.h3
                    className={`text-base font-bold ${!notification.read ? 'text-indigo-900' : 'text-gray-900'} mb-1`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Leave Request
                  </motion.h3>

                  <motion.p
                    className={`text-sm ${!notification.read ? 'text-indigo-700' : 'text-gray-600'} leading-relaxed mb-2`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {notification.message}
                  </motion.p>

                  {/* Compact Leave Details */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-indigo-100 text-xs"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-indigo-600 font-semibold">
                        {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span className="text-indigo-600 font-semibold">
                        {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      {daysCount} {daysCount === 1 ? 'day' : 'days'}
                    </motion.div>

                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-indigo-100 text-xs"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-gray-600">by</span>
                      <span className="text-indigo-600 font-semibold ml-1">
                        {notification.data?.users?.name || notification.sender_name || 'Employee'}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Compact Action Buttons */}
                {currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin') && (
                  <motion.div
                    className="flex items-center gap-2 flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    <motion.button
                      onClick={(e) => handleLeaveAction('approve', e)}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={actionLoading === 'approve'}
                      title="Approve leave request"
                    >
                      {actionLoading === 'approve' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3"
                        >
                          <FiClock />
                        </motion.div>
                      ) : (
                        <>
                          <FiCheck className="w-3 h-3" />
                          Approve
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={(e) => handleLeaveAction('reject', e)}
                      className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={actionLoading === 'reject'}
                      title="Reject leave request"
                    >
                      {actionLoading === 'reject' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3"
                        >
                          <FiClock />
                        </motion.div>
                      ) : (
                        <>
                          <FiX className="w-3 h-3" />
                          Reject
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* Compact Footer */}
              <motion.div
                className="flex items-center justify-between gap-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium border border-amber-200"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Pending Approval
                  </motion.div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FiClock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Subtle activity indicator */}
        {isHovered && (
          <motion.div
            className="absolute top-2 right-2 opacity-40"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ delay: 0.45 }}
          >
            <FiActivity className="w-3 h-3 text-indigo-400" />
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default notification card for other types
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