import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { notesService } from '../../services/notesService';
import { useTheme } from '../../context/ThemeContext';

// Icons
import { FiShare2, FiX, FiUsers, FiShield, FiClock, FiEdit, FiEye, FiSearch, FiUser, FiCheck, FiLink } from 'react-icons/fi';

const ShareModal = ({ isOpen, onClose, note, onShareSuccess }) => {
  const { themeMode } = useTheme();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('read');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareHistory, setShareHistory] = useState([]);
  const [userId, setUserId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Theme classes
  const getThemeClasses = () => {
    switch (themeMode) {
      case 'light':
        return {
          bg: 'bg-white',
          bgSecondary: 'bg-slate-50',
          bgHover: 'hover:bg-slate-100',
          border: 'border-slate-200',
          text: 'text-slate-900',
          textSecondary: 'text-slate-600',
          textMuted: 'text-slate-400',
          input: 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500',
          cardHover: 'hover:border-slate-300 hover:bg-slate-50',
          accent: 'indigo',
          gradient: 'from-indigo-500 to-purple-600',
          gradientBg: 'from-indigo-50 to-purple-50',
        };
      case 'space':
        return {
          bg: 'bg-slate-900',
          bgSecondary: 'bg-slate-800/50',
          bgHover: 'hover:bg-slate-800',
          border: 'border-white/10',
          text: 'text-white',
          textSecondary: 'text-slate-300',
          textMuted: 'text-slate-500',
          input: 'bg-slate-800 border-white/10 focus:ring-purple-500 focus:border-purple-500 text-white placeholder:text-slate-500',
          cardHover: 'hover:border-purple-500/30 hover:bg-slate-800',
          accent: 'purple',
          gradient: 'from-purple-500 to-fuchsia-600',
          gradientBg: 'from-purple-900/30 to-fuchsia-900/30',
        };
      default: // dark
        return {
          bg: 'bg-slate-900',
          bgSecondary: 'bg-slate-800/50',
          bgHover: 'hover:bg-slate-800',
          border: 'border-slate-700',
          text: 'text-white',
          textSecondary: 'text-slate-300',
          textMuted: 'text-slate-500',
          input: 'bg-slate-800 border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500',
          cardHover: 'hover:border-indigo-500/30 hover:bg-slate-800',
          accent: 'indigo',
          gradient: 'from-indigo-500 to-purple-600',
          gradientBg: 'from-indigo-900/30 to-purple-900/30',
        };
    }
  };

  const theme = getThemeClasses();

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

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        onShareSuccess?.(successful);
        await loadShareHistory(note.id);
        setSelectedUsers([]);
        setSearchQuery('');

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

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/notes/${note.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`${theme.bg} rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border ${theme.border}`}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${theme.border} bg-gradient-to-r ${theme.gradientBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-gradient-to-br ${theme.gradient} rounded-2xl text-white shadow-lg`}>
                  <FiShare2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${theme.text}`}>Share Note</h2>
                  <p className={`text-sm ${theme.textSecondary} truncate max-w-xs`}>
                    {note?.title || 'Untitled Note'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2.5 rounded-xl ${theme.bgHover} transition-colors`}
              >
                <FiX className={`w-5 h-5 ${theme.textMuted}`} />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {/* Copy Link Section */}
            <div className={`mb-6 p-4 rounded-2xl ${theme.bgSecondary} border ${theme.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${theme.accent}-500/10`}>
                    <FiLink className={`w-4 h-4 text-${theme.accent}-500`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme.text}`}>Share via link</p>
                    <p className={`text-xs ${theme.textMuted}`}>Anyone with the link can view</p>
                  </div>
                </div>
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${copied
                      ? 'bg-emerald-500 text-white'
                      : `${theme.bgHover} ${theme.text} border ${theme.border}`
                    }`}
                >
                  {copied ? (
                    <span className="flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      Copied!
                    </span>
                  ) : (
                    'Copy Link'
                  )}
                </button>
              </div>
            </div>

            {/* Permission Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-3 flex items-center gap-2`}>
                <FiShield className="w-4 h-4" />
                Default Permission
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPermission('read')}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${permission === 'read'
                      ? `border-${theme.accent}-500 bg-${theme.accent}-500/10 text-${theme.accent}-500`
                      : `${theme.border} ${theme.cardHover} ${theme.textSecondary}`
                    }`}
                >
                  <FiEye className="w-5 h-5" />
                  <span className="font-medium">Can View</span>
                </button>
                <button
                  onClick={() => setPermission('edit')}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${permission === 'edit'
                      ? `border-${theme.accent}-500 bg-${theme.accent}-500/10 text-${theme.accent}-500`
                      : `${theme.border} ${theme.cardHover} ${theme.textSecondary}`
                    }`}
                >
                  <FiEdit className="w-5 h-5" />
                  <span className="font-medium">Can Edit</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FiSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.textMuted} w-4 h-4`} />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all ${theme.input}`}
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium ${theme.textSecondary} mb-3 flex items-center gap-2`}>
                <FiUsers className="w-4 h-4" />
                Team Members
                {selectedUsers.length > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-${theme.accent}-500 text-white`}>
                    {selectedUsers.length} selected
                  </span>
                )}
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredMembers.length === 0 ? (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{searchQuery ? 'No members found' : 'No team members available'}</p>
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedUsers.includes(member.id)
                          ? `border-${theme.accent}-500 bg-${theme.accent}-500/10`
                          : `${theme.border} ${theme.cardHover}`
                        }`}
                      onClick={() => handleUserToggle(member.id)}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${selectedUsers.includes(member.id)
                          ? `border-${theme.accent}-500 bg-${theme.accent}-500`
                          : `${theme.border}`
                        }`}>
                        {selectedUsers.includes(member.id) && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-10 h-10 rounded-xl mr-3 object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center mr-3`}>
                          <span className="text-white font-bold">{member.name?.[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${theme.text} truncate`}>{member.name}</p>
                        <p className={`text-sm ${theme.textMuted} truncate`}>{member.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg ${theme.bgSecondary} ${theme.textMuted} capitalize`}>
                        {member.role}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Share History */}
            {shareHistory.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium ${theme.textSecondary} mb-3 flex items-center gap-2`}>
                  <FiClock className="w-4 h-4" />
                  Already Shared With
                </h3>
                <div className="space-y-2">
                  {shareHistory.map(share => (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center justify-between p-3 rounded-xl ${theme.bgSecondary} border ${theme.border}`}
                    >
                      <div className="flex items-center">
                        {share.recipient?.avatar_url ? (
                          <img
                            src={share.recipient.avatar_url}
                            alt={share.recipient.name}
                            className="w-9 h-9 rounded-xl mr-3 object-cover"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center mr-3`}>
                            <span className="text-white font-bold text-sm">{share.recipient?.name?.[0]}</span>
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${theme.text} text-sm`}>{share.recipient?.name}</p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            Shared {new Date(share.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={share.permission}
                          onChange={(e) => handleUpdatePermission(share.id, share.shared_with, e.target.value)}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-${theme.accent}-500`}
                        >
                          <option value="read">Can View</option>
                          <option value="edit">Can Edit</option>
                        </select>
                        <button
                          onClick={() => handleUnshare(share.id, share.shared_with)}
                          className={`p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors`}
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
          <div className={`p-6 border-t ${theme.border} ${theme.bgSecondary}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${theme.textMuted}`}>
                {selectedUsers.length > 0 && (
                  <span className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 ${theme.text} ${theme.bgHover} border ${theme.border} rounded-xl font-medium transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0 || loading}
                  className={`px-5 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-medium hover:shadow-lg hover:shadow-${theme.accent}-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2`}
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
