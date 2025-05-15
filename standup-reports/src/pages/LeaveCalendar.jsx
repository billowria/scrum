import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';

// Import components
import LeaveCalendarView from '../components/LeaveCalendarView';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveSummary from '../components/LeaveSummary';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function LeaveCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveData, setLeaveData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [leaveReason, setLeaveReason] = useState('');
  const [message, setMessage] = useState(null);
  
  // Current user info
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchLeaveData();
  }, [currentMonth]);
  
  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser(data);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, team_id');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };
  
  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status,
          users:user_id (id, name, team_id)
        `)
        .gte('start_date', start)
        .lte('end_date', end);
      
      if (error) throw error;
      setLeaveData(data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // Handle day click for date selection
  const handleDayClick = (day) => {
    // If no start date is selected, set it
    if (!selectedDates.start) {
      setSelectedDates({ start: day, end: null });
      return;
    }
    
    // If start date is selected but no end date, set end date
    if (selectedDates.start && !selectedDates.end) {
      // Ensure end date is not before start date
      if (day < selectedDates.start) {
        setSelectedDates({ start: day, end: selectedDates.start });
      } else {
        setSelectedDates({ ...selectedDates, end: day });
      }
      return;
    }
    
    // If both dates are selected, start over
    setSelectedDates({ start: day, end: null });
  };
  
  // Reset date selection
  const resetDateSelection = () => {
    setSelectedDates({ start: null, end: null });
  };
  
  // Handle leave request submission success
  const handleLeaveRequestSuccess = () => {
    fetchLeaveData();
    setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };
  
  // Calendar days for current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.h1 
        className="text-3xl font-bold font-display mb-6 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent"
        variants={itemVariants}
      >
        Team Leave Calendar
      </motion.h1>
      
      {/* Success/error message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            className={`mb-4 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {message.type === 'success' ? (
              <FiCheck className="mr-2" />
            ) : (
              <FiX className="mr-2" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Month navigation and actions */}
      <motion.div 
        className="mb-8 flex justify-between items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FiCalendar className="text-primary-600" />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-4">
          {selectedDates.start && (
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
              onClick={resetDateSelection}
            >
              <FiX />
              Clear Selection
            </button>
          )}
          
          <motion.button 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
            onClick={() => setShowLeaveForm(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiPlus />
            Request Leave
          </motion.button>
        </div>
      </motion.div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar view - takes 2/3 of the space on large screens */}
        <motion.div 
          className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 overflow-hidden"
          variants={itemVariants}
        >
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <LeaveCalendarView 
              daysInMonth={daysInMonth}
              leaveData={leaveData}
              users={users}
              onDayClick={handleDayClick}
              selectedDates={selectedDates}
            />
          )}
        </motion.div>
        
        {/* Leave summary - takes 1/3 of the space on large screens */}
        <motion.div
          className="lg:col-span-1"
          variants={itemVariants}
        >
          <LeaveSummary 
            leaveData={leaveData} 
            currentMonth={currentMonth} 
          />
        </motion.div>
      </div>
      
      {/* Leave request form modal */}
      <LeaveRequestForm 
        isOpen={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        onSuccess={handleLeaveRequestSuccess}
      />
    </motion.div>
  );
}
