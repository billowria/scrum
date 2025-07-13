import React, { useState, useEffect, useRef, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCalendar, FiCheck, FiX as FiXIcon, FiMessageCircle, FiClock, FiInfo } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { format, parseISO, differenceInDays } from 'date-fns';
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
  const [processingLeaveRequest, setProcessingLeaveRequest] = useState(null);
  const modalRoot = useRef(document.getElementById('modal-root') || document.body);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Effect to create modal root if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('modal-root')) {
      const modalRootDiv = document.createElement('div');
      modalRootDiv.id = 'modal-root';
      document.body.appendChild(modalRootDiv);
      modalRoot.current = modalRootDiv;
    }
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

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
            users:user_id (id, name, teams:team_id(id, name))
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (leaveError) throw leaveError;

        // Transform leave requests into notifications
        const leaveNotifications = leaveRequests.map(request => {
          // Format the leave days count
          const startDate = parseISO(request.start_date);
          const endDate = parseISO(request.end_date);
          const days = differenceInDays(endDate, startDate) + 1;
          
          return {
            id: `leave-${request.id}`,
            type: 'leave_request',
            title: 'Leave Request',
            message: `${request.users.name} requested ${days} ${days === 1 ? 'day' : 'days'} off (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})`,
            created_at: request.created_at,
            read: false,
            data: request
          };
        });
        
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
    } else if (type === 'leave') {
      // Dismissing a leave request: set status to 'rejected' so it doesn't reappear
      try {
        const { error } = await supabase
          .from('leave_plans')
          .update({ status: 'rejected' })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error dismissing leave request:', error);
      }
    }
    
    // Remove from notification list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const handleLeaveAction = async (leaveId, action) => {
    setProcessingLeaveRequest(leaveId);
    try {
      // Update leave request status in database
      const { error } = await supabase
        .from('leave_plans')
        .update({ status: action })
        .eq('id', leaveId);
        
      if (error) throw error;
      
      // Remove from notifications
      handleDismiss(`leave-${leaveId}`);
      
      // Show toast or other feedback (you could add this)
      console.log(`Leave request ${action}`);
    } catch (error) {
      console.error(`Error ${action} leave request:`, error);
    } finally {
      setProcessingLeaveRequest(null);
    }
  };

  return (
    <div className="relative">
      <motion.button
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover="hover"
        whileTap="tap"
        variants={bellVariants}
        animate={unreadCount > 0 ? "ring" : "idle"}
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial="hidden"
            animate={unreadCount > 0 ? "pulse" : "hidden"}
            variants={dotVariants}
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
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              ref={dropdownRef}
            >
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        custom={index}
                        variants={notificationItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover="hover"
                        className="relative"
                      >
                        {notification.type === 'leave_request' ? (
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                                  <FiCalendar className="w-5 h-5" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <p className="font-medium text-gray-900">{notification.title}</p>
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
                                
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  {notification.data.users?.teams?.name && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-xs font-medium rounded-full text-gray-600">
                                      {notification.data.users.teams.name}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {format(parseISO(notification.created_at), 'MMM dd, h:mm a')}
                                  </span>
                                </div>
                                
                                {/* Action buttons for managers */}
                                <div className="flex gap-2 mt-3">
                                  <motion.button
                                    className="px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 hover:bg-green-200 transition-colors disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLeaveAction(notification.data.id, 'approved');
                                    }}
                                    disabled={processingLeaveRequest === notification.data.id}
                                  >
                                    {processingLeaveRequest === notification.data.id ? (
                                      <div className="w-3 h-3 border-t-2 border-green-700 rounded-full animate-spin mr-1" />
                                    ) : (
                                      <FiCheck className="w-3 h-3" />
                                    )}
                                    Approve
                                  </motion.button>
                                  
                                  <motion.button
                                    className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 hover:bg-red-200 transition-colors disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLeaveAction(notification.data.id, 'rejected');
                                    }}
                                    disabled={processingLeaveRequest === notification.data.id}
                                  >
                                    {processingLeaveRequest === notification.data.id ? (
                                      <div className="w-3 h-3 border-t-2 border-red-700 rounded-full animate-spin mr-1" />
                                    ) : (
                                      <FiX className="w-3 h-3" />
                                    )}
                                    Reject
                                  </motion.button>
                                  
                                  <motion.button
                                    className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1 hover:bg-gray-200 transition-colors ml-auto"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    Details
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {notification.type === 'announcement' ? (
                                  <FiMessageCircle className="w-5 h-5 text-primary-500" />
                                ) : (
                                  <FiBell className="w-5 h-5 text-primary-500" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <p className="font-medium text-gray-900">{notification.title}</p>
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
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {format(parseISO(notification.created_at), 'MMM dd, h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer link to full page */}
              <div className="border-t border-gray-200">
                <button
                  className="w-full text-center px-4 py-3 text-primary-600 font-semibold hover:bg-gray-50 transition-colors"
                  onClick={() => { navigate('/notifications'); setShowDropdown(false); }}
                >
                  Go to Notification Page
                </button>
              </div>
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