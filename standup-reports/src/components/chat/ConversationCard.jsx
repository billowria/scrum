import React, { useState } from 'react';
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
  const [showDropdown, setShowDropdown] = useState(false);

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
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
          {conversation.otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white">
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
      return message.content.length > 35
        ? `${message.content.substring(0, 35)}...`
        : message.content;
    }

    // Handle different message types
    if (message.attachments && message.attachments.length > 0) {
      return `📎 ${message.attachments.length} file${message.attachments.length > 1 ? 's' : ''}`;
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
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">99+</span>
        </div>
      );
    }

    return (
      <div className="min-w-[1.25rem] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
        <span className="text-white text-xs font-bold">{count}</span>
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
        // TODO: Implement archive functionality
        console.log('Archive conversation:', conversation.id);
        break;
      case 'info':
        // TODO: Show conversation info modal
        console.log('Show conversation info:', conversation.id);
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      className={`relative group cursor-pointer transition-all duration-200 ${isActive
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'
        : 'hover:bg-gray-50 border-l-4 border-transparent'
        } ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="flex items-center gap-3 p-3">
        {/* Avatar - Clickable for direct messages */}
        <motion.div
          className="relative flex-shrink-0"
          whileHover={{ scale: conversation.type === 'direct' ? 1.05 : 1 }}
          whileTap={{ scale: conversation.type === 'direct' ? 0.95 : 1 }}
          onClick={(e) => {
            if (conversation.type === 'direct' && conversation.otherUser?.id) {
              e.stopPropagation();
              onAvatarClick?.(conversation.otherUser.id);
            }
          }}
        >
          <div className={`w-12 h-12 rounded-full overflow-hidden shadow-sm ${conversation.type === 'direct' ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all' : ''}`}>
            {getConversationAvatar()}
          </div>

          {/* Online status indicator for direct messages */}
          {conversation.type === 'direct' && (
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isUserOnline()
              ? 'bg-green-500'
              : 'bg-gray-300'
              }`} />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate flex items-center gap-2 ${isActive
              ? 'text-blue-600'
              : 'text-gray-900'
              }`}>
              {getConversationName()}

              {/* Status indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isPinned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-0.5"
                  >
                    <FiBookmark className="w-3 h-3 text-yellow-500 fill-current" />
                  </motion.div>
                )}

                {isMuted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-0.5"
                  >
                    <FiVolumeX className="w-3 h-3 text-gray-400" />
                  </motion.div>
                )}
              </div>
            </h3>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs ${isActive
                ? 'text-blue-500 font-medium'
                : 'text-gray-500'
                }`}>
                {formatTime(conversation.last_message_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${isActive
              ? 'text-blue-600'
              : isMuted
                ? 'text-gray-400'
                : 'text-gray-600'
              }`}>
              {getLastMessagePreview()}
            </p>

            {/* Unread count */}
            <AnimatePresence>
              {getUnreadDisplay()}
            </AnimatePresence>
          </div>

          {/* Typing indicator */}
          {conversation.isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-xs text-blue-500 font-medium flex items-center gap-1"
            >
              <span>typing</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* More options button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-500" />
          </motion.button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20"
                >
                  <button
                    onClick={() => handleAction('pin')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiBookmark className="w-4 h-4 text-gray-400" />
                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => handleAction('mute')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {isMuted ? (
                      <>
                        <FiVolume2 className="w-4 h-4 text-gray-400" />
                        <span>Unmute</span>
                      </>
                    ) : (
                      <>
                        <FiVolumeX className="w-4 h-4 text-gray-400" />
                        <span>Mute</span>
                      </>
                    )}
                  </button>

                  {conversation.type === 'team' && (
                    <button
                      onClick={() => handleAction('info')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FiInfo className="w-4 h-4 text-gray-400" />
                      <span>View Info</span>
                    </button>
                  )}

                  <div className="border-t border-gray-200 my-1"></div>

                  <button
                    onClick={() => handleAction('archive')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiArchive className="w-4 h-4 text-gray-400" />
                    <span>Archive</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationCard;