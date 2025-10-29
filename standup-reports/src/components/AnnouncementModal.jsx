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
  const [showContent, setShowContent] = React.useState(true);
  
  const handleDismiss = async () => {
    try {
      // Dismissal tracking has been removed
      console.log('Announcement dismissal not tracked anymore');
      if (onDismiss) onDismiss(announcement.id);
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
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
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
              <h3 className="text-xl font-extrabold text-primary-900 text-center tracking-tight mb-1">{announcement.title}</h3>
              <p className="text-xs text-primary-500 text-center mb-2">Announcement</p>
            </div>
            {/* Content */}
            <div className="px-6 pb-2 max-h-48 overflow-y-auto text-primary-800 whitespace-pre-line text-sm leading-relaxed text-center">
              {announcement.content}
            </div>
            {/* Metadata chips */}
            <div className="flex flex-wrap justify-center gap-2 px-6 pb-2">
              <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-1 rounded-full text-xs font-semibold">
                <FiMessageCircle className="text-primary-400" />
                {announcement.manager?.name || 'Your Manager'}
              </div>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                <FiCalendar className="text-blue-400" />
                {format(parseISO(announcement.created_at), 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                <FiClock className="text-yellow-400" />
                Expires: {format(parseISO(announcement.expiry_date), 'MMM dd, yyyy')}
              </div>
            </div>
            {/* Action Button */}
            <motion.button
              className="mt-2 w-full py-3 bg-gradient-to-r from-primary-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-extrabold shadow-xl hover:from-primary-700 hover:to-blue-700 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDismiss}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiBell className="mr-2" /> Dismiss
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 