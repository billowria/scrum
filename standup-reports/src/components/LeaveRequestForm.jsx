import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  FiCalendar, 
  FiX, 
  FiCheck, 
  FiLoader, 
  FiAlertCircle, 
  FiTag, 
  FiEdit3, 
  FiSun, 
  FiHeart, 
  FiUser, 
  FiActivity,
  FiBriefcase,
  FiZap
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { notifyLeaveRequest } from '../utils/notificationHelper';

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 30,
      duration: 0.4
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 20,
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
  disabled: { opacity: 0.6, scale: 1 }
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
  const [hoveredType, setHoveredType] = useState(null);
  
  const leaveTypeConfig = {
    vacation: {
      label: 'Vacation',
      icon: <FiSun className="w-5 h-5" />,
      color: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700'
    },
    sick: {
      label: 'Sick Leave',
      icon: <FiActivity className="w-5 h-5" />,
      color: 'from-red-400 to-pink-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700'
    },
    personal: {
      label: 'Personal',
      icon: <FiUser className="w-5 h-5" />,
      color: 'from-blue-400 to-cyan-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700'
    },
    family: {
      label: 'Family Care',
      icon: <FiHeart className="w-5 h-5" />,
      color: 'from-pink-400 to-rose-500',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700'
    },
    other: {
      label: 'Other',
      icon: <FiBriefcase className="w-5 h-5" />,
      color: 'from-purple-400 to-violet-500',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700'
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDates.start || !selectedDates.end) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (leaveType === "other" && !reason.trim()) {
      setError('Please enter a reason for other leave types');
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
            status: 'pending',
            type: leaveType
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
          { start_date: startDate, end_date: endDate, user_id: user.id, type: leaveType },
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
      setError(`Error: ${error.message || 'Failed to submit leave request'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    if (!selectedDates.start || !selectedDates.end) {
      return 'Select dates';
    }
    const start = format(selectedDates.start, 'MMM dd');
    const end = format(selectedDates.end, 'MMM dd');
    const startYear = format(selectedDates.start, 'yyyy');
    const endYear = format(selectedDates.end, 'yyyy');
    
    if (startYear === endYear) {
      return `${start} - ${end}, ${startYear}`;
    } else {
      return `${start}, ${startYear} - ${end}, ${endYear}`;
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div
              className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-gray-200/30 z-50"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tr from-amber-100/30 to-cyan-100/40 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>
              
              {/* Header Section */}
              <div className="relative z-10 px-6 pt-8 pb-4">
                <motion.div 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          delay: 0.15
                        }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg"
                      >
                        <FiCalendar className="text-white" />
                      </motion.div>
                      Request Time Off
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Submit your leave request</p>
                  </div>
                  <motion.button
                    className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 transition-all z-20"
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="text-gray-600 w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 relative z-10">
                {/* Date Range Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiCalendar className="inline mr-2 text-indigo-500" />
                    Date Range
                  </label>
                  <div 
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200/50 shadow-sm cursor-pointer hover:border-indigo-300/50 transition-all"
                    onClick={e => { e.preventDefault(); setShowDatePopover(true); }}
                  >
                    <div className="p-2 bg-indigo-100/50 rounded-lg">
                      <FiCalendar className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 font-medium">{formatDateRange()}</p>
                      {selectedDates.start && selectedDates.end && (
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(selectedDates.end) - new Date(selectedDates.start))/(1000*60*60*24)) + 1} days selected
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Date Picker Popover */}
                  {showDatePopover && (
                    <motion.div 
                      className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4 mt-2 z-30"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white/90 text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={selectedDates.start ? format(selectedDates.start, 'yyyy-MM-dd') : ''}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={e => setSelectedDates({ start: new Date(e.target.value), end: selectedDates.end })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                          <input
                            type="date"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white/90 text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={selectedDates.end ? format(selectedDates.end, 'yyyy-MM-dd') : ''}
                            min={selectedDates.start ? format(selectedDates.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                            onChange={e => setSelectedDates({ ...selectedDates, end: new Date(e.target.value) })}
                            disabled={!selectedDates.start}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <motion.button
                          type="button"
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-colors"
                          onClick={() => setShowDatePopover(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Done
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Leave Type Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <FiTag className="inline mr-2 text-indigo-500" />
                    Leave Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(leaveTypeConfig).map(([key, config]) => (
                      <motion.button
                        key={key}
                        type="button"
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          leaveType === key 
                            ? `border-indigo-500 bg-gradient-to-br ${config.color} bg-opacity-10 shadow-lg` 
                            : 'border-gray-200/50 bg-white/50 hover:border-gray-300/50'
                        }`}
                        onClick={() => setLeaveType(key)}
                        onMouseEnter={() => setHoveredType(key)}
                        onMouseLeave={() => setHoveredType(null)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`p-3 rounded-xl ${
                            leaveType === key 
                              ? `bg-gradient-to-br ${config.color} text-white shadow-lg` 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          animate={{
                            scale: hoveredType === key ? 1.1 : 1
                          }}
                        >
                          {config.icon}
                        </motion.div>
                        <span className={`font-semibold ${leaveType === key ? 'text-gray-800' : 'text-gray-600'}`}>
                          {config.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Reason Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiEdit3 className="inline mr-2 text-indigo-500" />
                    Reason {leaveType === "other" ? "(Required)" : "(Optional)"}
                  </label>
                  <div className="relative">
                    <textarea
                      id="reason"
                      className="w-full p-4 rounded-2xl border-2 border-gray-200/50 bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      rows="3"
                      placeholder={`Enter reason for your ${leaveTypeConfig[leaveType].label}...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required={leaveType === "other"}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/200 characters
                  </p>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FiAlertCircle className="text-red-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-red-800 font-medium text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading || !selectedDates.start || !selectedDates.end || (leaveType === "other" && !reason.trim())}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Processing...
                      </>
                    ) : success ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="p-1 bg-white/20 rounded-full"
                        >
                          <FiCheck className="w-5 h-5" />
                        </motion.div>
                        Submitted!
                      </>
                    ) : (
                      <>
                        <FiZap className="w-5 h-5" />
                        Submit Request
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* Success overlay */}
              {success && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-40 flex flex-col items-center justify-center text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                      <FiCheck className="w-12 h-12" />
                    </div>
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold mb-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Request Submitted!
                  </motion.h3>
                  <motion.p 
                    className="text-white/90 text-center max-w-xs"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Your leave request has been sent for approval and will be processed shortly.
                  </motion.p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeaveRequestForm;
