import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiRefreshCw, FiUsers, FiMessageSquare, FiHash } from 'react-icons/fi';
import ConversationCard from './ConversationCard';
import UserPresence from './UserPresence';

const ChatSidebar = ({
  conversations = [],
  activeConversationId,
  onConversationSelect,
  onStartDirectMessage,
  onRefresh,
  isRefreshing = false,
  currentUser,
  onlineUsers = [],
  className = ""
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState('all');
  const [showTeamPresence, setShowTeamPresence] = useState(false);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Conversations', icon: FiMessageSquare },
    { value: 'unread', label: 'Unread', icon: FiMessageSquare },
    { value: 'direct', label: 'Direct Messages', icon: FiUsers },
    { value: 'team', label: 'Team Chats', icon: FiHash }
  ];

  // Separate team and direct conversations
  const teamConversations = conversations.filter(c => c.type === 'team');
  const directConversations = conversations.filter(c => c.type === 'direct');

  // Filter conversations based on search and filter
  const filterConversations = (convos) => {
    let filtered = convos;

    // Apply conversation type filter
    if (conversationFilter === 'direct') {
      filtered = filtered.filter(c => c.type === 'direct');
    } else if (conversationFilter === 'team') {
      filtered = filtered.filter(c => c.type === 'team');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.last_message?.content?.toLowerCase().includes(query) ||
        (c.type === 'direct' && c.otherUser?.name?.toLowerCase().includes(query))
      );
    }

    // Apply unread filter
    if (conversationFilter === 'unread') {
      filtered = filtered.filter(c => c.unread_count > 0);
    }

    return filtered.sort((a, b) => {
      // Sort by pinned status first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then by last message time
      const aTime = new Date(a.last_message_at || 0);
      const bTime = new Date(b.last_message_at || 0);
      return bTime - aTime;
    });
  };

  const filteredConversations = filterConversations(conversations);
  const filteredTeams = filterConversations(teamConversations);
  const filteredDirect = filterConversations(directConversations);

  // Get unread counts
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const teamUnread = teamConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const directUnread = directConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const handleStartDM = (user) => {
    setShowUserList(false);
    onStartDirectMessage?.(user);
  };

  const handlePinConversation = (conversationId) => {
    // This would be implemented to pin/unpin conversations
    console.log('Toggle pin for conversation:', conversationId);
  };

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col h-full ${className}`}>
      {/* Enhanced Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {totalUnread > 0 && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Team Presence Toggle */}
            <button
              onClick={() => setShowTeamPresence(!showTeamPresence)}
              className={`p-2 rounded-lg transition-colors ${
                showTeamPresence
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Team presence"
            >
              <FiUsers className="w-5 h-5" />
            </button>

            {/* Refresh Button */}
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group disabled:opacity-50"
              title="Refresh conversations"
            >
              <FiRefreshCw
                className={`w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors ${
                  isRefreshing ? 'animate-spin text-blue-600' : ''
                }`}
              />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiPlus className="w-4 h-4 rotate-45" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setConversationFilter(option.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                conversationFilter === option.value
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <option.icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-20">{option.label}</span>
              {option.value === 'unread' && totalUnread > 0 && (
                <span className="px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full min-w-[1.25rem] text-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Team Presence Panel */}
      <AnimatePresence>
        {showTeamPresence && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50">
              <UserPresence
                users={onlineUsers}
                currentUser={currentUser}
                showStatus={true}
                showActivity={true}
                maxVisible={4}
                onUserClick={handleStartDM}
                onStartChat={handleStartDM}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversationFilter === 'all' ? (
          <>
            {/* Team Chats Section */}
            {filteredTeams.length > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between px-6 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <FiHash className="w-3 h-3" />
                    Team Chats
                  </h3>
                  {teamUnread > 0 && (
                    <span className="text-xs text-gray-500">
                      {teamUnread} unread
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {filteredTeams.map(conversation => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      currentUser={currentUser}
                      isActive={conversation.id === activeConversationId}
                      onSelect={() => onConversationSelect?.(conversation)}
                      onPin={handlePinConversation}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Direct Messages Section */}
            <div className="py-2">
              <div className="flex items-center justify-between px-6 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <FiUsers className="w-3 h-3" />
                  Direct Messages
                </h3>
                <div className="flex items-center gap-2">
                  {directUnread > 0 && (
                    <span className="text-xs text-gray-500">
                      {directUnread} unread
                    </span>
                  )}
                  <button
                    onClick={() => setShowUserList(true)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors group"
                    title="New direct message"
                  >
                    <FiPlus className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {filteredDirect.length > 0 ? (
                  filteredDirect.map(conversation => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      currentUser={currentUser}
                      isActive={conversation.id === activeConversationId}
                      isOnline={onlineUsers.some(u => u.id === conversation.otherUser?.id)}
                      onSelect={() => onConversationSelect?.(conversation)}
                      onPin={handlePinConversation}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 py-8 text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiUsers className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No direct messages yet</h4>
                    <p className="text-sm text-gray-500 mb-4">Start a conversation with your team members</p>
                    <button
                      onClick={() => setShowUserList(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Start a conversation
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Filtered View */
          <div className="py-2">
            <AnimatePresence>
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conversation => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    currentUser={currentUser}
                    isActive={conversation.id === activeConversationId}
                    isOnline={onlineUsers.some(u => u.id === conversation.otherUser?.id)}
                    onSelect={() => onConversationSelect?.(conversation)}
                    onPin={handlePinConversation}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-8 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FiSearch className="w-6 h-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No conversations found</h4>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Try adjusting your search' : 'No conversations match this filter'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* User List Modal */}
      <AnimatePresence>
        {showUserList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowUserList(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Start a conversation</h3>
                  <button
                    onClick={() => setShowUserList(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FiPlus className="w-4 h-4 rotate-45 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                <UserPresence
                  users={onlineUsers}
                  currentUser={currentUser}
                  showStatus={true}
                  onUserClick={handleStartDM}
                  onStartChat={handleStartDM}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSidebar;