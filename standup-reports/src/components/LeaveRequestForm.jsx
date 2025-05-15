import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiCalendar, FiX, FiCheck, FiLoader } from 'react-icons/fi';
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

const LeaveRequestForm = ({ 
  isOpen, 
  onClose, 
  selectedDates,
  setSelectedDates,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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
        setSelectedDates({ start: null, end: null });
        onSuccess();
        onClose();
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
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
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
                  Request Leave
                </h3>
                <button 
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                  onClick={onClose}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Date selection info */}
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Selected Dates
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Start Date</div>
                        <div className="font-medium">
                          {selectedDates.start 
                            ? format(selectedDates.start, 'MMM dd, yyyy') 
                            : 'Not selected'}
                        </div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <div className="text-sm text-gray-500">End Date</div>
                        <div className="font-medium">
                          {selectedDates.end 
                            ? format(selectedDates.end, 'MMM dd, yyyy') 
                            : 'Not selected'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Click on calendar dates to select your leave period
                  </div>
                </div>
                
                {/* Reason field */}
                <div className="mb-6">
                  <label 
                    htmlFor="reason" 
                    className="block text-gray-700 mb-2 font-medium"
                  >
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    rows="3"
                    placeholder="Enter reason for leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                
                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}
                
                {/* Submit button */}
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    disabled={loading || !selectedDates.start || !selectedDates.end}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
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
                      'Submit Request'
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

export default LeaveRequestForm;
