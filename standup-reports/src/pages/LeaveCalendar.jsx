import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, parseISO, isSameMonth, differenceInDays } from 'date-fns';
import { FiCalendar, FiPlus, FiX, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiCheck, FiBell, FiUsers, FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiEye, FiArrowRight, FiEdit3, FiTrash2, FiDownload, FiSend, FiTarget, FiCheckSquare, FiBriefcase, FiLayers, FiFileText, FiEyeOff, FiStar, FiVideo, FiLink, FiExternalLink, FiMoreHorizontal, FiGrid } from 'react-icons/fi';
import { useCompany } from '../contexts/CompanyContext';

// Import components
import LeaveRequestForm from '../components/LeaveRequestForm';
import FloatingNav from '../components/FloatingNav';
import AnnouncementModal from '../components/AnnouncementModal';
import UserListModal from '../components/UserListModal';
import TimesheetModal from '../components/TimesheetModal';
import HolidayModal from '../components/HolidayModal';
import MeetingModal from '../components/MeetingModal';
import DayAgendaModal from '../components/DayAgendaModal';

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

  // View Mode: 'meetings', 'leaves', 'timesheets', or 'holidays'
  const [viewMode, setViewMode] = useState('meetings');
  const [isTogglesExpanded, setIsTogglesExpanded] = useState(false);

  // Selection States
  const [selectedLeaveDates, setSelectedLeaveDates] = useState([]); // Array of strings 'YYYY-MM-DD'
  const [selectedTimesheetDates, setSelectedTimesheetDates] = useState([]); // Array of date strings 'YYYY-MM-DD'

  const [leaveData, setLeaveData] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [holidayData, setHolidayData] = useState([]);
  const [meetingData, setMeetingData] = useState([]);
  const [users, setUsers] = useState([]);

  // Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Meeting Modal State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeetingDate, setSelectedMeetingDate] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showDayAgendaModal, setShowDayAgendaModal] = useState(false);
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(null);

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

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchCurrentUser();

    // Check for tab parameter in URL
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['leaves', 'timesheets', 'holidays', 'meetings'].includes(tab)) {
      setViewMode(tab);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentCompany?.id) {
      fetchUsers();
      fetchLeaveData();
      fetchAnnouncements();
    }
  }, [currentUser, currentCompany?.id]);

  // Mobile Check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser && currentCompany?.id) {
      if (viewMode === 'leaves') {
        fetchLeaveData();
      } else if (viewMode === 'timesheets') {
        fetchTimesheets();
      } else if (viewMode === 'holidays') {
        fetchHolidays();
      } else if (viewMode === 'meetings') {
        fetchMeetings();
      }
    }
  }, [currentMonth, viewMode, currentUser, currentCompany?.id]);

  // Derived Stats
  const [stats, setStats] = useState({
    onLeaveToday: 0,
    pendingRequests: 0,
    totalHoursMonth: 0,
    missingDays: 0,
    meetingsToday: 0,
    meetingsMonth: 0
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

    // Meeting Stats
    const meetingsTodayCount = meetingData.filter(m => {
      const meetingDate = format(parseISO(m.start_time), 'yyyy-MM-dd');
      return meetingDate === todayStr;
    }).length;

    const meetingsMonthCount = meetingData.length; // meetingData is already filtered by current month in fetchMeetings

    setStats({
      onLeaveToday,
      pendingRequests,
      totalHoursMonth: totalHours.toFixed(1),
      missingDays,
      meetingsToday: meetingsTodayCount,
      meetingsMonth: meetingsMonthCount
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

  const fetchMeetings = async () => {
    if (!currentUser || !currentCompany?.id) return;
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          creator:users!created_by(id, name, avatar_url),
          meeting_participants(*, user:users(id, name, avatar_url))
        `)
        .eq('company_id', currentCompany.id)
        .gte('start_time', `${start}T00:00:00`)
        .lte('start_time', `${end}T23:59:59`)
        .order('start_time');

      if (error) throw error;
      setMeetingData(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Meeting deleted successfully' });
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setMessage({ type: 'error', text: 'Failed to delete meeting' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
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
      // Holidays Mode - Single selection for managers and admins
      if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
        // Toggle: if already selected, deselect. Otherwise, select this date.
        if (selectedHolidayDate === dateStr) {
          setSelectedHolidayDate(null);
        } else {
          setSelectedHolidayDate(dateStr);
          setEditingHoliday(holidayData.find(h => h.date === dateStr) || null);
        }
      }
    } else if (viewMode === 'meetings') {
      const dateStr = format(day, 'yyyy-MM-dd');
      // Always open Day Agenda view on day click
      setSelectedAgendaDate(day);
      setShowDayAgendaModal(true);
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

    if (viewMode === 'meetings') {
      // Get meetings for this day
      const dayMeetings = meetingData.filter(m => {
        const meetingDate = format(parseISO(m.start_time), 'yyyy-MM-dd');
        return meetingDate === dateStr;
      });

      if (dayMeetings.length > 0) {
        return (
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayMeetings.slice(0, 2).map((meeting, idx) => {
              const startTime = parseISO(meeting.start_time);
              const colorClasses = {
                blue: 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                purple: 'bg-purple-100/80 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
                pink: 'bg-pink-100/80 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
                green: 'bg-green-100/80 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                amber: 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                red: 'bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                cyan: 'bg-cyan-100/80 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
                indigo: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
              };
              const colorClass = colorClasses[meeting.color] || colorClasses.blue;

              return (
                <div
                  key={meeting.id}
                  className={`p-1.5 rounded-lg text-xs font-medium ${colorClass} opacity-90`}
                >
                  <div className="flex items-center gap-1">
                    <FiVideo className="w-3 h-3 flex-shrink-0" />
                    <span className="font-bold truncate">{format(startTime, 'HH:mm')}</span>
                  </div>
                  <div className="truncate font-medium text-[10px] mt-0.5 opacity-80 hidden md:block">
                    {meeting.title}
                  </div>
                  {meeting.meeting_participants?.length > 0 && (
                    <div className="flex -space-x-1 mt-1 hidden lg:flex">
                      {meeting.meeting_participants.slice(0, 3).map((p, i) => (
                        <img
                          key={p.user?.id || i}
                          src={p.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name || 'U')}&background=random`}
                          alt=""
                          className="w-4 h-4 rounded-full ring-1 ring-white dark:ring-slate-800 object-cover"
                        />
                      ))}
                      {meeting.meeting_participants.length > 3 && (
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-600 ring-1 ring-white dark:ring-slate-800 flex items-center justify-center text-[7px] font-bold">
                          +{meeting.meeting_participants.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {dayMeetings.length > 2 && (
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center">
                +{dayMeetings.length - 2} more
              </div>
            )}
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
      className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 bg-gray-50/50 dark:bg-slate-950 transition-colors duration-500"
    >
      {/* ================= LIQUID GLASS HEADER ================= */}
      {showHeader && (
        <motion.div
          className="fixed top-16 right-0 z-20 px-6 py-4 pointer-events-none"
          id="leave-calendar-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          style={{
            left: isMobile ? '0px' : (sidebarOpen ? '280px' : '80px'),
            width: isMobile ? '100%' : (sidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 80px)'),
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Liquid Glass Header */}
          <div
            className="pointer-events-auto relative overflow-hidden bg-white/10 dark:bg-slate-900/60 backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col md:flex-row items-center justify-between group min-h-[70px] gap-2 md:gap-0"
            style={{
              boxShadow: `
                0 8px 32px 0 rgba(31, 38, 135, 0.15),
                inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 0 20px rgba(255, 255, 255, 0.05)
              `
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
          >
            {/* Liquid Sheen Effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(
                  800px circle at var(--mouse-x) var(--mouse-y), 
                  rgba(255, 255, 255, 0.15), 
                  transparent 40%
                )`
              }}
            />

            {/* Chromatic Edge Simulation */}
            <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-50 mix-blend-overlay bg-gradient-to-br from-cyan-500/10 via-transparent to-pink-500/10" />

            {/* Left: Title & Context */}
            <div className="flex items-center gap-4 px-4 relative z-10">
              <div className="relative group/icon cursor-pointer">
                <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 dark:opacity-20 group-hover/icon:opacity-60 transition-opacity ${viewMode === 'leaves' ? 'bg-gradient-to-tr from-cyan-500 to-blue-500' :
                  viewMode === 'timesheets' ? 'bg-gradient-to-tr from-purple-500 to-pink-500' :
                    viewMode === 'meetings' ? 'bg-gradient-to-tr from-blue-500 to-indigo-500' :
                      'bg-gradient-to-tr from-amber-500 to-orange-500'
                  }`}></div>
                <div className={`relative p-2.5 rounded-2xl text-white shadow-lg ring-1 ring-white/20 dark:ring-white/10 group-hover/icon:scale-105 transition-transform duration-300 ${viewMode === 'leaves' ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/30' :
                  viewMode === 'timesheets' ? 'bg-gradient-to-tr from-purple-500 to-pink-600 shadow-purple-500/30' :
                    viewMode === 'meetings' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/30' :
                      'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30'
                  }`}>
                  {viewMode === 'leaves' ? <FiCalendar className="w-5 h-5" /> :
                    viewMode === 'timesheets' ? <FiClock className="w-5 h-5" /> :
                      viewMode === 'meetings' ? <FiVideo className="w-5 h-5" /> :
                        <FiStar className="w-5 h-5" />}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                  {viewMode === 'leaves' ? 'Team Calendar' : viewMode === 'timesheets' ? 'Timesheets' : viewMode === 'meetings' ? 'Meetings' : 'Holidays'}
                </h1>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  {viewMode === 'leaves' ? 'Manage team availability' :
                    viewMode === 'timesheets' ? 'Track your work hours' :
                      viewMode === 'meetings' ? 'Schedule team meetings' :
                        'Company holidays'}
                </p>
              </div>
            </div>

            {/* Center: Futuristic Toggle - Responsive & Collapsible (Compact) */}
            <div className="flex w-full md:w-auto overflow-x-auto md:overflow-visible md:absolute md:left-1/2 md:-translate-x-1/2 bg-transparent md:bg-gray-100/30 md:backdrop-blur-xl p-1 rounded-2xl z-20 md:border md:border-white/40 md:shadow-inner no-scrollbar justify-center items-center gap-0.5">
              {/* Primary Visible Tabs */}
              <div className="flex items-center gap-0.5">
                {[
                  { id: 'meetings', icon: FiVideo, label: 'Meetings' },
                  { id: 'leaves', icon: FiCalendar, label: 'Leaves' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    layout="position"
                    className={`relative px-2 py-1 md:px-3.5 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 z-10 whitespace-nowrap ${viewMode === tab.id
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
                      }`}
                    onClick={() => {
                      setViewMode(tab.id);
                      setSelectedLeaveDates([]);
                      setSelectedTimesheetDates([]);
                      setSelectedHolidayDate(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {viewMode === tab.id && (
                      <motion.div
                        className="absolute inset-0 rounded-lg md:rounded-xl shadow-md border border-white/20 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
                        layoutId="activeTabCalendar"
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1 md:gap-1.5 drop-shadow-sm">
                      <tab.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${viewMode === tab.id ? 'text-white' : ''}`} />
                      {tab.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {!isTogglesExpanded ? (
                  /* Premium Compact Expansion Trigger */
                  <motion.button
                    key="expansion-indicator"
                    initial={{ opacity: 0, scale: 0.8, x: -5 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -5 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={() => setIsTogglesExpanded(true)}
                    className="group relative ml-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/40 hover:border-indigo-500/50 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer overflow-hidden"
                  >
                    <FiGrid className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="flex items-center gap-1">
                      <span className="flex items-center justify-center w-3 h-3 rounded-full bg-indigo-500 text-white text-[7px] font-black shadow-sm shadow-indigo-500/20">2</span>
                    </div>
                  </motion.button>
                ) : (
                  /* Collapsed Items: Revealed when expanded (Compact) */
                  <motion.div
                    key="collapsed-items"
                    initial={{ opacity: 0, width: 0, x: -10 }}
                    animate={{ opacity: 1, width: 'auto', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="flex items-center gap-0.5 border-l border-slate-200/50 dark:border-slate-700/50 ml-1 pl-1"
                  >
                    {[
                      { id: 'timesheets', icon: FiClock, label: 'Timesheet' },
                      { id: 'holidays', icon: FiStar, label: 'Holidays' }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        layout="position"
                        className={`relative px-2 py-1 md:px-3.5 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-1 z-10 whitespace-nowrap ${viewMode === tab.id
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
                          }`}
                        onClick={() => {
                          setViewMode(tab.id);
                          setSelectedLeaveDates([]);
                          setSelectedTimesheetDates([]);
                          setSelectedHolidayDate(null);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {viewMode === tab.id && (
                          <motion.div
                            className={`absolute inset-0 rounded-lg md:rounded-xl shadow-md border border-white/20 ${tab.id === 'timesheets' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500' :
                              'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                              }`}
                            layoutId="activeTabCalendar"
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1 md:gap-1.5 drop-shadow-sm">
                          <tab.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${viewMode === tab.id ? 'text-white' : ''}`} />
                          {tab.label}
                        </span>
                      </motion.button>
                    ))}

                    {/* Compact Collapse Handle */}
                    <motion.button
                      key="collapse-handle"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1, textShadow: '0 0 8px rgba(244,63,94,0.4)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsTogglesExpanded(false)}
                      className="p-1 ml-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 px-2 relative z-10">

              {/* Glowing Stats Pills - Smooth Animated Text Reveal */}
              <div className="hidden xl:flex items-center gap-1.5 mr-1">
                {(viewMode === 'leaves' ? [
                  { value: users.length - stats.onLeaveToday, label: 'Available', colors: ['from-emerald-400', 'to-green-500'], icon: FiCheckCircle },
                  { value: stats.onLeaveToday, label: 'Away', colors: ['from-orange-400', 'to-amber-500'], icon: FiUser },
                  { value: stats.pendingRequests, label: 'Pending', colors: ['from-red-400', 'to-rose-500'], icon: FiAlertCircle }
                ] : viewMode === 'timesheets' ? [
                  { value: `${stats.totalHoursMonth}h`, label: 'Logged', colors: ['from-emerald-400', 'to-green-500'], icon: FiClock },
                  { value: stats.missingDays, label: 'Missing', colors: ['from-amber-400', 'to-orange-500'], icon: FiAlertCircle }
                ] : viewMode === 'meetings' ? [
                  { value: stats.meetingsToday, label: "Today's Meetings", colors: ['from-blue-400', 'to-indigo-500'], icon: FiVideo },
                  { value: stats.meetingsMonth, label: 'T       his Month', colors: ['from-cyan-400', 'to-blue-500'], icon: FiLayers }
                ] : [
                  { value: holidayData.length, label: 'Holidays', colors: ['from-amber-400', 'to-orange-500'], icon: FiStar }
                ]).map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className={`relative bg-gradient-to-r ${stat.colors[0]} ${stat.colors[1]} px-2.5 py-1 rounded-full text-white shadow-md cursor-pointer overflow-hidden group/stat`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                    transition={{ delay: 0.05 + index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className="relative flex items-center gap-1">
                      <stat.icon className="w-3.5 h-3.5 flex-shrink-0 group-hover/stat:rotate-12 transition-transform duration-300" />
                      <span className="text-[11px] font-bold">{stat.value}</span>
                      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/stat:max-w-[80px] group-hover/stat:opacity-100 group-hover/stat:ml-1 transition-all duration-300 ease-out">
                        {stat.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Refresh Button - Icon Only */}
              <motion.button
                className="p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/40 dark:border-white/5 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-white/70 dark:hover:bg-slate-700/70 hover:text-gray-800 dark:hover:text-white transition-all shadow-sm"
                onClick={() => {
                  if (viewMode === 'leaves') fetchLeaveData();
                  else if (viewMode === 'timesheets') fetchTimesheets();
                  else if (viewMode === 'meetings') fetchMeetings();
                  else fetchHolidays();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Professional Create Button */}
              {viewMode === 'leaves' && (
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg hover:bg-gray-800 dark:hover:bg-indigo-500 border border-gray-700 dark:border-indigo-500/50 transition-all"
                  onClick={handleRequestLeave}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Request Leave</span>
                </motion.button>
              )}
              {viewMode === 'timesheets' && (
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg hover:bg-gray-800 dark:hover:bg-indigo-500 border border-gray-700 dark:border-indigo-500/50 transition-all"
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
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiClock className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectedTimesheetDates.length > 0 ? `Log (${selectedTimesheetDates.length})` : 'Log Today'}</span>
                </motion.button>
              )}
              {viewMode === 'holidays' && (currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
                <motion.button
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg hover:bg-gray-800 dark:hover:bg-indigo-500 border border-gray-700 dark:border-indigo-500/50 transition-all ${!selectedHolidayDate ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!selectedHolidayDate) {
                      setMessage({ type: 'warning', text: 'Select a date first' });
                      setTimeout(() => setMessage(null), 3000);
                      return;
                    }
                    setShowHolidayModal(true);
                  }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectedHolidayDate ? (editingHoliday ? 'Edit Holiday' : 'Add Holiday') : 'Select Date'}</span>
                </motion.button>
              )}
              {viewMode === 'meetings' && (
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 transition-all"
                  onClick={() => {
                    setSelectedMeetingDate(new Date());
                    setEditingMeeting(null);
                    setShowMeetingModal(true);
                  }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiVideo className="w-4 h-4" />
                  <span className="hidden sm:inline">Schedule Meeting</span>
                </motion.button>
              )}

              {/* Hide Header Button - Icon Only */}
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/40 rounded-lg transition-all"
                onClick={() => setShowHeader(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Hide Header"
              >
                <FiEyeOff className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Show Header Button - Icon Only, Clean Design */}
      {!showHeader && (
        <motion.button
          className="fixed top-20 right-6 z-30 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all"
          onClick={() => setShowHeader(true)}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Show Header"
        >
          <FiEye className="w-5 h-5" />
        </motion.button>
      )}

      {/* ================= SCROLLABLE CONTENT AREA (flows under header) ================= */}
      <div className={`flex-1 overflow-y-auto relative z-10 ${showHeader ? (isMobile ? 'pt-48' : 'pt-32') : 'pt-0'}`}>
        {/* Control Bar */}
        <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/40 p-2 rounded-2xl border border-white/60 dark:border-white/5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 py-1">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Legend or Stats */}
            <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 px-4">
              {viewMode === 'leaves' && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> High Availability</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Medium</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Low</div>
                </div>
              )}
              {viewMode === 'timesheets' && (
                <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Select dates to log time</span>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid Area */}
        <div className="px-4 md:px-8 pb-6 w-full max-w-[1600px] mx-auto">


          {/* --- Calendar Grid --- */}
          <div className="hidden md:grid grid-cols-7 gap-4 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-gray-400 dark:text-gray-500 uppercase text-xs tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <motion.div
            layout
            className="grid grid-cols-5 md:grid-cols-7 gap-2 md:gap-3 pb-24" // Added padding bottom for floating buttons
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
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                        relative min-h-[80px] md:min-h-[140px] p-1.5 md:p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer overflow-hidden group
                        ${isSelected
                      ? 'ring-2 ring-blue-500 dark:ring-blue-600 shadow-md bg-blue-50/30 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : isToday
                        ? 'bg-indigo-50/20 dark:bg-indigo-900/10 border-indigo-400 dark:border-indigo-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800'
                    }
                        ${!isSameMonth(day, currentMonth) ? 'opacity-40 bg-gray-50 dark:bg-slate-950' : ''}
                      `}
                >
                  {/* Top Row: Date & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] md:text-xs uppercase font-bold tracking-wide ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {format(day, 'EEE')}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[8px] font-black uppercase tracking-tighter shadow-sm shadow-indigo-500/20">
                            Today
                          </span>
                        )}
                      </div>
                      <span className={`text-lg md:text-xl font-bold leading-tight ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
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
                      className="mt-2 group/bar relative cursor-pointer hidden md:block"
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
                      <div className="flex justify-between text-[9px] text-gray-500 dark:text-gray-500 mb-0.5">
                        <span>Availability</span>
                        <span className="dark:text-gray-400 font-medium">{availPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
          // If only one date is in the array, it's a partial selection (start only)
          if (selectedLeaveDates.length === 1) {
            return {
              start: new Date(selectedLeaveDates[0]),
              end: null
            };
          }
          const sorted = [...selectedLeaveDates].sort();
          return {
            start: new Date(sorted[0]),
            end: new Date(sorted[sorted.length - 1])
          };
        })()}
        setSelectedDates={(dates) => {
          if (!dates.start) {
            setSelectedLeaveDates([]);
            return;
          }
          if (!dates.end) {
            setSelectedLeaveDates([format(dates.start, 'yyyy-MM-dd')]);
          } else {
            // Generate all dates in between
            const days = eachDayOfInterval({ start: dates.start, end: dates.end });
            setSelectedLeaveDates(days.map(d => format(d, 'yyyy-MM-dd')));
          }
        }}
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

      <MeetingModal
        isOpen={showMeetingModal}
        onClose={() => {
          setShowMeetingModal(false);
          setEditingMeeting(null);
          setSelectedMeetingDate(null);
        }}
        selectedDate={selectedMeetingDate}
        currentUser={currentUser}
        initialData={editingMeeting}
        onSave={() => {
          fetchMeetings();
          setMessage({ type: 'success', text: editingMeeting ? 'Meeting updated!' : 'Meeting scheduled!' });
          setTimeout(() => setMessage(null), 3000);
        }}
        onDelete={(id) => {
          handleDeleteMeeting(id);
          setShowMeetingModal(false);
        }}
      />

      <DayAgendaModal
        isOpen={showDayAgendaModal}
        onClose={() => setShowDayAgendaModal(false)}
        date={selectedAgendaDate}
        meetings={selectedAgendaDate ? meetingData.filter(m =>
          format(parseISO(m.start_time), 'yyyy-MM-dd') === format(selectedAgendaDate, 'yyyy-MM-dd')
        ) : []}
        onAddMeeting={(date) => {
          setShowDayAgendaModal(false);
          setSelectedMeetingDate(date);
          setEditingMeeting(null);
          setShowMeetingModal(true);
        }}
        onEditMeeting={(meeting) => {
          setShowDayAgendaModal(false);
          setEditingMeeting(meeting);
          setSelectedMeetingDate(parseISO(meeting.start_time));
          setShowMeetingModal(true);
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
