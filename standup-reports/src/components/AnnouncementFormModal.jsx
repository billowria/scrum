import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { FiBell, FiMessageCircle, FiUsers, FiCalendar, FiAlertCircle, FiInfo, FiSend, FiX } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

export default function AnnouncementFormModal({ open, onClose, onSuccess }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [expiryDate, setExpiryDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open) {
      fetchTeams();
      setTitle('');
      setContent('');
      setSelectedTeam('');
      setExpiryDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
      setError(null);
    }
  }, [open]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setTeams(data || []);
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      setError('Failed to load teams');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedTeam || !expiryDate) {
      setError('Please fill out all fields');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.rpc('manage_announcement', {
        p_title: title,
        p_content: content,
        p_team_id: selectedTeam,
        p_expiry_date: expiryDate,
        p_announcement_id: null
      });
      if (error) throw error;
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-primary-400 via-indigo-400 to-blue-300 opacity-30 blur-2xl rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tr from-blue-400 via-indigo-300 to-primary-300 opacity-20 blur-2xl rounded-full animate-pulse delay-2000" />
        </div>
        <motion.div
          className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto overflow-hidden border border-white/30 z-10 p-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Floating close button */}
          <motion.button
            className="absolute top-3 right-3 bg-white/60 backdrop-blur-lg rounded-full p-2 shadow-lg hover:shadow-xl hover:bg-white/90 transition-all z-20"
            onClick={onClose}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiX className="w-5 h-5 text-primary-700" />
          </motion.button>
          {/* Floating icon header */}
          <div className="flex flex-col items-center pt-7 pb-2 px-6 relative">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 via-indigo-500 to-blue-400 flex items-center justify-center shadow-xl ring-4 ring-white/60">
                <FiBell className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-primary-900 text-center tracking-tight mb-1">Create Announcement</h3>
            <p className="text-xs text-primary-500 text-center mb-2">Share important updates with your team</p>
          </div>
          <form className="px-6 pb-6 pt-2 flex flex-col gap-4" onSubmit={handleCreateAnnouncement}>
            {error && (
              <div className="mb-2 p-2 bg-red-50 text-red-700 rounded-lg text-xs flex items-center">
                <FiAlertCircle className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            {/* Title Field */}
            <div className="relative group">
              <label htmlFor="title" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Title</label>
              <div className="relative">
                <FiMessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-200 bg-white/80 text-primary-800 font-bold shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 pl-10 transition-all"
                  placeholder="Announcement title"
                  required
                />
              </div>
            </div>
            {/* Content Field */}
            <div className="relative group">
              <label htmlFor="content" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Content</label>
              <div className="relative">
                <textarea
                  id="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-200 bg-white/80 text-primary-800 shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all"
                  placeholder="Provide detailed information about the announcement"
                  rows={4}
                  required
                />
              </div>
            </div>
            {/* Team Select */}
            <div className="relative group">
              <label htmlFor="team" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Select Team</label>
              <div className="relative">
                <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                <select
                  id="team"
                  value={selectedTeam || ''}
                  onChange={e => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-200 bg-white/80 text-primary-800 shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 pl-10 transition-all"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Expiry Date */}
            <div className="relative group">
              <label htmlFor="expiry" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Expiry Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-200 bg-white/80 text-primary-800 shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 pl-10 transition-all"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-1 flex items-center">
                <FiInfo className="inline mr-1" />
                The announcement will disappear automatically after this date
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <motion.button
                type="button"
                className="w-full py-3 bg-white/70 text-primary-700 rounded-2xl font-bold shadow hover:bg-primary-50 transition-all border border-primary-100"
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-extrabold shadow-xl hover:from-primary-700 hover:to-blue-700 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!title || !content || !selectedTeam || !expiryDate || loading}
              >
                <FiSend className="mr-2" />
                {loading ? 'Publishing...' : 'Publish'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 