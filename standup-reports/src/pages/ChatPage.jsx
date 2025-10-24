import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useConversations } from '../hooks/useConversations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ChatHeader from '../components/chat/ChatHeader';
import UserPresence from '../components/chat/UserPresence';

import { FiChevronLeft, FiSettings, FiX, FiMessageSquare } from 'react-icons/fi';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chat hooks
  const { conversations, loading, startDirectConversation, fetchConversations, silentRefresh } = useConversations();
  const { onlineStatus, isUserOnline } = useOnlineStatus([]);
  const { messages, sendMessage, editMessage, deleteMessage, reactToMessage, loadMoreMessages } = useChatMessages(activeConversation?.id);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(activeConversation?.id);

  // Get all user IDs for online status
  const allUserIds = React.useMemo(() => {
    const userIds = new Set();
    conversations.forEach(conv => {
      if (conv.type === 'direct' && conv.otherUser?.id) {
        userIds.add(conv.otherUser.id);
      } else if (conv.participants) {
        conv.participants.forEach(p => userIds.add(p.id));
      }
    });
    return Array.from(userIds);
  }, [conversations]);

  const onlineUsers = React.useMemo(() => {
    return allUserIds.filter(userId => onlineStatus[userId]).map(userId => {
      // Find user details from conversations
      for (const conv of conversations) {
        if (conv.type === 'direct' && conv.otherUser?.id === userId) {
          return { ...conv.otherUser, is_online: true };
        }
        if (conv.participants) {
          const participant = conv.participants.find(p => p.id === userId);
          if (participant) return { ...participant, is_online: true };
        }
      }
      return { id: userId, name: 'Unknown User', is_online: true };
    });
  }, [allUserIds, onlineStatus, conversations]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      silentRefresh();
    }, 30000);

    return () => clearInterval(autoRefreshInterval);
  }, [silentRefresh]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConversations();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
    // Only hide sidebar on mobile, no movement on desktop
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle back to conversations (mobile)
  const handleBackToConversations = () => {
    setShowSidebar(true);
    setActiveConversation(null);
  };

  // Start new direct message
  const handleStartDirectMessage = async (user) => {
    try {
      const conversation = await startDirectConversation(user.id);
      setActiveConversation(conversation);
      if (isMobile) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error starting direct message:', error);
    }
  };

  // Message handlers
  const handleSendMessage = async (content, attachments = [], options = {}) => {
    try {
      await sendMessage(content, attachments, options);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      await editMessage(messageId, content);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      await reactToMessage(messageId, emoji);
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  // Get online status for active conversation
  const getActiveUserOnlineStatus = () => {
    if (!activeConversation || activeConversation.type !== 'direct') return false;
    const otherUser = activeConversation.otherUser;
    return otherUser ? isUserOnline(otherUser.id) : false;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setShowSidebar(!showSidebar);
            break;
          case ',':
            e.preventDefault();
            setShowSettings(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSidebar]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Mobile back button overlay */}
      <AnimatePresence>
        {isMobile && !showSidebar && activeConversation && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleBackToConversations}
            className="fixed top-4 left-4 z-30 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          >
            <FiChevronLeft className="w-6 h-6 text-gray-700" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed positioning, no movement on desktop */}
      <div
        className={`${isMobile ? 'absolute inset-y-0 left-0 z-20' : 'relative flex-shrink-0'} bg-white border-r border-gray-200`}
        style={{
          width: isMobile ? '100%' : sidebarCollapsed ? '0px' : '288px',
          minHeight: 0,
          display: isMobile && !showSidebar ? 'none' : 'block'
        }}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onConversationSelect={handleConversationSelect}
          onStartDirectMessage={handleStartDirectMessage}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* Sidebar Toggle Button (Desktop) */}
      {!isMobile && (
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-r-lg shadow-lg hover:bg-gray-50 transition-colors"
          style={{
            left: sidebarCollapsed ? '0px' : '288px'
          }}
        >
          <FiChevronLeft className={`w-4 h-4 text-gray-600 transition-transform ${
            sidebarCollapsed ? 'rotate-180' : ''
          }`} />
        </button>
      )}

      {/* Main Chat Area */}
      <div
        className={`flex-1 h-full overflow-hidden relative ${
          isMobile && showSidebar ? 'hidden' : ''
        }`}
        style={{
          minHeight: 0,
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUser={currentUser}
            isOnline={getActiveUserOnlineStatus()}
            messages={messages}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReactToMessage={handleReactToMessage}
            onLoadMore={loadMoreMessages}
            onRefresh={handleRefresh}
            loading={loading}
            sending={false}
            hasMore={false}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
          />
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                <FiMessageSquare className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to SquadSync Chat</h3>
              <p className="text-gray-500 mb-6">
                Select a conversation from the sidebar to start chatting with your team
              </p>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Quick tips:</p>
                  <ul className="space-y-1 text-left">
                    <li>Click on any conversation to start chatting</li>
                    <li>Use Ctrl+K to toggle sidebar</li>
                    <li>Look for the green dot to see who's online</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
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
                  <h3 className="text-lg font-semibold text-gray-900">Chat Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notifications</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Message notifications</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Sound effects</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Desktop notifications</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Appearance</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Show online status</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Show typing indicators</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Show message timestamps</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Toggle sidebar</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Ctrl+K</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Settings</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Ctrl+,</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;