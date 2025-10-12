import React from 'react';
import { motion } from 'framer-motion';
import { HashtagIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { formatConversationTime, getMessagePreview } from '../../utils/chatUtils';
import UserAvatar from './UserAvatar';

/**
 * ConversationItem Component
 * Individual conversation item in the sidebar
 */
export const ConversationItem = ({ 
  conversation, 
  isActive = false, 
  onClick,
  currentUser,
  isOnline = false
}) => {
  const navigate = useNavigate();
  if (!conversation) return null;

  const hasUnread = conversation.unread_count > 0;
  const otherUser = conversation.type === 'direct' ? conversation.otherUser : null;
  const lastMessage = conversation.last_message;

  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative px-4 py-3 cursor-pointer transition-colors border-l-4
        ${isActive 
          ? 'bg-indigo-50 border-indigo-600' 
          : 'border-transparent hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar/Icon */}
        <div className="flex-shrink-0">
          {conversation.type === 'direct' && otherUser ? (
            <UserAvatar 
              user={otherUser} 
              size="md" 
              showOnline 
              isOnline={isOnline}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${otherUser.id}`);
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <HashtagIcon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-sm font-semibold truncate ${
              hasUnread ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {conversation.type === 'team' && (
                <HashtagIcon className="w-4 h-4 inline mr-1 -mt-0.5" />
              )}
              {conversation.name}
            </h3>
            
            {/* Timestamp */}
            {lastMessage && (
              <span className={`text-xs flex-shrink-0 ml-2 ${
                hasUnread ? 'text-indigo-600 font-medium' : 'text-gray-500'
              }`}>
                {formatConversationTime(lastMessage.created_at)}
              </span>
            )}
          </div>

          {/* Last message preview */}
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${
              hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'
            }`}>
              {lastMessage ? getMessagePreview(lastMessage) : 'No messages yet'}
            </p>

            {/* Unread badge */}
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 flex-shrink-0 flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full"
              >
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationItem;
