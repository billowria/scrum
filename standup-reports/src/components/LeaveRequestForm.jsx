import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiCalendar, FiX, FiCheck, FiLoader, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

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

const buttonVariants = {
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.97 },
  disabled: { opacity: 0.6 }
};

const LeaveRequestForm = ({ 
  isOpen = true, 
  onClose, 
  selectedDates,
  setSelectedDates,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDates.start || !selectedDates.end) {
      setError('Please select both start and end dates');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Format dates for database
      const startDate = format(selectedDates.start, 'yyyy-MM-dd');
      const endDate = format(selectedDates.end, 'yyyy-MM-dd');
      
      // Insert leave request
      const { data, error } = await supabase
        .from('leave_plans')
        .insert([
          {
            user_id: user.id,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
            status: 'pending'
          }
        ]);
      
      if (error) throw error;
      
      // Show success animation
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        setLeaveType('vacation');
        if (setSelectedDates) {
          setSelectedDates({ start: null, end: null });
        }
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
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
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success overlay */}
              {success && (
                <motion.div 
                  className="absolute inset-0 bg-green-600 bg-opacity-95 z-10 flex flex-col items-center justify-center text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="bg-white bg-opacity-20 rounded-full p-4 mb-4"
                  >
                    <FiCheck className="w-16 h-16" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Request Submitted!</h3>
                  <p className="text-white text-opacity-90">Your leave request has been sent for approval</p>
                </motion.div>
              )}
              
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FiCalendar className="h-5 w-5" />
                  Request Time Off
                </h3>
                <motion.button 
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors flex items-center justify-center"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Date selection info */}
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Selected Date Range
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Start Date</div>
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium text-primary-700">
                          {selectedDates.start 
                            ? format(selectedDates.start, 'MMM dd, yyyy') 
                            : 'Select date'}
                        </div>
                      </div>
                      
                      <div className="flex-grow mx-4 flex items-center justify-center">
                        <div className="h-0.5 bg-gray-300 w-full relative">
                          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <FiArrow className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">End Date</div>
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium text-primary-700">
                          {selectedDates.end 
                            ? format(selectedDates.end, 'MMM dd, yyyy') 
                            : 'Select date'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                    <FiInfo className="text-primary-500" />
                    Click on calendar dates to select your leave period
                  </div>
                </div>
                
                {/* Leave Type Selection */}
                <div className="mb-6">
                  <label 
                    htmlFor="leaveType" 
                    className="block text-gray-700 mb-2 font-medium"
                  >
                    Leave Type
                  </label>
                  <select
                    id="leaveType"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="family">Family Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Reason field */}
                <div className="mb-6">
                  <label 
                    htmlFor="reason" 
                    className="block text-gray-700 mb-2 font-medium"
                  >
                    Reason {leaveType === "other" ? "(Required)" : "(Optional)"}
                  </label>
                  <textarea
                    id="reason"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    rows="3"
                    placeholder="Enter reason for leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required={leaveType === "other"}
                  />
                </div>
                
                {/* Error message */}
                {error && (
                  <motion.div 
                    className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                
                {/* Actions */}
                <div className="flex justify-between mt-8">
                  <motion.button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                    onClick={onClose}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !selectedDates.start || !selectedDates.end || (leaveType === "other" && !reason)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    animate={loading || !selectedDates.start || !selectedDates.end ? "disabled" : ""}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Submitting...
                      </>
                    ) : success ? (
                      <>
                        <FiCheck />
                        Submitted!
                      </>
                    ) : (
                      <>
                        <FiCalendar />
                        Submit Request
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const FiArrow = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default LeaveRequestForm;
