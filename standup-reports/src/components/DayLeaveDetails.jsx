import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { FiX, FiUser, FiCalendar, FiInfo, FiCheck, FiClock } from 'react-icons/fi';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: 'easeOut'
    }
  })
};

const DayLeaveDetails = ({ isOpen, onClose, selectedDay, leavesOnDay }) => {
  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && selectedDay && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FiCalendar />
                  Leaves on {format(selectedDay, 'MMMM d, yyyy')}
                </h3>
                <button 
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                  onClick={onClose}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {leavesOnDay.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No leaves scheduled for this day
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leavesOnDay.map((leave, index) => {
                      const startDate = parseISO(leave.start_date);
                      const endDate = parseISO(leave.end_date);
                      const duration = differenceInDays(endDate, startDate) + 1;
                      
                      return (
                        <motion.div
                          key={leave.id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                <FiUser className="h-5 w-5" />
                              </div>
                              <span className="font-medium text-lg">{leave.users?.name || 'Unknown User'}</span>
                            </div>
                            
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(leave.status)}`}>
                              {getStatusIcon(leave.status)}
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </div>
                          </div>
                          
                          <div className="ml-12 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FiCalendar className="text-primary-500" />
                              <span>
                                {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                              </span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                {duration} {duration === 1 ? 'day' : 'days'}
                              </span>
                            </div>
                            
                            {leave.reason && (
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <FiInfo className="text-primary-500 mt-0.5" />
                                <span className="text-gray-700">{leave.reason}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DayLeaveDetails;
