import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { FiPlus, FiEdit, FiTrash2, FiX, FiBell, FiUsers, FiCalendar, FiCheck } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
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
  },
  exit: { opacity: 0, y: -20 }
};

const AnnouncementForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [expiryDays, setExpiryDays] = useState(14); // Default 14 days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isEditing = !!initialData;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const expiryDate = addDays(new Date(), expiryDays).toISOString();
      
      const formData = {
        title,
        content,
        expiry_date: expiryDate,
        ...(!isEditing && { created_at: new Date().toISOString() })
      };
      
      await onSubmit(formData, initialData?.id);
      
      // Reset form
      if (!isEditing) {
        setTitle('');
        setContent('');
        setExpiryDays(14);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <FiBell className="mr-2" />
          {isEditing ? 'Edit Announcement' : 'New Announcement'}
        </h3>
        <button 
          type="button"
          className="text-white/80 hover:text-white"
          onClick={onCancel}
        >
          <FiX size={20} />
        </button>
      </div>
      
      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Announcement Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Announcement Content
          </label>
          <textarea
            id="content"
            placeholder="Enter announcement details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
            Expires After (days)
          </label>
          <select
            id="expiry"
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <div className="mt-1 text-sm text-gray-500">
            Announcement will expire on {format(addDays(new Date(), expiryDays), 'MMMM d, yyyy')}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-3"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">
                  <FiCalendar />
                </span>
                Saving...
              </>
            ) : (
              <>
                {isEditing ? <FiCheck className="mr-2" /> : <FiPlus className="mr-2" />}
                {isEditing ? 'Update' : 'Post'} Announcement
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

const AnnouncementCard = ({ announcement, onEdit, onDelete }) => {
  return (
    <motion.div
      className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
      variants={itemVariants}
      layout
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-gray-800">{announcement.title}</h3>
          <div className="flex space-x-2">
            <motion.button
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md"
              onClick={() => onEdit(announcement)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit size={16} />
            </motion.button>
            <motion.button
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md"
              onClick={() => onDelete(announcement.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={16} />
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50">
        <div className="text-sm text-gray-600 whitespace-pre-line mb-4 line-clamp-3">
          {announcement.content}
        </div>
        
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <FiCalendar className="mr-1" />
            Created: {format(parseISO(announcement.created_at), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center">
            <FiCalendar className="mr-1" />
            Expires: {format(parseISO(announcement.expiry_date), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    fetchCurrentUser();
    fetchAnnouncements();
  }, []);
  
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error.message);
    }
  };
  
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          manager:created_by (id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAnnouncements(data || []);
    } catch (error) {
      setError(`Error fetching announcements: ${error.message}`);
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAnnouncement = async (formData) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Insert announcement
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            ...formData,
            created_by: user.id
          }
        ]);
      
      if (error) throw error;
      
      setShowForm(false);
      fetchAnnouncements();
      
      setMessage({
        type: 'success',
        text: 'Announcement created successfully!'
      });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      throw error;
    }
  };
  
  const handleUpdateAnnouncement = async (formData, id) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update(formData)
        .eq('id', id);
      
      if (error) throw error;
      
      setEditingAnnouncement(null);
      fetchAnnouncements();
      
      setMessage({
        type: 'success',
        text: 'Announcement updated successfully!'
      });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      throw error;
    }
  };
  
  const handleSubmitAnnouncement = async (formData, id = null) => {
    if (id) {
      await handleUpdateAnnouncement(formData, id);
    } else {
      await handleCreateAnnouncement(formData);
    }
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
      
      fetchAnnouncements();
      
      setMessage({
        type: 'success',
        text: 'Announcement deleted successfully!'
      });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting announcement:', error.message);
      
      setMessage({
        type: 'error',
        text: `Error deleting announcement: ${error.message}`
      });
      
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  // Check if user is a manager/admin
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
          Manage Announcements
        </h1>
        <p className="text-gray-600">
          Create and manage announcements for your team
        </p>
      </motion.div>
      
      {/* Message alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            className={`p-4 mb-6 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.type === 'success' ? (
              <FiCheck className="inline-block mr-2" />
            ) : (
              <FiX className="inline-block mr-2" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <div className="mb-8">
        {showForm || editingAnnouncement ? (
          <AnnouncementForm
            onSubmit={handleSubmitAnnouncement}
            onCancel={() => {
              setShowForm(false);
              setEditingAnnouncement(null);
            }}
            initialData={editingAnnouncement}
          />
        ) : (
          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-medium text-gray-800 flex items-center">
              <FiBell className="mr-2 text-primary-600" />
              Team Announcements
            </div>
            
            {isManager && (
              <motion.button
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                onClick={() => setShowForm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus className="mr-2" />
                New Announcement
              </motion.button>
            )}
          </div>
        )}
        
        {!showForm && !editingAnnouncement && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin text-primary-600">
                  <FiCalendar size={32} />
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No Announcements</h3>
                <p className="text-gray-500 mb-6">
                  There are no announcements to display.
                </p>
                
                {isManager && (
                  <motion.button
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center"
                    onClick={() => setShowForm(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="mr-2" />
                    Create First Announcement
                  </motion.button>
                )}
              </div>
            ) : (
              <motion.div 
                className="grid gap-6 md:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {announcements.map(announcement => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={isManager ? setEditingAnnouncement : () => {}}
                      onDelete={isManager ? handleDeleteAnnouncement : () => {}}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 