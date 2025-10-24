import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiCheck, FiCheckCircle, FiClock, FiUsers, FiMessageSquare, FiBookmark } from 'react-icons/fi';

const ConversationCard = ({
  conversation,
  currentUser,
  isActive,
  isOnline,
  unreadCount = 0,
  lastMessage,
  isTyping,
  isPinned = false,
  onSelect,
  onPin,
  className = ""
}) => {
  const getConversationName = () => {
    if (conversation.type === 'direct' && conversation.otherUser) {
      return conversation.otherUser.name || 'Unknown User';
    }
    return conversation.name || conversation.type === 'team' ? 'Team Chat' : 'Untitled';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'direct' && conversation.otherUser) {
      if (conversation.otherUser.avatar_url && conversation.otherUser.avatar_url.trim() !== '') {
        return (
          <img
            src={conversation.otherUser.avatar_url}
            alt={conversation.otherUser.name}
            className="w-full h-full object-cover"
          />
        );
      }
      return (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
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

  const getStatusIndicator = () => {
    if (conversation.type === 'direct' && isOnline) {
      return (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      );
    }
    return null;
  };

  const getTypingIndicator = () => {
    if (isTyping) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>typing...</span>
        </div>
      );
    }
    return null;
  };

  const formatLastMessage = () => {
    if (!lastMessage) return '';

    if (lastMessage.user_id === currentUser?.id) {
      const prefix = lastMessage.deleted_at ? 'You deleted a message' : 'You: ';
      return prefix + (lastMessage.deleted_at ? 'This message was deleted' : lastMessage.content);
    }

    const senderName = conversation.type === 'direct'
      ? conversation.otherUser?.name
      : lastMessage.user_name || 'Someone';

    return `${senderName}: ${lastMessage.content}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50
        ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
        ${isPinned ? 'bg-yellow-50/50' : ''}
        ${className}
      `}
      onClick={onSelect}
    >
      {/* Avatar with status */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
          {getConversationAvatar()}
        </div>
        {getStatusIndicator()}
      </div>

      {/* Conversation Content */}
      <div className="flex-1 min-w-0">
        {/* Header with name and time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {isPinned && (
              <FiBookmark className="w-3 h-3 text-yellow-600 flex-shrink-0" />
            )}
            <h3 className={`font-semibold text-gray-900 truncate ${
              isActive ? 'text-blue-600' : ''
            }`}>
              {getConversationName()}
            </h3>
            {conversation.type === 'team' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FiUsers className="w-3 h-3" />
                {conversation.participant_count || 2}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
              </span>
            )}

            {/* Read status */}
            {lastMessage?.user_id === currentUser?.id && lastMessage?.read_at && (
              <FiCheckCircle className="w-4 h-4 text-blue-500" />
            )}
          </div>
        </div>

        {/* Last message or typing indicator */}
        <div className="min-h-[1.25rem] flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {getTypingIndicator() || (
              <p className={`text-sm text-gray-600 truncate ${
                unreadCount > 0 ? 'font-semibold' : ''
              }`}>
                {formatLastMessage() || 'No messages yet'}
              </p>
            )}
          </div>

          {/* Unread count */}
          {unreadCount > 0 && (
            <div className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full min-w-[1.5rem] text-center flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin?.(conversation.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
      >
        <FiBookmark className={`w-4 h-4 ${isPinned ? 'text-yellow-600 fill-current' : 'text-gray-400'}`} />
      </button>
    </motion.div>
  );
};

export default ConversationCard;