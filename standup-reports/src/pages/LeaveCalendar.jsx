import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiBarChart2 } from 'react-icons/fi';

// Import components
import LeaveCalendarView from '../components/LeaveCalendarView';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveSummary from '../components/LeaveSummary';
import AnnouncementModal from '../components/AnnouncementModal';
import TeamAvailabilityAnalytics from '../components/TeamAvailabilityAnalytics';
import TeamLeaveOverview from '../components/TeamLeaveOverview';

// Professional color palette
const colors = {
  primary: {
    light: '#EBF4FF', // Light blue
    medium: '#3F83F8', // Medium blue
    dark: '#1E429F', // Dark blue
  },
  accent: {
    light: '#FDF2F8', // Light pink
    medium: '#F472B6', // Medium pink
    dark: '#9D174D', // Dark pink
  },
  success: {
    light: '#ECFDF5', // Light green
    medium: '#34D399', // Medium green
    dark: '#065F46', // Dark green
  },
  warning: {
    light: '#FFFBEB', // Light yellow
    medium: '#FBBF24', // Medium yellow
    dark: '#92400E', // Dark yellow
  },
  danger: {
    light: '#FEF2F2', // Light red
    medium: '#F87171', // Medium red
    dark: '#991B1B', // Dark red
  },
  neutral: {
    lightest: '#F9FAFB', // Almost white
    lighter: '#F3F4F6', // Very light gray
    light: '#E5E7EB', // Light gray
    medium: '#9CA3AF', // Medium gray
    dark: '#4B5563', // Dark gray
    darker: '#1F2937', // Very dark gray
    darkest: '#111827', // Almost black
  }
};

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

const calendarVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.3 } 
  }
};

const monthTransitionVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    }
  },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    }
  })
};

const overlayButtonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// New tab variants
const tabVariants = {
  inactive: { opacity: 0.7, y: 5 },
  active: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  }
};

const TabButton = ({ active, onClick, icon, children }) => (
  <motion.button
    className={`flex items-center justify-center py-3 px-4 text-sm font-medium relative rounded-t-lg ${
      active ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
    }`}
    variants={tabVariants}
    animate={active ? 'active' : 'inactive'}
    onClick={onClick}
    whileHover={{ opacity: active ? 1 : 0.9 }}
    whileTap={{ scale: 0.97 }}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
    {active && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
        layoutId="activeCalendarTab"
      />
    )}
  </motion.button>
);

// Add UsersOnLeaveModal component within the LeaveCalendar.jsx file
const UsersOnLeaveModal = ({ isOpen, onClose, date, users }) => {
  if (!isOpen || !date || !users || users.length === 0) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center">
                <FiUsers className="mr-2" /> 
                Team Members on Leave: {format(date, 'MMMM d, yyyy')}
              </h3>
              <button 
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-primary-700"
                onClick={onClose}
              >
                <FiX />
              </button>
            </div>
            
            <div className="p-4 max-h-80 overflow-y-auto">
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user, index) => (
                    <motion.div 
                      key={user.id || index}
                      className="p-3 bg-gray-50 rounded-lg flex items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-lg mr-3">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.team_id ? `Team ID: ${user.team_id}` : 'No team assigned'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  No team members on leave for this day.
                </div>
              )}
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const [monthDirection, setMonthDirection] = useState(0);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'analytics', or 'team'
  
  // Current user info
  const [currentUser, setCurrentUser] = useState(null);
  
  // Announcement modal state
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [calendarAnnouncement, setCalendarAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  
  // Add state for the users on leave modal
  const [showUsersOnLeaveModal, setShowUsersOnLeaveModal] = useState(false);
  const [usersOnLeaveData, setUsersOnLeaveData] = useState({
    date: null,
    users: []
  });
  
  // Animation controls
  const controls = useAnimation();
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchLeaveData();
    fetchAnnouncements();
    
    // Animate the calendar on initial load
    controls.start('visible');
  }, []);
  
  useEffect(() => {
    fetchLeaveData();
  }, [currentMonth]);
  
  // Calculate team availability whenever leave data changes
  useEffect(() => {
    if (leaveData.length > 0 && users.length > 0) {
      calculateTeamAvailability();
    }
  }, [leaveData, users]);
  
  const calculateTeamAvailability = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    
    const availability = {};
    
    daysInMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const totalUsers = users.length;
      const onLeave = leaveData.filter(leave => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return day >= start && day <= end && leave.status !== 'rejected';
      }).length;
      
      const availablePercentage = Math.round(((totalUsers - onLeave) / totalUsers) * 100);
      
      let status = 'high';
      if (availablePercentage < 70) status = 'medium';
      if (availablePercentage < 50) status = 'low';
      
      availability[dateStr] = {
        availablePercentage,
        status,
        onLeave
      };
    });
    
    setTeamAvailability(availability);
  };
  
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
  
  // Fetch announcements from the database
  const fetchAnnouncements = async () => {
    try {
      const today = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date,
          manager:created_by (id, name)
        `)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAnnouncements(data);
        setCalendarAnnouncement(data[0]); // Use the most recent announcement
        setHasUnreadAnnouncements(true);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
    }
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setMonthDirection(-1);
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setMonthDirection(1);
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // Handle day click for date selection
  const handleDayClick = (day, event) => {
    // If shift key is pressed, show user info for that day
    if (event.shiftKey) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const usersOnLeave = leaveData.filter(leave => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return day >= start && day <= end && leave.status !== 'rejected';
      }).map(leave => leave.users);
      
      setHoverInfo({
        date: day,
        position: { x: event.clientX, y: event.clientY },
        usersOnLeave
      });
      return;
    }
    
    // Clear hover info if it was showing
    if (hoverInfo) {
      setHoverInfo(null);
    }
    
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
  
  // Get color for day based on availability
  const getDayColor = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const availability = teamAvailability[dateStr];
    
    if (!availability) return colors.neutral.lighter;
    
    if (availability.status === 'high') return colors.success.light;
    if (availability.status === 'medium') return colors.warning.light;
    if (availability.status === 'low') return colors.danger.light;
    
    return colors.neutral.lighter;
  };
  
  // Get border color for selected dates
  const getSelectedDateBorder = (day) => {
    const { start, end } = selectedDates;
    
    if (!start) return '';
    
    if (isSameDay(day, start)) {
      return `ring-2 ring-${end ? 'primary' : 'accent'}-500`;
    }
    
    if (end && day >= start && day <= end) {
      return 'ring-2 ring-primary-300';
    }
    
    return '';
  };
  
  // Calendar days for current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Handle user icon click
  const handleUsersIconClick = (day, usersOnLeave, event) => {
    event.stopPropagation(); // Prevent day click handler from firing
    
    setUsersOnLeaveData({
      date: day,
      users: usersOnLeave
    });
    
    setShowUsersOnLeaveModal(true);
  };
  
  // Function to render the calendar day
  const renderCalendarDay = (day) => {
    const isWeekendDay = isWeekend(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSameMonthDay = isSameMonth(day, currentMonth);
    const availability = teamAvailability[dateStr];
    
    // Check if this day has leave data
    const usersOnLeave = leaveData
      .filter(leave => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return day >= start && day <= end && leave.status !== 'rejected';
      })
      .map(leave => leave.users);
    
    const hasLeave = usersOnLeave.length > 0;
    
    // Check if current user has leave on this day
    const userHasLeave = leaveData.some(leave => {
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return day >= start && day <= end && 
             leave.status !== 'rejected' && 
             leave.users && currentUser && 
             leave.users.id === currentUser.id;
  });
  
  return (
    <motion.div 
        key={dateStr}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative cursor-pointer rounded-lg p-2 sm:p-3 h-16 sm:h-20 
          flex flex-col justify-between
          ${isSameMonthDay ? 'opacity-100' : 'opacity-30'}
          ${isWeekendDay ? 'bg-gray-50' : availability ? getDayColor(day) : 'bg-white'}
          ${userHasLeave ? 'border-2 border-accent-500' : 'border border-gray-100'}
          ${getSelectedDateBorder(day)}
          hover:shadow-md transition-shadow
        `}
        onClick={(e) => handleDayClick(day, e)}
      >
        <div className="flex justify-between items-start">
          <span className={`text-sm font-medium ${isWeekendDay ? 'text-gray-500' : 'text-gray-700'}`}>
            {format(day, 'd')}
          </span>
          
          {hasLeave && (
            <motion.span 
              className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded-full inline-flex items-center cursor-pointer hover:bg-primary-200"
              onClick={(e) => handleUsersIconClick(day, usersOnLeave, e)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiUsers size={10} className="mr-1" /> 
              {usersOnLeave.length}
            </motion.span>
          )}
        </div>
        
        {availability && (
          <div className="flex items-center justify-between text-xs mt-1">
            <div 
              className={`h-1.5 w-full rounded-full overflow-hidden bg-gray-200`}
              style={{ opacity: isSameMonthDay ? 1 : 0.3 }}
            >
              <div 
                className={`h-full ${
                  availability.status === 'high' ? 'bg-green-500' : 
                  availability.status === 'medium' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${availability.availablePercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {userHasLeave && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full"></span>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
          <motion.div 
        className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
          >
        <h1 className="text-3xl font-bold font-display mb-2 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
          Team Leave Calendar
        </h1>
        <p className="text-gray-600">
          Manage leave requests and view team availability
        </p>
          </motion.div>
      
      {/* Calendar controls */}
      <motion.div 
        className="flex flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            onClick={goToPreviousMonth}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiChevronLeft size={24} />
          </motion.button>
          
          <div className="text-xl font-medium text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          
          <motion.button
            className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            onClick={goToNextMonth}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiChevronRight size={24} />
          </motion.button>
          
          <motion.button 
            className="ml-2 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 flex items-center transition-colors"
            onClick={() => setCurrentMonth(new Date())}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiCalendar className="mr-1" /> Today
          </motion.button>
        </div>
        
        <motion.button
          className="mt-2 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center transition-colors"
          onClick={() => setShowLeaveForm(true)}
          variants={overlayButtonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <FiPlus className="mr-2" /> Request Leave
        </motion.button>
      </motion.div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-gray-50 rounded-t-lg">
        <TabButton 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')} 
          icon={<FiCalendar />}
        >
          Calendar
        </TabButton>
        <TabButton 
          active={activeTab === 'team'} 
          onClick={() => setActiveTab('team')} 
          icon={<FiUsers />}
        >
          Team View
        </TabButton>
        <TabButton 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
          icon={<FiBarChart2 />}
        >
          Analytics
        </TabButton>
      </div>
      
      {/* Legend */}
      {activeTab === 'calendar' && (
        <motion.div 
          className="flex flex-wrap gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 mr-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">High Availability</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 mr-2 bg-yellow-500 rounded-full"></span>
            <span className="text-gray-600">Medium Availability</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 mr-2 bg-red-500 rounded-full"></span>
            <span className="text-gray-600">Low Availability</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 mr-2 border-2 border-accent-500 rounded-full"></span>
            <span className="text-gray-600">Your Leave</span>
          </div>
        </motion.div>
      )}
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Calendar grid */}
            <AnimatePresence initial={false} custom={monthDirection}>
              <motion.div
                key={format(currentMonth, 'yyyy-MM')}
                custom={monthDirection}
                variants={monthTransitionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="mb-8"
              >
                <motion.div
                  className="grid grid-cols-7 gap-2 mb-2"
                  variants={calendarVariants}
                  initial="hidden"
                  animate={controls}
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center p-2 font-medium text-gray-500 bg-gray-50 rounded-md">
                      {day}
            </div>
                  ))}
                </motion.div>
                
                <motion.div 
                  className="grid grid-cols-7 gap-2"
                  variants={calendarVariants}
                  initial="hidden"
                  animate={controls}
                >
                  {daysInMonth.map(day => renderCalendarDay(day))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* Team View */}
        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TeamLeaveOverview 
              users={users}
              leaveData={leaveData}
              currentMonth={currentMonth}
            />
          </motion.div>
          )}
        
        {/* Analytics View */}
        {activeTab === 'analytics' && (
        <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <TeamAvailabilityAnalytics 
              teamAvailability={teamAvailability}
              users={users}
            leaveData={leaveData} 
            currentMonth={currentMonth} 
          />
        </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selected date range indicator */}
      {selectedDates.start && activeTab === 'calendar' && (
        <motion.div 
          className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Selected Date Range</h3>
              <p className="text-gray-600">
                {format(selectedDates.start, 'MMMM d, yyyy')}
                {selectedDates.end && ` to ${format(selectedDates.end, 'MMMM d, yyyy')}`}
                {selectedDates.end && ` (${differenceInDays(selectedDates.end, selectedDates.start) + 1} days)`}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <motion.button
                className="px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={resetDateSelection}
                variants={overlayButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <FiX className="mr-1 inline" /> Clear
              </motion.button>
              
              {selectedDates.end && (
                <motion.button
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  onClick={() => setShowLeaveForm(true)}
                  variants={overlayButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FiPlus className="mr-1 inline" /> Request for these dates
                </motion.button>
              )}
            </div>
      </div>
        </motion.div>
      )}
      
      {/* User on leave hover info */}
      <AnimatePresence>
        {hoverInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'fixed',
              top: hoverInfo.position.y + 10,
              left: hoverInfo.position.x + 10,
              zIndex: 100
            }}
            className="bg-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-200"
          >
            <h4 className="font-medium text-gray-800 mb-2">
              {format(hoverInfo.date, 'MMMM d, yyyy')}
            </h4>
            
            {hoverInfo.usersOnLeave.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-2">Team members on leave:</p>
                <ul className="space-y-1.5">
                  {hoverInfo.usersOnLeave.map((user, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <FiUser className="mr-2 text-primary-500" /> {user.name}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-gray-600">No team members on leave this day.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg ${
              message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <FiCheck className="inline mr-2" /> : <FiInfo className="inline mr-2" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Leave request form */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg overflow-hidden w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Request Leave</h2>
                <motion.button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setShowLeaveForm(false)}
                  variants={overlayButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FiX size={24} className="text-gray-500" />
                </motion.button>
              </div>
            </div>
            
            <div className="p-6">
      <LeaveRequestForm 
        isOpen={showLeaveForm}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
                onSuccess={() => {
                  setShowLeaveForm(false);
                  handleLeaveRequestSuccess();
                }}
                onClose={() => setShowLeaveForm(false)}
      />
            </div>
    </motion.div>
        </div>
      )}
      
      {/* Users on leave modal */}
      <UsersOnLeaveModal 
        isOpen={showUsersOnLeaveModal}
        onClose={() => setShowUsersOnLeaveModal(false)}
        date={usersOnLeaveData.date}
        users={usersOnLeaveData.users}
      />
      
      {/* Announcement modal */}
      <AnnouncementModal
        isOpen={showAnnouncement}
        onClose={() => {
          setShowAnnouncement(false);
          setHasUnreadAnnouncements(false);
        }}
        announcement={calendarAnnouncement}
        userId={currentUser?.id}
        onDismiss={() => setHasUnreadAnnouncements(false)}
      />
      
      {/* Announcement button */}
      {calendarAnnouncement && (
        <motion.button
          className={`fixed bottom-5 right-5 p-3 ${hasUnreadAnnouncements ? 'bg-primary-600' : 'bg-gray-500'} text-white rounded-full shadow-lg`}
          onClick={() => setShowAnnouncement(true)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiBell size={24} />
          {hasUnreadAnnouncements && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </motion.button>
      )}
    </div>
  );
}
