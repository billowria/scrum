import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiUser, FiTag, FiMoreVertical, FiEye, FiArchive, 
  FiTrash2, FiBookmark, FiShare2, FiCornerUpLeft, FiStar, FiCheck,
  FiExternalLink, FiHeart, FiMessageSquare, FiArrowRight
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCard({ 
  notification, 
  onRead, 
  onArchive, 
  onDelete,
  onBookmark,
  onReply,
  compact = false,
  showActions = true 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef(null);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50';
      case 'high': return 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50';
      case 'medium': return 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50';
      default: return 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50';
    }
  };
  
  const getCategoryIcon = (category) => {
    const iconMap = {
      system: '🔧',
      security: '🔒',
      standup: '📅',
      mention: '💬',
      task: '✅',
      update: '📢',
      administrative: '📋',
      project: '📁',
      communication: '💬',
      achievement: '🏆'
    };
    return iconMap[category] || '📝';
  };
  
  const getCategoryColor = (category) => {
    const colorMap = {
      task: 'from-blue-400 to-indigo-500',
      administrative: 'from-purple-400 to-indigo-500',
      project: 'from-emerald-400 to-teal-500',
      communication: 'from-cyan-400 to-blue-500',
      system: 'from-gray-400 to-slate-500',
      achievement: 'from-amber-400 to-orange-500'
    };
    return colorMap[category] || 'from-gray-400 to-slate-500';
  };
  
  const handleAction = async (action, e) => {
    e?.stopPropagation();
    setIsMenuOpen(false);
    
    try {
      switch (action) {
        case 'read':
          await onRead?.(notification.id);
          break;
        case 'archive':
          await onArchive?.(notification.id);
          break;
        case 'delete':
          await onDelete?.(notification.id);
          break;
        case 'bookmark':
          await onBookmark?.(notification.id);
          break;
        case 'reply':
          onReply?.(notification);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`
        relative group border-l-4 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm
        ${!notification.read ? getPriorityColor(notification.priority) : 'border-gray-300 bg-white'}
        ${compact ? 'p-3' : 'p-5'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !notification.read && handleAction('read')}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <motion.div 
          className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Category badge */}
      <div className="absolute top-3 right-3">
        <motion.div 
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${getCategoryColor(notification.category)} shadow-sm`}
          whileHover={{ scale: 1.05 }}
        >
          {notification.category || 'general'}
        </motion.div>
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Category icon with gradient background */}
          <motion.div 
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryColor(notification.category)} flex items-center justify-center shadow-sm flex-shrink-0`}
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-xl">{getCategoryIcon(notification.category)}</span>
          </motion.div>
          
          {/* Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className={`font-semibold text-base ${!notification.read ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                {notification.title}
              </h4>
              {notification.priority === 'urgent' && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <FiStar className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                </motion.div>
              )}
              {notification.isBookmarked && (
                <FiBookmark className="w-4 h-4 text-amber-500 fill-current flex-shrink-0" />
              )}
            </div>
            
            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                <FiUser className="w-3 h-3 text-gray-600" />
                <span className="font-medium">{notification.sender || 'System'}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions menu */}
        {showActions && (
          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiMoreVertical className="w-4 h-4 text-gray-400" />
            </motion.button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border z-20"
                >
                  <div className="py-1">
                    {!notification.read && (
                      <button
                        onClick={(e) => handleAction('read', e)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiEye className="w-4 h-4" />
                        Mark as read
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => handleAction('bookmark', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiBookmark className="w-4 h-4" />
                      {notification.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    </button>
                    
                    {notification.allowReply && (
                      <button
                        onClick={(e) => handleAction('reply', e)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiCornerUpLeft className="w-4 h-4" />
                        Reply
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => handleAction('archive', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiArchive className="w-4 h-4" />
                      Archive
                    </button>
                    
                    <div className="border-t my-1"></div>
                    
                    <button
                      onClick={(e) => handleAction('delete', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className={`${compact ? 'text-sm' : 'text-sm'} text-gray-700 mb-3 mt-3 leading-relaxed`}>
        <div className={!notification.read ? 'font-medium' : ''}>
          {isExpanded || !notification.content ? 
            notification.content : 
            truncateText(notification.content)
          }
        </div>
        
        {notification.content && notification.content.length > 150 && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1"
            whileHover={{ x: 2 }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
            <FiArrowRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>
      
      {/* Actions (if any) */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {notification.actions.map((action, index) => (
            <motion.button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(notification);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all shadow-sm ${
                action.primary ? 
                'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent hover:shadow-md' :
                'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
      
      {/* Footer with engagement stats */}
      {(notification.likes || notification.comments || notification.url) && (
        <div className="flex items-center gap-4 pt-3 mt-2 border-t border-gray-200">
          {notification.likes > 0 && (
            <motion.div 
              className="flex items-center gap-1.5 text-xs text-gray-600 bg-red-50 px-2 py-1 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <FiHeart className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold">{notification.likes}</span>
            </motion.div>
          )}
          
          {notification.comments > 0 && (
            <motion.div 
              className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <FiMessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold">{notification.comments}</span>
            </motion.div>
          )}
          
          {notification.url && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                window.open(notification.url, '_blank');
              }}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 ml-auto font-semibold bg-indigo-50 px-3 py-1 rounded-full"
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              <span>View</span>
            </motion.button>
          )}
        </div>
      )}
      
      {/* Click overlay for unread notifications */}
      {!notification.read && (
        <div className="absolute inset-0 bg-transparent" />
      )}
    </motion.div>
  );
}