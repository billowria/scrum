import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiBarChart2, FiArrowRight, FiFilter, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiUserCheck } from 'react-icons/fi';

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

// Enhanced stat card animation
const statCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: custom => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      type: 'spring', 
      stiffness: 400, 
      damping: 15 
    }
  }),
  hover: {
    y: -5,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 10
    }
  }
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

// Professional stat card component
const StatCard = ({ icon, title, value, color, index }) => (
  <motion.div
    className={`bg-white rounded-xl border border-${color}-100 shadow-sm overflow-hidden`}
    variants={statCardVariants}
    custom={index}
    initial="hidden"
    animate="visible"
    whileHover="hover"
  >
    <div className={`p-5 flex items-start justify-between bg-gradient-to-r from-${color}-50 to-white`}>
      <div>
        <p className={`text-${color}-700 text-sm font-medium mb-1`}>{title}</p>
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

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
  
  // New stats for enhanced dashboard
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    onLeaveToday: 0,
    upcomingLeaves: 0,
    totalLeaveThisMonth: 0,
    rejectedRequests: 0
  });
  
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
      calculateStats();
    }
  }, [leaveData, users]);
  
  // Calculate stats for dashboard
  const calculateStats = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Count team members on leave today
    const onLeaveToday = leaveData.filter(leave => {
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return today >= start && today <= end && leave.status === 'approved';
    }).length;
    
    // Count upcoming leaves (next 14 days)
    const upcoming = leaveData.filter(leave => {
      const start = parseISO(leave.start_date);
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);
      return start > today && start <= twoWeeksFromNow && leave.status === 'approved';
    }).length;
    
    // Count total leaves this month
    const totalThisMonth = leaveData.filter(leave => 
      isSameMonth(parseISO(leave.start_date), currentMonth) || 
      isSameMonth(parseISO(leave.end_date), currentMonth)
    ).length;
    
    // Count rejected requests
    const rejected = leaveData.filter(leave => leave.status === 'rejected').length;
    
    setStats({
      totalTeamMembers: users.length,
      onLeaveToday,
      upcomingLeaves: upcoming,
      totalLeaveThisMonth: totalThisMonth,
      rejectedRequests: rejected
    });
  };
  
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
    const isToday = isSameDay(new Date(), day);
    
    // Check if this day has leave data
    const usersOnLeave = leaveData
      .filter(leave => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return day >= start && day <= end && leave.status === 'approved';
      })
      .map(leave => leave.users);
    
    const hasLeave = usersOnLeave.length > 0;
    
    // Check if current user has leave on this day
    const userHasLeave = leaveData.some(leave => {
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return day >= start && day <= end && 
             leave.status === 'approved' && 
             leave.users && currentUser && 
             leave.users.id === currentUser.id;
    });
    
    // Check if there are pending leave requests for this day
    const hasPendingRequests = leaveData.some(leave => {
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return day >= start && day <= end && leave.status === 'pending';
    });
  
    return (
      <motion.div 
        key={dateStr}
        whileHover={{ scale: 1.05, zIndex: 10, boxShadow: "0 8px 16px -2px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative cursor-pointer rounded-lg p-2 sm:p-3 h-20 sm:h-24 
          flex flex-col justify-between
          ${isSameMonthDay ? 'opacity-100' : 'opacity-40'}
          ${isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
          ${isWeekendDay ? 'bg-gray-50' : availability ? getDayColor(day) : 'bg-white'}
          ${userHasLeave ? 'border-2 border-accent-500' : 'border border-gray-100'}
          ${getSelectedDateBorder(day)}
          shadow-sm hover:shadow-md transition-all duration-200
        `}
        onClick={(e) => handleDayClick(day, e)}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-center">
            <span className={`text-xs uppercase font-medium text-gray-400 ${isToday ? 'text-primary-500' : ''}`}>
              {format(day, 'EEE')}
            </span>
            <span className={`
              ${isToday 
                ? 'bg-primary-500 text-white w-6 h-6 flex items-center justify-center rounded-full mt-0.5' 
                : isWeekendDay ? 'text-gray-500' : 'text-gray-800'
              } text-sm font-bold`}
            >
              {format(day, 'd')}
            </span>
          </div>
          
          <div className="flex flex-col items-end gap-0.5">
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
            
            {hasPendingRequests && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full inline-flex items-center">
                <FiClock size={10} className="mr-1" />
                Pending
              </span>
            )}
          </div>
        </div>
        
        {/* Availability indicator */}
        {availability && (
          <div className="flex flex-col gap-1 mt-1">
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
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Available:</span>
              <span className={`font-medium ${
                availability.status === 'high' ? 'text-green-600' : 
                availability.status === 'medium' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {availability.availablePercentage}%
              </span>
            </div>
          </div>
        )}
        
        {/* Status markers */}
        {userHasLeave && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white"></div>
        )}
        
        {/* Selected day indicator */}
        {selectedDates.start && isSameDay(selectedDates.start, day) && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
        )}
        
        {selectedDates.end && isSameDay(selectedDates.end, day) && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Enhanced page header with professional gradient background */}
      <motion.div 
        className="relative mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 text-white overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display mb-2">
            Team Leave Calendar
          </h1>
          <p className="text-primary-100 max-w-xl">
            Plan, view, and manage leave requests for your team. Stay updated on team availability and coordinate effectively.
          </p>
          
          <div className="flex items-center mt-4 text-primary-100">
            <FiCalendar className="mr-2" />
            <span className="mr-4">Current view: {format(currentMonth, 'MMMM yyyy')}</span>
            <FiUsers className="mr-2" />
            <span>{users.length} team members</span>
          </div>
        </div>
      </motion.div>
      
      {/* Stats cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatCard 
          icon={<FiUsers size={20} />}
          title="Team Members Available Today" 
          value={stats.totalTeamMembers - stats.onLeaveToday} 
          color="green"
          index={0}
        />
        
        <StatCard 
          icon={<FiUserCheck size={20} />}
          title="On Leave Today" 
          value={stats.onLeaveToday} 
          color="blue"
          index={1}
        />
        
        <StatCard 
          icon={<FiClock size={20} />}
          title="Upcoming Leaves" 
          value={stats.upcomingLeaves} 
          color="yellow"
          index={2}
        />
        
        <StatCard 
          icon={<FiCalendar size={20} />}
          title="Total This Month" 
          value={stats.totalLeaveThisMonth} 
          color="indigo"
          index={3}
        />
      </motion.div>
      
      {/* Calendar controls with enhanced styling */}
      <motion.div 
        className="flex flex-wrap justify-between items-center mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors shadow-sm"
            onClick={goToPreviousMonth}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiChevronLeft size={24} />
          </motion.button>
          
          <div className="text-xl font-bold text-gray-800 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          
          <motion.button
            className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors shadow-sm"
            onClick={goToNextMonth}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiChevronRight size={24} />
          </motion.button>
          
          <motion.button 
            className="ml-2 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 flex items-center transition-colors shadow-sm"
            onClick={() => setCurrentMonth(new Date())}
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiCalendar className="mr-1" /> Today
          </motion.button>
          
          <motion.button 
            className="ml-2 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 flex items-center transition-colors shadow-sm"
            variants={overlayButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiRefreshCw className="mr-1" /> Refresh
          </motion.button>
        </div>
        
        <motion.button
          className="mt-2 sm:mt-0 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center justify-center transition-all shadow-sm"
          onClick={() => setShowLeaveForm(true)}
          variants={overlayButtonVariants}
          whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
          whileTap="tap"
        >
          <FiPlus className="mr-2" /> Request Leave
        </motion.button>
      </motion.div>
      
      {/* Tabs with enhanced styling */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6 bg-gray-50 rounded-t-lg overflow-x-auto">
        <TabButton 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')} 
          icon={<FiCalendar className="text-primary-500" />}
        >
          Calendar View
        </TabButton>
        <TabButton 
          active={activeTab === 'team'} 
          onClick={() => setActiveTab('team')} 
          icon={<FiUsers className="text-primary-500" />}
        >
          Team Overview
        </TabButton>
        <TabButton 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
          icon={<FiBarChart2 className="text-primary-500" />}
        >
          Analytics
        </TabButton>
        <TabButton 
          active={activeTab === 'requests'} 
          onClick={() => setActiveTab('requests')} 
          icon={<FiClock className="text-primary-500" />}
        >
          My Requests
        </TabButton>
      </div>
      
      {/* Enhanced Legend with animations */}
      {activeTab === 'calendar' && (
        <motion.div 
          className="flex flex-wrap items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-sm">
              <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full w-16 bg-green-500"></div>
              </div>
              <span className="text-gray-700 font-medium">High Availability</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full w-10 bg-yellow-500"></div>
              </div>
              <span className="text-gray-700 font-medium">Medium Availability</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full w-5 bg-red-500"></div>
              </div>
              <span className="text-gray-700 font-medium">Low Availability</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="inline-block w-3 h-3 mr-2 border-2 border-accent-500 rounded-full"></span>
              <span className="text-gray-700 font-medium">Your Leave</span>
            </div>
          </div>
          
          <div className="mt-2 sm:mt-0 text-sm text-gray-500 flex items-center">
            <FiInfo className="mr-1" /> 
            <span>Shift+Click on a day to see team members on leave</span>
          </div>
        </motion.div>
      )}
      
      {/* Tab Content with improved transitions */}
      <AnimatePresence mode="wait">
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            {/* Calendar Header with days of week */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
              <motion.div
                className="grid grid-cols-7 gap-2"
                variants={calendarVariants}
                initial="hidden"
                animate={controls}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center p-2 font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
              </motion.div>
            </div>
            
            {/* Calendar body with days */}
            <div className="p-4">
              {/* Calendar grid */}
              <AnimatePresence initial={false} custom={monthDirection}>
                <motion.div
                  key={format(currentMonth, 'yyyy-MM')}
                  custom={monthDirection}
                  variants={monthTransitionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
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
            </div>
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
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiUsers className="mr-2 text-primary-500" />
              Team Leave Overview
            </h2>
            
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
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-primary-500" />
              Team Availability Analytics
            </h2>
            
            <TeamAvailabilityAnalytics 
              teamAvailability={teamAvailability}
              users={users}
              leaveData={leaveData} 
              currentMonth={currentMonth} 
            />
          </motion.div>
        )}
        
        {/* My Requests View */}
        {activeTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiClock className="mr-2 text-primary-500" />
              My Leave Requests
            </h2>
            
            {currentUser ? (
              <div className="space-y-4">
                {leaveData.filter(leave => leave.users?.id === currentUser.id).length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {leaveData
                      .filter(leave => leave.users?.id === currentUser.id)
                      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      .map((leave, index) => (
                        <motion.div 
                          key={leave.id}
                          className="py-4 px-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <FiCalendar className="text-primary-500" />
                                <span className="font-medium text-gray-800">
                                  {format(parseISO(leave.start_date), 'MMM dd, yyyy')} 
                                  {' '} - {' '}
                                  {format(parseISO(leave.end_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 ml-6 mt-1">
                                {differenceInDays(parseISO(leave.end_date), parseISO(leave.start_date)) + 1} days of leave
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                leave.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : leave.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leave.status === 'approved' ? (
                                  <span className="flex items-center">
                                    <FiCheckCircle className="mr-1" /> Approved
                                  </span>
                                ) : leave.status === 'rejected' ? (
                                  <span className="flex items-center">
                                    <FiX className="mr-1" /> Rejected
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <FiClock className="mr-1" /> Pending
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {leave.reason && (
                            <div className="mt-2 ml-6 text-sm text-gray-600">
                              <span className="font-medium">Reason:</span> {leave.reason}
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-800 mb-1">No Leave Requests</h3>
                    <p className="text-gray-500">You haven't made any leave requests yet.</p>
                    <motion.button
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg inline-flex items-center"
                      onClick={() => setShowLeaveForm(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiPlus className="mr-2" /> Request Leave
                    </motion.button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">Not Logged In</h3>
                <p className="text-gray-500">Please log in to view your leave requests.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced selected date range indicator */}
      {selectedDates.start && activeTab === 'calendar' && (
        <motion.div 
          className="mb-6 p-5 bg-gradient-to-r from-primary-50 to-white rounded-xl shadow-sm border border-primary-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <FiCalendar className="text-primary-500 mr-2" />
                Leave Date Selection
              </h3>
              
              <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase mb-1">Start Date</div>
                  <div className="font-bold text-primary-700">
                    {format(selectedDates.start, 'MMM dd, yyyy')}
                  </div>
                </div>
                
                {selectedDates.end && (
                  <>
                    <div className="flex-grow h-0.5 bg-primary-100 relative">
                      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <FiArrowRight className="text-primary-400" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase mb-1">End Date</div>
                      <div className="font-bold text-primary-700">
                        {format(selectedDates.end, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="text-center ml-2 pl-3 border-l border-gray-200">
                      <div className="text-xs text-gray-500 uppercase mb-1">Duration</div>
                      <div className="font-bold text-accent-600">
                        {differenceInDays(selectedDates.end, selectedDates.start) + 1} days
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {!selectedDates.end && (
                <div className="mt-2 text-sm text-gray-500 flex items-center">
                  <FiInfo className="mr-1 text-primary-500" />
                  Click on another date to select the end date
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <motion.button
                className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                onClick={resetDateSelection}
                variants={overlayButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <FiX className="mr-1" /> Clear Selection
              </motion.button>
              
              {selectedDates.end && (
                <motion.button
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center shadow-sm"
                  onClick={() => setShowLeaveForm(true)}
                  variants={overlayButtonVariants}
                  whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
                  whileTap="tap"
                >
                  <FiPlus className="mr-1" /> Request for these dates
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced users on leave hover info */}
      <AnimatePresence>
        {hoverInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: hoverInfo.position.y + 10,
              left: hoverInfo.position.x + 10,
              zIndex: 100
            }}
            className="bg-white p-5 rounded-xl shadow-xl max-w-xs border border-gray-200"
          >
            <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <FiCalendar className="mr-2 text-primary-500" />
              {format(hoverInfo.date, 'MMMM d, yyyy')}
            </h4>
            
            {hoverInfo.usersOnLeave.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">Team members on leave:</p>
                  <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">
                    {hoverInfo.usersOnLeave.length}
                  </span>
                </div>
                <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {hoverInfo.usersOnLeave.map((user, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center text-sm p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3 text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </motion.li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
                <FiCheckCircle className="text-green-500 mr-2" />
                <p className="text-sm text-gray-600">No team members on leave this day.</p>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-center text-gray-500">
              Click anywhere to dismiss
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced success message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`fixed bottom-5 right-5 p-4 rounded-xl shadow-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
                : 'bg-gradient-to-r from-red-600 to-red-500 text-white'
            }`}
          >
            <div className={`p-2 rounded-full ${
              message.type === 'success' ? 'bg-green-400/20' : 'bg-red-400/20'
            } mr-3`}>
              {message.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiInfo className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium">{message.text}</p>
            </div>
            <button 
              className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => setMessage(null)}
            >
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced leave request form */}
      <AnimatePresence>
        {showLeaveForm && (
          <motion.div 
            className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLeaveForm(false)}
          >
            <motion.div
              className="bg-white rounded-xl overflow-hidden w-full max-w-lg shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <FiCalendar className="mr-3" />
                    Request Leave
                  </h2>
                  <motion.button
                    className="p-2 rounded-full hover:bg-primary-500 text-white/80 hover:text-white transition-colors"
                    onClick={() => setShowLeaveForm(false)}
                    variants={overlayButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <FiX size={24} />
                  </motion.button>
                </div>
                <p className="text-primary-100 mt-2">
                  Request time off from your calendar. Selected dates will be submitted for approval.
                </p>
              </div>
            
              <div className="p-0">
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
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced users on leave modal */}
      <UsersOnLeaveModal 
        isOpen={showUsersOnLeaveModal}
        onClose={() => setShowUsersOnLeaveModal(false)}
        date={usersOnLeaveData.date}
        users={usersOnLeaveData.users}
      />
      
      {/* Enhanced announcement modal */}
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
      
      {/* Enhanced announcement button */}
      {calendarAnnouncement && (
        <motion.button
          className={`fixed bottom-5 right-5 p-3.5 ${
            hasUnreadAnnouncements 
              ? 'bg-gradient-to-r from-primary-600 to-primary-700' 
              : 'bg-gray-600'
          } text-white rounded-full shadow-lg`}
          onClick={() => setShowAnnouncement(true)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
          whileTap={{ scale: 0.9 }}
        >
          <FiBell size={24} />
          {hasUnreadAnnouncements && (
            <motion.span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            />
          )}
        </motion.button>
      )}
      
      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c5c5c5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a5a5a5;
        }
      `}</style>
    </div>
  );
}
