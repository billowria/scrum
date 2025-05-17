import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { FiBell, FiClock, FiX, FiMessageCircle, FiCalendar } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 30
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: {
      duration: 0.2
    }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export default function AnnouncementModal({ 
  announcement, 
  isOpen, 
  onClose, 
  onDismiss, 
  userId,
  contained = false // New prop to make the modal contained within its parent
}) {
  if (!announcement || !isOpen) return null;
  
  const handleDismiss = async () => {
    try {
      // Record dismissal in database
      const { error } = await supabase
        .from('announcement_dismissals')
        .insert({
          user_id: userId,
          announcement_id: announcement.id,
          dismissed_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Notify parent component
      if (onDismiss) onDismiss(announcement.id);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error dismissing announcement:', error.message);
    }
  };
  
  // Determine positioning classes based on contained prop
  const backdropPositionClass = "fixed"; // Always use fixed
  const modalPositionClass = "fixed"; // Always use fixed
  
  // Use the highest possible z-index values to ensure modal appears above all other elements
  const backdropZIndex = "z-[99998]";
  const modalZIndex = "z-[99999]";
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            className={`${backdropPositionClass} inset-0 bg-black/40 ${backdropZIndex} backdrop-blur-sm`}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal Container - Always use fixed positioning for fullscreen */}
          <div className={`${modalPositionClass} inset-0 flex items-center justify-center ${modalZIndex} px-4 py-12 md:py-20 overflow-y-auto`}>
            <div className="w-full max-w-2xl mx-auto my-auto">
              <motion.div 
                className="bg-white rounded-xl shadow-2xl w-full overflow-hidden flex flex-col"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-5 flex justify-between items-center shrink-0">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <FiBell className="text-white h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{announcement.title}</h2>
                  </div>
                  <motion.button
                    className="text-white/80 hover:text-white p-1"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="h-6 w-6" />
                  </motion.button>
                </div>
                
                {/* Content - Add overflow handling to this section */}
                <div className="p-6 overflow-y-auto max-h-[calc(70vh-100px)]">
                  <div className="mb-6">
                    <div className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                      {announcement.content}
                    </div>
                  </div>
                  
                  {/* Metadata */}
                  <div className="bg-gray-50 -mx-6 px-6 py-4 mt-6 border-t border-gray-100">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMessageCircle className="mr-2 text-primary-500" />
                        From: {announcement.manager?.name || 'Your Manager'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-2 text-primary-500" />
                        Posted: {format(parseISO(announcement.created_at), 'MMM dd, yyyy')}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-2 text-primary-500" />
                        Expires: {format(parseISO(announcement.expiry_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="px-6 py-3 bg-white border-t border-gray-100 flex justify-end shrink-0">
                  <motion.button
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                  
                  <motion.button
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    onClick={handleDismiss}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Dismiss
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
} 