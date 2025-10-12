import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import * as chatService from '../../services/chatService';
import UserAvatar from './UserAvatar';

export const UserListModal = ({ onClose, onSelectUser, currentUser, onlineStatus = {} }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await chatService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel as={motion.div} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">New Direct Message</Dialog.Title>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : filteredUsers.length > 0 ? (
                <AnimatePresence>
                  {filteredUsers.map(user => (
                    <motion.button key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }} onClick={() => onSelectUser(user)} className="w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors">
                      <UserAvatar user={user} size="md" showOnline isOnline={onlineStatus[user.id]} />
                      <div className="flex-1 min-w-0"><h4 className="font-medium text-gray-900 truncate">{user.name}</h4><p className="text-sm text-gray-500 truncate">{user.email}</p></div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-8 text-gray-500"><p>No users found</p></div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default UserListModal;
