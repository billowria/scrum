import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
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
  FiZap,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { notifyLeaveRequest } from '../utils/notificationHelper';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../context/ThemeContext';

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
  const { currentCompany } = useCompany();
  const { isAnimatedTheme } = useTheme();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = (date) => {
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      // Start new selection
      setSelectedDates({ start: date, end: null });
    } else {
      // Complete selection
      if (date < selectedDates.start) {
        setSelectedDates({ start: date, end: selectedDates.start });
      } else {
        setSelectedDates({ ...selectedDates, end: date });
      }
      // Optional: Close popover after short delay or keep open for review
      // setShowDatePopover(false);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="p-4 w-full sm:w-[320px]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-800 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isSelected = (selectedDates.start && isSameDay(day, selectedDates.start)) ||
              (selectedDates.end && isSameDay(day, selectedDates.end));
            const isInRange = selectedDates.start && selectedDates.end &&
              isWithinInterval(day, { start: selectedDates.start, end: selectedDates.end });
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isSameDay(day, new Date());

            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-sm relative transition-all
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-slate-600' : 'text-gray-700 dark:text-gray-200'}
                  ${isSelected ? 'bg-indigo-600 text-white shadow-md z-10' : ''}
                  ${!isSelected && isInRange ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-none first:rounded-l-full last:rounded-r-full' : ''}
                  ${!isSelected && !isInRange && isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-slate-700' : ''}
                  ${isTodayDate && !isSelected ? 'ring-1 ring-indigo-500 font-bold' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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

    if (!currentCompany?.id) {
      setError('Company information not available. Please refresh the page.');
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

      // Check for existing leave requests that overlap with the requested dates
      const { data: existingLeave, error: checkError } = await supabase
        .from('leave_plans')
        .select('id, start_date, end_date, status')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .neq('status', 'rejected'); // Ignore rejected requests

      if (checkError) {
        throw new Error('Error checking existing leave requests');
      }

      // Check for any overlapping leave requests
      const overlappingRequests = existingLeave ? existingLeave.filter(leave => {
        const existingStart = new Date(leave.start_date);
        const existingEnd = new Date(leave.end_date);
        const requestedStart = new Date(startDate);
        const requestedEnd = new Date(endDate);

        // Check if date ranges overlap
        return (
          (requestedStart >= existingStart && requestedStart <= existingEnd) ||
          (requestedEnd >= existingStart && requestedEnd <= existingEnd) ||
          (requestedStart <= existingStart && requestedEnd >= existingEnd)
        );
      }) : [];

      if (overlappingRequests.length > 0) {
        const overlappingDates = overlappingRequests
          .map(leave => {
            const start = format(new Date(leave.start_date), 'MMM d, yyyy');
            const end = format(new Date(leave.end_date), 'MMM d, yyyy');
            return start === end ? start : `${start} - ${end}`;
          })
          .join(', ');

        setError(`You already have a leave request for ${overlappingDates}. Please edit your existing request instead of creating a new one.`);
        setLoading(false);
        return;
      }

      // Fetch user info first for notification
      const { data: userData } = await supabase
        .from('users')
        .select('name, manager_id')
        .eq('id', user.id)
        .single();

      // Insert leave request
      const { data, error } = await supabase
        .from('leave_plans')
        .insert([
          {
            user_id: user.id,
            company_id: currentCompany.id,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
            status: 'pending',
            type: leaveType
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification for managers about the new leave request
      if (data?.id) {
        await notifyLeaveRequest(
          {
            id: data.id,
            start_date: startDate,
            end_date: endDate,
            user_id: user.id,
            type: leaveType,
            reason: reason
          },
          userData?.name || 'Employee',
          userData?.manager_id
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
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div
              className={`relative rounded-3xl w-full sm:w-[500px] max-w-[95vw] mx-auto max-h-[90vh] overflow-hidden flex flex-col ${isAnimatedTheme
                ? 'bg-slate-900/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border-2 border-white/20'
                : 'bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-800'
                }`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated background elements - Only for standard themes */}
              {!isAnimatedTheme && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                </div>
              )}

              {/* Header Section */}
              <div className="relative z-10 px-6 pt-8 pb-4">
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-2 ${isAnimatedTheme ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          delay: 0.15
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isAnimatedTheme
                          ? 'bg-white/20 backdrop-blur-md border border-white/20'
                          : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                          }`}
                      >
                        <FiCalendar className="text-white" />
                      </motion.div>
                      Request Time Off
                    </h2>
                    <p className={`text-sm mt-1 ${isAnimatedTheme ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>Submit your leave request</p>
                  </div>
                  <motion.button
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all z-20 ${isAnimatedTheme
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 max-h-[60vh]">
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 relative z-10">
                  {/* Date Range Selection */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className={`block text-sm font-semibold mb-2 ${isAnimatedTheme ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <FiCalendar className={`inline mr-2 ${isAnimatedTheme ? 'text-white' : 'text-indigo-500'}`} />
                      Date Range
                    </label>
                    <div
                      className={`flex items-center gap-3 rounded-2xl p-4 border-2 shadow-sm cursor-pointer transition-all ${isAnimatedTheme
                        ? 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/30'
                        : 'bg-white/80 dark:bg-slate-800/80 border-gray-200/50 dark:border-slate-700 hover:border-indigo-300/50 dark:hover:border-indigo-500/50'
                        }`}
                      onClick={e => { e.preventDefault(); setShowDatePopover(true); }}
                    >
                      <div className={`p-2 rounded-lg ${isAnimatedTheme ? 'bg-white/20' : 'bg-indigo-100/50 dark:bg-indigo-900/30'}`}>
                        <FiCalendar className={`w-5 h-5 ${isAnimatedTheme ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isAnimatedTheme ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{formatDateRange()}</p>
                        {selectedDates.start && selectedDates.end && (
                          <p className={`text-xs ${isAnimatedTheme ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            {Math.ceil((new Date(selectedDates.end) - new Date(selectedDates.start)) / (1000 * 60 * 60 * 24)) + 1} days selected
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date Picker Popover */}
                    {showDatePopover && (
                      <motion.div
                        className="absolute top-full left-0 sm:left-auto sm:right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 mt-2 z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      >
                        {renderCalendar()}
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-3 border-t border-gray-100 dark:border-slate-800">
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {selectedDates.start && selectedDates.end
                              ? `${Math.ceil((selectedDates.end - selectedDates.start) / (1000 * 60 * 60 * 24)) + 1} days`
                              : 'Select range'}
                          </span>
                          <motion.button
                            type="button"
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
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
                    <label className={`block text-sm font-semibold mb-3 ${isAnimatedTheme ? 'text-white' : 'text-gray-700'}`}>
                      <FiTag className={`inline mr-2 ${isAnimatedTheme ? 'text-white' : 'text-indigo-500'}`} />
                      Leave Type
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Object.entries(leaveTypeConfig).map(([key, config]) => (
                        <motion.button
                          key={key}
                          type="button"
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${leaveType === key
                            ? isAnimatedTheme
                              ? `border-white/50 bg-white/20 shadow-lg`
                              : `border-indigo-500 bg-gradient-to-br ${config.color} bg-opacity-20 shadow-md`
                            : isAnimatedTheme
                              ? 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                              : 'border-gray-200/50 bg-white/50 hover:border-gray-300'
                            }`}
                          onClick={() => setLeaveType(key)}
                          onMouseEnter={() => setHoveredType(key)}
                          onMouseLeave={() => setHoveredType(null)}
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${leaveType === key
                              ? isAnimatedTheme
                                ? 'bg-white text-indigo-600'
                                : `bg-gradient-to-br ${config.color} text-white`
                              : isAnimatedTheme
                                ? 'bg-white/10 text-white/70'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                            animate={{
                              scale: hoveredType === key ? 1.2 : 1
                            }}
                          >
                            {config.icon}
                          </motion.div>
                          <span className={`text-xs font-medium mt-1 ${isAnimatedTheme ? 'text-white' : leaveType === key ? 'text-gray-800' : 'text-gray-600'}`}>
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
                    <label htmlFor="reason" className={`block text-sm font-semibold mb-2 ${isAnimatedTheme ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <FiEdit3 className={`inline mr-2 ${isAnimatedTheme ? 'text-white' : 'text-indigo-500'}`} />
                      Reason {leaveType === "other" ? "(Required)" : "(Optional)"}
                    </label>
                    <div className="relative">
                      <textarea
                        id="reason"
                        className={`w-full p-4 rounded-2xl border-2 transition-all resize-none ${isAnimatedTheme
                          ? 'bg-white/10 border-white/10 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/30 focus:ring-2 focus:ring-white/20'
                          : 'bg-white/80 dark:bg-slate-800 border-gray-200/50 dark:border-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500'
                          }`}
                        rows="3"
                        placeholder={`Enter reason for your ${leaveTypeConfig[leaveType].label}...`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required={leaveType === "other"}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${isAnimatedTheme ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
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
              </div>

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
