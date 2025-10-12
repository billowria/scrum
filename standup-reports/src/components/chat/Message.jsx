import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Linkify from 'linkify-react';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { formatMessageTime, isOnlyEmoji } from '../../utils/chatUtils';
import UserAvatar from './UserAvatar';

/**
 * Message Component
 * Individual message bubble with user info and actions
 */
export const Message = ({ 
  message, 
  isOwnMessage, 
  showAvatar = true,
  isGrouped = false,
  onEdit,
  onDelete 
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  const isOwn = isOwnMessage || (currentUser && message.user_id === currentUser.id);
  const isEmoji = isOnlyEmoji(message.content);

  const linkifyOptions = {
    className: 'text-blue-600 hover:underline',
    target: '_blank',
    rel: 'noopener noreferrer'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} ${
        isGrouped ? 'mt-0.5' : 'mt-4'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && !isGrouped ? (
          <UserAvatar 
            user={message.user} 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              if (message.user?.id) navigate(`/profile/${message.user.id}`);
            }}
          />
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xl`}>
        {/* User name and timestamp */}
        {!isGrouped && (
          <div className={`flex items-center space-x-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <button
              type="button"
              className="text-sm font-medium text-gray-900 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (!isOwn && message.user?.id) navigate(`/profile/${message.user.id}`);
              }}
            >
              {isOwn ? 'You' : message.user?.name}
            </button>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        )}

        <div className="relative group">
          {/* Message bubble */}
          <div
            className={`
              relative rounded-2xl px-4 py-2 
              ${isEmoji ? 'text-4xl bg-transparent' : ''}
              ${!isEmoji && isOwn ? 'bg-indigo-600 text-white' : ''}
              ${!isEmoji && !isOwn ? 'bg-white text-gray-900 border border-gray-200' : ''}
              ${message.sending ? 'opacity-60' : ''}
              shadow-sm
            `}
          >
            <Linkify options={linkifyOptions}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </Linkify>

            {/* Edited indicator */}
            {message.edited_at && (
              <span className={`text-xs italic mt-1 block ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                (edited)
              </span>
            )}
          </div>

          {/* Actions menu */}
          {isOwn && isHovered && !message.sending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}
            >
              <Menu as="div" className="relative">
                <Menu.Button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onEdit?.(message)}
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } flex items-center w-full px-3 py-2 text-sm text-gray-700`}
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onDelete?.(message.id)}
                        className={`${
                          active ? 'bg-red-50' : ''
                        } flex items-center w-full px-3 py-2 text-sm text-red-600`}
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </motion.div>
          )}
        </div>

        {/* Timestamp on hover (for grouped messages) */}
        {isGrouped && isHovered && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 px-1 mt-0.5"
          >
            {formatMessageTime(message.created_at)}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
