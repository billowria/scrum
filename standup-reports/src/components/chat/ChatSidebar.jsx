import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationItem from './ConversationItem';
import UserListModal from './UserListModal';

/**
 * ChatSidebar Component
 * Sidebar with conversation list and search
 */
export const ChatSidebar = ({ 
  conversations = [],
  activeConversationId,
  onConversationSelect,
  onStartDirectMessage,
  onRefresh,
  isRefreshing = false,
  currentUser,
  onlineStatus = {}
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Separate team and direct conversations
  const teamConversations = conversations.filter(c => c.type === 'team');
  const directConversations = conversations.filter(c => c.type === 'direct');

  // Filter conversations based on search
  const filterConversations = (convos) => {
    if (!searchQuery.trim()) return convos;
    
    const query = searchQuery.toLowerCase();
    return convos.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.last_message?.content?.toLowerCase().includes(query)
    );
  };

  const filteredTeams = filterConversations(teamConversations);
  const filteredDirect = filterConversations(directConversations);

  const handleStartDM = (user) => {
    setShowUserList(false);
    onStartDirectMessage?.(user);
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            
            {/* Refresh Button */}
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh conversations"
            >
              <ArrowPathIcon 
                className={`w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors ${
                  isRefreshing ? 'animate-spin text-indigo-600' : ''
                }`}
              />
            </motion.button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {/* Team Chats Section */}
          {filteredTeams.length > 0 && (
            <div className="py-2">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Team Chats
              </h3>
              <AnimatePresence>
                {filteredTeams.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onConversationSelect?.(conversation)}
                    currentUser={currentUser}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Direct Messages Section */}
          <div className="py-2">
            <div className="flex items-center justify-between px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Direct Messages
              </h3>
              <button
                onClick={() => setShowUserList(true)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors group"
                title="New direct message"
              >
                <PlusIcon className="w-4 h-4 text-gray-500 group-hover:text-indigo-600" />
              </button>
            </div>

            <AnimatePresence>
              {filteredDirect.length > 0 ? (
                filteredDirect.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onConversationSelect?.(conversation)}
                    currentUser={currentUser}
                    isOnline={onlineStatus[conversation.otherUser?.id]}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-8 text-center"
                >
                  <p className="text-sm text-gray-500 mb-3">No direct messages yet</p>
                  <button
                    onClick={() => setShowUserList(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Start a conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <UserListModal
          onClose={() => setShowUserList(false)}
          onSelectUser={handleStartDM}
          currentUser={currentUser}
          onlineStatus={onlineStatus}
        />
      )}
    </>
  );
};

export default ChatSidebar;
