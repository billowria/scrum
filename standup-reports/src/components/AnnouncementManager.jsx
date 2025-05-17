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
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => resetForm()}
            />
            
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-primary-600 text-white p-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FiBell />
                    {editingId ? 'Update Announcement' : 'Create Announcement'}
                  </h3>
                </div>
                
                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                      <FiAlertCircle className="mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="title">
                      Announcement Title
                    </label>
                    <motion.div
                      initial={{ scale: 1 }}
                      whileFocus={{ scale: 1.01 }}
                      className="relative"
                    >
                      <FiMessageCircle className="absolute left-3 top-3 text-gray-400" />
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Brief, attention-grabbing title"
                        required
                      />
                    </motion.div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="content">
                      Announcement Content
                    </label>
                    <motion.div
                      initial={{ scale: 1 }}
                      whileFocus={{ scale: 1.01 }}
                      className="relative"
                    >
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Provide detailed information about the announcement"
                        rows={4}
                        required
                      />
                    </motion.div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="team">
                      Select Team
                    </label>
                    <motion.div
                      initial={{ scale: 1 }}
                      whileFocus={{ scale: 1.01 }}
                      className="relative"
                    >
                      <FiUsers className="absolute left-3 top-3 text-gray-400" />
                      <select
                        id="team"
                        value={selectedTeam || ''}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select a team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </motion.div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="expiry">
                      Expiry Date
                    </label>
                    <motion.div
                      initial={{ scale: 1 }}
                      whileFocus={{ scale: 1.01 }}
                      className="relative"
                    >
                      <FiCalendar className="absolute left-3 top-3 text-gray-400" />
                      <input
                        id="expiry"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </motion.div>
                    <p className="text-xs text-gray-500 mt-1 pl-1">
                      <FiInfo className="inline mr-1" />
                      The announcement will disappear automatically after this date
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <motion.button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                      onClick={resetForm}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
                      onClick={handleCreateAnnouncement}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!title || !content || !selectedTeam || !expiryDate}
                    >
                      <FiSend />
                      {editingId ? 'Update' : 'Publish'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 