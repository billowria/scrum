import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiEye, FiArrowRight, FiEdit3, FiTrash2, FiDownload } from 'react-icons/fi';

// Import components
import LeaveRequestForm from '../components/LeaveRequestForm';
import FloatingNav from '../components/FloatingNav';
import AnnouncementModal from '../components/AnnouncementModal';
import UserListModal from '../components/UserListModal';

// Professional color palette
const colors = {
  primary: {
    light: '#EBF4FF',
    medium: '#3F83F8',
    dark: '#1E429F',
  },
  accent: {
    light: '#FDF2F8',
    medium: '#F472B6',
    dark: '#9D174D',
  },
  success: {
    light: '#ECFDF5',
    medium: '#34D399',
    dark: '#065F46',
  },
  warning: {
    light: '#FFFBEB',
    medium: '#FBBF24',
    dark: '#92400E',
  },
  danger: {
    light: '#FEF2F2',
    medium: '#F87171',
    dark: '#991B1B',
  },
  neutral: {
    lightest: '#F9FAFB',
    lighter: '#F3F4F6',
    light: '#E5E7EB',
    medium: '#9CA3AF',
    dark: '#4B5563',
    darker: '#1F2937',
    darkest: '#111827',
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

// Compact Tab Header Component - Small and Responsive Design
const CompactTabHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  color = "blue",
  quickStats = [],
  quickActions = [],
  badge
}) => {
  const colorSchemes = {
    blue: {
      bg: "bg-gradient-to-r from-blue-600 to-indigo-600",
      text: "text-blue-50",
      border: "border-blue-500/20",
      accent: "bg-blue-500/20"
    },
    green: {
      bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
      text: "text-emerald-50",
      border: "border-emerald-500/20",
      accent: "bg-emerald-500/20"
    },
    purple: {
      bg: "bg-gradient-to-r from-purple-600 to-violet-600",
      text: "text-purple-50",
      border: "border-purple-500/20",
      accent: "bg-purple-500/20"
    },
    orange: {
      bg: "bg-gradient-to-r from-orange-600 to-red-600",
      text: "text-orange-50",
      border: "border-orange-500/20",
      accent: "bg-orange-500/20"
    }
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      className={`sticky top-16 z-30 ${scheme.bg} shadow-lg border-b ${scheme.border} backdrop-blur-sm`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left Section - Title and Icon */}
          <div className="flex items-center gap-3">
            <motion.div 
              className={`p-2 rounded-lg ${scheme.accent} backdrop-blur-sm`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={`w-5 h-5 ${scheme.text}`} />
            </motion.div>
            
            <div className="flex items-center gap-3">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${scheme.text} flex items-center gap-2 cursor-pointer hover:text-blue-300 transition-colors`} onClick={() => window.location.href = '/'}>
                  {title}
                  {badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                      {badge}
                    </span>
                  )}
                </h2>
                <p className={`text-sm ${scheme.text} opacity-90 hidden sm:block`}>
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Stats and Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            {quickStats.length > 0 && (
              <div className="hidden sm:flex items-center gap-3">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    onClick={stat.onClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${scheme.accent} ${stat.onClick ? 'cursor-pointer hover:bg-white/10' : ''} transition-colors`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={stat.onClick ? { scale: 1.02 } : {}}
                  >
                    <span className={`text-xs ${scheme.text} opacity-80`}>{stat.label}:</span>
                    <span className={`text-sm font-bold ${scheme.text}`}>{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="flex items-center gap-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    className={`p-2 rounded-lg ${scheme.accent} hover:bg-white/10 transition-colors ${scheme.text}`}
                    onClick={action.onClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={action.tooltip}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    {action.icon}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LeaveCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [leaveData, setLeaveData] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [showOnLeaveModal, setShowOnLeaveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [calendarAnnouncement, setCalendarAnnouncement] = useState(null);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthDirection, setMonthDirection] = useState(0);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [usersOnLeaveToday, setUsersOnLeaveToday] = useState([]);

  // Timesheet state
  const [timesheetsByDate, setTimesheetsByDate] = useState({}); // { 'yyyy-MM-dd': [entries] }
  const [timesheetTotalsByDate, setTimesheetTotalsByDate] = useState({}); // { 'yyyy-MM-dd': totalHours }
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [timesheetDate, setTimesheetDate] = useState(null);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [showTimesheetRangeModal, setShowTimesheetRangeModal] = useState(false);
  const [timesheetRange, setTimesheetRange] = useState({ start: null, end: null });
  // New state for monthly timesheet view
  const [showMonthlyTimesheetModal, setShowMonthlyTimesheetModal] = useState(false);
  
  // New state for holiday calendar view
  const [showHolidayCalendarModal, setShowHolidayCalendarModal] = useState(false);

  // Timesheet approvals count for indicator
  const [pendingTimesheetCount, setPendingTimesheetCount] = useState(0);

  // Animation controls
  const controls = useAnimation();
  
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchLeaveData();
      fetchAnnouncements();
      fetchTimesheets();
      fetchPendingTimesheetCount();
    }
    
    // Animate the calendar on initial load
    controls.start('visible');
  }, [currentUser]);
  
  useEffect(() => {
    if (currentUser) {
      fetchLeaveData();
      fetchTimesheets();
      fetchPendingTimesheetCount();
    }
  }, [currentMonth, currentUser]);

  const fetchPendingTimesheetCount = async () => {
    if (!currentUser) return;
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const { count, error } = await supabase
        .from('timesheet_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'pending')
        .gte('start_date', start)
        .lte('end_date', end);
      if (error) throw error;
      setPendingTimesheetCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending timesheet count:', error.message);
    }
  };
  
  // Calculate team availability whenever leave data changes
  useEffect(() => {
    if (leaveData.length > 0 && users.length > 0) {
      calculateTeamAvailability();
      calculateStats();
    }
  }, [leaveData, users]);
  
  const calculateStats = async () => {
    if (!currentUser) return;
    
    try {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      
      const { data: onLeaveTodayData, error: onLeaveError } = await supabase
        .from('leave_plans')
        .select(`
          users:user_id (id, name, avatar_url, role)
        `)
        .eq('status', 'approved')
        .lte('start_date', todayString)
        .gte('end_date', todayString);

      if (onLeaveError) throw onLeaveError;

      const usersOnLeave = onLeaveTodayData.map(leave => leave.users).filter(Boolean);
      const onLeaveIds = usersOnLeave.map(user => user.id);
      
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar_url, role');

      if (usersError) throw usersError;

      const availableUsers = allUsers.filter(user => !onLeaveIds.includes(user.id));

      setUsersOnLeaveToday(usersOnLeave);

      return {
        totalTeamMembers: allUsers.length,
        membersOnLeave: usersOnLeave.length,
        membersAvailable: availableUsers.length
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalTeamMembers: 0,
        membersOnLeave: 0,
        membersAvailable: 0
      };
    }
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
    if (!currentUser) return;
    
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
    if (!currentUser) return;
    
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

  // Fetch timesheets for the current month for the logged-in user
  const fetchTimesheets = async () => {
    if (!currentUser) return;
    try {
      setTimesheetLoading(true);
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('timesheets')
        .select(`id, date, hours, notes, project_id, projects:project_id (id, name)`) 
        .gte('date', start)
        .lte('date', end)
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const byDate = {};
      const totals = {};
      (data || []).forEach((entry) => {
        const key = entry.date;
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(entry);
        totals[key] = (totals[key] || 0) + Number(entry.hours || 0);
      });
      setTimesheetsByDate(byDate);
      setTimesheetTotalsByDate(totals);
    } catch (error) {
      console.error('Error fetching timesheets:', error.message);
    } finally {
      setTimesheetLoading(false);
    }
  };
  
  // Fetch announcements from the database
  const fetchAnnouncements = async () => {
    if (!currentUser) return;
    
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
      return end ? 'ring-4 ring-blue-500' : 'ring-4 ring-purple-500';
    }
    
    if (end && day >= start && day <= end) {
      return 'ring-4 ring-blue-300';
    }
    
    return '';
  };
  
  // Calendar days for current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Handle user icon click
  const handleUsersIconClick = async (day, usersOnLeave, event) => {
    event.stopPropagation();
    setSelectedDate(day);
    setSelectedUsers(usersOnLeave);
    setShowOnLeaveModal(true);
  };

  const openTimesheetForDay = (day, event) => {
    if (event) event.stopPropagation();
    setTimesheetDate(day);
    setShowTimesheetModal(true);
  };

  // Function to render the calendar day
  const renderCalendarDay = (day) => {
    const isWeekendDay = isWeekend(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSameMonthDay = isSameMonth(day, currentMonth);
    const availability = teamAvailability[dateStr];
    const isToday = isSameDay(new Date(), day);
    const totalHours = timesheetTotalsByDate[dateStr] || 0;
    
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
        whileHover={{ y: -5, boxShadow: "0 12px 24px -4px rgba(0,0,0,0.15)" }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative cursor-pointer rounded-2xl p-4 min-h-[120px] 
          flex flex-col justify-between
          ${isSameMonthDay ? 'opacity-100' : 'opacity-60'}
          ${isToday ? 'ring-4 ring-blue-500 ring-offset-2 transform' : ''}
          ${isWeekendDay ? 'bg-gradient-to-b from-gray-50 to-gray-100' : availability ? getDayColor(day) : 'bg-gradient-to-b from-white to-gray-50'}
          ${userHasLeave ? 'border-4 border-accent-500' : 'border border-gray-200'}
          ${getSelectedDateBorder(day)}
          ${selectedDates.start && isSameDay(selectedDates.start, day) ? 'bg-gradient-to-br from-blue-200 to-blue-300 shadow-lg' : ''}
          ${selectedDates.end && isSameDay(selectedDates.end, day) ? 'bg-gradient-to-br from-blue-200 to-blue-300 shadow-lg' : ''}
          ${selectedDates.start && selectedDates.end && day > selectedDates.start && day < selectedDates.end ? 'bg-gradient-to-br from-blue-100 to-blue-200' : ''}
          shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
        `}
        onClick={(e) => handleDayClick(day, e)}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-center">
            <span className={`text-xs uppercase font-semibold ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
              {format(day, 'EEE')}
            </span>
            <span className={`
              ${isToday 
                ? 'bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full mt-1 shadow-md' 
                : isWeekendDay ? 'text-gray-600' : 'text-gray-800'
              } text-base font-bold`}
            >
              {format(day, 'd')}
            </span>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {hasLeave && (
              <motion.span 
                className="text-[0.65rem] px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full inline-flex items-center cursor-pointer hover:from-blue-200 hover:to-blue-300 shadow-sm"
                onClick={(e) => handleUsersIconClick(day, usersOnLeave, e)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiUsers size={9} className="mr-1" /> 
                {usersOnLeave.length}
              </motion.span>
            )}
            
            {hasPendingRequests && (
              <span className="text-[0.65rem] px-2 py-1 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-full inline-flex items-center shadow-sm">
                <FiClock size={9} className="mr-1" />
                Pending
              </span>
            )}

            {/* Timesheet total hours badge */}
            <motion.span
              className={`mt-1 text-[0.65rem] px-2 py-1 ${totalHours > 0 ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 hover:from-emerald-200 hover:to-emerald-300 cursor-pointer shadow-sm' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 cursor-pointer shadow-sm'} rounded-full inline-flex items-center`}
              onClick={(e) => openTimesheetForDay(day, e)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={totalHours > 0 ? `${totalHours}h logged` : 'Log time'}
            >
              <FiClock size={9} className="mr-1" />
              {totalHours > 0 ? `${totalHours}h` : 'Log'}
            </motion.span>
          </div>
        </div>
        
        {/* Availability indicator */}
        {availability && (
          <div className="flex flex-col gap-1 mt-auto">
            <div 
              className={`h-2 w-full rounded-full overflow-hidden bg-gray-200 shadow-inner`}
              style={{ opacity: isSameMonthDay ? 1 : 0.3 }}
            >
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  availability.status === 'high' ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                  availability.status === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                  'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${availability.availablePercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-[0.65rem]">
              <span className="font-medium text-gray-600">Avail:</span>
              <span className={`font-bold ${
                availability.status === 'high' ? 'text-green-700' : 
                availability.status === 'medium' ? 'text-amber-700' : 
                'text-red-700'
              }`}>
                {availability.availablePercentage}%
              </span>
            </div>
          </div>
        )}
        
        {/* Status markers */}
        {userHasLeave && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full border-2 border-white shadow-lg"></div>
        )}
        
        {/* Selected day indicator */}
        {selectedDates.start && isSameDay(selectedDates.start, day) && (
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full border-2 border-white shadow-lg"></div>
        )}
        
        {selectedDates.end && isSameDay(selectedDates.end, day) && (
          <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full border-2 border-white shadow-lg"></div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header */}
      <CompactTabHeader
        title="Leave Calendar"
        subtitle="View and request leave with interactive calendar"
        icon={FiCalendar}
        color="blue"
        badge="Active"
        quickStats={[
          { 
            label: "Month", 
            value: format(currentMonth, 'MMM yyyy'),
            onClick: () => setShowHolidayCalendarModal(true)
          },
          { 
            label: "Hours Logged", 
            value: Object.values(timesheetTotalsByDate).reduce((a, b) => a + b, 0), 
            onClick: () => setShowMonthlyTimesheetModal(true)
          }
        ]}
        quickActions={[
          {
            icon: <FiPlus className="w-4 h-4" />,
            onClick: () => setShowLeaveForm(true),
            tooltip: "Request Leave"
          },
          {
            icon: <FiClock className="w-4 h-4" />,
            onClick: () => setShowMonthlyTimesheetModal(true),
            tooltip: "View Monthly Hours"
          },
          {
            icon: <FiRefreshCw className="w-4 h-4" />,
            onClick: () => window.location.reload(),
            tooltip: "Refresh"
          }
        ]}
      />
      
      {/* Calendar Content */}
      <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Calendar Header with Controls */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
              <div className="flex items-center space-x-4">
                <motion.button
                  className="p-2.5 rounded-full bg-white text-primary-600 hover:bg-primary-50 transition-all shadow-sm border border-gray-200 hover:border-primary-300"
                  onClick={goToPreviousMonth}
                  variants={overlayButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FiChevronLeft size={20} />
                </motion.button>
                
                <div 
                  className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent cursor-pointer hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 p-2 rounded-lg hover:bg-opacity-20"
                  onClick={() => setShowHolidayCalendarModal(true)}
                >
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                
                <motion.button
                  className="p-2.5 rounded-full bg-white text-primary-600 hover:bg-primary-50 transition-all shadow-sm border border-gray-200 hover:border-primary-300"
                  onClick={goToNextMonth}
                  variants={overlayButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FiChevronRight size={20} />
                </motion.button>
                
                <motion.button 
                  className="ml-2 px-4 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 flex items-center transition-all shadow-sm border border-primary-200"
                  onClick={() => setCurrentMonth(new Date())}
                  variants={overlayButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FiCalendar className="mr-1.5" /> Today
                </motion.button>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center justify-center transition-all shadow-sm"
                  onClick={() => setShowLeaveForm(true)}
                  variants={overlayButtonVariants}
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
                  whileTap="tap"
                >
                  <FiPlus className="mr-2" /> Request Leave
                </motion.button>
                <motion.button
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center transition-all shadow-sm"
                  onClick={() => {
                    setTimesheetDate(new Date());
                    setShowTimesheetRangeModal(true);
                  }}
                  variants={overlayButtonVariants}
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" }}
                  whileTap="tap"
                >
                  <FiPlus className="mr-2" /> Log Timesheet Range
                </motion.button>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center text-sm">
                <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden shadow-sm">
                  <div className="h-full w-16 bg-green-500"></div>
                </div>
                <span className="text-gray-700 font-medium">High Availability</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden shadow-sm">
                  <div className="h-full w-10 bg-yellow-500"></div>
                </div>
                <span className="text-gray-700 font-medium">Medium Availability</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="flex h-3 w-20 mr-2 rounded-full bg-gray-200 overflow-hidden shadow-sm">
                  <div className="h-full w-5 bg-red-500"></div>
                </div>
                <span className="text-gray-700 font-medium">Low Availability</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="inline-block w-3 h-3 mr-2 border-2 border-accent-500 rounded-full bg-accent-50"></span>
                <span className="text-gray-700 font-medium">Your Leave</span>
              </div>
            </div>
          </div>
          
          {/* Calendar Header with days of week */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center p-2 font-semibold text-gray-500">
                  {day}
                </div>
              ))}
            </div>
          </div>
          
          {/* Calendar body with days */}
          <div className="p-4">
            <AnimatePresence initial={false} custom={monthDirection}>
              <motion.div
                key={format(currentMonth, 'yyyy-MM')}
                custom={monthDirection}
                variants={monthTransitionVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map(day => renderCalendarDay(day))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      
      {/* Selected date range indicator */}
      {selectedDates.start && (
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
      
      {/* Users on leave hover info */}
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
      
      {/* Success message */}
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
      
      {/* Leave request form */}
      {showLeaveForm && (
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
      )}

      {/* Timesheet range modal */}
      <TimesheetRangeModal
        isOpen={showTimesheetRangeModal}
        onClose={() => setShowTimesheetRangeModal(false)}
        defaultStart={selectedDates.start || new Date()}
        defaultEnd={selectedDates.end || new Date()}
        currentUser={currentUser}
        onSubmitted={async () => {
          setShowTimesheetRangeModal(false);
          await fetchTimesheets();
          setMessage({ type: 'success', text: 'Timesheet submitted for approval' });
          setTimeout(() => setMessage(null), 2500);
        }}
      />
      
      {/* Timesheet Modal */}
      <TimesheetModal 
        isOpen={showTimesheetModal}
        onClose={() => setShowTimesheetModal(false)}
        date={timesheetDate}
        currentUser={currentUser}
        entries={(timesheetDate ? timesheetsByDate[format(timesheetDate, 'yyyy-MM-dd')] : []) || []}
        onChanged={async () => {
          await fetchTimesheets();
          setMessage({ type: 'success', text: 'Timesheet updated' });
          setTimeout(() => setMessage(null), 2500);
        }}
      />

      {/* Monthly Timesheet Modal */}
      <MonthlyTimesheetModal
        isOpen={showMonthlyTimesheetModal}
        onClose={() => setShowMonthlyTimesheetModal(false)}
        currentUser={currentUser}
        timesheetsByDate={timesheetsByDate}
        timesheetTotalsByDate={timesheetTotalsByDate}
        currentMonth={currentMonth}
      />

      {/* Holiday Calendar Modal */}
      <HolidayCalendarModal
        isOpen={showHolidayCalendarModal}
        onClose={() => setShowHolidayCalendarModal(false)}
        currentMonth={currentMonth}
      />

      {/* Users on leave modal */}
      <UserListModal
        isOpen={showOnLeaveModal}
        onClose={() => setShowOnLeaveModal(false)}
        title="Team Members on Leave"
        subtitle={selectedDate ? format(selectedDate, 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}
        users={selectedUsers}
        type="onLeave"
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
      
     
      {/* Custom scrollbar styles */}
      <style>{`
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

// Timesheet Modal Component
const TimesheetModal = ({ isOpen, onClose, date, currentUser, entries, onChanged }) => {
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    }
  };

  const resetForm = () => {
    setHours('');
    setNotes('');
    setProjectId('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!currentUser || !date) return;
    const hoursValue = Number(hours);
    if (Number.isNaN(hoursValue) || hoursValue <= 0) return;

    try {
      setSubmitting(true);
      const payload = {
        user_id: currentUser.id,
        date: format(date, 'yyyy-MM-dd'),
        hours: hoursValue,
        notes: notes || null,
        project_id: projectId || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('timesheets')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('timesheets')
          .insert([payload]);
        if (error) throw error;
      }

      resetForm();
      await onChanged?.();
    } catch (error) {
      console.error('Error saving timesheet:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setHours(String(entry.hours || ''));
    setNotes(entry.notes || '');
    setProjectId(entry.project_id || '');
  };

  const handleDelete = async (id) => {
    try {
      setSubmitting(true);
      const { error } = await supabase.from('timesheets').delete().eq('id', id);
      if (error) throw error;
      if (editingId === id) resetForm();
      await onChanged?.();
    } catch (error) {
      console.error('Error deleting timesheet:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-700">
                <FiClock />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{date ? format(date, 'MMM dd, yyyy') : 'Timesheet'}</h3>
                <p className="text-sm text-gray-500">Log and review your time entries</p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Project</label>
                <select
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="e.g. 1.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
                >
                  {editingId ? 'Update Entry' : 'Add Entry'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Entries list */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">Entries</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{entries.length} item(s)</span>
              </div>
              {entries.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">No entries yet. Log your first one!</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                          <FiClock className="text-emerald-600" /> {Number(entry.hours)}h
                          {entry.projects?.name && (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{entry.projects.name}</span>
                          )}
                        </div>
                        {entry.notes && <div className="text-sm text-gray-600 mt-1">{entry.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          onClick={() => handleEdit(entry)}
                          title="Edit"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          onClick={() => handleDelete(entry.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Timesheet Range Modal: submit multiple days and create a submission for approval
const TimesheetRangeModal = ({ isOpen, onClose, defaultStart, defaultEnd, currentUser, onSubmitted }) => {
  const [startDate, setStartDate] = useState(defaultStart || null);
  const [endDate, setEndDate] = useState(defaultEnd || null);
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await supabase.from('projects').select('id, name').order('name');
        setProjects(data || []);
      } catch {}
    })();
  }, [isOpen]);

  useEffect(() => {
    setStartDate(defaultStart || new Date());
    setEndDate(defaultEnd || new Date());
  }, [defaultStart, defaultEnd, isOpen]);

  if (!isOpen) return null;

  const createRangeEntries = async () => {
    if (!currentUser || !startDate || !endDate) return;
    const start = startDate <= endDate ? startDate : endDate;
    const end = endDate >= startDate ? endDate : startDate;
    const days = eachDayOfInterval({ start, end });
    const hoursValue = Number(hoursPerDay);
    if (Number.isNaN(hoursValue) || hoursValue <= 0) return;

    try {
      setSubmitting(true);
      // Create a submission record
      const submissionPayload = {
        user_id: currentUser.id,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        status: 'pending',
        notes: notes || null,
      };
      const { data: subRows, error: subErr } = await supabase
        .from('timesheet_submissions')
        .insert([submissionPayload])
        .select('id')
        .single();
      if (subErr) throw subErr;

      const submissionId = subRows.id;
      const rows = days.map((d) => ({
        user_id: currentUser.id,
        date: format(d, 'yyyy-MM-dd'),
        hours: hoursValue,
        notes: notes || null,
        project_id: projectId || null,
        submission_id: submissionId,
      }));

      const { error } = await supabase.from('timesheets').insert(rows);
      if (error) throw error;

      await onSubmitted?.();
    } catch (error) {
      console.error('Error submitting timesheet range:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <FiClock />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Submit Timesheet Range</h3>
                <p className="text-sm text-gray-500">Create entries for a date range and send for approval</p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={startDate ? format(startDate, 'yyyy-MM-dd') : ''} onChange={(e) => setStartDate(e.target.value ? parseISO(e.target.value) : null)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={endDate ? format(endDate, 'yyyy-MM-dd') : ''} onChange={(e) => setEndDate(e.target.value ? parseISO(e.target.value) : null)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hours per day</label>
                  <input type="number" min="0" step="0.25" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Project</label>
                  <select className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notes</label>
                  <textarea rows={3} className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the submission" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button disabled={submitting} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700" onClick={createRangeEntries}>
                  Submit for Approval
                </button>
                <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50" onClick={onClose}>Cancel</button>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2">Preview</h4>
              {startDate && endDate ? (
                <div className="text-sm text-gray-600">
                  {format(startDate, 'MMM dd, yyyy')} → {format(endDate, 'MMM dd, yyyy')} ({differenceInDays((endDate >= startDate ? endDate : startDate), (startDate <= endDate ? startDate : endDate)) + 1} days)
                  <div className="mt-2 p-2 rounded bg-gray-50 border border-gray-100">{hoursPerDay}h/day, {projectId ? 'Assigned to selected project' : 'Unassigned'}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a start and end date to preview.</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


// Monthly Timesheet Modal Component
const MonthlyTimesheetModal = ({ isOpen, onClose, currentUser, timesheetsByDate, timesheetTotalsByDate, currentMonth }) => {
  // Calculate monthly totals
  const monthlyTotal = Object.values(timesheetTotalsByDate).reduce((sum, hours) => sum + hours, 0);
  
  // Get all dates with entries
  const datesWithEntries = Object.keys(timesheetsByDate)
    .filter(date => timesheetsByDate[date].length > 0)
    .sort(); // Sort dates chronologically

  // If not open, return null
  if (!isOpen) return null;

  // Get status for a timesheet entry
  const getStatusInfo = (entry) => {
    // The submission status would typically come from the timesheet_submissions table
    // For now, we'll return status based on common possible states
    // In a real implementation, you would pass submission statuses from the parent component
    if (!entry.submission_id) {
      return { status: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' };
    } else if (entry.status === 'approved') {
      return { status: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800', icon: '✓' };
    } else if (entry.status === 'rejected') {
      return { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '✗' };
    } else {
      // Default to pending if submission exists but status is not set to approved/rejected
      return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
    }
  };

  // Function to export data as Excel
  const exportToExcel = () => {
    // Create a CSV string
    let csvContent = "Date,Day,Total Hours,Status,Project,Hours,Notes\n";
    
    datesWithEntries.forEach(dateStr => {
      const date = parseISO(dateStr);
      const entries = timesheetsByDate[dateStr] || [];
      const totalHours = timesheetTotalsByDate[dateStr] || 0;
      const statusInfo = getStatusInfo(entries[0] || {});
      
      if (entries.length > 0) {
        // Add a row for each entry on this date
        entries.forEach((entry, idx) => {
          const project = entry.projects?.name || '';
          const notes = entry.notes || '';
          const row = [
            format(date, 'yyyy-MM-dd'),
            format(date, 'EEE'),
            totalHours.toFixed(2),
            statusInfo.label,
            project,
            entry.hours,
            `"${notes.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
          ].join(',');
          
          csvContent += row + '\n';
        });
      } else {
        // If no entries, still add a row for the date
        const row = [
          format(date, 'yyyy-MM-dd'),
          format(date, 'EEE'),
          totalHours.toFixed(2),
          'No entries',
          '',
          '',
          ''
        ].join(',');
        
        csvContent += row + '\n';
      }
    });
    
    // Create a Blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${format(currentMonth, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <FiClock />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Your Monthly Timesheet</h3>
                <p className="text-sm text-gray-500">Hours logged by {currentUser?.name || 'you'} for {format(currentMonth, 'MMMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                onClick={exportToExcel}
                aria-label="Export to Excel"
              >
                <FiDownload />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-gray-100" 
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Monthly Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Monthly Summary</h4>
                  <p className="text-sm text-gray-600">Total hours logged by you</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-700">{monthlyTotal.toFixed(2)}h</div>
                  <div className="text-sm text-gray-600">{datesWithEntries.length} days with entries</div>
                </div>
              </div>
            </div>

            {/* Timesheet Entries by Date */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
                {datesWithEntries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FiClock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No timesheet entries for this month</p>
                    <p className="text-sm mt-1">Start by logging your hours for each day</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datesWithEntries.map((dateStr, index) => {
                        const date = parseISO(dateStr);
                        const entries = timesheetsByDate[dateStr] || [];
                        const totalHours = timesheetTotalsByDate[dateStr] || 0;
                        
                        return (
                          <motion.tr 
                            key={dateStr}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {format(date, 'MMM dd')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {format(date, 'EEE')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-700">
                              {totalHours.toFixed(2)}h
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(entries[0] || {}).color}`}>
                                {getStatusInfo(entries[0] || {}).icon} {getStatusInfo(entries[0] || {}).label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="space-y-1">
                                {entries.map((entry) => (
                                  <div key={entry.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg">
                                    <div>
                                      <div className="font-medium">{entry.hours}h</div>
                                      {entry.projects?.name && (
                                        <div className="text-xs text-gray-500">{entry.projects.name}</div>
                                      )}
                                      {entry.notes && (
                                        <div className="text-xs text-gray-600 italic">{entry.notes}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};



// Holiday Calendar Modal Component
const HolidayCalendarModal = ({ isOpen, onClose, currentMonth }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // In a real application, this would fetch from an API
  const fetchHolidaysForMonth = async (month) => {
    setLoading(true);
    try {
      // Simulate API call or fetch from a holiday API in a real implementation
      // For demo purposes, I'll create realistic holidays based on the actual month
      const year = new Date(currentMonth).getFullYear();
      const monthNum = new Date(currentMonth).getMonth();
      
      // Create some realistic holidays for the given month
      const monthHolidays = [];
      
      // Add some common recurring holidays based on the month
      if (monthNum === 0) { // January
        monthHolidays.push({ date: format(new Date(year, 0, 1), 'yyyy-MM-dd'), name: 'New Year\'s Day', type: 'Public' });
        if (year === new Date().getFullYear()) {
          monthHolidays.push({ date: format(new Date(year, 0, 15), 'yyyy-MM-dd'), name: 'Martin Luther King Jr. Day', type: 'Federal' });
        }
      } else if (monthNum === 1) { // February
        monthHolidays.push({ date: format(new Date(year, 1, 14), 'yyyy-MM-dd'), name: 'Valentine\'s Day', type: 'Observance' });
        if (year === new Date().getFullYear()) {
          monthHolidays.push({ date: format(new Date(year, 1, 20), 'yyyy-MM-dd'), name: 'Presidents\' Day', type: 'Federal' });
        }
      } else if (monthNum === 6) { // July
        monthHolidays.push({ date: format(new Date(year, 6, 4), 'yyyy-MM-dd'), name: 'Independence Day', type: 'Public' });
      } else if (monthNum === 11) { // December
        monthHolidays.push({ date: format(new Date(year, 11, 25), 'yyyy-MM-dd'), name: 'Christmas Day', type: 'Public' });
      }
      
      // Add a few more random holidays for demonstration
      if (new Date().getMonth() === monthNum) {
        // Add weekend holidays for demonstration
        const daysInMonth = eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth)
        });
        
        daysInMonth.forEach(day => {
          if (isWeekend(day) && Math.random() > 0.7) { // Random weekends as sample holidays
            monthHolidays.push({
              date: format(day, 'yyyy-MM-dd'),
              name: 'Weekend Holiday',
              type: 'Observance'
            });
          }
        });
      }
      
      // Sort holidays by date
      monthHolidays.sort((a, b) => parseISO(a.date) - parseISO(b.date));
      
      setHolidays(monthHolidays);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      // Set some default holidays in case of error
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHolidaysForMonth(currentMonth);
    }
  }, [isOpen, currentMonth]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header with Professional Gradient */}
          <div className="p-5 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Holiday Calendar</h3>
                  <p className="text-indigo-100 text-sm">Holidays for {format(currentMonth, 'MMMM yyyy')}</p>
                </div>
              </div>
              <button 
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* Enhanced Holiday Summary Card */}
            <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Holidays Summary</h4>
                  <p className="text-gray-600">Public and special holidays for the month</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-700">{holidays.length}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="h-10 w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-700">
                      {holidays.filter(h => h.type === 'Public' || h.type === 'Federal').length}
                    </div>
                    <div className="text-sm text-gray-500">Public</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Holiday List */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-10 border-t-2 border-indigo-600 border-solid rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Loading Holidays</h3>
                  <p className="text-gray-500">Retrieving holiday information for {format(currentMonth, 'MMMM yyyy')}</p>
                </div>
              ) : holidays.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FiCalendar className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No Holidays This Month</h3>
                  <p className="text-gray-500">There are no holidays scheduled for {format(currentMonth, 'MMMM yyyy')}</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[50vh] custom-scrollbar pr-2">
                  <div className="divide-y divide-gray-100">
                    {holidays.map((holiday, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-5 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-start gap-4">
                          {/* Date Circle */}
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white text-sm font-bold">
                              <div>{format(parseISO(holiday.date), 'dd')}</div>
                              <div className="text-xs opacity-80">{format(parseISO(holiday.date), 'MMM')}</div>
                            </div>
                          </div>
                          
                          {/* Holiday Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg">{holiday.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <FiCalendar className="w-4 h-4" />
                                    {format(parseISO(holiday.date), 'EEEE, MMMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize ${
                                holiday.type === 'Public' || holiday.type === 'Federal' 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : holiday.type === 'Observance'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {holiday.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
