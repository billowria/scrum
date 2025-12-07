import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiEye, FiArrowRight, FiEdit3, FiTrash2, FiDownload, FiSend, FiTarget, FiCheckSquare, FiBriefcase, FiLayers, FiFileText, FiEyeOff, FiStar } from 'react-icons/fi';
import { useCompany } from '../contexts/CompanyContext';

// Import components
import LeaveRequestForm from '../components/LeaveRequestForm';
import FloatingNav from '../components/FloatingNav';
import AnnouncementModal from '../components/AnnouncementModal';
import UserListModal from '../components/UserListModal';
import TimesheetModal from '../components/TimesheetModal';
import HolidayModal from '../components/HolidayModal';

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

export default function LeaveCalendar({ sidebarOpen = false }) {
  const { currentCompany } = useCompany();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // View Mode: 'leaves', 'timesheets', or 'holidays'
  const [viewMode, setViewMode] = useState('leaves');

  // Selection States
  const [selectedLeaveDates, setSelectedLeaveDates] = useState([]); // Array of strings 'YYYY-MM-DD'
  const [selectedTimesheetDates, setSelectedTimesheetDates] = useState([]); // Array of date strings 'YYYY-MM-DD'

  const [leaveData, setLeaveData] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [holidayData, setHolidayData] = useState([]);
  const [users, setUsers] = useState([]);

  // Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Modals
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [editingTimesheetEntry, setEditingTimesheetEntry] = useState(null);

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
  const [showHeader, setShowHeader] = useState(true);

  // Animation controls
  const controls = useAnimation();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && currentCompany?.id) {
      fetchUsers();
      fetchLeaveData();
      if (viewMode === 'timesheets') {
        fetchTimesheets();
      }
      fetchAnnouncements();
    }
  }, [currentUser, currentCompany?.id]);

  useEffect(() => {
    if (currentUser && currentCompany?.id) {
      if (viewMode === 'leaves') {
        fetchLeaveData();
      } else if (viewMode === 'timesheets') {
        fetchTimesheets();
      } else if (viewMode === 'holidays') {
        fetchHolidays();
      }
    }
  }, [currentMonth, viewMode]);

  // Derived Stats
  const [stats, setStats] = useState({
    onLeaveToday: 0,
    pendingRequests: 0,
    totalHoursMonth: 0,
    missingDays: 0
  });

  useEffect(() => {
    calculateStats();
    calculateTeamAvailability();
  }, [leaveData, timesheetData, users, currentMonth, viewMode]);

  const calculateStats = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Leave Stats
    const onLeaveToday = leaveData.filter(l => {
      return l.status === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date;
    }).length;

    const pendingRequests = leaveData.filter(l => l.status === 'pending').length;

    // Timesheet Stats (Current User)
    const userTimesheets = timesheetData.filter(t => t.user_id === currentUser?.id);
    const totalHours = userTimesheets.reduce((acc, curr) => acc + (curr.hours || 0), 0);

    // Missing Days (Weekdays in current month up to today)
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: isSameMonth(currentMonth, today) ? today : endOfMonth(currentMonth)
    });

    // Exclude weekends
    const workDays = daysInMonth.filter(d => !isWeekend(d));
    const loggedDates = new Set(userTimesheets.map(t => t.date));
    const missingDays = workDays.filter(d => !loggedDates.has(format(d, 'yyyy-MM-dd'))).length;

    setStats({
      onLeaveToday,
      pendingRequests,
      totalHoursMonth: totalHours.toFixed(1),
      missingDays
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

      let availablePercentage = 100;
      if (totalUsers > 0) {
        availablePercentage = Math.round(((totalUsers - onLeave) / totalUsers) * 100);
      }

      let status = 'high';
      if (availablePercentage < 70) status = 'medium';
      if (availablePercentage < 50) status = 'low';

      availability[dateStr] = {
        availablePercentage,
        status,
        onLeave,
        totalUsers
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
    if (!currentUser || !currentCompany?.id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, team_id, company_id, avatar_url')
        .eq('company_id', currentCompany?.id);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const fetchLeaveData = async () => {
    if (!currentUser || !currentCompany?.id) return;
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, reason, status, company_id,
          users:user_id (id, name, team_id, avatar_url, company_id)
        `)
        .eq('company_id', currentCompany?.id)
        .eq('users.company_id', currentCompany?.id)
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

  const fetchTimesheets = async () => {
    if (!currentUser || !currentCompany?.id) return;
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          project:project_id (name)
        `)
        .eq('user_id', currentUser.id)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;
      setTimesheetData(data || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    // ... existing
    if (!currentUser || !currentCompany?.id) return;
    try {
      const today = new Date().toISOString();
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, expiry_date')
        .eq('company_id', currentCompany?.id)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setCalendarAnnouncement(data[0]);
        setHasUnreadAnnouncements(true);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
    }
  };

  const fetchHolidays = async () => {
    if (!currentUser || !currentCompany?.id) return;
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('company_id', currentCompany.id)
        .gte('date', start)
        .lte('date', end)
        .order('date');

      if (error) throw error;
      setHolidayData(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Month Navigation
  const goToPreviousMonth = () => {
    setMonthDirection(-1);
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setMonthDirection(1);
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Interactions
  const handleDayClick = (day, event) => {
    const dateStr = format(day, 'yyyy-MM-dd');

    if (viewMode === 'timesheets') {
      // Toggle date selection
      if (selectedTimesheetDates.includes(dateStr)) {
        setSelectedTimesheetDates(prev => prev.filter(d => d !== dateStr));
      } else {
        setSelectedTimesheetDates(prev => [...prev, dateStr]);
      }
    } else if (viewMode === 'holidays') {
      // Holidays Mode - Single selection for managers
      if (currentUser?.role === 'manager') {
        // Toggle: if already selected, deselect. Otherwise, select this date.
        if (selectedHolidayDate === dateStr) {
          setSelectedHolidayDate(null);
        } else {
          setSelectedHolidayDate(dateStr);
          setEditingHoliday(holidayData.find(h => h.date === dateStr) || null);
        }
      }
    } else {
      // Leaves Mode - same toggle logic
      if (selectedLeaveDates.includes(dateStr)) {
        setSelectedLeaveDates(prev => prev.filter(d => d !== dateStr));
      } else {
        setSelectedLeaveDates(prev => [...prev, dateStr]);
      }
    }
  };

  const handleRequestLeave = () => {
    if (selectedLeaveDates.length === 0) {
      setMessage({ type: 'warning', text: 'Select dates first' });
      return;
    }

    // Sort dates to find range
    const sorted = [...selectedLeaveDates].sort();
    const start = new Date(sorted[0]);
    const end = new Date(sorted[sorted.length - 1]);

    // Check for gaps if strict range is needed, but for now just pass min/max
    // The LeaveRequestForm likely takes { start, end }
    // We'll set the range state that the form uses, constructed on the fly
    // Note: LeaveRequestForm logic might need a range object passed to it.
    // We can just use the state setter expected by the form or pass props?
    // Looking at previous code, `selectedDates` prop was passed `selectedLeaveRange`.
    // We will construct a temporary object to pass.

    // Actually, `selectedDates` prop on Form is controlled? 
    // Previous: `selectedDates={selectedLeaveRange}` -> {start, end}
    // So we need to emulate that.
    setShowLeaveForm(true);
  };

  const handleBatchLogTime = () => {
    // If only 1 date selected, check if it has entry => Edit Mode
    if (selectedTimesheetDates.length === 1) {
      const entry = timesheetData.find(t => t.date === selectedTimesheetDates[0]);
      setEditingTimesheetEntry(entry || null);
    } else {
      setEditingTimesheetEntry(null);
    }
    setShowTimesheetModal(true);
  };

  const handleTimesheetSave = () => {
    fetchTimesheets();
    setMessage({ type: 'success', text: 'Time logged successfully!' });
    setSelectedTimesheetDates([]); // Clear selection after save
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTimesheetDelete = (id) => {
    fetchTimesheets();
    setMessage({ type: 'success', text: 'Entry deleted' });
    setSelectedTimesheetDates([]);
    setTimeout(() => setMessage(null), 3000);
  };

  // Rendering Helpers
  const getDayContent = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isWeekendDay = isWeekend(day);

    if (viewMode === 'timesheets') {
      const entry = timesheetData.find(t => t.date === dateStr);
      if (entry) {
        return (
          <div className={`mt-1 p-1.5 rounded-lg text-xs font-medium ${entry.hours >= 8 ? 'bg-green-100/80 text-green-800' : 'bg-amber-100/80 text-amber-800'}`}>
            <span className="font-bold block">{entry.hours}h</span>
            {entry.project?.name && (
              <div className="truncate text-[10px] opacity-75 hidden 2xl:block">{entry.project.name}</div>
            )}
          </div>
        );
      }
      return null;
    }

    if (viewMode === 'holidays') {
      const holiday = holidayData.find(h => h.date === dateStr);
      if (holiday) {
        return (
          <div
            className="mt-1 p-1.5 rounded-lg text-xs font-medium bg-amber-100/80 text-amber-800 cursor-pointer hover:bg-amber-200/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHolidayDate(dateStr);
              setEditingHoliday(holiday);
              setShowHolidayModal(true);
            }}
          >
            <FiStar className="w-3 h-3 inline-block mr-1 text-amber-600" />
            <span className="font-bold">{holiday.name}</span>
          </div>
        );
      }
      return null;
    }

    // Leave View Content
    const isSameMonthDay = isSameMonth(day, currentMonth);
    if (!isSameMonthDay) return null;

    // Users on leave
    const usersOnLeave = leaveData
      .filter(leave => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return day >= start && day <= end && leave.status === 'approved';
      })
      .map(leave => leave.users)
      .filter((user, index, arr) => arr.findIndex(u => u.id === user.id) === index);

    if (usersOnLeave.length > 0) {
      return (
        <div
          className="mt-2 flex -space-x-2 overflow-hidden px-1 cursor-pointer hover:scale-105 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDate(day);
            setSelectedUsers(usersOnLeave);
            setShowOnLeaveModal(true);
          }}
        >
          {usersOnLeave.slice(0, 3).map((u, i) => (
            <div key={i} className="relative inline-block h-6 w-6 rounded-full ring-1 ring-white">
              <img
                src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                alt={u.name}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          ))}
          {usersOnLeave.length > 3 && (
            <div className="relative inline-block h-6 w-6 rounded-full ring-1 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
              +{usersOnLeave.length - 3}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 bg-gray-50/50"
    >
      {/* ================= HEADER SECTION ================= */}
      <AnimatePresence>
        {showHeader && (
          <div className="z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
              {/* Left Section - Title */}
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-r ${viewMode === 'leaves' ? 'from-cyan-500 to-blue-500 shadow-cyan-200/50' : viewMode === 'timesheets' ? 'from-indigo-500 to-purple-500 shadow-indigo-200/50' : 'from-amber-500 to-orange-500 shadow-amber-200/50'} rounded-xl text-white shadow-lg transition-all duration-300`}>
                  {viewMode === 'leaves' ? <FiCalendar className="w-5 h-5" /> : viewMode === 'timesheets' ? <FiClock className="w-5 h-5" /> : <FiStar className="w-5 h-5" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {viewMode === 'leaves' ? 'Team Calendar' : viewMode === 'timesheets' ? 'Timesheets' : 'Holidays'}
                  </h1>
                </div>
              </div>

              {/* Center Section - Toggle Switch (Absolutely Centered) */}
              <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="relative group">
                  <div className="relative bg-white/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/50 shadow-inner flex items-center gap-1">
                    {[
                      { id: 'leaves', icon: FiCalendar, label: 'Leaves', gradient: 'from-cyan-500 via-blue-500 to-indigo-500' },
                      { id: 'timesheets', icon: FiClock, label: 'Timesheet', gradient: 'from-purple-500 via-pink-500 to-rose-500' },
                      { id: 'holidays', icon: FiStar, label: 'Holidays', gradient: 'from-amber-500 via-orange-500 to-red-500' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === tab.id
                          ? 'text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          }`}
                        onClick={() => {
                          setViewMode(tab.id);
                          setSelectedLeaveDates([]);
                          setSelectedTimesheetDates([]);
                        }}
                      >
                        {viewMode === tab.id && (
                          <motion.div
                            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient}`}
                            layoutId="activeTab"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section - Stats & Actions */}
              <div className="flex items-center gap-3 md:gap-6">
                {/* Stats with Info Icons */}
                <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4">
                  {viewMode === 'leaves' ? (
                    <>
                      <motion.div
                        className="relative bg-gradient-to-r from-emerald-400 to-green-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                          hover: {}
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.1 }}
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-50 blur-md"></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${users.length - stats.onLeaveToday} team members available`}>
                          <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{users.length - stats.onLeaveToday}</span>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                            variants={{
                              hidden: { width: 0, opacity: 0, marginLeft: 0 },
                              visible: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            Available
                          </motion.span>
                        </div>
                      </motion.div>

                      <motion.div
                        className="relative bg-gradient-to-r from-orange-400 to-amber-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                          hover: {}
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.1 }}
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full opacity-50 blur-md"></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${stats.onLeaveToday} team members are away today`}>
                          <FiUser className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stats.onLeaveToday}</span>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                            variants={{
                              hidden: { width: 0, opacity: 0, marginLeft: 0 },
                              visible: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            Away
                          </motion.span>
                        </div>
                      </motion.div>

                      <motion.div
                        className="relative bg-gradient-to-r from-red-400 to-rose-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                          hover: {}
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.2 }}
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 rounded-full opacity-50 blur-md"></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                        />
                        <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${stats.pendingRequests} leave requests pending approval`}>
                          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stats.pendingRequests}</span>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                            variants={{
                              hidden: { width: 0, opacity: 0, marginLeft: 0 },
                              visible: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            Pending
                          </motion.span>
                        </div>
                      </motion.div>
                    </>
                  ) : viewMode === 'timesheets' ? (
                    <>
                      <motion.div
                        className="relative bg-gradient-to-r from-emerald-400 to-green-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                          hover: {}
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.1 }}
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-50 blur-md"></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${stats.totalHoursMonth} hours logged this month`}>
                          <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stats.totalHoursMonth}h</span>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                            variants={{
                              hidden: { width: 0, opacity: 0, marginLeft: 0 },
                              visible: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            Total
                          </motion.span>
                        </div>
                      </motion.div>

                      <motion.div
                        className="relative bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: { opacity: 1, x: 0 },
                          hover: {}
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.2 }}
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-50 blur-md"></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                        />
                        <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${stats.missingDays} work days with no time logged`}>
                          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stats.missingDays}</span>
                          {/* Expandable label on hover */}
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                            variants={{
                              hidden: { width: 0, opacity: 0, marginLeft: 0 },
                              visible: { width: 0, opacity: 0, marginLeft: 0 },
                              hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            Missing
                          </motion.span>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    // Holidays mode stats
                    <motion.div
                      className="relative bg-gradient-to-r from-yellow-400 to-amber-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.1 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative flex items-center gap-1.5 proact-stat-item" title={`${holidayData.length} holidays this month`}>
                        <FiStar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{holidayData.length}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Holidays
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Primary Header Action */}
                  {viewMode === 'leaves' ? (
                    <motion.button
                      onClick={handleRequestLeave}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 font-medium text-sm transition-all"
                    >
                      <FiPlus className="w-4 h-4" />
                      Request Leave
                    </motion.button>
                  ) : viewMode === 'timesheets' ? (
                    <motion.button
                      onClick={() => {
                        if (selectedTimesheetDates.length > 0) {
                          handleBatchLogTime();
                        } else {
                          const todayStr = format(new Date(), 'yyyy-MM-dd');
                          const entry = timesheetData.find(t => t.date === todayStr);
                          setSelectedTimesheetDates([todayStr]);
                          setEditingTimesheetEntry(entry || null);
                          setShowTimesheetModal(true);
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg hover:shadow-violet-500/30 font-medium text-sm transition-all"
                    >
                      <FiClock className="w-4 h-4" />
                      {selectedTimesheetDates.length > 0 ? `Log (${selectedTimesheetDates.length})` : 'Log Today'}
                    </motion.button>
                  ) : (
                    // Holidays mode - Manager only
                    currentUser?.role === 'manager' && (
                      <motion.button
                        onClick={() => {
                          if (!selectedHolidayDate) {
                            setMessage({ type: 'warning', text: 'Select a date first' });
                            setTimeout(() => setMessage(null), 3000);
                            return;
                          }
                          // editingHoliday is already set by handleDayClick
                          setShowHolidayModal(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-amber-500/30 font-medium text-sm transition-all ${!selectedHolidayDate ? 'opacity-60' : ''}`}
                      >
                        <FiPlus className="w-4 h-4" />
                        {selectedHolidayDate ? (editingHoliday ? 'Edit Holiday' : 'Add Holiday') : 'Select Date'}
                      </motion.button>
                    )
                  )}

                  <motion.button
                    onClick={() => {
                      if (viewMode === 'leaves') fetchLeaveData();
                      else if (viewMode === 'timesheets') fetchTimesheets();
                      else fetchHolidays();
                    }}
                    className="p-2.5 bg-white/50 hover:bg-white rounded-xl text-gray-600 transition-colors"
                    title="Refresh Data"
                  >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CONTROL BAR (FIXED) ================= */}
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto z-30">
        <div className="flex items-center justify-between bg-white/60 p-2 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-600 hover:text-gray-900 shadow-sm hover:shadow"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-1">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-600 hover:text-gray-900 shadow-sm hover:shadow"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Legend or Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-600 px-4">
            {viewMode === 'leaves' && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> High Availability</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Medium</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Low</div>
              </div>
            )}
            {viewMode === 'timesheets' && (
              <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Select dates to log time</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= GRID SCROLLABLE AREA ================= */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6 w-full max-w-[1600px] mx-auto">


        {/* --- Calendar Grid --- */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-gray-400 uppercase text-xs tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <motion.div
          layout
          className="grid grid-cols-7 gap-3 pb-24" // Added padding bottom for floating buttons
        >
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isToday = isSameDay(new Date(), day);
            const availability = teamAvailability[dateStr];

            // Selection Logic
            let isSelected = false;

            if (viewMode === 'leaves') {
              isSelected = selectedLeaveDates.includes(dateStr);
            } else if (viewMode === 'timesheets') {
              isSelected = selectedTimesheetDates.includes(dateStr);
            } else if (viewMode === 'holidays') {
              isSelected = selectedHolidayDate === dateStr;
            }

            // On Leave Info for Tooltip/Modal
            const onLeaveCount = availability ? availability.onLeave : 0;
            const availPercent = availability ? availability.availablePercentage : 100;

            return (
              <motion.div
                key={dateStr}
                onClick={(e) => handleDayClick(day, e)}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
                className={`
                        relative min-h-[140px] p-3 rounded-2xl border bg-white flex flex-col justify-between transition-all cursor-pointer overflow-hidden group
                        ${isSelected ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/30' : 'border-gray-200 shadow-sm hover:shadow-md'}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-40 bg-gray-50' : ''}
                     `}
              >
                {/* Top Row: Date & Status */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className={`text-xs uppercase font-bold tracking-wide ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-lg font-bold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Selection Checkmark for Both Modes */}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                      <FiCheck className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Middle: Content */}
                <div className="flex-1 py-1">
                  {getDayContent(day)}
                </div>

                {/* Bottom: Team Availability Bar - Only in Leaves Mode */}
                {viewMode === 'leaves' && (
                  <div
                    className="mt-2 group/bar relative cursor-pointer"
                    title={`${availPercent}% Team Available • ${onLeaveCount} On Leave`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLeaveCount > 0) {
                        const usersOnLeave = leaveData.filter(leave => {
                          const s = parseISO(leave.start_date);
                          const e = parseISO(leave.end_date);
                          return day >= s && day <= e && leave.status === 'approved';
                        }).map(l => l.users)
                          .flat()
                          .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                        setSelectedDate(day);
                        setSelectedUsers(usersOnLeave);
                        setShowOnLeaveModal(true);
                      }
                    }}
                  >
                    <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                      <span>Availability</span>
                      <span>{availPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${availPercent > 70 ? 'bg-emerald-400' :
                          availPercent > 40 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                        style={{ width: `${availPercent}%` }}
                      />
                    </div>
                  </div>
                )}

              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* MODALS */}
      <LeaveRequestForm
        isOpen={showLeaveForm}
        onClose={() => {
          setShowLeaveForm(false);
          setSelectedLeaveDates([]);
        }}
        selectedDates={(() => {
          if (selectedLeaveDates.length === 0) return { start: null, end: null };
          const sorted = [...selectedLeaveDates].sort();
          return {
            start: new Date(sorted[0]),
            end: new Date(sorted[sorted.length - 1])
          };
        })()}
        onSuccess={() => {
          fetchLeaveData();
          setShowLeaveForm(false);
          setSelectedLeaveDates([]);
          setMessage({ type: 'success', text: 'Leave request submitted!' });
          setTimeout(() => setMessage(null), 3000);
        }}
      />

      <TimesheetModal
        isOpen={showTimesheetModal}
        onClose={() => {
          setShowTimesheetModal(false);
          setEditingTimesheetEntry(null);
        }}
        // Pass array of dates
        dates={selectedTimesheetDates.length > 0 ? selectedTimesheetDates : (selectedTimesheetDates.length === 0 && editingTimesheetEntry ? [editingTimesheetEntry.date] : [])}
        currentUser={currentUser}
        initialData={editingTimesheetEntry}
        onSave={handleTimesheetSave}
        onDelete={handleTimesheetDelete}
      />

      <UserListModal
        isOpen={showOnLeaveModal}
        onClose={() => setShowOnLeaveModal(false)}
        users={selectedUsers}
        title={`On Leave - ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}
      />

      <HolidayModal
        isOpen={showHolidayModal}
        onClose={() => {
          setShowHolidayModal(false);
          setEditingHoliday(null);
          setSelectedHolidayDate(null);
        }}
        date={selectedHolidayDate}
        currentUser={currentUser}
        initialData={editingHoliday}
        onSave={() => {
          fetchHolidays();
          setMessage({ type: 'success', text: editingHoliday ? 'Holiday updated!' : 'Holiday added!' });
          setTimeout(() => setMessage(null), 3000);
        }}
        onDelete={() => {
          fetchHolidays();
          setMessage({ type: 'success', text: 'Holiday deleted' });
          setTimeout(() => setMessage(null), 3000);
        }}
      />

      {calendarAnnouncement && (
        <AnnouncementModal
          isOpen={hasUnreadAnnouncements && showAnnouncement}
          onClose={() => setShowAnnouncement(false)}
          announcement={calendarAnnouncement}
        />
      )}

      {message && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[100] text-white font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

    </motion.div>
  );
}
