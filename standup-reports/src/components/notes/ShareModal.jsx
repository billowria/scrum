import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { notesService } from '../../services/notesService';

// Icons
import { FiShare2, FiX, FiUsers, FiMail, FiShield, FiClock, FiEdit, FiEye, FiUserPlus, FiSearch, FiCheck, FiUser } from 'react-icons/fi';

const ShareModal = ({ isOpen, onClose, note, onShareSuccess }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('read');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareHistory, setShareHistory] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadTeamMembers(user.id);
        if (note?.id) {
          loadShareHistory(note.id);
        }
      }
    };
    
    if (isOpen) {
      getCurrentUser();
    }
  }, [isOpen, note?.id]);

  const loadTeamMembers = async (currentUserId) => {
    try {
      const members = await notesService.getTeamMembers(currentUserId);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadShareHistory = async (noteId) => {
    try {
      const history = await notesService.getShareHistory(noteId);
      setShareHistory(history);
    } catch (error) {
      console.error('Error loading share history:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const results = await notesService.shareNote(note.id, selectedUsers, permission);
      
      // Show success for successful shares
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        onShareSuccess?.(successful);
        
        // Reload share history
        await loadShareHistory(note.id);
        
        // Reset form
        setSelectedUsers([]);
        setSearchQuery('');
        
        // Close modal if all shares were successful
        if (failed.length === 0) {
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (error) {
      console.error('Error sharing note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (shareId, userId) => {
    try {
      await notesService.unshareNote(note.id, userId);
      await loadShareHistory(note.id);
      onShareSuccess?.();
    } catch (error) {
      console.error('Error unsharing note:', error);
    }
  };

  const handleUpdatePermission = async (shareId, userId, newPermission) => {
    try {
      await notesService.updateSharePermission(note.id, userId, newPermission);
      await loadShareHistory(note.id);
      onShareSuccess?.();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <FiShare2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Share Note</h2>
                  <p className="text-sm text-gray-600">{note?.title || 'Untitled Note'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Permission Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <FiShield className="inline w-4 h-4 mr-2" />
                Default Permission
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPermission('read')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    permission === 'read'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiEye className="w-4 h-4" />
                  <span className="font-medium">Can View</span>
                </button>
                <button
                  onClick={() => setPermission('edit')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    permission === 'edit'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiEdit className="w-4 h-4" />
                  <span className="font-medium">Can Edit</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                <FiUsers className="inline w-4 h-4 mr-2" />
                Team Members
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchQuery ? 'No members found' : 'No team members available'}
                  </p>
                ) : (
                  filteredMembers.map(member => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedUsers.includes(member.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserToggle(member.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(member.id)}
                        onChange={() => handleUserToggle(member.id)}
                        className="mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <FiUser className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {member.role}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Share History */}
            {shareHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  <FiClock className="inline w-4 h-4 mr-2" />
                  Already Shared With
                </h3>
                <div className="space-y-2">
                  {shareHistory.map(share => (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        {share.recipient?.avatar_url ? (
                          <img
                            src={share.recipient.avatar_url}
                            alt={share.recipient.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                            <FiUser className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{share.recipient?.name}</p>
                          <p className="text-xs text-gray-500">
                            Shared {new Date(share.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={share.permission}
                          onChange={(e) => handleUpdatePermission(share.id, share.shared_with, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="read">Can View</option>
                          <option value="edit">Can Edit</option>
                        </select>
                        <button
                          onClick={() => handleUnshare(share.id, share.shared_with)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedUsers.length > 0 && (
                  <span>{selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0 || loading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiShare2 className="w-4 h-4" />
                  )}
                  Share Note
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
