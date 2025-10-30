import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiCalendar, FiClock, FiUser, FiCheckCircle, FiArchive,
  FiTrash2, FiBell, FiMessageCircle, FiTarget, FiFolder, FiPlus, FiEdit,
  FiAlertTriangle, FiExternalLink, FiCheck
} from 'react-icons/fi';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import notificationService from '../../services/notificationService';

// Optimized animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: "easeIn" }
  }
};

const modalVariants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
    y: 20,
    transition: { duration: 0.15, ease: "easeIn" }
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 35,
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  },
  exit: {
    scale: 0.98,
    opacity: 0,
    y: 10,
    transition: { duration: 0.1, ease: "easeIn" }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const NotificationDetailModal = ({ notification, isOpen, onClose, onAction }) => {
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  if (!notification || !isOpen) return null;

  // Handle notification actions
  const handleNotificationAction = async (action) => {
    setProcessing(true);
    setActionResult(null);

    try {
      if (onAction) {
        await onAction(action, notification.id);
      }

      // Show success message
      const messages = {
        markRead: 'Marked as read',
        archive: 'Archived successfully',
        delete: 'Deleted successfully'
      };

      setActionResult({
        type: 'success',
        message: messages[action] || 'Action completed successfully'
      });

      // Auto-close for simple actions
      if (['markRead', 'archive', 'delete'].includes(action)) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }

    } catch (error) {
      console.error('Error handling action:', error);
      setActionResult({
        type: 'error',
        message: 'Failed to process action. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
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
      task_comment: FiMessageCircle,
      project_update: FiFolder,
      sprint_update: FiTarget,
      system_alert: FiAlertTriangle,
      general: FiMessageCircle,
      meeting: FiCalendar,
      task_status_change: FiEdit,
      default: FiBell
    };
    const Icon = iconMap[type] || iconMap.default;
    return <Icon className="w-6 h-6" />;
  };

  const getNotificationColors = (type) => {
    const colorMap = {
      announcement: 'from-blue-500 to-indigo-600',
      leave_request: 'from-purple-500 to-pink-600',
      timesheet_submission: 'from-green-500 to-emerald-600',
      task_created: 'from-indigo-500 to-blue-600',
      task_updated: 'from-amber-500 to-orange-600',
      task_assigned: 'from-cyan-500 to-teal-600',
      task_comment: 'from-teal-500 to-green-600',
      project_update: 'from-emerald-500 to-teal-600',
      sprint_update: 'from-rose-500 to-pink-600',
      system_alert: 'from-red-500 to-rose-600',
      general: 'from-gray-500 to-slate-600'
    };
    return colorMap[type] || 'from-gray-500 to-slate-600';
  };

  const category = notificationService.getNotificationCategory(notification.type);
  const colorGradient = getNotificationColors(notification.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Light backdrop with subtle blur */}
          <motion.div
            className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-6xl max-h-[90vh] min-h-fit bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col m-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Streamlined Header Section */}
            <div className="relative bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4 pb-3 flex-shrink-0">
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </motion.button>

              {/* Header Content */}
              <div className="flex items-start gap-4">
                {/* Smaller notification icon */}
                <motion.div
                  className={`
                    w-10 h-10 rounded-xl bg-gradient-to-br ${colorGradient}
                    flex items-center justify-center text-white shadow-lg
                    flex-shrink-0
                  `}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    delay: 0.05
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  {getNotificationIcon(notification.type)}
                </motion.div>

                {/* Title and metadata */}
                <div className="flex-1 min-w-0 pr-12">
                  <motion.h1
                    className="text-2xl font-bold text-gray-900 mb-1 leading-tight"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {notification.title}
                  </motion.h1>

                  <motion.div
                    className="flex items-center gap-3 text-sm text-gray-600"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <FiUser className="w-4 h-4" />
                      <span>{notification.sender_name || 'System'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                    </div>
                  </motion.div>

                  {/* Category and Priority badges */}
                  <motion.div
                    className="flex items-center gap-2 mt-1"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {category}
                    </span>

                    {notification.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Urgent
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <motion.div
                className="p-6"
                variants={contentVariants}
                transition={{ delay: 0.1 }}
              >
                {/* Message content */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Streamlined Action Buttons */}
            <motion.div
              className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex gap-3 justify-end">
                {/* Archive button */}
                <motion.button
                  onClick={() => handleNotificationAction('archive')}
                  disabled={processing}
                  className="px-6 py-2.5 bg-white text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 border border-gray-300 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {processing && actionResult?.type === 'success' && actionResult?.message.includes('Archived') ? (
                    <>
                      <FiArchive className="w-4 h-4" />
                      Archived
                    </>
                  ) : (
                    <>
                      <FiArchive className="w-4 h-4" />
                      Archive
                    </>
                  )}
                </motion.button>

                {/* Delete button */}
                <motion.button
                  onClick={() => handleNotificationAction('delete')}
                  disabled={processing}
                  className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 border border-red-200 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {processing && actionResult?.type === 'success' && actionResult?.message.includes('Deleted') ? (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      Deleted
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Success/Error message overlay */}
            <AnimatePresence>
              {actionResult && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.div
                    className={`
                      flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg
                      ${actionResult.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                      }
                    `}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {actionResult.type === 'success' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.05 }}
                      >
                        <FiCheck className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <FiAlertTriangle className="w-6 h-6" />
                    )}
                    <span className="font-semibold text-base">{actionResult.message}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
