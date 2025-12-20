import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiArrowDown, FiUsers, FiInfo, FiMoreVertical, FiPhone, FiVideo,
  FiSearch, FiFilter, FiCheckCircle, FiCircle, FiX, FiCornerUpLeft, FiEdit2,
  FiChevronLeft, FiSettings, FiMic, FiUser, FiMessageSquare
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
  onBack = null,
  onAvatarClick,
  onToggleProfile,
  mobileLayout = false,
  className = ""
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollToBottom) {
      scrollToBottom();
    }
  }, [messages, showScrollToBottom]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    const messageData = { content, attachments: attachments || [] };

    if (editingMessage) {
      await onEditMessage?.(editingMessage.id, content);
      setEditingMessage(null);
      setMessageInput("");
    } else if (replyingTo) {
      await onSendMessage?.({ ...messageData, replyTo: replyingTo.id });
      setReplyingTo(null);
      setMessageInput("");
    } else {
      await onSendMessage?.(messageData);
      setMessageInput("");
    }
  };

  // Handle message actions
  const handleEdit = (message) => {
    setEditingMessage(message);
    setReplyingTo(null);
    setMessageInput(message.content || "");
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
    setMessageInput("");
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
      <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
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
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>{text}</span>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950/40 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-3xl flex items-center justify-center">
            <FiMessageSquare className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Select a conversation</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a conversation from the sidebar to start chatting
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm ${className}`}>


      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 border-b border-gray-200 dark:border-white/10"
          >
            <div className="px-4 py-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-500"
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

      {/* Enhanced Compact Modern Header */}
      {!mobileLayout ? (
        <div className="flex-shrink-0 px-6 py-4 bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-white/10 backdrop-blur-md shadow-sm z-10">
          <div className="flex items-center justify-between">
            {/* Left Section - Back Button, Avatar, and Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Back Button (Mobile Only) */}
              {onBack && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                  title="Back to conversations"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </motion.button>
              )}

              {/* Conversation Avatar - Clickable */}
              <motion.div
                className="relative flex-shrink-0 cursor-pointer"
                whileHover={{ scale: conversation.type === 'direct' ? 1.05 : 1 }}
                whileTap={{ scale: conversation.type === 'direct' ? 0.95 : 1 }}
                onClick={() => {
                  if (conversation.type === 'direct' && conversation.otherUser?.id) {
                    onAvatarClick?.(conversation.otherUser.id);
                  }
                }}
              >
                {conversation.type === 'direct' ? (
                  conversation.otherUser?.avatar_url ? (
                    <img
                      src={conversation.otherUser.avatar_url}
                      alt={conversation.otherUser.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-semibold shadow-sm">
                      {conversation.otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-semibold shadow-sm">
                    <FiUsers className="w-5 h-5" />
                  </div>
                )}

                {/* Online Status Indicator */}
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${conversation.type === 'direct'
                  ? isOnline ? 'bg-green-500' : 'bg-gray-400'
                  : 'bg-blue-500'
                  }`} />
              </motion.div>

              {/* Conversation Title and Status */}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                  {conversation.type === 'direct'
                    ? conversation.otherUser?.name || 'Unknown User'
                    : conversation.name || 'Unnamed Group'
                  }
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {conversation.type === 'direct' ? (
                    <>
                      <span className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'
                        }`}>
                        {isOnline ? 'Active now' : 'Offline'}
                      </span>
                    </>
                  ) : (
                    <>
                      <FiUsers className="w-3 h-3" />
                      <span>{conversation.participant_count || 0} members</span>
                      <span className="text-xs text-gray-500">
                        • {conversation.type === 'team' ? 'Team' : 'Group'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Center Section - Typing Indicator */}
            <div className="hidden lg:flex items-center flex-1 justify-center">
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </span>
                </motion.div>
              )}
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Search Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition-colors ${showSearch
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                title="Search messages"
              >
                <FiSearch className="w-4 h-4" />
              </motion.button>

              {/* Voice Call */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Start voice call"
              >
                <FiPhone className="w-4 h-4" />
              </motion.button>

              {/* Video Call */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Start video call"
              >
                <FiVideo className="w-4 h-4" />
              </motion.button>


              {/* Toggle Info Sidebar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleProfile}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors ml-1"
                title="Conversation Info"
              >
                <FiInfo className="w-5 h-5" />
              </motion.button>

              {/* More Options Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className={`p-2 rounded-lg transition-colors ${showMoreOptions
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  title="More options"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </motion.button>
                <AnimatePresence>
                  {showMoreOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
                    >
                      {/* Team Members (for team chats) */}
                      {conversation.type === 'team' && (
                        <button
                          onClick={() => {
                            setShowUserList(true);
                            setShowMoreOptions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FiUsers className="w-4 h-4 text-purple-500" />
                          <span>Team members</span>
                        </button>
                      )}

                      {/* Settings */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FiSettings className="w-4 h-4 text-gray-500" />
                        <span>Settings</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile: Reduce visible buttons */}
              {isMobile && (
                <>
                  {/* Hide some buttons on mobile to save space */}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Mobile Header
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {conversation.otherUser?.avatar_url ? (
                    <img src={conversation.otherUser.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                      {(conversation.otherUser?.name || conversation.name)?.substring(0, 2)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {conversation.type === 'direct' ? conversation.otherUser?.name : conversation.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <FiPhone className="w-5 h-5" />
              <FiVideo className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Ensure proper scrolling */}
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
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Messages */}
            {searchQuery ? (
              <>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
            className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {editingMessage ? (
                  <>
                    <FiEdit2 className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                    <span className="text-yellow-700 dark:text-yellow-400">Editing message</span>
                  </>
                ) : (
                  <>
                    <FiCornerUpLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">Replying to {replyingTo.user_name}</span>
                  </>
                )}
              </div>
              <button
                onClick={editingMessage ? handleCancelEdit : handleCancelReply}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 flex justify-center"
          >
            <motion.button
              onClick={scrollToBottom}
              className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10 flex items-center justify-center w-10 h-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Scroll to latest messages"
            >
              <FiArrowDown className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInput
        value={messageInput}
        onChange={(content) => {
          setMessageInput(content);
          if (editingMessage) {
            setEditingMessage({ ...editingMessage, content });
          }
        }}
        onSend={handleSend}
        disabled={sending}
        showTypingIndicator={typingUsers.length > 0}
        mobileLayout={mobileLayout}
      />

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
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4 border border-white/20 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation Info</h3>
                  <button
                    onClick={() => setShowConversationInfo(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Conversation details */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {conversation.type === 'direct' ? 'Direct Message' : 'Team Chat'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Participants (for team chats) */}
                  {conversation.type === 'team' && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Participants</h4>
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
    </div >
  );
};

export default ChatWindow;