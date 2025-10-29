import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { FiBell, FiClock, FiAlertCircle, FiX, FiArrowRight } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.1,
      type: 'spring', 
      stiffness: 300, 
      damping: 24 
    }
  }),
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2 } 
  }
};

const Announcements = ({ 
  userId, 
  teamId, 
  dismissCallback, 
  compact = false, 
  onViewAnnouncement = null,
  maxItems = 5
}) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  
  useEffect(() => {
    fetchAnnouncements();
    
    // Set up real-time subscription for new announcements
    const subscription = supabase
      .channel('announcements-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      }, handleNewAnnouncement)
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, teamId]);
  
  const fetchAnnouncements = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString();
      
      // Fetch announcements that haven't expired
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          manager:created_by (id, name)
        `)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Dismissal tracking has been removed
      setDismissedIds(new Set());

      // Show all announcements (no dismissal filtering)
      const filteredAnnouncements = data || [];
      
      setAnnouncements(filteredAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewAnnouncement = (payload) => {
    // When a new announcement is created, fetch all announcements again
    fetchAnnouncements();
  };
  
  const handleDismiss = async (announcementId) => {
    try {
      // Dismissal tracking has been removed
      console.log('Announcement dismissal not tracked anymore');
      
      // Update announcements list
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      
      // Call the callback if provided
      if (dismissCallback) dismissCallback(announcementId);
    } catch (err) {
      console.error('Error dismissing announcement:', err);
    }
  };
  
  // For compact rendering (e.g. in dropdown)
  if (compact) {
    return (
      <div className="w-full">
        <AnimatePresence>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <motion.div 
                className="animate-spin text-primary-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiClock className="h-6 w-6" />
              </motion.div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <FiAlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FiBell className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p>No new announcements</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.slice(0, maxItems).map((announcement, index) => (
                <motion.div 
                  key={announcement.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800 truncate">{announcement.title}</h3>
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      onClick={() => handleDismiss(announcement.id)}
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{announcement.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>By: {announcement.manager?.name || 'Unknown'}</span>
                    <button 
                      className="flex items-center text-primary-600 hover:text-primary-800" 
                      onClick={() => onViewAnnouncement && onViewAnnouncement(announcement)}
                    >
                      View <FiArrowRight className="ml-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {announcements.length > maxItems && (
                <div className="p-3 text-center">
                  <button 
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    onClick={() => onViewAnnouncement && onViewAnnouncement(announcements[0])}
                  >
                    See all announcements ({announcements.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // Full (non-compact) rendering
  return (
    <div className="w-full">
      <AnimatePresence>
        {loading ? (
          <motion.div 
            className="flex justify-center items-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="animate-spin text-primary-500">
              <FiClock className="h-8 w-8" />
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            className="p-6 bg-red-50 rounded-lg text-center text-red-600 border border-red-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FiAlertCircle className="h-10 w-10 mx-auto mb-3" />
            <p className="font-medium mb-1">Error Loading Announcements</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        ) : announcements.length === 0 ? (
          <motion.div 
            className="p-8 bg-gray-50 rounded-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FiBell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-700 mb-1">All Caught Up!</p>
            <p className="text-gray-500">No new announcements to display.</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-4 md:grid-cols-2"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {announcements.map((announcement, index) => (
              <motion.div 
                key={announcement.id}
                variants={itemVariants}
                custom={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 truncate flex-1">{announcement.title}</h3>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full ml-2"
                    onClick={() => handleDismiss(announcement.id)}
                    title="Dismiss"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-4 line-clamp-3">{announcement.content}</p>
                  <div className="flex flex-wrap justify-between items-center text-sm text-gray-500 mt-2">
                    <span className="flex items-center">
                      <FiBell className="h-4 w-4 mr-1" />
                      {announcement.manager?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="h-4 w-4 mr-1" />
                      {format(parseISO(announcement.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcements; 