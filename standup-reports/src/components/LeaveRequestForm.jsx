import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiCalendar, FiX, FiCheck, FiLoader, FiInfo, FiAlertCircle, FiTag, FiEdit3 } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { notifyLeaveRequest } from '../utils/notificationHelper';

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
  const [showDatePopover, setShowDatePopover] = useState(false);
  
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
      
      // Fetch user info and notify manager
      const { data: userData } = await supabase
        .from('users')
        .select('name, manager_id')
        .eq('id', user.id)
        .single();
      
      if (userData?.manager_id) {
        await notifyLeaveRequest(
          { start_date: startDate, end_date: endDate, user_id: user.id },
          userData.name,
          userData.manager_id
        );
      }
      
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
          {/* Remove Backdrop overlay */}
          {/* Animated background blobs */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Animated background blobs */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-primary-400 via-indigo-400 to-blue-300 opacity-30 blur-2xl rounded-full animate-pulse" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tr from-blue-400 via-indigo-300 to-primary-300 opacity-20 blur-2xl rounded-full animate-pulse delay-2000" />
            </div>
            <motion.div
              className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden border border-white/30 z-10"
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
                    <FiCalendar className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-primary-900 text-center tracking-tight">Request Time Off</h3>
                <p className="text-xs text-primary-500 text-center mt-1 mb-2">Submit your leave request below</p>
              </div>
              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 flex flex-col gap-4">
                {/* Custom Date Range Field */}
                <div className="relative group">
                  <label className="block text-xs font-bold text-primary-700 mb-1 ml-1">Date Range</label>
                  <div className="flex items-center gap-2 bg-white/90 border-2 border-primary-100 rounded-xl px-3 py-2 shadow-inner focus-within:border-primary-400 transition-all cursor-pointer" onClick={e => { e.preventDefault(); setShowDatePopover(true); }}>
                    <FiCalendar className="text-primary-400 mr-2" />
                    <span className={`font-semibold text-primary-800 ${!selectedDates.start ? 'opacity-50' : ''}`}>{selectedDates.start ? format(selectedDates.start, 'MMM dd, yyyy') : 'Start'}</span>
                    <span className="mx-1 text-primary-300">—</span>
                    <span className={`font-semibold text-primary-800 ${!selectedDates.end ? 'opacity-50' : ''}`}>{selectedDates.end ? format(selectedDates.end, 'MMM dd, yyyy') : 'End'}</span>
                  </div>
                  {/* Date popover (simple, not a full calendar grid for brevity) */}
                  {showDatePopover && (
                    <div className="absolute left-0 top-12 bg-white rounded-2xl shadow-xl border border-primary-100 p-4 flex gap-4 z-30 animate-fade-in">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-primary-600 mb-1">Start</span>
                        <input
                          type="date"
                          className="w-32 px-2 py-2 rounded-lg border-2 border-primary-200 bg-white/90 text-primary-800 font-bold shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all text-center text-sm"
                          value={selectedDates.start ? format(selectedDates.start, 'yyyy-MM-dd') : ''}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          onChange={e => setSelectedDates({ start: new Date(e.target.value), end: selectedDates.end })}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-primary-600 mb-1">End</span>
                        <input
                          type="date"
                          className="w-32 px-2 py-2 rounded-lg border-2 border-primary-200 bg-white/90 text-primary-800 font-bold shadow focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all text-center text-sm"
                          value={selectedDates.end ? format(selectedDates.end, 'yyyy-MM-dd') : ''}
                          min={selectedDates.start ? format(selectedDates.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                          onChange={e => setSelectedDates({ ...selectedDates, end: new Date(e.target.value) })}
                          disabled={!selectedDates.start}
                        />
                      </div>
                      <button type="button" className="ml-2 text-xs text-primary-500 hover:text-primary-700 font-bold" onClick={() => setShowDatePopover(false)}>Done</button>
                    </div>
                  )}
                </div>
                {/* Leave Type Field */}
                <div className="relative group">
                  <label htmlFor="leaveType" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Leave Type</label>
                  <div className="relative">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <select
                      id="leaveType"
                      className="w-full border-2 border-indigo-100 rounded-xl p-2 pl-9 bg-white/90 text-indigo-700 font-semibold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all shadow-sm text-sm"
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
                </div>
                {/* Reason Field */}
                <div className="relative group">
                  <label htmlFor="reason" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Reason {leaveType === "other" ? "(Required)" : "(Optional)"}</label>
                  <div className="relative">
                    <FiEdit3 className="absolute left-3 top-3 text-blue-400" />
                    <textarea
                      id="reason"
                      className="w-full border-2 border-blue-100 rounded-xl p-2 pl-9 bg-white/90 text-blue-700 font-semibold focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all shadow-sm text-sm"
                      rows="2"
                      placeholder="Enter reason for leave..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required={leaveType === "other"}
                    />
                  </div>
                </div>
                {/* Error message */}
                {error && (
                  <motion.div 
                    className="mb-2 p-2 bg-red-100 text-red-800 rounded-xl border border-red-200 flex items-start gap-2 shadow animate-pulse text-xs"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {/* Success overlay (unchanged) */}
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
                {/* Action Button */}
                <motion.button
                  type="submit"
                  className="mt-2 w-full py-3 bg-gradient-to-r from-primary-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-extrabold shadow-xl hover:from-primary-700 hover:to-blue-700 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
