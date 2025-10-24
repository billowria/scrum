import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiCircle, FiUser, FiUsers, FiWifi, FiWifiOff, FiMoreVertical,
  FiMessageSquare, FiVideo, FiPhone, FiInfo, FiSettings
} from 'react-icons/fi';

const UserPresence = ({
  users = [],
  currentUser = null,
  showStatus = true,
  showActivity = false,
  maxVisible = 5,
  onUserClick,
  onStartChat,
  onStartCall,
  className = ""
}) => {
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // User status types
  const statusTypes = {
    online: { color: 'bg-green-500', label: 'Online', pulse: true },
    away: { color: 'bg-yellow-500', label: 'Away', pulse: false },
    busy: { color: 'bg-red-500', label: 'Busy', pulse: false },
    offline: { color: 'bg-gray-400', label: 'Offline', pulse: false }
  };

  // Get user status
  const getUserStatus = (user) => {
    if (user.is_online) {
      return user.status ? statusTypes[user.status] : statusTypes.online;
    }
    return statusTypes.offline;
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Online users first
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;

      // Then by status priority
      const statusPriority = { online: 0, away: 1, busy: 2, offline: 3 };
      const aStatus = getUserStatus(a);
      const bStatus = getUserStatus(b);
      return statusPriority[aStatus.label.toLowerCase()] - statusPriority[bStatus.label.toLowerCase()];
    });

  const visibleUsers = expandedUsers ? filteredUsers : filteredUsers.slice(0, maxVisible);
  const onlineCount = users.filter(user => user.is_online).count;
  const totalCount = users.length;

  // User avatar component
  const UserAvatar = ({ user, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-6 h-6 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base'
    };

    const statusSizeClasses = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4'
    };

    return (
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="w-full h-full rounded-full overflow-hidden">
          {user.avatar_url && user.avatar_url.trim() !== '' ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {showStatus && (
          <div className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} ${
            getUserStatus(user).color
          } border-2 border-white rounded-full ${
            getUserStatus(user).pulse ? 'animate-pulse' : ''
          }`} />
        )}
      </div>
    );
  };

  // User list item
  const UserListItem = ({ user }) => {
    const status = getUserStatus(user);
    const lastSeen = user.last_seen ? formatDistanceToNow(new Date(user.last_seen), { addSuffix: true }) : null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
        onClick={() => {
          setSelectedUser(user);
          onUserClick?.(user);
        }}
      >
        <UserAvatar user={user} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{user.name}</span>
            {user.current_status && (
              <span className="text-xs text-gray-500">• {user.current_status}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={status.color.replace('bg-', 'text-')}>
              {status.label}
            </span>
            {!user.is_online && lastSeen && (
              <span>• {lastSeen}</span>
            )}
            {showActivity && user.activity && (
              <span>• {user.activity}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartChat?.(user);
            }}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Send message"
          >
            <FiMessageSquare className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartCall?.(user);
            }}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Start call"
          >
            <FiPhone className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </motion.div>
    );
  };

  // Compact presence indicator
  const CompactPresence = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2">
        {users.slice(0, 4).map((user, index) => (
          <div key={user.id} className="relative">
            <UserAvatar user={user} size="sm" />
          </div>
        ))}

        {users.length > 4 && (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
            +{users.length - 4}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-600">
        <FiCircle className={`w-2 h-2 fill-current ${statusTypes.online.color}`} />
        <span>{onlineCount} online</span>
      </div>
    </div>
  );

  // Full presence panel
  const FullPresence = () => (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            Team Presence ({onlineCount}/{totalCount})
          </h3>
        </div>

        <button
          onClick={() => setExpandedUsers(!expandedUsers)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <FiMoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 text-xs text-gray-600">
        {Object.entries(statusTypes).map(([key, status]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`} />
            <span>
              {users.filter(u => getUserStatus(u).label === status.label).length} {status.label}
            </span>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {visibleUsers.map((user) => (
            <UserListItem key={user.id} user={user} />
          ))}
        </AnimatePresence>

        {!expandedUsers && filteredUsers.length > maxVisible && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setExpandedUsers(true)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Show {filteredUsers.length - maxVisible} more members
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // User detail modal
  const UserDetailModal = () => (
    <AnimatePresence>
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
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
                <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiMoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <UserAvatar user={selectedUser} size="lg" />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getUserStatus(selectedUser).color} ${
                      getUserStatus(selectedUser).pulse ? 'animate-pulse' : ''
                    }`} />
                    <span className="text-sm text-gray-600">{getUserStatus(selectedUser).label}</span>
                  </div>
                </div>
              </div>

              {selectedUser.current_status && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Status</h5>
                  <p className="text-sm text-gray-600">{selectedUser.current_status}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onStartChat?.(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  Message
                </button>

                <button
                  onClick={() => {
                    onStartCall?.(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiPhone className="w-4 h-4" />
                  Call
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {maxVisible <= 4 ? <CompactPresence /> : <FullPresence />}
      <UserDetailModal />
    </>
  );
};

export default UserPresence;