import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageSquare, FiCheckSquare, FiAlertCircle, FiInfo,
  FiClock, FiTrash2, FiCheck, FiArrowRight, FiStar, FiCalendar, FiFileText,
  FiCheckCircle, FiXCircle, FiZap, FiAtSign, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const NotificationCard = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  onAction
}) => {
  const { isAnimatedTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
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
        return FiAtSign;
      case 'message':
        return FiMessageSquare;
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

  // Style Mapping for premium themes
  const getStyles = () => {
    if (isAnimatedTheme) {
      switch (type) {
        case 'task':
        case 'task_assigned':
        case 'task_updated':
        case 'task_comment':
          return { bg: 'bg-emerald-500/20', color: 'text-emerald-300', border: 'border-emerald-400/30' };
        case 'mention':
          return { bg: 'bg-amber-500/20', color: 'text-amber-300', border: 'border-amber-400/30' };
        case 'message':
          return { bg: 'bg-blue-500/20', color: 'text-blue-300', border: 'border-blue-400/30' };
        case 'alert':
          return { bg: 'bg-red-500/20', color: 'text-red-300', border: 'border-red-400/30' };
        case 'achievement':
          return { bg: 'bg-amber-500/20', color: 'text-amber-300', border: 'border-amber-400/30' };
        case 'leave_request':
        case 'meeting':
          return { bg: 'bg-purple-500/20', color: 'text-purple-300', border: 'border-purple-400/30' };
        case 'timesheet':
          return { bg: 'bg-indigo-500/20', color: 'text-indigo-300', border: 'border-indigo-400/30' };
        case 'urgent':
          return { bg: 'bg-rose-500/20', color: 'text-rose-300', border: 'border-rose-400/30' };
        case 'project_update':
        case 'sprint_update':
          return { bg: 'bg-indigo-500/20', color: 'text-indigo-300', border: 'border-indigo-400/30' };
        default:
          return { bg: 'bg-white/10', color: 'text-white/70', border: 'border-white/20' };
      }
    }
    switch (type) {
      case 'task':
      case 'task_assigned':
      case 'task_updated':
      case 'task_comment':
        return { bg: 'bg-emerald-100', color: 'text-emerald-600', border: 'border-emerald-200' };
      case 'mention':
        return { bg: 'bg-amber-100', color: 'text-amber-600', border: 'border-amber-200' };
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Specific actions for Leave Requests and Timesheets
  const isActionable = type === 'leave_request' || type === 'timesheet';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={!isMobile ? { scale: 1.01 } : {}}
      className={`
        relative p-4 mb-2 rounded-xl border transition-all duration-200 cursor-pointer group backdrop-blur-sm
        ${isAnimatedTheme
          ? read
            ? 'bg-white/5 border-white/10'
            : 'bg-white/10 border-white/20 shadow-sm'
          : read
            ? 'bg-white/60 dark:bg-slate-800/60 border-gray-50 dark:border-slate-800'
            : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900 shadow-sm'
        }
        ${priority === 'Critical' ? 'border-l-4 border-l-red-500' : ''}
        ${isMobile ? isAnimatedTheme ? 'active:bg-white/15' : 'active:bg-gray-50 dark:active:bg-slate-700/50' : ''}
      `}
      onClick={() => {
        setExpanded(prev => !prev);
        if (!read && onMarkRead) onMarkRead(id);
        onClick && onClick(notification);
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${styles.bg} ${styles.color} transition-colors duration-200
        `}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-semibold truncate ${isAnimatedTheme ? (read ? 'text-white/70' : 'text-white') : (read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white')}`}>
              {title}
            </h3>
            <span className={`text-[10px] flex-shrink-0 flex items-center gap-1 ${isAnimatedTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
              {created_at && formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>

          <p className={`text-sm leading-relaxed transition-all duration-300 ${expanded ? '' : 'line-clamp-2'} ${isAnimatedTheme ? (read ? 'text-white/50' : 'text-white/70') : (read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300')}`}>
            {message}
          </p>

          {/* Expand/Collapse indicator */}
          {message && message.length > 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
              className={`flex items-center gap-0.5 mt-1 text-[11px] font-medium transition-colors ${isAnimatedTheme ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
            >
              {expanded ? <><FiChevronUp className="w-3 h-3" /> Show less</> : <><FiChevronDown className="w-3 h-3" /> Show more</>}
            </button>
          )}

          {/* Action Buttons for Actionable Types */}
          {isActionable && !read && (
            <div className="flex items-center gap-2 mt-3 mb-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction && onAction(notification, 'approved');
                }}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${isAnimatedTheme ? 'bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200/50'}`}
              >
                <FiCheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction && onAction(notification, 'rejected');
                }}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${isAnimatedTheme ? 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50'}`}
              >
                <FiXCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}

          {/* Standard Actions */}
          <div className={`flex items-center justify-between mt-3 transition-opacity duration-200 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${styles.bg} ${styles.color}`}>
              {priority}
            </span>

            <div className="flex items-center gap-1">
              {!read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead && onMarkRead(id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${isAnimatedTheme ? 'text-blue-300 hover:bg-white/10' : 'text-blue-600 hover:bg-blue-50'}`}
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
                className={`p-1.5 rounded-lg transition-colors ${isAnimatedTheme ? 'text-white/50 hover:text-red-300 hover:bg-white/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
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
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isAnimatedTheme ? 'bg-blue-400 ring-4 ring-white/10' : 'bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-950'}`} />
      )}
    </motion.div>
  );
};

export default NotificationCard;