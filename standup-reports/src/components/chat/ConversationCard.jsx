import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiMessageSquare,
  FiBookmark,
  FiMoreVertical,
  FiVolume2,
  FiVolumeX,
  FiArchive,
  FiTrash2,
  FiUserPlus,
  FiInfo
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const ConversationCard = ({
  conversation,
  isActive,
  onClick,
  isPinned = false,
  isMuted = false,
  onPin,
  onMute,
  onlineUsers = [],
  currentUser,
  onAvatarClick,
  className = ""
}) => {
  const { themeMode } = useTheme();
  const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Get conversation name
  const getConversationName = () => {
    if (conversation.type === 'direct' && conversation.otherUser) {
      return conversation.otherUser.name || 'Unknown User';
    }
    return conversation.name || (conversation.type === 'team' ? 'Team Chat' : 'Untitled');
  };

  // Get conversation avatar
  const getConversationAvatar = () => {
    if (conversation.type === 'direct' && conversation.otherUser) {
      // Check if user has avatar
      if (conversation.otherUser.avatar_url && conversation.otherUser.avatar_url.trim() !== '') {
        return (
          <img
            src={conversation.otherUser.avatar_url}
            alt={conversation.otherUser.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        );
      }
      return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {conversation.otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
        <FiUsers className="w-5 h-5" />
      </div>
    );
  };

  // Get online status for direct messages
  const isUserOnline = () => {
    if (conversation.type === 'direct' && conversation.otherUser) {
      return onlineUsers.some(user => user.id === conversation.otherUser.id);
    }
    return false;
  };

  // Format last message time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMins = Math.floor((now - date) / (1000 * 60));
        return diffInMins <= 1 ? 'now' : `${diffInMins}m`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}d`;
      } else {
        return formatDistanceToNow(date, { addSuffix: false });
      }
    } catch (error) {
      return '';
    }
  };

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!conversation.last_message) return 'No messages yet';

    const message = conversation.last_message;
    if (message.content) {
      return message.content.length > 30
        ? `${message.content.substring(0, 30)}...`
        : message.content;
    }

    // Handle different message types
    if (message.attachments && message.attachments.length > 0) {
      return `📎 ${message.attachments.length} attachment${message.attachments.length > 1 ? 's' : ''}`;
    }

    if (message.type === 'voice') {
      return '🎤 Voice message';
    }

    return 'Message';
  };

  // Get unread count display
  const getUnreadDisplay = () => {
    const count = conversation.unread_count || 0;
    if (count === 0) return null;

    if (count > 99) {
      return (
        <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-200">
          <span className="text-white text-[10px] font-bold">99+</span>
        </div>
      );
    }

    return (
      <div className="min-w-[1.25rem] h-5 bg-rose-500 rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-rose-200">
        <span className="text-white text-[10px] font-bold">{count}</span>
      </div>
    );
  };

  // Handle dropdown actions
  const handleAction = (action) => {
    setShowDropdown(false);

    switch (action) {
      case 'pin':
        onPin?.();
        break;
      case 'mute':
        onMute?.();
        break;
      case 'archive':
        console.log('Archive conversation:', conversation.id);
        break;
      case 'info':
        console.log('Show conversation info:', conversation.id);
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      className={`relative group mb-3 last:mb-0 mx-2 ${className}`}
      layout
      style={{ zIndex: showDropdown ? 50 : 1 }}
    >
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative p-3 rounded-2xl cursor-pointer transition-all duration-300
          ${isActive
            ? (isPremiumTheme
              ? 'bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-white/20'
              : 'bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-slate-900/50 ring-1 ring-black/5 dark:ring-slate-700')
            : (isPremiumTheme
              ? 'bg-white/5 hover:bg-white/10 backdrop-blur-sm hover:ring-1 hover:ring-white/10 border border-transparent hover:border-white/10'
              : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg backdrop-blur-sm hover:ring-1 hover:ring-black/5 dark:hover:ring-slate-700 border border-transparent hover:border-white/50 dark:hover:border-slate-700')
          }
        `}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
          />
        )}

        <div className="flex items-center gap-3">
          {/* Avatar Area */}
          <motion.div
            className="relative flex-shrink-0"
            onClick={(e) => {
              if (conversation.type === 'direct' && conversation.otherUser?.id) {
                e.stopPropagation();
                onAvatarClick?.(conversation.otherUser.id);
              }
            }}
          >
            <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 ${conversation.type === 'direct' ? 'group-hover:scale-105 group-hover:rotate-3' : ''}`}>
              {getConversationAvatar()}
            </div>

            {/* Online Badge */}
            {conversation.type === 'direct' && isUserOnline() && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            )}
          </motion.div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className={`font-bold truncate text-sm flex items-center gap-1.5 ${isActive
                ? (isPremiumTheme ? 'text-white' : 'text-gray-900 dark:text-white')
                : (isPremiumTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-300')
                }`}>
                {getConversationName()}
                {isPinned && <FiBookmark className="w-3 h-3 text-indigo-500 fill-current" />}
                {isMuted && <FiVolumeX className="w-3 h-3 text-gray-400" />}
              </h3>
              <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}>
                {formatTime(conversation.last_message_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className={`text-xs truncate max-w-[140px] ${isActive
                ? (isPremiumTheme ? 'text-white/70' : 'text-gray-600 dark:text-gray-400')
                : (isPremiumTheme ? 'text-white/60' : 'text-gray-500 dark:text-gray-400')
                }`}>
                {conversation.isTyping ? (
                  <span className="text-indigo-500 font-medium animate-pulse">Typing...</span>
                ) : (
                  getLastMessagePreview()
                )}
              </p>
              {getUnreadDisplay()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Action Button (More) - Only visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className={`p-1.5 rounded-full shadow-sm backdrop-blur-md border border-white/50 dark:border-slate-700 transition-colors ${showDropdown ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white opacity-100' : 'bg-white/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
        >
          <FiMoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-8 w-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 dark:border-slate-700 z-50 overflow-hidden"
            >
              <div className="p-1">
                <button onClick={() => handleAction('pin')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                  <FiBookmark className="w-3.5 h-3.5" /> {isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => handleAction('mute')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                  {isMuted ? <FiVolume2 className="w-3.5 h-3.5" /> : <FiVolumeX className="w-3.5 h-3.5" />} {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <div className="h-px bg-gray-200/50 dark:bg-slate-700 my-1" />
                <button onClick={() => handleAction('archive')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <FiArchive className="w-3.5 h-3.5" /> Archive
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ConversationCard;