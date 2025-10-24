import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiArrowDown, FiUsers, FiInfo, FiMoreVertical, FiPhone, FiVideo,
  FiSearch, FiFilter, FiCheckCircle, FiCircle, FiX, FiCornerUpLeft, FiEdit2
} from 'react-icons/fi';

import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import UserPresence from './UserPresence';

const ChatWindow = ({
  conversation,
  currentUser,
  isOnline = false,
  messages = [],
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onLoadMore,
  onRefresh,
  loading = false,
  sending = false,
  hasMore = false,
  onlineUsers = [],
  typingUsers = [],
  className = ""
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollToBottom) {
      scrollToBottom();
    }
  }, [messages, showScrollToBottom]);

  // Handle scroll detection
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setShowScrollToBottom(!isAtBottom);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle message send
  const handleSend = async ({ content, attachments }) => {
    if (editingMessage) {
      await onEditMessage?.(editingMessage.id, content);
      setEditingMessage(null);
    } else if (replyingTo) {
      await onSendMessage?.(content, attachments, { replyTo: replyingTo.id });
      setReplyingTo(null);
    } else {
      await onSendMessage?.(content, attachments);
    }
  };

  // Handle message actions
  const handleEdit = (message) => {
    setEditingMessage(message);
    setReplyingTo(null);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      await onDeleteMessage?.(messageId);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    await onReactToMessage?.(messageId, emoji);
  };

  // Cancel edit/reply
  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Search messages
  const searchResults = searchQuery
    ? messages.filter(msg =>
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Render date separator
  const renderDateSeparator = (date) => (
    <div className="flex items-center justify-center py-4">
      <div className="px-4 py-2 bg-gray-100 rounded-full">
        <span className="text-xs font-medium text-gray-600">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </span>
      </div>
    </div>
  );

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.slice(0, 2).map(u => u.name).join(', ');
    const text = typingUsers.length > 2
      ? `${names} and ${typingUsers.length - 2} others are typing...`
      : `${names} is typing...`;

    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 italic">
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>{text}</span>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-gray-50 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
            <FiMessageSquare className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</h3>
          <p className="text-gray-500">
            Choose a conversation from the sidebar to start chatting
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-white h-full ${className}`}>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 border-b border-gray-200"
          >
            <div className="px-4 py-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Info Bar */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversation.type === 'direct'
                  ? conversation.otherUser?.name
                  : conversation.name
                }
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {conversation.type === 'direct' ? (
                  <>
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </>
                ) : (
                  <>
                    <FiUsers className="w-3 h-3" />
                    <span>{conversation.participant_count || 0} members</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Search messages"
            >
              <FiSearch className="w-4 h-4" />
            </button>

            {/* Voice/Video call */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Voice call">
              <FiPhone className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Video call">
              <FiVideo className="w-4 h-4" />
            </button>

            {/* Conversation info */}
            <button
              onClick={() => setShowConversationInfo(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Conversation info"
            >
              <FiInfo className="w-4 h-4" />
            </button>

            {/* Team members (for team chats) */}
            {conversation.type === 'team' && (
              <button
                onClick={() => setShowUserList(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Team members"
              >
                <FiUsers className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: 0 }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-2">
                <button
                  onClick={onLoadMore}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Messages */}
            {searchQuery ? (
              <>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Found {searchResults.length} messages matching "{searchQuery}"
                  </p>
                </div>
                {searchResults.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    isOwnMessage={message.user_id === currentUser?.id}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReaction={handleReaction}
                  />
                ))}
              </>
            ) : (
              <>
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showDateSeparator = !prevMessage ||
                    new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

                  return (
                    <div key={message.id}>
                      {showDateSeparator && renderDateSeparator(message.created_at)}
                      <MessageBubble
                        message={message}
                        currentUser={currentUser}
                        isOwnMessage={message.user_id === currentUser?.id}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReaction={handleReaction}
                      />
                    </div>
                  );
                })}
              </>
            )}

            {/* Typing indicator */}
            {renderTypingIndicator()}

            {/* Hidden element for scroll to bottom */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply/Edit preview */}
      <AnimatePresence>
        {(editingMessage || replyingTo) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {editingMessage ? (
                  <>
                    <FiEdit2 className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700">Editing message</span>
                  </>
                ) : (
                  <>
                    <FiCornerUpLeft className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">Replying to {replyingTo.user_name}</span>
                  </>
                )}
              </div>
              <button
                onClick={editingMessage ? handleCancelEdit : handleCancelReply}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInput
        value={editingMessage?.content || replyingTo?.content || ""}
        onChange={(content) => {
          if (editingMessage) {
            setEditingMessage({ ...editingMessage, content });
          } else if (replyingTo) {
            // For replies, we don't modify the original content
          }
        }}
        onSend={handleSend}
        disabled={sending}
        showTypingIndicator={typingUsers.length > 0}
      />

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-8 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <FiArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Conversation Info Modal */}
      <AnimatePresence>
        {showConversationInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowConversationInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Conversation Info</h3>
                  <button
                    onClick={() => setShowConversationInfo(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Conversation details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {conversation.type === 'direct' ? 'Direct Message' : 'Team Chat'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Participants (for team chats) */}
                  {conversation.type === 'team' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Participants</h4>
                      <UserPresence
                        users={onlineUsers}
                        currentUser={currentUser}
                        maxVisible={6}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;