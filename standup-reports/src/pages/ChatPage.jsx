import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useConversations } from '../hooks/useConversations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { colors, animations } from '../config/designSystem';

import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import UserPresence from '../components/chat/UserPresence';
import NewChatModal from '../components/chat/NewChatModal';
import '../components/chat/chat-design-tokens.css';

import { FiChevronLeft, FiSettings, FiX, FiMessageSquare, FiMenu, FiUsers } from 'react-icons/fi';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserPresence, setShowUserPresence] = useState(false);

  // Chat hooks
  const { conversations, loading, startDirectConversation, createGroupConversation, fetchConversations, silentRefresh } = useConversations();
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

  // Check if mobile and adjust sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-select first conversation when conversations are loaded and no active conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation && !loading) {
      // Select the first conversation (most recent by default)
      const firstConversation = conversations[0];
      setActiveConversation(firstConversation);

      // On desktop, keep sidebar visible when auto-selecting
      if (!isMobile) {
        setShowSidebar(true);
      }
    }
  }, [conversations, activeConversation, loading, isMobile]);

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

  // Create new chat handler
  const handleCreateNewChat = async (chatData) => {
    try {
      console.log('Creating new chat:', chatData);

      switch (chatData.type) {
        case 'direct':
          await handleStartDirectMessage({ id: chatData.userId, name: chatData.userName });
          break;
        case 'group':
          // Implement group chat creation
          console.log('Creating group chat:', chatData);
          const groupConversation = await createGroupConversation({
            name: chatData.name,
            description: `Group chat created by ${currentUser?.name || 'User'}`,
            privacy: chatData.privacy || 'private',
            members: chatData.members
          });

          if (groupConversation) {
            // Find the newly created conversation and set it as active
            setTimeout(() => {
              const newConversation = conversations.find(c => c.id === groupConversation.id);
              if (newConversation) {
                setActiveConversation(newConversation);
                if (isMobile) {
                  setShowSidebar(false);
                }
              }
            }, 500); // Small delay to ensure conversations are updated
          }
          break;
        default:
          console.error('Unknown chat type:', chatData.type);
          alert('Unknown chat type. Please try again.');
          return;
      }

      setShowNewChatModal(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert(`Failed to create ${chatData.type} chat. Please try again.\nError: ${error.message}`);
    }
  };

  // Message handlers
  const handleSendMessage = async (messageData) => {
    try {
      console.log('Sending message:', {
        content: messageData.content,
        conversationId: activeConversation?.id,
        hasActiveConversation: !!activeConversation,
        hasReplyTo: !!messageData.replyTo
      });

      // For now, ignore replyTo since useChatMessages doesn't support it yet
      await sendMessage(messageData.content);
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

  const handleVoiceMessage = async (voiceData) => {
    try {
      // Handle voice message - convert blob to URL and send
      await sendMessage('', [voiceData], { type: 'voice' });
    } catch (error) {
      console.error('Error sending voice message:', error);
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
            if (isMobile) {
              setShowSidebar(!showSidebar);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
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
  }, [showSidebar, sidebarCollapsed, isMobile]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={animations.variants.scaleIn}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading conversations...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* pt-16 accounts for the main app navbar */}

      {/* Mobile back button overlay */}
      <AnimatePresence>
        {isMobile && !showSidebar && activeConversation && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleBackToConversations}
            className="absolute top-20 left-4 z-30 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          >
            <FiChevronLeft className="w-6 h-6 text-gray-700" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Enhanced with Glass Morphism */}
        <div
          className={`
            ${isMobile
              ? (showSidebar ? 'absolute inset-y-0 left-0 z-20 w-full' : 'hidden')
              : `relative flex-shrink-0 border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'
              }`
            }
            bg-white backdrop-blur-md transition-all duration-300
          `}
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
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onShowNewChatModal={() => setShowNewChatModal(true)}
          />
        </div>

        {/* Sidebar Toggle Button (Desktop) - Glass Morphism */}
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`absolute top-1/2 z-10 p-3 bg-white/80 backdrop-blur-md border border-gray-200
                      rounded-full shadow-lg hover:bg-white/90 transition-all duration-200
                      transform -translate-y-1/2 ${sidebarCollapsed ? 'left-16' : 'left-80'
              }`}
          >
            <FiChevronLeft className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${sidebarCollapsed ? '' : 'rotate-180'
              }`} />
          </motion.button>
        )}

        {/* Main Chat Area - Enhanced Design */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50 ${isMobile && showSidebar ? 'hidden' : ''
            }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Window */}
              <ChatWindow
                conversation={activeConversation}
                currentUser={currentUser}
                isOnline={getActiveUserOnlineStatus()}
                messages={messages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactToMessage={handleReactToMessage}
                onVoiceMessage={handleVoiceMessage}
                onLoadMore={loadMoreMessages}
                onRefresh={handleRefresh}
                loading={loading}
                sending={false}
                hasMore={false}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                onBack={isMobile ? handleBackToConversations : undefined}
              />
            </>
          ) : (
            /* Enhanced Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={animations.variants.scaleIn}
                className="text-center max-w-md"
              >
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FiMessageSquare className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Sync Chat</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Connect with your team in real-time. Select a conversation from the sidebar to start chatting.
                </p>

                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-blue-500" />
                    Quick Tips
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600 text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Click on any conversation to start messaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Look for the green dot to see who's online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Use Ctrl+K to toggle the sidebar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Share files, images, and voice messages</span>
                    </li>
                  </ul>
                </div>

                {onlineUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex items-center justify-center gap-2"
                  >
                    <div className="flex -space-x-2">
                      {onlineUsers.slice(0, 5).map((user) => (
                        <div
                          key={user.id}
                          className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-3 border-white flex items-center justify-center text-white text-sm font-semibold shadow-md"
                        >
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {onlineUsers.length} {onlineUsers.length === 1 ? 'person' : 'people'} online
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* User Presence Modal */}
      <AnimatePresence>
        {showUserPresence && activeConversation && (
          <UserPresence
            conversation={activeConversation}
            currentUser={currentUser}
            onlineUsers={onlineUsers}
            onClose={() => setShowUserPresence(false)}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal - Enhanced Design */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={animations.variants.modal}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Chat Settings</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🔔 Notifications
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Message notifications', defaultChecked: true },
                        { label: 'Sound effects', defaultChecked: true },
                        { label: 'Desktop notifications', defaultChecked: false }
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" defaultChecked={item.defaultChecked} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" autoComplete="off" data-form-type="other" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🎨 Appearance
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Show online status', defaultChecked: true },
                        { label: 'Show typing indicators', defaultChecked: true },
                        { label: 'Show message timestamps', defaultChecked: true }
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" defaultChecked={item.defaultChecked} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" autoComplete="off" data-form-type="other" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      ⌨️ Keyboard Shortcuts
                    </h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { key: 'Toggle sidebar', shortcut: 'Ctrl+K' },
                        { key: 'Settings', shortcut: 'Ctrl+,' },
                        { key: 'Search', shortcut: '/' }
                      ].map((item) => (
                        <div key={item.key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{item.key}</span>
                          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600">
                            {item.shortcut}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Modal - Full Screen Overlay */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
        onCreateChat={handleCreateNewChat}
      />
    </div>
  );
};

export default ChatPage;