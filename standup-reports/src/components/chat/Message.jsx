import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Linkify from 'linkify-react';
import { Menu, Transition } from '@headlessui/react';
import { 
  EllipsisVerticalIcon, 
  PencilSquareIcon, 
  TrashIcon,
  CheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { formatMessageTime, isOnlyEmoji } from '../../utils/chatUtils';
import UserAvatar from './UserAvatar';

/**
 * Premium Message Component
 * Enhanced bubble design with glass effects, refined typography, and smooth interactions
 */
export const Message = React.memo(function Message({ 
  message, 
  isOwnMessage, 
  showAvatar = true,
  isGrouped = false,
  onEdit,
  onDelete 
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  React.useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setCurrentUser(data.user);
    });
    return () => { isMounted = false; };
  }, []);

  const isOwn = isOwnMessage || (currentUser && message.user_id === currentUser.id);
  const isEmoji = isOnlyEmoji(message.content);

  const linkifyOptions = {
    className: isOwn 
      ? 'text-indigo-100 hover:text-white underline' 
      : 'text-indigo-600 hover:text-indigo-800 underline',
    target: '_blank',
    rel: 'noopener noreferrer'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${
        isGrouped ? 'mt-0.5' : 'mt-3'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 self-end">
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
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-lg sm:max-w-xl lg:max-w-2xl`}>
        {/* User name and timestamp */}
        {!isGrouped && (
          <div className={`flex items-center gap-2 mb-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (!isOwn && message.user?.id) navigate(`/profile/${message.user.id}`);
              }}
            >
              {isOwn ? 'You' : message.user?.name || 'Unknown'}
            </button>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        )}

        <div className="relative group">
          {/* Message bubble */}
          <div
            className={`
              relative rounded-2xl transition-all
              ${isEmoji ? 'text-4xl bg-transparent px-2 py-1' : 'px-4 py-2.5'}
              ${!isEmoji && isOwn 
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md' 
                : ''}
              ${!isEmoji && !isOwn 
                ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm' 
                : ''}
              ${message.sending ? 'opacity-50' : 'opacity-100'}
              ${isHovered && !isEmoji ? 'shadow-lg scale-[1.01]' : ''}
            `}
          >
            <Linkify options={linkifyOptions}>
              <p className={`${
                isEmoji ? 'text-4xl' : 'text-sm leading-relaxed'
              } whitespace-pre-wrap break-words`}>
                {message.content}
              </p>
            </Linkify>

            {/* Status indicators */}
            <div className={`flex items-center gap-1.5 mt-1 text-xs ${
              isOwn ? 'text-indigo-200' : 'text-gray-500'
            }`}>
              {message.edited_at && (
                <span className="italic flex items-center gap-1">
                  <PencilSquareIcon className="w-3 h-3" />
                  edited
                </span>
              )}
              {message.sending && (
                <span className="flex items-center gap-1 animate-pulse">
                  <ClockIcon className="w-3 h-3" />
                  sending...
                </span>
              )}
              {!message.sending && isOwn && (
                <CheckIcon className="w-3 h-3" />
              )}
            </div>
          </div>

          {/* Actions menu */}
          {isOwn && isHovered && !message.sending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.12 }}
              className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}
            >
              <Menu as="div" className="relative">
                <Menu.Button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all shadow-sm hover:shadow-md">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Menu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-20">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onEdit?.(message)}
                          className={`${
                            active ? 'bg-indigo-50' : ''
                          } flex items-center gap-2.5 w-full px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors`}
                        >
                          <PencilSquareIcon className="w-4 h-4" />
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
                          } flex items-center gap-2.5 w-full px-3.5 py-2 text-sm font-medium text-red-600 transition-colors`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </motion.div>
          )}
        </div>

        {/* Timestamp on hover (for grouped messages) */}
        {isGrouped && isHovered && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-500 px-1 mt-1 flex items-center gap-1"
          >
            <ClockIcon className="w-3 h-3" />
            {formatMessageTime(message.created_at)}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
});

export default Message;
