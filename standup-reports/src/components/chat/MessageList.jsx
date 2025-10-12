import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { 
  shouldShowDateSeparator, 
  formatDateSeparator,
  shouldGroupMessages 
} from '../../utils/chatUtils';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

/**
 * MessageList Component
 * Scrollable list of messages with date separators
 */
export const MessageList = ({ 
  messages = [], 
  typingUsers = [],
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const previousScrollHeight = useRef(0);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Handle scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if user is at bottom
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setAutoScroll(isAtBottom);

    // Load more when scrolling to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      previousScrollHeight.current = container.scrollHeight;
      onLoadMore?.();
    }
  };

  // Maintain scroll position when loading more messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && previousScrollHeight.current > 0) {
      container.scrollTop = container.scrollHeight - previousScrollHeight.current;
      previousScrollHeight.current = 0;
    }
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Loading indicator at top */}
      {loading && hasMore && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}

      <AnimatePresence>
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(
            message.created_at,
            previousMessage?.created_at
          );
          const isGrouped = shouldGroupMessages(message, previousMessage);
          const isOwnMessage = currentUser && message.user_id === currentUser.id;

          return (
            <React.Fragment key={message.id}>
              {/* Date separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                    {formatDateSeparator(message.created_at)}
                  </div>
                </div>
              )}

              {/* Message */}
              <Message
                message={message}
                isOwnMessage={isOwnMessage}
                isGrouped={isGrouped}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </React.Fragment>
          );
        })}
      </AnimatePresence>

      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <TypingIndicator />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
