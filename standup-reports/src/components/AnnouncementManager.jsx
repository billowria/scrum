import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, isBefore, differenceInDays } from 'date-fns';
import { 
  FiBell, FiCalendar, FiClock, FiEdit, FiTrash2, FiPlus, FiMessageCircle, 
  FiSend, FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiUsers, FiEye,
  FiTrendingUp, FiActivity, FiStar, FiRefreshCw, FiFilter, FiSearch
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';

// Enhanced animation variants
const containerVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      delay: i * 0.05,
      type: 'spring', 
      stiffness: 300, 
      damping: 25,
      mass: 0.8
    }
  })
};

const cardVariants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  hover: { 
    scale: 1.02,
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  }
};

// Enhanced Status Badge Component
const StatusBadge = ({ announcement }) => {
  const daysUntilExpiry = differenceInDays(new Date(announcement.expiry_date), new Date());
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

  if (isExpired) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
        Expired
      </motion.div>
    );
  }

  if (isExpiringSoon) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200"
      >
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
        {daysUntilExpiry}d left
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
      Active ({daysUntilExpiry}d)
    </motion.div>
  );
};

// Enhanced Loading Component
const LoadingCard = () => (
  <motion.div
    variants={itemVariants}
    className="relative bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-lg"
    style={{
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8))',
      backdropFilter: 'blur(10px)'
    }}
  >
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-24 h-3 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-4 bg-slate-200 rounded-lg animate-pulse" />
        <div className="w-3/4 h-4 bg-slate-100 rounded-lg animate-pulse" />
        <div className="w-1/2 h-4 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="flex justify-between items-center pt-4">
        <div className="w-20 h-6 bg-slate-200 rounded-full animate-pulse" />
        <div className="w-16 h-3 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
    
    {/* Shimmer effect */}
    <motion.div
      animate={{
        x: ['-100%', '100%']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      style={{ clipPath: 'inset(0)' }}
    />
  </motion.div>
);

// Enhanced Empty State
const EmptyState = ({ onCreateNew }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    className="text-center py-16 px-8"
  >
    <motion.div
      animate={{ 
        y: [-5, 5, -5],
        rotate: [0, 3, -3, 0]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative mx-auto mb-8 w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center"
    >
      <FiBell className="w-16 h-16 text-indigo-400" />
      
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
      />
    </motion.div>
    
    <h3 className="text-2xl font-bold text-gray-800 mb-4">No Announcements Yet 📢</h3>
    <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
      Create your first announcement to keep your team informed about important updates and company news.
    </p>

    <motion.button
      onClick={onCreateNew}
      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <FiPlus className="mr-2" />
      Create Your First Announcement
    </motion.button>
  </motion.div>
);

// Enhanced Notification Component
const NotificationToast = ({ type, message, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: FiCheckCircle,
      iconColor: 'text-green-500'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-pink-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: FiAlertCircle,
      iconColor: 'text-red-500'
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`mb-6 p-4 rounded-2xl ${style.bg} ${style.border} ${style.text} border shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`mr-3 flex-shrink-0 w-5 h-5 ${style.iconColor}`} />
          <span className="font-medium">{message}</span>
        </div>
        <motion.button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiX className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

const AnnouncementManager = forwardRef(function AnnouncementManager(props, ref) {
  const [announcements, setAnnouncements] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault(); // Prevent form submission
    
    if (!title.trim() || !content.trim() || !selectedTeam || !expiryDate) {
      setError('Please fill out all fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('manage_announcement', {
        p_title: title,
        p_content: content,
        p_team_id: selectedTeam,
        p_expiry_date: expiryDate,
        p_announcement_id: editingId || null
      });

      if (error) {
        throw error;
      }

      // Clear form and close
      resetForm();
      
      // Trigger refresh of announcements list
      fetchAnnouncements();
      
      setSuccess(editingId ? 'Announcement updated successfully!' : 'Announcement created successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error creating/updating announcement:', error);
      setError(error.message || 'Failed to create/update announcement');
    } finally {
      setLoading(false);
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
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
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

  // Filter announcements based on search
  const filteredAnnouncements = announcements.filter(announcement =>
    !searchTerm || 
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false)
  }));

  return (
    <motion.div
      className="max-w-7xl mx-auto p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Enhanced Header Section */}
      <motion.div 
        className="mb-8"
        variants={itemVariants}
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <FiBell className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Announcements</h1>
                <p className="text-gray-600">Manage and track all your team communications</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FiActivity className="w-4 h-4 mr-1" />
                    {announcements.length} total
                  </span>
                  <span className="flex items-center">
                    <FiTrendingUp className="w-4 h-4 mr-1" />
                    {announcements.filter(a => !isBefore(new Date(a.expiry_date), new Date())).length} active
                  </span>
                </div>
              </div>
            </div>
            
            <motion.button
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="mr-2" />
              New Announcement
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search Section */}
      {announcements.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mb-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
              />
            </div>
            
            <motion.button
              onClick={fetchAnnouncements}
              className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Notifications */}
      <AnimatePresence>
        {success && (
          <NotificationToast
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}
        {error && (
          <NotificationToast
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <motion.div 
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden"
        variants={itemVariants}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              className="p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            </motion.div>
          ) : filteredAnnouncements.length === 0 ? (
            announcements.length === 0 ? (
              <EmptyState onCreateNew={() => setShowModal(true)} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 px-8 text-gray-500"
              >
                <FiFilter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No matches found</h3>
                <p>Try adjusting your search terms.</p>
              </motion.div>
            )
          ) : (
            <motion.div 
              key="content"
              className="p-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnnouncements.map((announcement, index) => {
                  const isExpired = isBefore(new Date(announcement.expiry_date), new Date());
                  const daysUntilExpiry = differenceInDays(new Date(announcement.expiry_date), new Date());
                  
                  return (
                    <motion.div
                      key={announcement.id}
                      variants={cardVariants}
                      initial="rest"
                      whileHover="hover"
                      custom={index}
                      className={`group relative bg-white rounded-3xl border overflow-hidden cursor-pointer ${
                        isExpired 
                          ? 'border-gray-200/60' 
                          : 'border-slate-200/60 hover:border-blue-300/60'
                      }`}
                      style={{
                        background: isExpired 
                          ? 'linear-gradient(145deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.8))'
                          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8))',
                        minHeight: '320px'
                      }}
                    >
                      {/* Header Section */}
                      <div className={`p-6 border-b ${
                        isExpired ? 'border-gray-100/80' : 'border-slate-100/80'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <motion.div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                isExpired 
                                  ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                                  : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600'
                              }`}
                              whileHover={{ scale: 1.1, rotate: 10 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                            >
                              {announcement.title.charAt(0).toUpperCase()}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-lg line-clamp-2 mb-2 ${
                                isExpired ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-600'
                              } transition-colors duration-200`}>
                                {announcement.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <FiUsers className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm truncate ${
                                  isExpired ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {announcement.teams?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <StatusBadge announcement={announcement} />
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <motion.button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAnnouncement(announcement);
                                }}
                                className={`p-2 rounded-xl transition-all duration-200 ${
                                  isExpired 
                                    ? 'text-gray-400 hover:bg-gray-100' 
                                    : 'text-blue-500 hover:bg-blue-50'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FiEdit className="h-4 w-4" />
                              </motion.button>
                              <motion.button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnouncement(announcement.id);
                                }}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-6 flex-1 flex flex-col">
                        <p className={`flex-1 line-clamp-4 leading-relaxed mb-4 ${
                          isExpired 
                            ? 'text-gray-500' 
                            : 'text-gray-700 group-hover:text-gray-800'
                        } transition-colors duration-200`}>
                          {announcement.content}
                        </p>
                        
                        {/* Footer Meta */}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-500">
                            <FiCalendar className="h-4 w-4" />
                            <span>{format(parseISO(announcement.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-gray-500">
                            <FiClock className="h-4 w-4" />
                            <span>
                              {isExpired 
                                ? `Expired ${Math.abs(daysUntilExpiry)}d ago`
                                : `${daysUntilExpiry}d left`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
                        initial={false}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Enhanced Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
            />
            
            <motion.div
              className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-2xl mx-auto border border-white/20 overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-8 text-white">
                <motion.button
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200"
                  onClick={resetForm}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
                
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <FiBell className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {editingId ? 'Update Announcement' : 'Create New Announcement'}
                    </h2>
                    <p className="text-blue-100">
                      {editingId ? 'Modify your announcement details' : 'Share important updates with your team'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Modal Content */}
              <form onSubmit={handleCreateAnnouncement} className="p-8 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center"
                  >
                    <FiAlertCircle className="mr-3 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Announcement Title
                    </label>
                    <div className="relative">
                      <FiMessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter announcement title..."
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Team Select */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Team
                    </label>
                    <div className="relative">
                      <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={selectedTeam || ''}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Content Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Announcement Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Write your announcement content here..."
                      rows={6}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <FiInfo className="mr-2 w-4 h-4" />
                      The announcement will automatically expire after the selected date
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!title || !content || !selectedTeam || !expiryDate}
                  >
                    <FiSend className="mr-2" />
                    {editingId ? 'Update Announcement' : 'Publish Announcement'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default AnnouncementManager;
