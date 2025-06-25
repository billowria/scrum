import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { FiBell, FiCalendar, FiClock, FiEdit, FiTrash2, FiPlus, FiMessageCircle, FiSend, FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiUsers } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expiryDate, setExpiryDate] = useState(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [editingId, setEditingId] = useState(null);
  
  useEffect(() => {
    fetchAnnouncements();
    fetchTeams();
  }, []);
  
  const fetchAnnouncements = async () => {
    try {
      // Get current user to filter announcements by their created ones
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get all announcements created by this manager
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, team_id, expiry_date, created_at, created_by,
          teams:team_id (id, name)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
      
      // If we have teams and none is selected, select the first one
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };
  
  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim() || !selectedTeam || !expiryDate) {
      setError('Please fill out all fields');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Format the expiry date to include time at end of day
      const formattedExpiryDate = new Date(expiryDate);
      formattedExpiryDate.setHours(23, 59, 59, 999);
      
      if (editingId) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
            team_id: selectedTeam,
            expiry_date: formattedExpiryDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        
        if (error) throw error;
        
        setSuccess('Announcement updated successfully');
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert({
            title,
            content,
            team_id: selectedTeam,
            created_by: user.id,
            expiry_date: formattedExpiryDate.toISOString(),
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        
        setSuccess('Announcement created successfully');
      }
      
      // Reset form and close modal
      resetForm();
      fetchAnnouncements();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating announcement:', error.message);
      setError(`Error: ${error.message}`);
    }
  };
  
  const handleEditAnnouncement = (announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setSelectedTeam(announcement.team_id);
    setExpiryDate(format(parseISO(announcement.expiry_date), 'yyyy-MM-dd'));
    setEditingId(announcement.id);
    setShowModal(true);
  };
  
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setSuccess('Announcement deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting announcement:', error.message);
      setError(`Error: ${error.message}`);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setContent('');
    setExpiryDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    setEditingId(null);
    setShowModal(false);
    setError(null);
  };
  
  return (
    <motion.div
      className="max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with Create Button */}
      <motion.div 
        className="flex justify-between items-center mb-6"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FiBell className="text-primary-600" />
          Team Announcements
        </h2>
        
        <motion.button
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus />
          New Announcement
        </motion.button>
      </motion.div>
      
      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div 
            className="mb-6 p-4 rounded-lg bg-green-50 text-green-800 flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FiCheckCircle className="mr-2" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FiAlertCircle className="mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Announcements List */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-6 overflow-hidden"
        variants={itemVariants}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FiBell className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg">No announcements yet</p>
            <p className="mt-2 text-sm">Create your first announcement to notify your team of important updates</p>
            <motion.button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus />
              Create Announcement
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((announcement) => {
              const isExpired = isBefore(new Date(announcement.expiry_date), new Date());
              
              return (
                <motion.div
                  key={announcement.id}
                  className={`border rounded-lg overflow-hidden h-[220px] flex flex-col ${isExpired ? 'border-gray-200 bg-gray-50' : 'border-indigo-100 bg-indigo-50'}`}
                  variants={itemVariants}
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${isExpired ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                    <div className="flex items-center">
                      <div className={`rounded-full p-1.5 mr-2 ${isExpired ? 'bg-gray-200 text-gray-600' : 'bg-primary-100 text-primary-600'}`}>
                        <FiBell className="h-4 w-4" />
                      </div>
                      <h3 className={`font-medium text-sm truncate max-w-[150px] ${isExpired ? 'text-gray-700' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h3>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditAnnouncement(announcement)}
                        className={`p-1.5 rounded-full ${isExpired ? 'text-gray-400 hover:bg-gray-200' : 'text-primary-500 hover:bg-primary-100'}`}
                      >
                        <FiEdit className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-1.5 rounded-full text-red-400 hover:bg-red-50"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 overflow-hidden">
                    <div className="h-[90px] overflow-hidden">
                      <p className={`${isExpired ? 'text-gray-500' : 'text-gray-700'} text-sm line-clamp-4`}>
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-auto p-3 text-xs border-t border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FiUsers className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{announcement.teams?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <FiCalendar className="h-3 w-3" />
                        <span>Expires: {format(parseISO(announcement.expiry_date), 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating close button */}
              <motion.button
                className="absolute top-3 right-3 bg-white/60 backdrop-blur-lg rounded-full p-2 shadow-lg hover:shadow-xl hover:bg-white/90 transition-all z-20"
                onClick={resetForm}
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
                <h3 className="text-xl font-extrabold text-primary-900 text-center tracking-tight mb-1">{editingId ? 'Update Announcement' : 'Create Announcement'}</h3>
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
                      onChange={(e) => setTitle(e.target.value)}
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
                      onChange={(e) => setContent(e.target.value)}
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
                      onChange={(e) => setSelectedTeam(e.target.value)}
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
                      onChange={(e) => setExpiryDate(e.target.value)}
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
                    onClick={resetForm}
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
                    disabled={!title || !content || !selectedTeam || !expiryDate}
                  >
                    <FiSend className="mr-2" />
                    {editingId ? 'Update' : 'Publish'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 