import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiBarChart2, FiArrowRight, FiFilter, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiUserCheck, FiEye, FiTrendingUp, FiTarget, FiZap, FiStar, FiGrid, FiList } from 'react-icons/fi';

// Import components
import LeaveCalendarView from '../components/LeaveCalendarView';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveSummary from '../components/LeaveSummary';
import FloatingNav from '../components/FloatingNav';
import AnnouncementModal from '../components/AnnouncementModal';
import TeamAvailabilityAnalytics from '../components/TeamAvailabilityAnalytics';
import TeamLeaveOverview from '../components/TeamLeaveOverview';
import UserListModal from '../components/UserListModal';

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

// Compact Tab Header Component - Completely different design
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
      gradient: "from-blue-500 via-indigo-600 to-purple-600",
      glow: "shadow-blue-500/25",
      accent: "from-cyan-400 to-blue-500",
      iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
      text: "text-blue-50",
      border: "border-blue-400/30",
      pulse: "bg-blue-400"
    },
    green: {
      gradient: "from-emerald-500 via-teal-600 to-cyan-600",
      glow: "shadow-emerald-500/25",
      accent: "from-green-400 to-emerald-500",
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
      text: "text-emerald-50",
      border: "border-emerald-400/30",
      pulse: "bg-emerald-400"
    },
    purple: {
      gradient: "from-purple-500 via-violet-600 to-indigo-600",
      glow: "shadow-purple-500/25",
      accent: "from-violet-400 to-purple-500",
      iconBg: "bg-gradient-to-br from-purple-400 to-violet-500",
      text: "text-purple-50",
      border: "border-purple-400/30",
      pulse: "bg-purple-400"
    },
    orange: {
      gradient: "from-orange-500 via-red-500 to-pink-600",
      glow: "shadow-orange-500/25",
      accent: "from-orange-400 to-red-500",
      iconBg: "bg-gradient-to-br from-orange-400 to-red-500",
      text: "text-orange-50",
      border: "border-orange-400/30",
      pulse: "bg-orange-400"
    }
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl mb-8 shadow-2xl ${scheme.glow}`}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        
        {/* Animated particles */}
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-6 left-6 w-1 h-1 bg-white/40 rounded-full"
          animate={{ 
            scale: [1, 2, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white/50 rounded-full"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.9, 0.5]
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="relative p-6">
        {/* Main Content */}
        <div className="flex items-start justify-between">
          {/* Left Section - Icon and Title */}
          <div className="flex items-start space-x-4 flex-1">
            <motion.div 
              className={`relative p-4 ${scheme.iconBg} rounded-2xl shadow-lg backdrop-blur-sm border ${scheme.border}`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className={`w-6 h-6 ${scheme.text}`} />
              
              {/* Glow effect */}
              <div className={`absolute inset-0 ${scheme.iconBg} rounded-2xl blur-xl opacity-50`} />
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <motion.h2 
                  className="text-2xl font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h2>
                {badge && (
                  <motion.span 
                    className={`px-3 py-1 text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 rounded-full ${scheme.text}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {badge}
                  </motion.span>
                )}
              </div>
              
              <motion.p 
                className="text-white/90 text-lg font-medium mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>
              
              {/* Quick Stats with enhanced design */}
              {quickStats.length > 0 && (
                <div className="flex items-center gap-6">
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      onClick={stat.onClick}
                      className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 ${stat.onClick ? 'cursor-pointer' : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={stat.onClick ? { scale: 1.05, y: -2 } : {}}
                      whileTap={stat.onClick ? { scale: 0.98 } : {}}
                    >
                      <span className="text-white/70 text-sm font-medium">{stat.label}:</span>
                      <span className="text-white font-bold text-lg">{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Quick Actions */}
          {quickActions.length > 0 && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  className={`relative p-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/25 transition-all duration-300 group ${scheme.text}`}
                  onClick={action.onClick}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  title={action.tooltip}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="relative z-10">
                    {action.icon}
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Pulse animation on hover */}
                  <motion.div
                    className={`absolute inset-0 ${scheme.pulse} rounded-xl opacity-20`}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bottom Section - Enhanced Features */}
        <motion.div 
          className="mt-6 pt-4 border-t border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/80">
                <FiEye className="w-4 h-4" />
                <span className="text-sm font-medium">Interactive Dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiZap className="w-4 h-4" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiStar className="w-4 h-4" />
                <span className="text-sm font-medium">Smart Insights</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-3 h-3 ${scheme.pulse} rounded-full`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white/80 text-sm font-medium">Live</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
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
      active 
        ? 'bg-white text-primary-700 shadow-sm' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
    onClick={onClick}
    variants={tabVariants}
    animate={active ? 'active' : 'inactive'}
    initial={false}
  >
    <span className="mr-2">{icon}</span>
    {children}
    {active && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
        layoutId="underline"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </motion.button>
);

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
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [calendarAnnouncement, setCalendarAnnouncement] = useState(null);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaveReason, setLeaveReason] = useState('');
  const [monthDirection, setMonthDirection] = useState(0);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [activeTab, setActiveTab] = useState('calendar');
  const [usersOnLeaveToday, setUsersOnLeaveToday] = useState([]);

  // Refs for scroll functionality
  const calendarRef = useRef(null);
  const teamRef = useRef(null);
  const analyticsRef = useRef(null);
  const requestsRef = useRef(null);

  const tabs = [
    { id: 'calendar', label: 'Calendar View', icon: <FiCalendar /> },
    { id: 'team', label: 'Team Overview', icon: <FiUsers /> },
    { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { id: 'requests', label: 'My Requests', icon: <FiClock /> },
  ]; // 'calendar', 'analytics', or 'team'
  
  // New stats for enhanced dashboard
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    membersOnLeave: 0,
    membersAvailable: 0
  });
  
  // Animation controls
  const controls = useAnimation();
  
  // Scroll to tab function
  const scrollToTab = (tabId) => {
    const refs = {
      'calendar': calendarRef,
      'team': teamRef,
      'analytics': analyticsRef,
      'requests': requestsRef
    };

    const ref = refs[tabId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };
  
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
    const doCalculations = async () => {
      if (leaveData.length > 0 && users.length > 0) {
        calculateTeamAvailability();
        const newStats = await calculateStats();
        if (newStats) {
          setStats(newStats);
        }
      }
    };
    doCalculations();
  }, [leaveData, users]);
  
  // Update the calculateStats function to set available and on-leave users
  const calculateStats = async () => {
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

      setAvailableUsers(availableUsers);
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
  const handleUsersIconClick = async (day, usersOnLeave, event) => {
    event.stopPropagation();
    setSelectedDate(day);
    setSelectedUsers(usersOnLeave);
    setShowOnLeaveModal(true);
  };

  const handleAvailableUsersClick = () => {
    setShowAvailableModal(true);
  };

  const handleOnLeaveUsersClick = () => {
    setSelectedUsers(usersOnLeaveToday);
    setShowOnLeaveModal(true);
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
    <div className="relative min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      {/* Tabs with enhanced styling */}
      {/* New Floating Nav with Gluey Animation */}
      <FloatingNav 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onTabClick={scrollToTab}
      />
      
      {/* Tab Content with improved transitions */}
      <AnimatePresence mode="wait">
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div ref={calendarRef}>
            <CompactTabHeader
              title="Calendar View"
              subtitle="Interactive monthly calendar with team availability and leave tracking"
              icon={FiCalendar}
              color="blue"
              badge="Active"
              quickStats={[
                { label: "Available", value: `${stats.membersAvailable} members`, onClick: handleAvailableUsersClick },
                { label: "On Leave", value: `${stats.membersOnLeave} today`, onClick: handleOnLeaveUsersClick },
                { label: "Month", value: format(currentMonth, 'MMM yyyy') }
              ]}
              quickActions={[
                {
                  icon: <FiPlus className="w-4 h-4" />,
                  onClick: () => setShowLeaveForm(true),
                  tooltip: "Request Leave"
                },
                {
                  icon: <FiRefreshCw className="w-4 h-4" />,
                  onClick: () => window.location.reload(),
                  tooltip: "Refresh"
                }
              ]}
            />
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 relative"
            >
              {/* Integrated Calendar Header with Controls and Legend */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                {/* Month Navigation and Controls */}
                <div className="flex flex-wrap items-center justify-between mb-4">
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
                    
                    <div className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
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
                  
                  <motion.button
                    className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center justify-center transition-all shadow-sm"
                    onClick={() => setShowLeaveForm(true)}
                    variants={overlayButtonVariants}
                    whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
                    whileTap="tap"
                  >
                    <FiPlus className="mr-2" /> Request Leave
                  </motion.button>
                </div>
                
                {/* Integrated Legend and Help */}
                <div className="flex flex-wrap items-center justify-between">
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
                  
                  <div className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <FiInfo className="mr-1.5" /> 
                    <span>Shift+Click to see team members on leave</span>
                  </div>
                </div>
              </div>
              
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
          </div>
        )}
        
        {/* Team View */}
        {activeTab === 'team' && (
          <div ref={teamRef}>
            <CompactTabHeader
              title="Team Overview"
              subtitle="Comprehensive team leave status and availability insights"
              icon={FiUsers}
              color="green"
              badge="Live"
              quickStats={[
                { label: "Total", value: `${users.length} members` },
                { label: "Available", value: `${stats.membersAvailable} today` },
                { label: "On Leave", value: `${stats.membersOnLeave} today` }
              ]}
              quickActions={[
                {
                  icon: <FiEye className="w-4 h-4" />,
                  onClick: () => handleAvailableUsersClick(availableUsers),
                  tooltip: "View Available"
                },
                {
                  icon: <FiUsers className="w-4 h-4" />,
                  onClick: () => stats.membersOnLeave > 0 && setShowOnLeaveModal(true),
                  tooltip: "View On Leave"
                }
              ]}
            />
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
          </div>
        )}
        
        {/* Analytics View */}
        {activeTab === 'analytics' && (
          <div ref={analyticsRef}>
            <CompactTabHeader
              title="Analytics Dashboard"
              subtitle="Data-driven insights into team availability patterns and trends"
              icon={FiBarChart2}
              color="purple"
              badge="Insights"
              quickStats={[
                { label: "Coverage", value: `${Math.round((stats.membersAvailable / stats.totalTeamMembers) * 100)}%` },
                { label: "Trend", value: "Stable" },
                { label: "Peak", value: "Mon-Wed" }
              ]}
              quickActions={[
                {
                  icon: <FiTrendingUp className="w-4 h-4" />,
                  onClick: () => console.log("View Trends"),
                  tooltip: "View Trends"
                },
                {
                  icon: <FiTarget className="w-4 h-4" />,
                  onClick: () => console.log("Set Goals"),
                  tooltip: "Set Goals"
                }
              ]}
            />
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
          </div>
        )}
        
        {/* My Requests View */}
        {activeTab === 'requests' && (
          <div ref={requestsRef}>
            <CompactTabHeader
              title="My Requests"
              subtitle="Track and manage your personal leave requests and history"
              icon={FiClock}
              color="orange"
              badge="Personal"
              quickStats={[
                { label: "Total", value: `${leaveData.filter(leave => leave.users?.id === currentUser?.id).length} requests` },
                { label: "Pending", value: `${leaveData.filter(leave => leave.users?.id === currentUser?.id && leave.status === 'pending').length} pending` },
                { label: "Approved", value: `${leaveData.filter(leave => leave.users?.id === currentUser?.id && leave.status === 'approved').length} approved` }
              ]}
              quickActions={[
                {
                  icon: <FiPlus className="w-4 h-4" />,
                  onClick: () => setShowLeaveForm(true),
                  tooltip: "New Request"
                },
                {
                  icon: <FiList className="w-4 h-4" />,
                  onClick: () => console.log("View History"),
                  tooltip: "View History"
                }
              ]}
            />
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
          </div>
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
      
      {/* Enhanced users on leave modal */}
      <UserListModal
        isOpen={showOnLeaveModal}
        onClose={() => setShowOnLeaveModal(false)}
        title="Team Members on Leave"
        subtitle={format(new Date(), 'MMMM d, yyyy')}
        users={selectedUsers}
        type="onLeave"
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
      
      {/* Render the modals */}
      <UserListModal
        isOpen={showAvailableModal}
        onClose={() => setShowAvailableModal(false)}
        title="Available Team Members"
        users={availableUsers}
        type="available"
      />
      
      {/* Add custom scrollbar styles */}
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
