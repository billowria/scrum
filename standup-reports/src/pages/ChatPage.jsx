import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useConversations } from '../hooks/useConversations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

/**
 * ChatPage Component
 * Main chat page with sidebar and chat window
 */
export const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { conversations, loading, startDirectConversation, fetchConversations, silentRefresh } = useConversations();
  
  // Get all user IDs for online status
  const allUserIds = React.useMemo(() => {
    const userIds = new Set();
    conversations.forEach(conv => {
      conv.participants?.forEach(p => userIds.add(p.id));
    });
    return Array.from(userIds);
  }, [conversations]);

  const { onlineStatus, isUserOnline } = useOnlineStatus(allUserIds);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConversations();
    } finally {
      // Keep spinning for at least 500ms for visual feedback
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Auto-refresh every 30 seconds (seamless background refresh)
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      silentRefresh(); // Truly silent - no loading state, no UI flicker
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [silentRefresh]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Get online status for active conversation
  const getActiveUserOnlineStatus = () => {
    if (!activeConversation || activeConversation.type !== 'direct') return false;
    const otherUser = activeConversation.otherUser;
    return otherUser ? isUserOnline(otherUser.id) : false;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile back button overlay */}
      {isMobile && !showSidebar && activeConversation && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBackToConversations}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
        </motion.button>
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isMobile && !showSidebar ? '-100%' : 0,
          display: isMobile && !showSidebar ? 'none' : 'block'
        }}
        transition={{ type: 'spring', damping: 20 }}
        className={isMobile ? 'absolute inset-y-0 left-0 z-20 w-full' : 'relative'}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onConversationSelect={handleConversationSelect}
          onStartDirectMessage={handleStartDirectMessage}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onlineStatus={onlineStatus}
        />
      </motion.div>

      {/* Chat Window */}
      <motion.div
        initial={false}
        animate={{
          x: isMobile && showSidebar ? '100%' : 0
        }}
        transition={{ type: 'spring', damping: 20 }}
        className="flex-1"
      >
        <ChatWindow
          conversation={activeConversation}
          currentUser={currentUser}
          isOnline={getActiveUserOnlineStatus()}
        />
      </motion.div>
    </div>
  );
};

export default ChatPage;
