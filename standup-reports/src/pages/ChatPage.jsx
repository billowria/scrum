
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useConversations } from '../hooks/useConversations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { colors, animations } from '../config/designSystem';
import { useTheme } from '../context/ThemeContext';

import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import UserPresence from '../components/chat/UserPresence';
import NewChatModal from '../components/chat/NewChatModal';
import UserProfileInfoModal from '../components/UserProfileInfoModal';
import '../components/chat/chat-design-tokens.css';

import { FiChevronLeft, FiSettings, FiX, FiMessageSquare, FiMenu, FiUsers, FiSearch, FiCheck } from 'react-icons/fi';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ChatRightSidebar from '../components/chat/ChatRightSidebar';

const ChatPage = () => {
  const location = useLocation();
  const { themeMode } = useTheme();

  // Check if using a premium animated theme (space, ocean, forest)
  const isPremiumTheme = ['space', 'ocean', 'forest'].includes(themeMode);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserPresence, setShowUserPresence] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

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

  // Handle start chat from navigation state
  useEffect(() => {
    const handleStartChatFromState = async () => {
      if (location.state?.startChatWithUserId && !loading && conversations.length >= 0) {
        const targetUserId = location.state.startChatWithUserId;

        // Clear state to prevent re-triggering
        window.history.replaceState({}, document.title);

        // Check if conversation already exists
        const existingConv = conversations.find(c =>
          c.type === 'direct' && c.otherUser?.id === targetUserId
        );

        if (existingConv) {
          setActiveConversation(existingConv);
        } else {
          // Create new conversation
          try {
            const newConv = await startDirectConversation(targetUserId);
            if (newConv) setActiveConversation(newConv);
          } catch (error) {
            console.error('Error starting chat from state:', error);
          }
        }

        if (isMobile) setShowSidebar(false);
      }
    };

    handleStartChatFromState();
  }, [location.state, loading, conversations, startDirectConversation, isMobile]);

  // Auto-select first conversation when conversations are loaded and no active conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation && !loading && !location.state?.startChatWithUserId) {
      // Select the first conversation (most recent by default)
      const firstConversation = conversations[0];
      setActiveConversation(firstConversation);

      // On desktop, keep sidebar visible when auto-selecting
      if (!isMobile) {
        setShowSidebar(true);
      }
    }
  }, [conversations, activeConversation, loading, isMobile, location.state]);

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
            description: `Group chat created by ${currentUser?.name || 'User'} `,
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
      alert(`Failed to create ${chatData.type} chat.Please try again.\nError: ${error.message} `);
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
      <div className={`h-screen flex items-center justify-center ${isPremiumTheme ? 'bg-transparent' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen max-h-screen overflow-hidden ${isPremiumTheme ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950'} pt-16`}>
      {/* pt-16 accounts for the main app navbar */}

      {/* Mobile back button overlay */}
      <AnimatePresence>
        {isMobile && !showSidebar && activeConversation && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleBackToConversations}
            className={`absolute top-20 left-4 z-30 p-3 rounded-full shadow-lg transition-colors ${isPremiumTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <FiChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Enhanced with Glass Morphism */}
        <div
          className={`
            ${isMobile
              ? (showSidebar ? 'absolute inset-y-0 left-0 z-20 w-full' : 'hidden')
              : `relative flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-80'
              }`
            }
            ${isPremiumTheme
              ? 'bg-transparent border-r border-white/10'
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
            } z-20
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
            onAvatarClick={(userId) => {
              setSelectedUserId(userId);
              setShowProfileModal(true);
            }}
            mobileLayout={isMobile}
          />
        </div>



        {/* Main Chat Area - Enhanced Design */}
        <div
          className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300
            ${isMobile && showSidebar ? 'hidden' : ''}
          `}
        >
          {!isPremiumTheme && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/40 to-blue-50/40 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20 pointer-events-none" />
          )}

          {activeConversation ? (
            <div className="flex flex-1 overflow-hidden relative z-10">
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
                onAvatarClick={(userId) => {
                  setShowUserPresence(true);
                }}
                onToggleProfile={() => setShowUserPresence(!showUserPresence)}
                mobileLayout={isMobile}
              />

              {/* Right Context Sidebar */}
              <ChatRightSidebar
                conversation={activeConversation}
                isOpen={showUserPresence}
                onClose={() => setShowUserPresence(false)}
                currentUser={currentUser}
              />
            </div>
          ) : (
            /* Enhanced Empty State - Centered */
            <div className="flex-1 flex items-center justify-center p-8 relative z-10 w-full h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={animations.variants.scaleIn}
                className="text-center max-w-2xl w-full"
              >
                {/* Hero Graphic */}
                <div className="relative w-full h-80 mb-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/50 to-purple-100/50 rounded-full blur-3xl opacity-60 animate-pulse" />
                  <div className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 ring-1 ring-white/60 dark:ring-slate-700/60">
                    <div className="grid grid-cols-2 gap-4 w-64">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl h-24 w-full animate-pulse delay-75"></div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-2xl h-24 w-full translate-y-4 animate-pulse delay-150"></div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl h-24 w-full -translate-y-4 animate-pulse delay-300"></div>
                      <div className="bg-pink-50 dark:bg-pink-900/30 p-4 rounded-2xl h-24 w-full animate-pulse"></div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 dark:border-slate-700/50">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <FiCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="h-2 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-2 w-12 bg-gray-100 dark:bg-slate-800 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                  Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Sync Chat</span>
                </h2>
                <p className="text-xl text-gray-500 dark:text-gray-400 mb-12 leading-relaxed max-w-lg mx-auto">
                  Your team's central hub for communication, seamlessly integrated with your tasks and projects.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[
                    { icon: FiUsers, title: 'Team Sync', desc: 'Real-time collaboration' },
                    { icon: FiSearch, title: 'Smart Search', desc: 'Find anything instantly' },
                    { icon: FiSettings, title: 'Customizable', desc: 'Make it yours' }
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5 }}
                      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-indigo-50 to-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-indigo-600">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>

              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal - Enhanced Design */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={animations.variants.modal}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Settings</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors bg-gray-50 dark:bg-slate-800"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">🔔</span>
                      Notifications
                    </h4>
                    <div className="space-y-3 pl-10">
                      {[
                        { label: 'Message notifications', defaultChecked: true },
                        { label: 'Sound effects', defaultChecked: true },
                        { label: 'Desktop notifications', defaultChecked: false }
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">🎨</span>
                      Appearance
                    </h4>
                    <div className="space-y-3 pl-10">
                      {[
                        { label: 'Show online status', defaultChecked: true },
                        { label: 'Show typing indicators', defaultChecked: true },
                        { label: 'Show message timestamps', defaultChecked: true }
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
                        </label>
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

      {/* User Profile Modal */}
      <UserProfileInfoModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
        onStartChat={handleStartDirectMessage}
      />
    </div>
  );
};

export default ChatPage;