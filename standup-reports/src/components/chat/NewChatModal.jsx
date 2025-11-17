import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiUsers,
  FiUserPlus,
  FiHash,
  FiPlus,
  FiClock,
  FiTrendingUp,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiLock,
  FiGlobe,
  FiArchive
} from 'react-icons/fi';
import { useUsers } from '../../hooks/useUsers';
import './chat-design-tokens.css';

const NewChatModal = ({ isOpen, onClose, currentUser, onCreateChat, onlineUsers = [] }) => {
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupPrivacy, setGroupPrivacy] = useState('private');
  const [isLoading, setIsLoading] = useState(false);

  // Real data from hooks
  const { users: allUsers, loading: usersLoading, searchUsers } = useUsers();

  // Loading state
  const isDataLoading = usersLoading;

  const recentSearches = useMemo(() => [
    { query: 'Alice', type: 'user', timestamp: Date.now() - 1000 * 60 * 5 },
    { query: 'Engineering', type: 'team', timestamp: Date.now() - 1000 * 60 * 30 },
    { query: 'Project status', type: 'group', timestamp: Date.now() - 1000 * 60 * 60 },
  ], []);

  const quickActions = [
    { id: 'direct', label: 'Direct Message', icon: FiUserPlus, description: 'Start a 1-on-1 conversation', color: 'blue' },
    { id: 'group', label: 'Group Chat', icon: FiHash, description: 'Create a group conversation', color: 'purple' },
  ];

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return searchUsers(searchQuery).map(user => ({
      ...user,
      status: onlineUsers.find(online => online.id === user.id) ? 'online' : 'offline',
      department: user.team_id || 'No Department'
    }));
  }, [allUsers, searchQuery, searchUsers, onlineUsers]);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateDirectMessage = (user) => {
    setIsLoading(true);
    setTimeout(() => {
      onCreateChat?.({
        type: 'direct',
        userId: user.id,
        userName: user.name
      });
      handleClose();
      setIsLoading(false);
    }, 1000);
  };

  
  const handleCreateGroupChat = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      onCreateChat?.({
        type: 'group',
        name: groupName.trim(),
        privacy: groupPrivacy,
        members: selectedUsers
      });
      handleClose();
      setIsLoading(false);
    }, 1000);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    setGroupName('');
    setGroupPrivacy('private');
    setActiveTab('direct');
    onClose();
  };

  // Helper function to render user avatar
  const renderUserAvatar = (user, size = 'w-10 h-10') => {
    if (user.avatar_url && user.avatar_url.trim() !== '') {
      return (
        <div className={`${size} rounded-full overflow-hidden`}>
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className={`${size} bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold`} style={{display: 'none'}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      );
    }
    return (
      <div className={`${size} bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold`}>
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const renderQuickActions = () => (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {quickActions.map(action => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(action.id)}
          className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
            activeTab === action.id
              ? `border-${action.color}-200 bg-${action.color}-50 shadow-lg`
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <action.icon className={`w-6 h-6 mb-2 text-${action.color}-600 mx-auto`} />
          <div className="text-sm font-medium text-gray-900">{action.label}</div>
          <div className="text-xs text-gray-500 mt-1">{action.description}</div>
        </motion.button>
      ))}
    </div>
  );

  const renderRecentSearches = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FiClock className="w-4 h-4" />
        Recent Searches
      </h3>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map((search, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchQuery(search.query)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors flex items-center gap-2"
          >
            {search.type === 'user' && <FiUser className="w-3 h-3" />}
            {search.type === 'team' && <FiUsers className="w-3 h-3" />}
            {search.type === 'group' && <FiHash className="w-3 h-3" />}
            {search.query}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderUserList = () => (
    <div className="space-y-2">
      {filteredUsers.map(user => (
        <motion.div
          key={user.id}
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            selectedUsers.find(u => u.id === user.id)
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => activeTab === 'group' ? handleUserSelect(user) : handleCreateDirectMessage(user)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {renderUserAvatar(user)}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                user.status === 'online' ? 'bg-green-500' :
                user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              {user.department}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  
  
  const renderCreateGroupForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Project Team, Study Group"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Privacy
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="relative">
            <input
              type="radio"
              name="privacy"
              value="private"
              checked={groupPrivacy === 'private'}
              onChange={(e) => setGroupPrivacy(e.target.value)}
              className="sr-only peer"
            />
            <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
              <FiLock className="w-5 h-5 text-gray-600 mb-2" />
              <div className="font-medium text-gray-900">Private</div>
              <div className="text-sm text-gray-500">Only invited members</div>
            </div>
          </label>

          <label className="relative">
            <input
              type="radio"
              name="privacy"
              value="public"
              checked={groupPrivacy === 'public'}
              onChange={(e) => setGroupPrivacy(e.target.value)}
              className="sr-only peer"
            />
            <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
              <FiGlobe className="w-5 h-5 text-gray-600 mb-2" />
              <div className="font-medium text-gray-900">Public</div>
              <div className="text-sm text-gray-500">Anyone can join</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Add Members
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredUsers.map(user => (
            <label
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all"
            >
              <input
                type="checkbox"
                checked={selectedUsers.find(u => u.id === user.id)}
                onChange={() => handleUserSelect(user)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateGroupChat}
        disabled={!groupName.trim() || selectedUsers.length === 0 || isLoading}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Group...' : `Create Group Chat (${selectedUsers.length} members)`}
      </motion.button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Start New Chat</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>

          <div className="flex h-full max-h-[calc(90vh-88px)]">
            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Search Bar */}
              <div className="relative mb-6">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users or group members..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none focus:bg-white transition-all"
                />
              </div>

              {/* Loading State */}
              {isDataLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500">Loading users...</span>
                </div>
              )}

              {searchQuery && !isDataLoading ? (
                <>
                  {activeTab === 'direct' && renderUserList()}
                  {activeTab === 'group' && renderUserList()}
                </>
              ) : !isDataLoading ? (
                <>
                  {renderQuickActions()}
                  {renderRecentSearches()}

                  {/* Quick Start Sections */}
                  {activeTab === 'direct' && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Suggested Contacts</h3>
                      {renderUserList()}
                    </div>
                  )}

                  {activeTab === 'group' && renderCreateGroupForm()}
                </>
              ) : null}
            </div>

            {/* Sidebar */}
            {(selectedUsers.length > 0 || groupName) && (
              <div className="w-80 p-6 border-l border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Selected</h3>

                {selectedUsers.length > 0 && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
                    </div>
                    <div className="space-y-2">
                      {selectedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                          {renderUserAvatar(user, 'w-8 h-8')}
                          <span className="text-sm font-medium text-gray-700">{user.name}</span>
                          <button
                            onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                            className="ml-auto p-1 hover:bg-gray-100 rounded"
                          >
                            <FiX className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
                {groupName && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Group Name</div>
                    <div className="p-3 bg-white rounded-lg text-sm text-gray-900">{groupName}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {groupPrivacy === 'private' ? 'Private group' : 'Public group'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;