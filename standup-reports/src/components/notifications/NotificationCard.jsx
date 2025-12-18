import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageSquare, FiCheckSquare, FiAlertCircle, FiInfo,
  FiClock, FiTrash2, FiCheck, FiArrowRight, FiStar, FiCalendar, FiFileText,
  FiCheckCircle, FiXCircle, FiZap
} from 'react-icons/fi';

const NotificationCard = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  onAction
}) => {
  const {
    id, title, message, type, created_at, read, priority
  } = notification;

  // Icon Mapping
  const getIcon = () => {
    switch (type) {
      case 'task':
      case 'task_assigned':
      case 'task_updated':
      case 'task_comment':
        return FiCheckSquare;
      case 'mention':
      case 'message':
        return FiMessageCircle;
      case 'alert':
        return FiAlertCircle;
      case 'achievement':
        return FiStar;
      case 'leave_request':
      case 'meeting':
        return FiCalendar;
      case 'timesheet':
        return FiClock;
      case 'urgent':
        return FiZap;
      case 'project_update':
      case 'sprint_update':
        return FiFileText;
      default:
        return FiInfo;
    }
  };

  const Icon = getIcon();

  // Style Mapping
  const getStyles = () => {
    switch (type) {
      case 'task':
      case 'task_assigned':
      case 'task_updated':
      case 'task_comment':
        return { bg: 'bg-emerald-100', color: 'text-emerald-600', border: 'border-emerald-200' };
      case 'mention':
      case 'message':
        return { bg: 'bg-blue-100', color: 'text-blue-600', border: 'border-blue-200' };
      case 'alert':
        return { bg: 'bg-red-100', color: 'text-red-600', border: 'border-red-200' };
      case 'achievement':
        return { bg: 'bg-amber-100', color: 'text-amber-600', border: 'border-amber-200' };
      case 'leave_request':
      case 'meeting':
        return { bg: 'bg-purple-100', color: 'text-purple-600', border: 'border-purple-200' };
      case 'timesheet':
        return { bg: 'bg-indigo-100', color: 'text-indigo-600', border: 'border-indigo-200' };
      case 'urgent':
        return { bg: 'bg-rose-100', color: 'text-rose-600', border: 'border-rose-200' };
      case 'project_update':
      case 'sprint_update':
        return { bg: 'bg-indigo-100', color: 'text-indigo-600', border: 'border-indigo-200' };
      default:
        return { bg: 'bg-gray-100', color: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  const styles = getStyles();

  // Specific actions for Leave Requests and Timesheets
  const isActionable = type === 'leave_request' || type === 'timesheet';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative p-4 mb-3 rounded-xl border transition-all duration-200 cursor-pointer group
        ${read
          ? 'bg-white/60 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700'
          : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900 shadow-sm shadow-blue-50 dark:shadow-blue-950'
        }
        ${priority === 'Critical' ? 'border-l-4 border-l-red-500' : ''}
      `}
      onClick={() => onClick && onClick(notification)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${styles.bg} ${styles.color} transition-colors duration-200
        `}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 pr-4">
            <h3 className={`text-sm font-semibold truncate ${read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
              {title}
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {created_at && formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>

          <p className={`text-sm line-clamp-2 mb-2 ${read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
            {message}
          </p>

          {/* Action Buttons for Actionable Types */}
          {isActionable && !read && (
            <div className="flex items-center gap-2 mt-3 mb-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction && onAction(notification, 'approved');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
              >
                <FiCheckCircle className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction && onAction(notification, 'rejected');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
              >
                <FiXCircle className="w-3 h-3" /> Reject
              </button>
            </div>
          )}

          {/* Standard Hover Actions */}
          <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.bg} ${styles.color}`}>
              {priority}
            </span>

            <div className="flex items-center gap-2">
              {!read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead && onMarkRead(id);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mark as read"
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Remove"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unread Indicator */}
      {!read && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-950" />
      )}
    </motion.div>
  );
};

export default NotificationCard;