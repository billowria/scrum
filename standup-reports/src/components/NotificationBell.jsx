import React, { useState, useEffect, useRef, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCalendar, FiCheck, FiX as FiXIcon, FiMessageCircle } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import AnnouncementModal from './AnnouncementModal';

// Enhanced animation variants
const bellVariants = {
  idle: { 
    rotate: 0 
  },
  hover: { 
    rotate: [0, -10, 10, -5, 5, 0],
    transition: { 
      duration: 0.6,
      ease: "easeInOut"
    }
  },
  ring: {
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    scale: [1, 1.1, 1],
    transition: { 
      duration: 0.8,
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
    }
  }
};

const dotVariants = {
  hidden: { scale: 0 },
  visible: { 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "mirror"
    }
  }
};

const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transformOrigin: "top right" 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25 
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { 
      duration: 0.2,
      ease: "easeInOut"
    } 
  }
};

const notificationItemVariants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: (i) => ({ 
    opacity: 1, 
    x: 0,
    transition: { 
      delay: i * 0.1,
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }),
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    backgroundColor: "rgba(243, 244, 246, 0.8)",
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

const NotificationBell = ({ userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const modalRoot = useRef(document.getElementById('modal-root') || document.body);
  const navigate = useNavigate();

  // Effect to create modal root if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('modal-root')) {
      const modalRootDiv = document.createElement('div');
      modalRootDiv.id = 'modal-root';
      document.body.appendChild(modalRootDiv);
      modalRoot.current = modalRootDiv;
    }
  }, []);

  useEffect(() => {
    // Get the current user ID on component mount
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    getCurrentUser();
    fetchNotifications();
    
    // Subscribe to new leave requests
    const leaveRequestsSubscription = supabase
      .channel('leave_requests_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leave_plans' 
        }, 
        (payload) => {
          console.log('New leave request received!', payload);
          fetchNotifications();
        }
      )
      .subscribe();
      
    // Subscribe to new announcements
    const announcementsSubscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          console.log('New announcement received!', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      leaveRequestsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
    };
  }, [userRole]);

  const fetchNotifications = async () => {
    try {
      // Get current user to fetch relevant notifications
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Get user's team information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      let allNotifications = [];
      
      // Fetch pending leave requests (for managers only)
      if (userRole === 'manager') {
        const { data: leaveRequests, error: leaveError } = await supabase
          .from('leave_plans')
          .select(`
            id, start_date, end_date, status, created_at,
            users:user_id (id, name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (leaveError) throw leaveError;

        // Transform leave requests into notifications
        const leaveNotifications = leaveRequests.map(request => ({
          id: `leave-${request.id}`,
          type: 'leave_request',
          title: 'New Leave Request',
          message: `${request.users.name} requested leave from ${format(parseISO(request.start_date), 'MMM dd')} to ${format(parseISO(request.end_date), 'MMM dd')}`,
          created_at: request.created_at,
          read: false,
          data: request
        }));
        
        allNotifications = [...leaveNotifications];
      }
      
      // Fetch announcements for user's team
      const today = new Date().toISOString();
      
      // Fetch dismissed announcements for this user
      const { data: dismissals, error: dismissalError } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);
        
      if (dismissalError) throw dismissalError;
      
      // Create a Set of dismissed announcement IDs
      const dismissedAnnouncementIds = new Set(dismissals?.map(d => d.announcement_id) || []);
      setDismissedAnnouncements(dismissedAnnouncementIds);
      
      // Get announcements for user's team that haven't expired and haven't been dismissed
      const { data: announcements, error: announcementError } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date, created_by,
          teams:team_id (id, name),
          manager:created_by (id, name)
        `)
        .eq('team_id', userData.team_id)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });
        
      if (announcementError) throw announcementError;
      
      // Filter out dismissed announcements and transform them
      const announcementNotifications = announcements
        .filter(announcement => !dismissedAnnouncementIds.has(announcement.id))
        .map(announcement => ({
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          message: announcement.content.length > 80 
            ? `${announcement.content.substring(0, 80)}...` 
            : announcement.content,
          created_at: announcement.created_at,
          read: false,
          data: announcement
        }));
        
      // Add announcements to notifications
      allNotifications = [...allNotifications, ...announcementNotifications];
      
      // Sort all notifications by date (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'leave_request') {
      navigate('/manager-dashboard?tab=leave-requests');
      setShowDropdown(false);
    } else if (notification.type === 'announcement') {
      // Open the announcement modal
      setSelectedAnnouncement(notification.data);
      setShowAnnouncementModal(true);
      setShowDropdown(false); // Close the dropdown when opening the modal
    }
  };

  const handleAnnouncementDismissal = async (announcementId) => {
    // After the announcement is dismissed from the modal
    handleDismiss(`announcement-${announcementId}`);
    setShowAnnouncementModal(false);
    setSelectedAnnouncement(null);
  };

  const handleDismiss = async (notificationId) => {
    // Extract the real ID from the notification ID
    const parts = notificationId.split('-');
    const type = parts[0];
    const id = parts[1];
    
    if (type === 'announcement') {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Record dismissal in database
        const { error } = await supabase
          .from('announcement_dismissals')
          .insert({
            user_id: user.id,
            announcement_id: id,
            dismissed_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        // Update local state
        setDismissedAnnouncements(prev => {
          const updated = new Set(prev);
          updated.add(id);
          return updated;
        });
      } catch (error) {
        console.error('Error dismissing announcement:', error);
      }
    }
    
    // Remove from notification list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <motion.button
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropdown(false)}
            />
            
            <motion.div
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {notification.type === 'leave_request' ? (
                              <FiCalendar className="w-5 h-5 text-primary-500" />
                            ) : notification.type === 'announcement' ? (
                              <FiMessageCircle className="w-5 h-5 text-primary-500" />
                            ) : (
                              <FiBell className="w-5 h-5 text-primary-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(parseISO(notification.created_at), 'MMM dd, h:mm a')}
                            </p>
                          </div>
                          
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notification.id);
                            }}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <button
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                      setShowDropdown(false);
                    }}
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Render the announcement modal using a portal to escape any layout constraints */}
      {selectedAnnouncement && showAnnouncementModal && (
        createPortal(
          <AnnouncementModal
            announcement={selectedAnnouncement}
            isOpen={showAnnouncementModal}
            onClose={() => {
              setShowAnnouncementModal(false);
              setSelectedAnnouncement(null);
            }}
            onDismiss={handleAnnouncementDismissal}
            userId={currentUserId}
          />,
          modalRoot.current
        )
      )}
    </div>
  );
};

export default NotificationBell; 