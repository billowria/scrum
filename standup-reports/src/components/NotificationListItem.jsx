import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiAlertCircle, FiMessageSquare, FiCheckSquare, FiAlertTriangle, FiBell,
  FiCheck, FiX, FiEye, FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';

const NotificationListItem = ({ 
  notification, 
  isSelected, 
  onSelect, 
  onMarkAsRead, 
  onViewDetails 
}) => {
  const priorityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-indigo-500',
    high: 'border-l-purple-500',
    critical: 'border-l-red-500'
  };

  const priorityTextColors = {
    low: 'text-blue-700 dark:text-blue-400',
    medium: 'text-indigo-700 dark:text-indigo-400',
    high: 'text-purple-700 dark:text-purple-400',
    critical: 'text-red-700 dark:text-red-400'
  };

  const getIcon = (type) => {
    switch(type) {
      case 'announcement': return <FiAlertCircle className="w-5 h-5 text-blue-600" />;
      case 'message': return <FiMessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'task': return <FiCheckSquare className="w-5 h-5 text-purple-600" />;
      case 'alert': return <FiAlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <FiBell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <motion.div 
      className={`relative bg-white/80 dark:bg-gray-900/70 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-lg shadow-sm transform-gpu cursor-pointer ${priorityColors[notification.priority] || priorityColors.medium} border-l-4 w-full max-w-full`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01, boxShadow: "0 5px 15px -5px rgba(0, 0, 0, 0.1)" }}
      onClick={onViewDetails}
    >
      <div className="p-4 flex items-center w-full">
        <div className="flex-shrink-0 mr-4">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex-shrink-0">
                New
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
            {notification.message}
          </p>
          
          <div className="flex items-center mt-2 text-xs flex-wrap">
            <FiClock className="mr-1 text-gray-500" />
            <span className="text-gray-500 dark:text-gray-400">
              {format(new Date(notification.created_at), 'MMM d, h:mm a')}
            </span>
            
            <span className={`mx-2 px-1.5 py-0.5 rounded ${priorityTextColors[notification.priority] || priorityTextColors.medium} bg-opacity-20 flex-shrink-0`}>
              {notification.priority}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Mark as read"
          >
            <FiCheck className="w-4 h-4" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="View details"
          >
            <FiEye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationListItem;
