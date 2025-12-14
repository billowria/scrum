import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiMessageSquare,
  FiHash,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiUser,
  FiMoreVertical,
  FiArchive,
  FiBell,
  FiFilter,
  FiX,
  FiCheck,
  FiCircle,
  FiWifi,
  FiWifiOff,
  FiHeart
} from 'react-icons/fi';
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
  isCollapsed = false,
  onToggleCollapse,
  onShowNewChatModal,
  onAvatarClick,
  className = ""
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    direct: true,
    team: true,
    archived: false
  });
  const [mutedConversations, setMutedConversations] = useState(new Set());
  const [pinnedConversations, setPinnedConversations] = useState(new Set());

  // Enhanced filter options
  const filterOptions = [
    { value: 'all', label: 'All', icon: FiMessageSquare, color: 'blue' },
    { value: 'unread', label: 'Unread', icon: FiCircle, color: 'red' },
    { value: 'direct', label: 'Direct', icon: FiUser, color: 'green' },
    { value: 'team', label: 'Teams', icon: FiHash, color: 'purple' },
    { value: 'pinned', label: 'Pinned', icon: FiCheck, color: 'yellow' },
    { value: 'archived', label: 'Archived', icon: FiArchive, color: 'gray' }
  ];

  // Separate and categorize conversations
  const categorizedConversations = useMemo(() => {
    const direct = [];
    const team = [];
    const archived = [];
    const unread = [];

    conversations.forEach(conv => {
      // Mark as unread if there are unread messages
      if (conv.unread_count > 0) {
        unread.push(conv);
      }

      // Categorize by type and status
      if (conv.archived) {
        archived.push(conv);
      } else if (conv.type === 'direct') {
        direct.push(conv);
      } else if (conv.type === 'team') {
        team.push(conv);
      } else if (conv.type === 'project') {
        team.push(conv); // Group projects with teams for now, or create new array
      }
    });

    return { direct, team, archived, unread, all: conversations };
  }, [conversations]);

  // Filter conversations based on search and selected filter
  const filteredConversations = useMemo(() => {
    let filtered = [];

    switch (selectedFilter) {
      case 'unread':
        filtered = categorizedConversations.unread;
        break;
      case 'direct':
        filtered = categorizedConversations.direct;
        break;
      case 'team':
        filtered = categorizedConversations.team;
        break;
      case 'pinned':
        filtered = Array.from(pinnedConversations).map(id =>
          conversations.find(c => c.id === id)
        ).filter(Boolean);
        break;
      case 'archived':
        filtered = categorizedConversations.archived;
        break;
      default:
        filtered = categorizedConversations.all;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.participants?.some(p =>
          p.name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
        ) ||
        c.last_message?.content?.toLowerCase().includes(query)
      );
    }

    // Sort conversations
    return filtered.sort((a, b) => {
      // Pinned conversations first
      const aPinned = pinnedConversations.has(a.id);
      const bPinned = pinnedConversations.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Then by last message time
      const aTime = new Date(a.last_message_at || 0);
      const bTime = new Date(b.last_message_at || 0);
      return bTime - aTime;
    });
  }, [categorizedConversations, selectedFilter, searchQuery, pinnedConversations, conversations]);

  // Get unread count for each category
  const getUnreadCount = (convs) => {
    return convs.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  };

  // Toggle conversation pinned status
  const togglePin = useCallback((conversationId) => {
    setPinnedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  }, []);

  // Toggle conversation mute status
  const toggleMute = useCallback((conversationId) => {
    setMutedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Handle section click for expansion
  const handleSectionClick = (section) => {
    if (!isCollapsed) {
      toggleSection(section);
    }
  };

  // Render conversation section header
  const renderSectionHeader = (title, section, conversations, Icon) => {
    const unreadCount = getUnreadCount(conversations);
    const isExpanded = expandedSections[section];

    return (
      <motion.button
        onClick={() => handleSectionClick(section)}
        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${isCollapsed ? 'justify-center' : ''
          }`}
        whileHover={{ scale: isCollapsed ? 1.05 : 1 }}
        whileTap={{ scale: isCollapsed ? 0.95 : 1 }}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <Icon className="w-4 h-4 text-gray-500" />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium text-gray-700">{title}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </div>
        {!isCollapsed && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  // If collapsed, render minimal version
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        exit={{ width: 320 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-gray-200 h-full flex flex-col"
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleCollapse}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg"
          >
            <FiMessageSquare className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Quick actions */}
        <div className="flex-1 flex flex-col gap-3 p-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowUserList(true)}
            className="w-10 h-10 bg-green-50 hover:bg-green-100 rounded-full flex items-center justify-center text-green-600 transition-colors"
            title="New Conversation"
          >
            <FiPlus className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 bg-blue-50 hover:bg-blue-100 rounded-full flex items-center justify-center text-blue-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Online status */}
        <div className="p-3 border-t border-gray-200">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
            title={`${onlineUsers.length} online`}
          >
            <FiWifi className="w-4 h-4 text-green-600" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Full sidebar
  return (
    <motion.div
      initial={{ width: 64 }}
      animate={{ width: 320 }}
      exit={{ width: 64 }}
      transition={{ duration: 0.3 }}
      className={`h-full flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent uppercase tracking-wider text-sm pl-1">
            Messages
          </h2>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-700 font-medium">{onlineUsers.length}</span>
            </motion.div>

            {/* Collapse button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiChevronLeft className="w-4 h-4 text-gray-500" />
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 hover:bg-white/80 border border-gray-100 hover:border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm"
            autoComplete="off"
            data-form-type="other"
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedFilter === filter.value;
            const count = filter.value === 'unread'
              ? getUnreadCount(categorizedConversations.all)
              : filter.value === 'pinned'
                ? pinnedConversations.size
                : filter.value === 'archived'
                  ? categorizedConversations.archived.length
                  : filter.value === 'direct'
                    ? categorizedConversations.direct.length
                    : filter.value === 'team'
                      ? categorizedConversations.team.length
                      : 0;

            return (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedFilter(filter.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${isSelected
                  ? `bg-${filter.color}-100 text-${filter.color}-700 border-2 border-${filter.color}-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Icon className="w-3 h-3" />
                <span>{filter.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${isSelected ? 'bg-white' : 'bg-gray-300'
                    }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onClick={onShowNewChatModal}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                     bg-gradient-to-r from-blue-500 to-blue-600 text-white
                     rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg
                     relative overflow-hidden border border-blue-400/30"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Icon container with subtle glow */}
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-center justify-center"
            >
              <FiPlus className="w-4 h-4 relative z-10 text-white" />
            </motion.div>

            <span className="text-sm font-medium text-white relative z-10">New Chat</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-sm disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
          >
            <FiSettings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Conversations list */}
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6 pt-2 scrollbar-hide">
        {filteredConversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 text-gray-400"
          >
            <FiMessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <>
            {/* Direct Messages */}
            {categorizedConversations.direct.length > 0 && (
              <div>
                {renderSectionHeader('Direct Messages', 'direct', categorizedConversations.direct, FiUser)}
                <AnimatePresence>
                  {expandedSections.direct && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {categorizedConversations.direct
                        .filter(conv => selectedFilter === 'all' || selectedFilter === 'direct' || selectedFilter === 'unread')
                        .map((conversation) => (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            layout
                          >
                            <ConversationCard
                              conversation={conversation}
                              isActive={activeConversationId === conversation.id}
                              onClick={() => onConversationSelect(conversation)}
                              isPinned={pinnedConversations.has(conversation.id)}
                              isMuted={mutedConversations.has(conversation.id)}
                              onPin={() => togglePin(conversation.id)}
                              onMute={() => toggleMute(conversation.id)}
                              onlineUsers={onlineUsers}
                              onAvatarClick={onAvatarClick}
                            />
                          </motion.div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Team Chats */}
            {categorizedConversations.team.length > 0 && (
              <div>
                {renderSectionHeader('Team Chats', 'team', categorizedConversations.team, FiHash)}
                <AnimatePresence>
                  {expandedSections.team && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {categorizedConversations.team
                        .filter(conv => selectedFilter === 'all' || selectedFilter === 'team' || selectedFilter === 'unread')
                        .map((conversation) => (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            layout
                          >
                            <ConversationCard
                              conversation={conversation}
                              isActive={activeConversationId === conversation.id}
                              onClick={() => onConversationSelect(conversation)}
                              isPinned={pinnedConversations.has(conversation.id)}
                              isMuted={mutedConversations.has(conversation.id)}
                              onPin={() => togglePin(conversation.id)}
                              onMute={() => toggleMute(conversation.id)}
                              onlineUsers={onlineUsers}
                              onAvatarClick={onAvatarClick}
                            />
                          </motion.div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Presence Modal */}
      <AnimatePresence>
        {showUserList && (
          <UserPresence
            onlineUsers={onlineUsers}
            allUsers={[]}
            currentUser={currentUser}
            onSelectUser={onStartDirectMessage}
            onClose={() => setShowUserList(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ChatSidebar;