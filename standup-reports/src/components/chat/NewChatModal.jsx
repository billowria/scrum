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
  FiArrowRight,
  FiCommand
} from 'react-icons/fi';
import { useUsers } from '../../hooks/useUsers';

const NewChatModal = ({ isOpen, onClose, currentUser, onCreateChat, onlineUsers = [] }) => {
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real data from hooks
  const { users: allUsers, loading: usersLoading, searchUsers } = useUsers();

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return searchUsers(searchQuery).map(user => ({
      ...user,
      status: onlineUsers.find(online => online.id === user.id) ? 'online' : 'offline',
      department: user.team_id || 'Team Member'
    }));
  }, [allUsers, searchQuery, searchUsers, onlineUsers]);

  const handleUserSelect = (user) => {
    if (activeTab === 'direct') {
      handleCreateDirectMessage(user);
    } else {
      setSelectedUsers(prev =>
        prev.find(u => u.id === user.id)
          ? prev.filter(u => u.id !== user.id)
          : [...prev, user]
      );
    }
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
    }, 600);
  };

  const handleCreateGroupChat = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      onCreateChat?.({
        type: 'group',
        name: groupName.trim(),
        privacy: 'private',
        members: selectedUsers
      });
      handleClose();
      setIsLoading(false);
    }, 800);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    setGroupName('');
    setActiveTab('direct');
    onClose();
  };

  // Render User Avatar Helper
  const UserAvatar = ({ user, size = "md" }) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-12 h-12 text-lg",
      lg: "w-16 h-16 text-xl"
    };

    return (
      <div className={`relative ${sizeClasses[size]}`}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full box-content shadow-sm" />
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center overflow-hidden"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative m-4"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Hero / Search Section */}
          <div className="p-8 pb-4 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'direct'
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  Direct Message
                </button>
                <button
                  onClick={() => setActiveTab('group')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'group'
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  New Group
                </button>
              </div>
              <button onClick={handleClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-300" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'group' ? "Add people to group..." : "Search for someone..."}
                className="w-full pl-12 pr-4 py-4 text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-none focus:ring-0"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 pt-2">

            {/* Group Configuration Panel */}
            {activeTab === 'group' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="e.g. Design Team"
                      className="w-full text-xl font-semibold border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2 bg-transparent transition-colors placeholder-gray-300"
                    />
                  </div>
                  <button
                    onClick={handleCreateGroupChat}
                    disabled={!groupName || selectedUsers.length === 0 || isLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isLoading ? 'Creating...' : <>Create Group <FiArrowRight /></>}
                  </button>
                </div>

                {/* Selected Members Chips */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedUsers.map(u => (
                      <motion.div layout key={u.id} className="flex items-center gap-2 pl-1 pr-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs">
                          {u.name[0]}
                        </div>
                        {u.name}
                        <button onClick={() => handleUserSelect(u)} className="hover:text-red-500"><FiX /></button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Suggestions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredUsers.slice(0, 12).map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleUserSelect(user)}
                  className={`
                          group relative p-4 bg-white rounded-2xl border border-gray-100 cursor-pointer overflow-hidden transition-all duration-300
                          ${selectedUsers.find(u => u.id === user.id) ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : 'hover:shadow-md hover:border-indigo-100 hover:-translate-y-1'}
                       `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{user.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{user.department}</p>
                    </div>

                    {/* Selection Check for Groups */}
                    {activeTab === 'group' && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedUsers.find(u => u.id === user.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200'
                        }`}>
                        <FiUsers className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Hover Effect Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  <p className="text-lg">No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Hint */}
          <div className="px-8 py-4 bg-gray-50 text-xs text-center text-gray-400 border-t border-gray-100 flex items-center justify-center gap-2">
            <FiCommand className="w-3 h-3" /> <span>Use arrows to navigate</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 mx-1" />
            <span>ESC to close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;