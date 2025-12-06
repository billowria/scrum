import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUsers, FiType, FiAlertCircle, FiCheck,
  FiMessageSquare, FiLayout, FiEye, FiSearch, FiUser
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import NotificationCard from './NotificationCard';

export default function NotificationCreator({ isOpen, onClose, onSuccess, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    priority: 'Medium',
    recipients: {
      teams: [],
      users: [],
      all: false
    }
  });

  // Fetch recipients on mount
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const [teamsRes, usersRes] = await Promise.all([
          supabase.from('teams').select('id, name'),
          supabase.from('users').select('id, name, avatar_url')
        ]);
        setTeams(teamsRes.data || []);
        setUsers(usersRes.data || []);
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Construct exact payload for DB
      const payload = {
        title: formData.title,
        content: formData.message,
        notification_type: formData.type,
        priority: formData.priority,
        // If specific teams selected, use the first one for the main column (or null)
        // Ideally we should handle multiple teams in metadata if the schema allows, 
        // but for now let's stick to the schema: team_id is a single UUID.
        // We'll prioritize the first team, or if 'all' is selected maybe null (broadcast).
        team_id: formData.recipients.teams[0] || null,
        company_id: currentUser.company_id,
        created_by: currentUser.id,
        metadata: {
          recipients: formData.recipients
        },
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('announcements')
        .insert(payload);

      if (error) throw error;

      onSuccess && onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'announcement',
        priority: 'Medium',
        recipients: { teams: [], users: [], all: false }
      });
    } catch (err) {
      console.error('Failed to create notification', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users for Search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Limit suggestions

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Notification</h2>
                  <p className="text-sm text-gray-500">Create an announcement or alert</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. Recipients */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Recipients</label>

                  {/* Quick Toggles */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        recipients: { ...prev.recipients, all: !prev.recipients.all }
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2
                        ${formData.recipients.all
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <FiUsers className="w-4 h-4" />
                      All Users
                    </button>
                  </div>

                  {/* Search / Multi-select (Disabled if 'All' is selected) */}
                  {!formData.recipients.all && (
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />

                      {/* Search Results Dropdown */}
                      {searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                          {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                const current = formData.recipients.users;
                                const newUsers = current.includes(user.id)
                                  ? current.filter(id => id !== user.id)
                                  : [...current, user.id];
                                setFormData(p => ({
                                  ...p,
                                  recipients: { ...p.recipients, users: newUsers }
                                }));
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-left gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  user.name?.[0] || 'U'
                                )}
                              </div>
                              <span className="text-sm text-gray-700 font-medium">{user.name}</span>
                            </button>
                          )) : (
                            <div className="p-4 text-center text-xs text-gray-500">No users found</div>
                          )}
                        </div>
                      )}

                      {/* Selected Chips */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.recipients.teams.map(tId => {
                          const team = teams.find(t => t.id === tId);
                          if (!team) return null;
                          return (
                            <span key={tId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-100">
                              Team: {team.name}
                              <button onClick={() => {
                                setFormData(p => ({
                                  ...p,
                                  recipients: { ...p.recipients, teams: p.recipients.teams.filter(id => id !== tId) }
                                }));
                              }}><FiX className="w-3 h-3 hover:text-purple-900" /></button>
                            </span>
                          )
                        })}
                        {formData.recipients.users.map(uId => {
                          const user = users.find(u => u.id === uId);
                          if (!user) return null;
                          return (
                            <span key={uId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                              {user.name}
                              <button onClick={() => {
                                setFormData(p => ({
                                  ...p,
                                  recipients: { ...p.recipients, users: p.recipients.users.filter(id => id !== uId) }
                                }));
                              }}><FiX className="w-3 h-3 hover:text-blue-900" /></button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Content */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                    <input
                      type="text"
                      placeholder="Notification Title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
                    <textarea
                      placeholder="Write your message here..."
                      rows={5}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 3. Settings (Type & Priority) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="alert">Alert</option>
                      <option value="task_updated">Task Update</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Priority</label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {['Low', 'Medium', 'High'].map(p => (
                        <button
                          key={p}
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${formData.priority === p
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Preview not available in quick compose
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.message}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Send Now
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}