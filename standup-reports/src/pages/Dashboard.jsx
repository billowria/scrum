import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { format, isToday, parseISO, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
// import TaskDetailView from '../components/tasks/TaskDetailView';

// Icons
import { FiFilter,FiAward,FiZap,FiInfo, FiClock, FiUser, FiUsers, FiCheckCircle, FiAlertCircle, FiCalendar, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus, FiList, FiGrid, FiMaximize, FiMinimize, FiX, FiFileText, FiArrowRight, FiChevronDown, FiBell, FiBarChart2, FiMessageSquare, FiUserPlus } from 'react-icons/fi';

// Components
import AnnouncementModal from '../components/AnnouncementModal';
import NotificationBell from '../components/NotificationBell';
import Announcements from '../components/Announcements';
import TeamAvailabilityAnalytics from '../components/TeamAvailabilityAnalytics';
import LeaveRequestForm from '../components/LeaveRequestForm';
import TeamHealthIndicator from '../components/TeamHealthIndicator';
import UserListModal from '../components/UserListModal';

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

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } },
  active: {
    scale: 1.05,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.95 },
  active: { backgroundColor: '#4F46E5', color: '#ffffff' }
};

const switchVariants = {
  list: { x: 0 },
  grid: { x: '100%' }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scaleY: 0.8, transformOrigin: "top" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scaleY: 1,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scaleY: 0.8,
    transition: { duration: 0.2 } 
  }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// Utility: basic HTML escaping
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Convert lightweight markdown and tokens to safe HTML
function formatReportContent(raw) {
  if (!raw) return '';
  const input = String(raw);

  // Detect if content is Tiptap/HTML (basic check)
  const isHtml = /<\s*(p|ul|ol|li|br|strong|em|span|div|a)[\s>]/i.test(input);

  if (isHtml) {
    // Minimal sanitize: strip scripts and inline event handlers
    let html = input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/ on\w+\s*=\s*\"[^\"]*\"/gi, '')
      .replace(/ on\w+\s*=\s*\'[^\']*\'/gi, '');

    // Replace [TASK:{id}|{title}] tokens inside HTML - show truncated task title
    html = html.replace(/\[TASK:([^|\]]+)\|([^\]]+)\]/g, (m, id, title) => {
      const safeTitle = escapeHtml(title);
      return `<span class="task-ref-wrapper inline-block max-w-xs align-baseline"><a href="#" class="task-ref text-indigo-600 hover:text-indigo-800 underline hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors cursor-pointer font-medium truncate block" data-task-id="${id}" title="${safeTitle}">${safeTitle}</a></span>`;
    });

    // Mentions: @Name{id:uuid} -> link to profile; fallback @word -> query link
    html = html.replace(/@([^\{\s]+)\{id:([a-f0-9\-]+)\}/gi, (m, name, id) => {
      const safeName = escapeHtml(name);
      return `<a href="/profile/${id}" class="mention text-blue-600 hover:underline">@${safeName}</a>`;
    });
    html = html.replace(/(^|\s)@([A-Za-z0-9_\.\-]+)/g, (m, pre, name) => {
      return `${pre}<a href="/profile?name=${name}" class="mention text-blue-600 hover:underline">@${name}</a>`;
    });

    // Hashtags within HTML text
    html = html.replace(/(^|\s)#([A-Za-z0-9_\-]+)/g, (m, pre, tag) => {
      return `${pre}<span class="hashtag text-purple-600">#${tag}</span>`;
    });

    return html;
  }

  // Plain text path: escape and transform to simple HTML
  let text = escapeHtml(input);

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold and italic (simple)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Lists
  const blocks = text.split(/\n\n+/);
  const formattedBlocks = blocks.map(block => {
    const lines = block.split(/\n/);
    if (lines.every(l => /^\s*-\s+/.test(l))) {
      const items = lines.map(l => `<li>${l.replace(/^\s*-\s+/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    if (lines.every(l => /^\s*\d+\.\s+/.test(l))) {
      const items = lines.map(l => `<li>${l.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    }
    return block.replace(/\n/g, '<br/>');
  });
  let html = formattedBlocks.join('\n');

  // Tokens and linkify - show truncated task title
  html = html.replace(/\[TASK:([^|\]]+)\|([^\]]+)\]/g, (m, id, title) => {
    const safeTitle = escapeHtml(title);
    return `<span class=\"task-ref-wrapper inline-block max-w-xs align-baseline\"><a href=\"#\" class=\"task-ref text-indigo-600 hover:text-indigo-800 underline hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors cursor-pointer font-medium truncate block\" data-task-id=\"${id}\" title=\"${safeTitle}\">${safeTitle}</a></span>`;
  });
  html = html.replace(/@([^\{\s]+)\{id:([a-f0-9\-]+)\}/gi, (m, name, id) => {
    const safeName = escapeHtml(name);
    return `<a href=\"/profile/${id}\" class=\"mention text-blue-600 hover:underline\">@${safeName}</a>`;
  });
  html = html.replace(/(^|\s)@([A-Za-z0-9_\.\-]+)/g, (m, pre, name) => {
    return `${pre}<a href=\"/profile?name=${name}\" class=\"mention text-blue-600 hover:underline\">@${name}</a>`;
  });
  html = html.replace(/(^|\s)#([A-Za-z0-9_\-]+)/g, (m, pre, tag) => {
    return `${pre}<span class=\"hashtag text-purple-600\">#${tag}</span>`;
  });
  html = html.replace(/(https?:\/\/[^\s<]+)/g, (m, url) => {
    const safe = escapeHtml(url);
    return `<a href=\"${safe}\" target=\"_blank\" rel=\"noopener\" class=\"text-indigo-600 underline\">${safe}</a>`;
  });

  return html;
}

// Display component that binds click handlers for task refs
function RichTextDisplay({ content, onTaskClick }) {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (e) => {
      const target = e.target;
      if (target && target.classList && target.classList.contains('task-ref')) {
        e.preventDefault();
        const taskId = target.getAttribute('data-task-id');
        if (taskId && onTaskClick) onTaskClick(taskId);
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onTaskClick]);

  const html = React.useMemo(() => formatReportContent(content), [content]);
  return (
    <div ref={containerRef} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default function Dashboard({ sidebarOpen }) {
  const { currentCompany, loading: companyLoading, error: companyError } = useCompany();
  const [reports, setReports] = useState([]);
  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); 
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  
  // User state
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  const [userTeamName, setUserTeamName] = useState(null);
  
  // Missing reports state
  const [teamMembers, setTeamMembers] = useState([]);
  const [missingReports, setMissingReports] = useState([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  
  // On-leave count and announcements count
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  
  // New messages count
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  
  // Project count
  const [projectCount, setProjectCount] = useState(0);

  // Animation controls
  const cardControls = useAnimation();
  const navigate = useNavigate();
  
  // Ref for scroll animations
  const reportRefs = useRef([]);
  const carouselRef = useRef(null);

  const [slideDirection, setSlideDirection] = useState('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);

  const [activeFilter, setActiveFilter] = useState(false);

  // Add new state variables for team interaction features
  const [showTeamAvailabilityWidget, setShowTeamAvailabilityWidget] = useState(true);
  const [showQuickLeaveRequest, setShowQuickLeaveRequest] = useState(false);
  const [leaveRequestSuccess, setLeaveRequestSuccess] = useState(false);
  const [teamMetrics, setTeamMetrics] = useState({
    collaboration: 0,
    velocity: 0,
    quality: 0,
    happiness: 0
  });
  

  // Add new state for modals and on-leave members
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showOnLeaveModal, setShowOnLeaveModal] = useState(false);
  const [onLeaveMembers, setOnLeaveMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);

  // State to toggle showing all missing reports in-card
  const [showAllMissingReports, setShowAllMissingReports] = useState(false);
  // Toggle for Missing Reports header visibility
  const [showMissingHeader, setShowMissingHeader] = useState(true);

  // State for animated time display
  const [currentTime, setCurrentTime] = useState(new Date());
  // Current user avatar
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
      // Get current user information including their team
      const getUserInfo = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setUserId(authUser.id);
        setUser(authUser); // Store full user object

        // Get user's info including avatar, team, and company
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, avatar_url, team_id, company_id, teams:team_id (id, name)')
          .eq('id', authUser.id)
          .single();
        
        if (!error && data) {
          setAvatarUrl(data.avatar_url || null);
          setUserRole(data.role || null);
          setUserTeamId(data.team_id);
          setUserTeamName(data.teams && data.teams.name || null);
          setUserName(data.name || authUser.user_metadata && authUser.user_metadata.name || authUser.email);
          fetchTeamMembers(data.team_id);
        } else {
          // Fallback if user not in our DB
          setUserName(authUser.user_metadata && authUser.user_metadata.name || authUser.email);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
    // fetchReports and fetchTeams will be called after company context is loaded
    
    // Initialize animation controls
    cardControls.start({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5 }
    });
    
    // Add keyboard listener for ESC key to exit fullscreen modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFullscreenModal) {
        setShowFullscreenModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  
  }, [date, cardControls, currentCompany?.id]);

  // Effect to fetch data once company context is loaded
  useEffect(() => {
    // Only fetch data when company context is available and not still loading
    if (!companyLoading && currentCompany !== undefined) {
      fetchReports(date);
      fetchTeams();
    }
  }, [companyLoading, currentCompany, date]);
  
  // Clock display component that only re-renders when necessary
  const ClockDisplay = React.memo(() => {
    const [time, setTime] = useState(new Date());
    
    useEffect(() => {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }, []);
    
    return (
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3"
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-30"></div>
            <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-xl text-center">
              <div className="text-sm font-medium tracking-wider">
                {format(time, 'h:mm')}
              </div>
            </div>
          </div>
          <motion.div 
            className="text-2xl font-bold text-gray-800 min-w-[40px] text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          >
            {format(time, 'ss')}
          </motion.div>
          <div className="text-gray-500 text-sm font-medium px-2 py-1.5 bg-gray-100 rounded-lg">
            {format(time, 'a')}
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center mt-1 font-medium uppercase tracking-wider">
          {format(time, 'zzz')}
        </div>
      </motion.div>
    );
  });

  const fetchTeams = async () => {
    // Don't fetch if company context is not available yet or is loading
    if (companyLoading || !currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('company_id', currentCompany.id); // Filter by company

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };

  const fetchReports = async (date) => {
    setLoading(true);
    setError(null);

    try {
      // Don't fetch if company context is not available yet or is loading
      if (companyLoading || !currentCompany?.id) {
        setLoading(false);
        return;
      }
      
      // Query to get reports with user and team information
      // Filter by company_id to ensure we only get reports from the current company
      let query = supabase
        .from('daily_reports')
        .select(`
          id, date, yesterday, today, blockers, created_at, company_id,
          users:user_id (id, name, team_id, company_id, teams:team_id (id, name))
        `)
        .eq('date', date)
        .eq('company_id', currentCompany.id) // Direct company filter on daily_reports table
        .eq('users.company_id', currentCompany.id) // Additional safety filter on users table
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
      
      // If today's date is selected, update missing reports
      if (date === new Date().toISOString().split('T')[0] && userTeamId) {
        identifyMissingReports(data || [], userTeamId);
      }
      
      // Reset refs array to match new reports length
      reportRefs.current = Array(data && data.length || 0).fill().map((_, i) => reportRefs.current[i] || null);
    } catch (error) {
      setError('Error fetching reports: ' + error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    if (!teamId || !currentCompany?.id) return;
    
    setLoadingMissing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, company_id, teams:team_id (id, name)')
        .eq('team_id', teamId)
        .eq('company_id', currentCompany?.id); // Filter by company
        
      if (error) throw error;
      
      setTeamMembers(data || []);
      
      // If reports are already loaded, identify missing reports
      if (reports.length > 0 && date === new Date().toISOString().split('T')[0]) {
        identifyMissingReports(reports, teamId);
      }
      
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingMissing(false);
    }
  };

  // This function is used for fetching team members when team is selected in filter
  const fetchTeamMembersForStatus = async (teamId) => {
    if (!teamId || teamId === 'all' || !currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id, company_id, teams:team_id (id, name)')
        .eq('team_id', teamId)
        .eq('company_id', currentCompany?.id) // Filter by company
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTeamMembers(data || []);
      
    } catch (error) {
      console.error('Error fetching team members for status:', error);
    }
  };
  
  // Effect to fetch team members when team filter changes
  useEffect(() => {
    if (selectedTeam !== 'all') {
      fetchTeamMembersForStatus(selectedTeam);
    }
  }, [selectedTeam]);
  
  // Update missing reports when team members data changes
  useEffect(() => {
    if (teamMembers.length > 0 && date === new Date().toISOString().split('T')[0]) {
      identifyMissingReports(reports, userTeamId);
    }
  }, [teamMembers, reports, userTeamId, date]);
  
  // Utility function to check if a team member has submitted a report
  const hasSubmittedReport = (userId) => {
    return reports.some(report => report.users && report.users.id === userId);
  };
  
  const identifyMissingReports = (reportsList, teamId) => {
    // Only run for today's date
    if (date !== new Date().toISOString().split('T')[0]) return;
    
    // Get IDs of users who have submitted reports
    const submittedUserIds = reportsList.map(report => report.users && report.users.id).filter(Boolean);
    
    // Make sure we have team members loaded
    if (teamMembers.length === 0) {
      console.log("No team members loaded yet");
      return;
    }
    
    // Get IDs of users who are on leave
    const onLeaveUserIds = onLeaveMembers.map(member => member.id).filter(Boolean);
    
    // Filter team members who haven't submitted reports and are not on leave
    const missing = teamMembers.filter(
      member => !submittedUserIds.includes(member.id) && !onLeaveUserIds.includes(member.id)
    );
    
    console.log("Team members:", teamMembers.length);
    console.log("Submitted IDs:", submittedUserIds);
    console.log("On leave IDs:", onLeaveUserIds);
    console.log("Missing reports:", missing.length);
    
    setMissingReports(missing);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(date);
    
    // If today's date is selected, also refresh team members data
    if (date === new Date().toISOString().split('T')[0] && userTeamId) {
      await fetchTeamMembers(userTeamId);
    }
    
    setTimeout(() => setRefreshing(false), 600); // Add a small delay for animation
    setCurrentReportIndex(0); // Reset to first report after refresh
  };
  
  const handleDragStart = (e) => {
    setDragStart(e.clientX);
  };

  const handleDragEnd = (e) => {
    setDragEnd(e.clientX);
    const dragDistance = dragStart - dragEnd;
    
    if (Math.abs(dragDistance) > 50) { // Minimum drag distance to trigger slide
      if (dragDistance > 0 && currentReportIndex < filteredReports.length - 1) {
        nextReport();
      } else if (dragDistance < 0 && currentReportIndex > 0) {
        prevReport();
      }
    }
  };

  const nextReport = () => {
    if (currentReportIndex < filteredReports.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('right');
      setCurrentReportIndex(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };
  
  const prevReport = () => {
    if (currentReportIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('left');
      setCurrentReportIndex(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };
  
  // Toggle fullscreen modal
  const openFullscreenModal = () => {
    setShowFullscreenModal(true);
    // Lock body scroll when fullscreen modal is open
    document.body.style.overflow = 'hidden';
  };
  
  // Close fullscreen modal
  const closeFullscreenModal = () => {
    setShowFullscreenModal(false);
    // Restore body scroll when fullscreen modal is closed
    document.body.style.overflow = 'auto';
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'carousel' ? 'list' : 'carousel');
  };
  
  const handleNewReport = () => {
    navigate('/report');
  };

  // Filter reports by team and user
  const filteredReports = reports.filter(report => {
    const matchesTeam = selectedTeam === 'all' || (report.users && report.users.teams && report.users.teams.id === selectedTeam);
    const matchesUser = !selectedUser || (report.users && report.users.id === selectedUser);
    return matchesTeam && matchesUser;
  });

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if date is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Fetch on-leave count
  const fetchOnLeaveCount = async () => {
    // Don't fetch if company context is not available yet or is loading
    if (companyLoading || !currentCompany?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error, count } = await supabase
        .from('leave_plans')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')
        .eq('company_id', currentCompany.id) // Filter by company
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) throw error;
      setOnLeaveCount(count || 0);
    } catch (error) {
      console.error('Error fetching on-leave count:', error.message);
    }
  };

  // Fetch announcements count
  const fetchAnnouncementsCount = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      // Don't fetch if company context is not available yet or is loading
      if (!user || companyLoading || !currentCompany?.id) return setAnnouncementsCount(0);

      // Fetch all announcements for the current company
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select(`id, team_id, expiry_date, company_id, announcement_reads:announcement_reads!announcement_reads_announcement_id_fkey(user_id, read)`)
        .eq('company_id', currentCompany.id) // Filter by company
        .gte('expiry_date', new Date().toISOString());
      if (annError) throw annError;

      // Only count announcements that are not read by this user
      const unreadCount = (announcements || []).filter(a => {
        const readEntry = (a.announcement_reads || []).find(r => r.user_id === user.id);
        return !readEntry || !readEntry.read;
      }).length;
      setAnnouncementsCount(unreadCount);
    } catch (error) {
      console.error('Error fetching announcements count:', error.message);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOnLeaveCount();
    fetchAnnouncementsCount();
    fetchNewMessagesCount();
    fetchProjectCount();
    
    // Set up interval to refresh message count every 30 seconds
    const messageCountInterval = setInterval(fetchNewMessagesCount, 30000);
    
    // Add event listener to update counts when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible, refresh counts
        fetchNewMessagesCount();
        fetchAnnouncementsCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup interval and event listener on unmount
    return () => {
      if (messageCountInterval) {
        clearInterval(messageCountInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch available and on-leave members when userTeamId is available
  useEffect(() => {
    if (userTeamId && currentCompany?.id) {
      fetchOnLeaveMembers();
    }
  }, [userTeamId, currentCompany?.id]);
  
  // Function to fetch new messages count for the user
  const fetchNewMessagesCount = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setNewMessagesCount(0);

      // Try multiple approaches to get conversations for user
      let conversations = [];
      let approachUsed = 'none';
      
      // Approach 1: Try chat_participants table
      try {
        const result = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('user_id', user.id);
          
        if (!result.error && result.data && result.data.length > 0) {
          conversations = result.data;
          approachUsed = 'chat_participants';
        } else if (result.error) {
          console.warn('chat_participants query failed:', result.error.message);
        }
      } catch (error) {
        console.warn('Error with chat_participants approach:', error.message);
      }

      // Approach 2: Try chat_conversation_list table if first approach failed
      if (conversations.length === 0) {
        try {
          const result = await supabase
            .from('chat_conversation_list')
            .select('id as conversation_id')
            .eq('participant_user_id', user.id);
            
          if (!result.error && result.data && result.data.length > 0) {
            conversations = result.data;
            approachUsed = 'chat_conversation_list';
          } else if (result.error) {
            console.warn('chat_conversation_list query failed:', result.error.message);
          }
        } catch (error) {
          console.warn('Error with chat_conversation_list approach:', error.message);
        }
      }

      // Approach 3: Try chat_conversations table if previous approaches failed
      if (conversations.length === 0) {
        try {
          const result = await supabase
            .from('chat_conversations')
            .select('id as conversation_id')
            .contains('participants', [user.id]); // Assuming participants is an array column
            
          if (!result.error && result.data && result.data.length > 0) {
            conversations = result.data;
            approachUsed = 'chat_conversations';
          } else if (result.error) {
            console.warn('chat_conversations query failed:', result.error.message);
          }
        } catch (error) {
          console.warn('Error with chat_conversations approach:', error.message);
        }
      }

      console.log(`Using approach: ${approachUsed} with ${conversations.length} conversations`);
      
      if (conversations.length === 0) {
        setNewMessagesCount(0);
        return;
      }

      // Get the latest read timestamp for each conversation for this user
      let lastReads = [];
      
      try {
        if (approachUsed === 'chat_participants') {
          const readResult = await supabase
            .from('chat_participants')
            .select('conversation_id, last_read_at')
            .eq('user_id', user.id);
            
          if (!readResult.error) {
            lastReads = readResult.data || [];
          }
        }
      } catch (readQueryError) {
        console.error('Error fetching read status:', readQueryError.message);
      }

      // For each conversation, count messages after the last read timestamp
      let totalCount = 0;
      for (const conv of conversations) {
        try {
          const convId = conv.conversation_id;
          
          // Find the last read time for this conversation
          const lastReadRecord = lastReads && lastReads.find(lr => lr.conversation_id === convId);
          const lastReadTime = lastReadRecord && lastReadRecord.last_read_at;

          // Count messages in this conversation after last read time
          let query = supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true });

          if (lastReadTime) {
            query = query.gt('created_at', lastReadTime);
          }

          const { count, error: msgError } = await query
            .eq('conversation_id', convId)
            .neq('user_id', user.id); // Exclude messages sent by the user themselves

          if (msgError) {
            console.error(`Error fetching messages for conversation ${convId}:`, msgError.message);
          } else if (count !== null) {
            totalCount += count;
          }
        } catch (convError) {
          console.error(`Error processing conversation ${conv.conversation_id}:`, convError.message);
          // Continue with other conversations even if one fails
        }
      }

      setNewMessagesCount(totalCount);
    } catch (error) {
      console.error('Unexpected error in fetchNewMessagesCount:', error);
      // Set count to 0 but don't crash the dashboard
      setNewMessagesCount(0);
    }
  };
  
  // Function to fetch project count for the user
  const fetchProjectCount = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) return setProjectCount(0);

      // Query to get projects assigned to the user in their company
      const { count, error } = await supabase
        .from('project_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching project assignments:', error);
        // Try alternative query: get projects where user is a team member
        const { count: altCount, error: altError } = await supabase
          .from('project_teams')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (altError) {
          console.error('Error fetching project teams:', altError);
          setProjectCount(0);
          return;
        }
        
        setProjectCount(altCount || 0);
      } else {
        setProjectCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchProjectCount:', error);
      setProjectCount(0);
    }
  };

  // Function to scroll to missing reports section
  const scrollToMissingReports = () => {
    const element = document.getElementById('missing-reports-header');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to fetch on-leave members and available members
  const fetchOnLeaveMembers = async () => {
    try {
      // Guard clause - don't proceed if company context is not available
      if (!currentCompany?.id) {
        console.warn('Company context not available, skipping fetchOnLeaveMembers');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Fetch on-leave members
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_plans')
        .select(`
          id,
          users:user_id (id, name, avatar_url, role, company_id, teams:team_id (id, name))
        `)
        .eq('status', 'approved')
        .eq('users.company_id', currentCompany.id) // Filter by company
        .lte('start_date', today)
        .gte('end_date', today);

      if (leaveError) {
        console.error('Error fetching on-leave members:', leaveError);
        throw leaveError;
      }
      
      const onLeaveUserIds = leaveData.map(item => item.users && item.users.id).filter(Boolean);
      setOnLeaveMembers(leaveData.map(item => item.users).filter(Boolean));
      
      // Fetch all team members to determine available ones
      if (userTeamId) {
        const { data: allMembers, error: membersError } = await supabase
          .from('users')
          .select('id, name, avatar_url, role, company_id, teams:team_id (id, name)')
          .eq('team_id', userTeamId)
          .eq('company_id', currentCompany.id); // Filter by company
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
        } else {
          // Filter out on-leave members to get available members
          const available = allMembers.filter(member => !onLeaveUserIds.includes(member.id));
          setAvailableMembers(available);
        }
      }
    } catch (error) {
      console.error('Error in fetchOnLeaveMembers:', error);
    }
  };

  // Scroll-based header hiding mechanism removed

  // When showing the missing header, don't scroll it into view
  useEffect(() => {
    // Removed auto-scrolling effect
  }, [showMissingHeader]);



  // Professional Dashboard Header component with Missing Reports summary
  const DashboardHeader = () => {
    // Calculate completion percentage for reports, excluding on-leave users
    const reportCompletionPercentage = teamMembers.length > 0 
      ? onLeaveMembers.length > 0
        ? Math.round(((teamMembers.length - missingReports.length - onLeaveMembers.length) / (teamMembers.length - onLeaveMembers.length)) * 100) 
        : Math.round(((teamMembers.length - missingReports.length) / teamMembers.length) * 100)
      : 0;
      
    return (
      <div className="space-y-8 mb-8">

        {/* Premium Quick Actions - Completely Redesigned */}
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 relative overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={statCardVariants}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-rose-400/10 rounded-full blur-3xl animate-pulse delay-1500" />
          </div>

          <div className="relative z-10">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Premium Quick Actions - Completely Redesigned */}
                <div className="md:col-span-3">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-sm text-white shadow-xl shadow-cyan-500/20 border border-white/20"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <FiZap className="w-6 h-6" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Quick Actions</h3>
                        <p className="text-gray-600 text-sm mt-1">Accelerate your workflow with one-click actions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Enhanced Team Availability Indicators - Clickable to open modal */}
                      <motion.button
                        className="p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 shadow-md flex items-center gap-2 cursor-pointer group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Click to view team availability details"
                        onClick={async () => {
                          // Ensure we have userTeamId
                          let currentTeamId = userTeamId;
                          if (!currentTeamId) {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              const { data: userData, error } = await supabase
                                .from('users')
                                .select('team_id')
                                .eq('id', user.id)
                                .single();
                              if (!error && userData) {
                                currentTeamId = userData.team_id;
                                setUserTeamId(currentTeamId);
                              }
                            }
                          }
                          
                          if (currentTeamId) {
                            await fetchOnLeaveMembers();
                          }
                          
                          setTimeout(() => {
                            setShowOnLeaveModal(true);
                          }, 100);
                        }}
                      >
                        {/* Available members indicator */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full bg-emerald-500"
                            title={`Available: ${availableMembers.length} team members`}
                          >
                          </div>
                          <span className="text-xs font-bold text-emerald-700">{availableMembers.length}</span>
                        </div>
                        
                        <div className="w-0.5 h-4 bg-gray-300"></div>
                        
                        {/* On leave members indicator */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full bg-amber-500"
                            title={`On Leave: ${onLeaveMembers.length} team members`}
                          >
                          </div>
                          <span className="text-xs font-bold text-amber-700">{onLeaveMembers.length}</span>
                        </div>
                      </motion.button>

                      {/* Create User button - Manager only */}
                      {userRole === 'manager' && (
                        <motion.button
                          onClick={() => navigate('/create-user')}
                          className="relative p-2.5 rounded-lg bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 text-blue-600 hover:bg-blue-500/30 hover:border-blue-500/50 transition-all shadow-md hover:shadow-blue-500/25 hover:shadow-lg"
                          title="Create New User"
                          whileHover={{ scale: 1.1, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="relative">
                            <FiUserPlus className="w-4 h-4" />
                            {/* Neon glow effect */}
                            <motion.div
                              className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"
                              initial={false}
                              animate={{ opacity: 0 }}
                              whileHover={{ opacity: 0.4 }}
                            />
                          </div>
                        </motion.button>
                      )}

                      <motion.button
                        onClick={() => navigate('/notifications')}
                        className="relative p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all shadow-md"
                        title="Notifications"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiBell className="w-5 h-5" />
                        {announcementsCount > 0 && (
                          <motion.span 
                            className="absolute -top-2 -right-2 text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-2 py-1 min-w-[20px] h-[20px] flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-sm"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                '0 0 0 8px rgba(239, 68, 68, 0)',
                                '0 0 0 0 rgba(239, 68, 68, 0.4)'
                              ]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2
                            }}
                          >
                            {announcementsCount > 99 ? '99+' : announcementsCount}
                          </motion.span>
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={handleRefresh}
                        className="p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all shadow-md"
                        title="Refresh Dashboard"
                        whileHover={{ scale: 1.1, y: -2, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Action Cards Row - Horizontal scroll, no wrapping */}
<div className="flex flex-nowrap gap-4 overflow-x-auto pt-6 pb-10 snap-x snap-mandatory no-scrollbar">
                    {[
                      { 
                        key: 'chat', 
                        icon: (
                          <motion.div
                            initial={{ rotate: -15 }}
                            animate={{ rotate: [ -15, 15, -15 ] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </motion.div>
                        ), 
                        onClick: () => navigate('/chat'), 
                        label: 'Communications', 
                        gradient: 'from-indigo-600 to-purple-600',
                        bg: 'bg-indigo-500/15',
                        border: 'border-indigo-500/40',
                        glow: 'shadow-indigo-500/30',
                        hoverText: 'Open communications center',
                        count: newMessagesCount > 0 ? newMessagesCount : null
                      },
                      { 
                        key: 'notes', 
                        icon: <FiFileText className="w-6 h-6" />, 
                        onClick: () => navigate('/notes'), 
                        label: 'Notes', 
                        gradient: 'from-emerald-500 to-teal-600',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/30',
                        glow: 'shadow-emerald-500/20',
                        hoverText: 'Take and manage notes'
                      },
                      { 
                        key: 'tasks', 
                        icon: <FiList className="w-6 h-6" />, 
                        onClick: () => navigate('/tasks?assignee=me'), 
                        label: 'My Tasks', 
                        gradient: 'from-blue-500 to-indigo-600',
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/30',
                        glow: 'shadow-blue-500/20'
                      },
                      // Removed 'report' card as requested
                      {
                        key: 'projects',
                        icon: <FiGrid className="w-6 h-6" />,
                        onClick: () => navigate('/projects'),
                        label: 'Projects',
                        gradient: 'from-purple-500 to-fuchsia-600',
                        bg: 'bg-purple-500/10',
                        border: 'border-purple-500/30',
                        glow: 'shadow-purple-500/20',
                        count: projectCount,
                        hoverText: `You are assigned to ${projectCount} project${projectCount !== 1 ? 's' : ''}`
                      },

                      {
                        key: 'team-management',
                        icon: <FiUsers className="w-6 h-6" />,
                        onClick: () => navigate('/team-management'),
                        label: 'Manage Team',
                        gradient: 'from-teal-500 to-cyan-600',
                        bg: 'bg-teal-500/10',
                        border: 'border-teal-500/30',
                        glow: 'shadow-teal-500/20',
                        hoverText: 'Manage team members and roles'
                      },

                      {
                        key: 'ach', 
                        icon: <FiAward className="w-6 h-6" />, 
                        onClick: () => navigate('/achievements'), 
                        label: 'Achievements', 
                        gradient: 'from-amber-500 to-orange-600',
                        bg: 'bg-amber-500/10',
                        border: 'border-amber-500/30',
                        glow: 'shadow-amber-500/20'
                      },                 
                     
                      { 
                        key: 'analytics',
                        icon: <FiBarChart2 className="w-6 h-6" />,
                        onClick: () => navigate('/analytics-dashboard'),
                        label: 'Analytics',
                        gradient: 'from-rose-500 to-red-600',
                        bg: 'bg-rose-500/10',
                        border: 'border-rose-500/30',
                        glow: 'shadow-rose-500/20',
                        hoverText: 'View my analytics'
                      },
                   
                      { 
                        key: 'profile', 
                        icon: <FiUser className="w-6 h-6" />, 
                        onClick: () => navigate('/profile'), 
                        label: 'Profile', 
                        gradient: 'from-fuchsia-500 to-pink-600',
                        bg: 'bg-fuchsia-500/10',
                        border: 'border-fuchsia-500/30',
                        glow: 'shadow-fuchsia-500/20'
                      }
                    ].filter(Boolean).map((action, index) => (
                      <motion.div
                        key={action.key}
                        className="group relative flex-none w-48 sm:w-56 md:w-60 snap-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, zIndex: 10 }}
                      >
                        <motion.button
                          onClick={action.onClick}
                          className={`w-full h-28 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden border border-white/30 shadow-md bg-white/20 hover:shadow-lg hover:bg-white/30`}
                          whileHover={{ 
                            scale: 1.05,
                            y: -5,
                            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.05)`
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Animated background on hover */}
                          <motion.div 
                            className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                          />
                          
                          {/* Icon container with gradient background */}
                          <motion.div 
                            className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg relative z-10 border border-white/20 backdrop-blur-sm`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            {action.icon}
                            {/* Show count badge for actions that have counts */}
                            {action.count !== undefined && action.count !== null && (
                              <motion.span 
                                className="absolute -top-1 -right-1 text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-sm"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                {action.count > 99 ? '99+' : action.count}
                              </motion.span>
                            )}
                          </motion.div>
                          
                          {/* Label with animated underline */}
                          <div className="relative z-10 w-full flex flex-col items-center">
                            <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                              {action.label}
                            </span>
                            
                            {/* Subtext for team status */}
                            {action.subText && (
                              <span className="text-[10px] text-gray-500 mt-0.5">
                                {action.subText}
                              </span>
                            )}
                            
                            {/* Animated underline */}
                            <motion.div 
                              className={`h-0.5 bg-gradient-to-r ${action.gradient} rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                              initial={{ width: 0 }}
                              whileHover={{ width: '100%' }}
                            />
                          </div>
                          
                          {/* Pulse animation on hover */}
                          <motion.div 
                            className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0, 0.3, 0]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity
                            }}
                          />
                        </motion.button>
                        
                        {/* Floating tooltip */}
                        <motion.div 
                          className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${action.gradient} text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl pointer-events-none`}
                          initial={{ y: 10 }}
                          whileHover={{ opacity: 1, y: 0 }}
                        >
                          {action.hoverText || action.label}
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 ${action.gradient} rotate-45`}></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Compact Missing Reports Summary */}
        <AnimatePresence initial={false}>
          {showMissingHeader && (
            <motion.div
              id="missing-reports-header"
              className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              layout
            >
          {/* Compact Header with orange theme */}
          <div className="px-4 py-2 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500">
                  <FiAlertCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-orange-800">Missing Reports</h3>
                </div>
              </div>
              {isToday(date) && missingReports.length > 0 && (
                <motion.button
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 shadow-sm shadow-orange-200"
                  onClick={() => setShowMissingModal(true)}
                  whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiUsers className="h-2.5 w-2.5" />
                  <span>View</span>
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Compact Missing Reports List */}
          {isToday(date) && missingReports.length > 0 && (
            <div className="px-4 py-3 bg-white/50">
              {showAllMissingReports ? (
                // Vertical layout when showing all - using flex wrap for multiple rows
                <div className="flex flex-wrap gap-2">
                  {missingReports.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          delay: index * 0.03
                        }
                      }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25
                      }}
                      layout
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100/70 cursor-pointer hover:border-orange-300 hover:shadow-sm hover:shadow-orange-100/50 transition-all duration-300 group relative overflow-hidden"
                        onClick={() => navigate(`/profile/${member.id}`)}
                        title={`${member.name} - Missing report`}
                      >
                        {/* Animated background on hover */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="relative z-10">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-6 h-6 rounded-full object-cover border-2 border-orange-200 group-hover:border-orange-300 transition-colors"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-xs border-2 border-orange-200 group-hover:border-orange-300 transition-colors">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-20 group-hover:text-orange-700 transition-colors relative z-10">
                          {member.name}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  <motion.button
                    type="button"
                    className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl border border-orange-200/70 hover:from-orange-200 hover:to-amber-200 transition-all duration-300"
                    onClick={() => {
                      setIsAnimating(true);
                      setShowAllMissingReports(false);
                      setTimeout(() => setIsAnimating(false), 300);
                    }}
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xs font-semibold text-orange-700">Show Less</span>
                  </motion.button>
                </div>
              ) : (
                // Horizontal layout when showing limited items
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                  {missingReports.slice(0, 6).map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      layout
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100/70 cursor-pointer hover:border-orange-300 hover:shadow-sm hover:shadow-orange-100/50 transition-all duration-300 group flex-shrink-0 relative overflow-hidden"
                        onClick={() => navigate(`/profile/${member.id}`)}
                        title={`${member.name} - Missing report`}
                      >
                        {/* Animated background on hover */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="relative z-10">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-6 h-6 rounded-full object-cover border-2 border-orange-200 group-hover:border-orange-300 transition-colors"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-xs border-2 border-orange-200 group-hover:border-orange-300 transition-colors">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-20 group-hover:text-orange-700 transition-colors relative z-10">
                          {member.name}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {missingReports.length > 6 && (
                    <motion.button
                      type="button"
                      className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl border border-orange-200/70 hover:from-orange-200 hover:to-amber-200 transition-all duration-300 flex-shrink-0"
                      onClick={() => {
                        setIsAnimating(true);
                        setShowAllMissingReports(true);
                        setTimeout(() => setIsAnimating(false), 300);
                      }}
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-xs font-semibold text-orange-700">+{missingReports.length - 6}</span>
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div 
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Apple-Style Glassmorphic Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-16 ${sidebarOpen ? 'left-64' : 'left-20'} right-0 z-30 transition-all duration-200 apple-glass`}
        id="dashboard-header"
        style={{
          width: `calc(100% - ${sidebarOpen ? '16rem' : '5rem'})`,
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), left 200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Apple-style background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/72 via-white/85 to-white/72 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 via-transparent to-blue-50/20"></div>

        {/* Subtle border highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>

        {/* Apple-style floating elements */}
        <div className="absolute top-8 left-12 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl"></div>
        <div className="absolute top-6 right-16 w-24 h-24 bg-purple-400/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-8 left-1/3 w-28 h-28 bg-cyan-400/5 rounded-full blur-xl"></div>

        <div className="relative z-10 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left section - User information */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <motion.div
                className="relative group flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute -inset-1 bg-white/80 rounded-2xl shadow-lg transition-shadow group-hover:shadow-xl"></div>
                <div className="relative p-0.5 rounded-2xl border border-white/60">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User avatar"
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover border border-gray-200/50"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 flex items-center justify-center">
                      <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="min-w-0"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {userName || 'User'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <FiCalendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <p className="text-xs text-gray-600 truncate">
                    {format(currentTime, 'MMM d, yyyy')}
                  </p>
                </div>
              </motion.div>
            </div>

          

            {/* Right section - Apple-style action buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              {/* Team button */}
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  let currentTeamId = userTeamId;
                  if (!currentTeamId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data: userData, error } = await supabase
                        .from('users')
                        .select('team_id')
                        .eq('id', user.id)
                        .single();
                      if (!error && userData) {
                        currentTeamId = userData.team_id;
                        setUserTeamId(currentTeamId);
                      }
                    }
                  }

                  if (currentTeamId) {
                    await fetchOnLeaveMembers();
                  }

                  setTimeout(() => {
                    setShowOnLeaveModal(true);
                  }, 100);
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 apple-glass-card border border-white/40 text-gray-700 hover:text-gray-900 rounded-full text-sm font-medium transition-all shadow-sm"
              >
                <FiUsers className="w-4 h-4" />
                <span className="truncate max-w-20">{userTeamName || 'Team'}</span>
              </motion.button>

              {/* Report reminder button */}
              {isToday(date) && userId && !reports.some(report => report.users && report.users.id === userId) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 20,
                    delay: 0.5
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.3)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-red-700 border border-gray-200 rounded-full text-sm font-medium transition-all shadow-md"
                >
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0 text-red-700" />
                  <span className="hidden sm:inline block text-center leading-none">Report</span>
                </motion.button>
              )}

              {/* Time display */}
              <motion.div
                className="flex items-center gap-2 px-4 py-2 apple-glass-card border border-white/40 rounded-full shadow-sm"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <div className="text-sm font-mono font-semibold text-gray-800">
                  {format(currentTime, 'h:mm')}
                </div>
                <div className="text-xs font-medium text-gray-600">
                  {format(currentTime, 'a').toLowerCase()}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Apple-style custom CSS */}
      <style jsx>{`
        .apple-glass {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .apple-glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
      `}</style>
      {/* Spacer to prevent content overlap */}
      <div className="h-20" />

      {/* Dashboard Header with Missing Reports Component */}
      <div className="container mx-auto px-6 pt-6">
        <DashboardHeader />
      </div>

      {/* Main Content: Daily Reports View with Carousel and Missing Reports */}
      <div className="grid grid-cols-1 gap-6 w-full mt-6 px-6">
        
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ 
              boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.05)",
              y: -3, 
              transition: { type: "spring", stiffness: 400, damping: 15 }
            }}
          >
            {/* Glass overlay decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl"></div>
            
            {/* Header */}
            <div className="relative p-4 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <motion.h2 
                  className="text-2xl font-bold text-gray-800 flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-md text-white">
                    <FiFileText className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">
                    Daily Standup Reports
                  </span>
                </motion.h2>
                
                {/* Quick Stats Bar */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium">
                    <FiFileText className="w-3 h-3" />
                    <span>{reports.length}</span>
                    <span className="text-blue-600 ml-1">Reports</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium">
                    <FiCheckCircle className="w-3 h-3" />
                    <span>{teamMembers.length - missingReports.length}</span>
                    <span className="text-emerald-600 ml-1">Submitted</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
                    <FiAlertCircle className="w-3 h-3" />
                    <span>{missingReports.length}</span>
                    <span className="text-amber-600 ml-1">Missing</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
                  {/* Filter button moved here from top section */}
                  <motion.button
                    className={`p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors relative ${activeFilter ? 'border-primary-300 text-primary-600 bg-primary-50' : ''}`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    animate={activeFilter ? "active" : ""}
                    onClick={() => {
                      setShowFilters(!showFilters);
                      setActiveFilter(!activeFilter);
                    }}
                  >
                    <FiFilter className={showFilters ? "text-primary-600" : ""} />
                    {activeFilter && (
                      <motion.span 
                        className="absolute -top-1 -right-1 bg-primary-500 rounded-full w-2 h-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      />
                    )}
            </motion.button>
                  
                  {/* View mode switcher - redesigned */}
                  <motion.div 
                    className="relative overflow-hidden border border-indigo-200 rounded-full flex items-center p-1 bg-white shadow-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div 
                      className="absolute top-1 bottom-1 rounded-full bg-indigo-100"
                      variants={switchVariants}
                      animate={viewMode === 'carousel' ? 'list' : 'grid'}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: '48%', height: '85%', left: viewMode === 'list' ? '1%' : '51%' }}
                    />
          <motion.button
                      className={`relative z-10 flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        viewMode === 'list' 
                          ? 'text-indigo-700' 
                          : 'text-gray-600'
                      }`}
            whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setViewMode('list')}
                    >
                      <FiList className={viewMode === 'list' ? 'text-indigo-600' : 'text-gray-500'} />
                      <span>List</span>
          </motion.button>
          <motion.button
                      className={`relative z-10 flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        viewMode === 'carousel' 
                          ? 'text-indigo-700' 
                          : 'text-gray-600'
                      }`}
            whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setViewMode('carousel')}
                    >
                      <FiGrid className={viewMode === 'carousel' ? 'text-indigo-600' : 'text-gray-500'} />
                      <span>Cards</span>
                    </motion.button>
                  </motion.div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {viewMode === 'carousel' && filteredReports.length > 0 && (
                      <motion.button
                        className="p-2.5 rounded-full border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors flex items-center justify-center"
                        whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
                        onClick={openFullscreenModal}
          >
                        <FiMaximize />
          </motion.button>
                    )}
          
          <motion.button
                      className="p-2.5 rounded-full border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 shadow-sm transition-colors flex items-center justify-center"
                      whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
                      onClick={handleNewReport}
          >
                      <FiPlus />
          </motion.button>

          {/* Report History Button */}
                      <motion.button
                        onClick={() => navigate('/history')}
                        title="Report History"
                        className="relative p-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 backdrop-blur-sm"
                        whileHover={{
                          scale: 1.1,
                          y: -1,
                          boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.3), 0 10px 10px -5px rgba(79, 70, 229, 0.2)'
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Animated background gradient on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
                        />

                        {/* Icon container */}
                        <div className="relative z-10">
                          <FiClock className="w-4 h-4" />
                        </div>

                        {/* Subtle glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 opacity-0 hover:opacity-20 blur-md transition-opacity duration-300"
                        />
                      </motion.button>
        </div>
                </div>
              </div>
            </div>

            {/* Modern Filter Section with enhanced design and user avatars */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
                  className="bg-gradient-to-br from-slate-50 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-6 mt-4 overflow-hidden"
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Decorative background elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/15 to-purple-400/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-blue-400/15 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Filter with avatar display */}
              <motion.div 
                className="space-y-2"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                whileHover="active"
              >
                <label htmlFor="user-filter" className="block text-sm font-semibold text-slate-700">
                  User
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="user-filter"
                    value={selectedUser || 'all'}
                    onChange={(e) => setSelectedUser(e.target.value === 'all' ? null : e.target.value)}
                    className="pl-10 pr-10 py-3 border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 block w-full shadow-sm text-sm bg-white/90 backdrop-blur-sm appearance-none"
                  >
                    <option value="all">All Users</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  
                  {/* Avatar preview for selected user */}
                  {selectedUser && (
                    <div className="absolute inset-y-0 right-8 flex items-center">
                      {(() => {
                        const user = teamMembers.find(m => m.id === selectedUser);
                        return user ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.name} 
                                className="w-6 h-6 rounded-full object-cover border border-white/80"
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Team Filter */}
              <motion.div 
                className="space-y-2"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                whileHover="active"
                transition={{ delay: 0.1 }}
              >
                <label htmlFor="team-filter" className="block text-sm font-semibold text-slate-700">
                  Team
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <FiUsers className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="team-filter"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="pl-10 pr-10 py-3 border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 block w-full shadow-sm text-sm bg-white/90 backdrop-blur-sm appearance-none"
                  >
                    <option value="all">All Teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
              
              {/* Date Filter */}
              <motion.div 
                className="space-y-2"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                whileHover="active"
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="date-filter" className="block text-sm font-semibold text-slate-700">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="date"
                    id="date-filter"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 pr-3 py-3 border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 block w-full shadow-sm text-sm bg-white/90 backdrop-blur-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-6 flex justify-end gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                className="px-6 py-3 border border-slate-300 text-slate-700 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm font-medium transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowFilters(false);
                }}
              >
                <FiX className="h-4 w-4" />
                <span>Cancel</span>
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 font-medium transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleRefresh();
                  setShowFilters(false);
                }}
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Apply Filters</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            
            
            
            {/* Reports Content */}
            <div className="p-4 bg-white/90 backdrop-blur-sm min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-4 rounded-full border-t-2 border-emerald-500 animate-spin animate-delay-300"></div>
                    <div className="absolute inset-8 rounded-full border-t-2 border-amber-500 animate-spin animate-delay-500"></div>
                  </div>
                  <p className="mt-4 text-gray-500 animate-pulse">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="w-20 h-20 mb-4 text-gray-300">
                    <FiFileText className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No reports found</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    {isToday(date) ? 
                      "No standup reports have been submitted for today yet." : 
                      `No standup reports were found for ${formatDate(date)}.`}
                  </p>
          <motion.button
                    onClick={handleNewReport}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Your Report
          </motion.button>
                </motion.div>
              ) : viewMode === 'carousel' ? (
                <div className="relative">
                  <AnimatePresence mode="wait">
              <motion.div
                key={currentReportIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative"
                    >
                      <div className="bg-gradient-to-b from-indigo-50/50 to-transparent rounded-xl overflow-hidden p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
                          <div className="flex items-center gap-3">
                            {filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.image_url ? (
                              <img
                                src={filteredReports[currentReportIndex].users.image_url}
                                alt={filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-medium shadow-sm">
                                {filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.name && filteredReports[currentReportIndex].users.name.charAt(0) || "U"}
                        </div>
                            )}
                        <div>
                              <h3 className="font-semibold text-gray-900">
                                {filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.name || "Unknown User"}
                              </h3>
                              <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                <FiClock className="h-3 w-3" />
                                <span>
                                  {filteredReports[currentReportIndex].created_at 
                                    ? format(new Date(filteredReports[currentReportIndex].created_at), "MMM d, h:mm a") 
                                    : "Unknown time"}
                                </span>
                          </div>
                        </div>
                      </div>
                      
                          <div className="ml-auto flex flex-wrap gap-2 items-center">
                            {filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.teams && filteredReports[currentReportIndex].users.teams.name && (
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium inline-flex items-center">
                                <FiUsers className="mr-1 h-3 w-3" />
                                {filteredReports[currentReportIndex].users.teams.name}
                              </span>
                            )}
                            
                            {(() => {
                              const blockers = filteredReports[currentReportIndex]?.blockers;
                              const isEmptyContent = !blockers ||
                                                    blockers === null ||
                                                    blockers === undefined ||
                                                    blockers.toString().trim() === '' ||
                                                    blockers.toString().trim() === '<p></p>' ||
                                                    blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                              const hasBlockers = !isEmptyContent;
                              return (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                                  hasBlockers
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {hasBlockers
                                    ? <FiAlertCircle className="mr-1 h-3 w-3" />
                                    : <FiCheckCircle className="mr-1 h-3 w-3" />}
                                  {hasBlockers ? "Has Blockers" : "No Blockers"}
                                </span>
                              );
                            })()}
                          </div>
                    </div>
                    
                        <div className={`grid gap-6 flex-1 ${(() => {
                          const blockers = filteredReports[currentReportIndex]?.blockers;
                          const isEmptyContent = !blockers ||
                                                blockers === null ||
                                                blockers === undefined ||
                                                blockers.toString().trim() === '' ||
                                                blockers.toString().trim() === '<p></p>' ||
                                                blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                          return !isEmptyContent ? 'md:grid-cols-3' : 'md:grid-cols-2';
                        })()}`}>
                        <motion.div 
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className="bg-indigo-600 text-white px-4 py-1">
                              <h4 className="font-medium flex items-center justify-center text-sm">
                                <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">1</span>
                            Yesterday
                          </h4>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 h-[273px] flex flex-col group-hover:from-indigo-100 group-hover:to-indigo-50 transition-colors">
                              <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                                {filteredReports[currentReportIndex].yesterday ? (
                                  <RichTextDisplay 
                                    content={filteredReports[currentReportIndex].yesterday}
                                    onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }}
                                  />
                                ) : (
                                  <span className="italic text-gray-400 flex items-center gap-2">
                                    <FiInfo className="h-4 w-4" />
                                    No update provided
                                  </span>
                                )}
                              </div>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className="bg-emerald-600 text-white px-4 py-1">
                              <h4 className="font-medium flex items-center justify-center text-sm">
                                <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">2</span>
                            Today
                          </h4>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 h-[273px] flex flex-col group-hover:from-emerald-100 group-hover:to-emerald-50 transition-colors">
                              <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                                {filteredReports[currentReportIndex].today ? (
                                  <RichTextDisplay 
                                    content={filteredReports[currentReportIndex].today}
                                    onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }}
                                  />
                                ) : (
                                  <span className="italic text-gray-400 flex items-center gap-2">
                                    <FiInfo className="h-4 w-4" />
                                    No update provided
                                  </span>
                                )}
                              </div>
                          </div>
                        </motion.div>

                        {(() => {
                          const blockers = filteredReports[currentReportIndex]?.blockers;
                          const isEmptyContent = !blockers ||
                                                blockers === null ||
                                                blockers === undefined ||
                                                blockers.toString().trim() === '' ||
                                                blockers.toString().trim() === '<p></p>' ||
                                                blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                          return !isEmptyContent;
                        })() && (
                          <motion.div
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -3 }}
                          >
                            <div className="px-4 py-1 text-white bg-amber-600">
                              <h4 className="font-medium flex items-center justify-center text-sm">
                                <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">3</span>
                            Blockers
                          </h4>
                            </div>
                            <div className="p-5 h-[273px] flex flex-col transition-colors bg-gradient-to-br from-amber-50 to-amber-100/50 group-hover:from-amber-100 group-hover:to-amber-50">
                              <div className="flex-1 overflow-y-auto custom-scrollbar px-1 text-amber-700">
                                <RichTextDisplay
                                  content={filteredReports[currentReportIndex].blockers}
                                  onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }}
                                />
                              </div>
                          </div>
                        </motion.div>
                      )}
                      </div>
                    </div>
              </motion.div>
            </AnimatePresence>
                  
                  {/* Navigation controls */}
                  <div className="flex justify-between mt-6">
                <motion.button 
                      onClick={prevReport}
                      disabled={filteredReports.length <= 1}
                      className={`p-3 rounded-full shadow-md flex items-center justify-center ${
                        filteredReports.length <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      } transition-all`}
                      whileHover={filteredReports.length > 1 ? { scale: 1.1 } : {}}
                      whileTap={filteredReports.length > 1 ? { scale: 0.9 } : {}}
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </motion.button>
                    
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-gray-600">
                        {filteredReports.length > 0 ? `${currentReportIndex + 1} of ${filteredReports.length}` : '0 of 0'}
                      </span>
        </div>
                    
                    <motion.button 
                      onClick={nextReport}
                      disabled={filteredReports.length <= 1}
                      className={`p-3 rounded-full shadow-md flex items-center justify-center ${
                        filteredReports.length <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                      } transition-all`}
                      whileHover={filteredReports.length > 1 ? { scale: 1.1 } : {}}
                      whileTap={filteredReports.length > 1 ? { scale: 0.9 } : {}}
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </motion.button>
          </div>
                </div>
              ) : (
                // List view
        <motion.div 
                  className="flex flex-col space-y-4"
                  variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
                  {filteredReports.map((report) => (
            <motion.div 
              key={report.id} 
                      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-5 overflow-hidden"
              variants={itemVariants}
                      whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {report.users && report.users.image_url ? (
                            <img
                              src={report.users.image_url}
                              alt={report.users && report.users.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-medium shadow-sm">
                              {report.users && report.users.name && report.users.name.charAt(0) || "U"}
                    </div>
                            )}
                    <div>
                            <h3 className="font-medium text-gray-900">{report.users && report.users.name || "Unknown User"}</h3>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FiClock className="h-3 w-3" />
                              <span>{report.created_at ? format(new Date(report.created_at), "MMM d, h:mm a") : "Unknown time"}</span>
                    </div>
                  </div>
                </div>
                
                        <div className="flex flex-wrap gap-2 items-center">
                          {report.users && report.users.teams && report.users.teams.name && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium inline-flex items-center">
                              <FiUsers className="mr-1 h-3 w-3" />
                              {report.users.teams.name}
                            </span>
                          )}
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                            (() => {
                              const blockers = report?.blockers;
                              const isEmptyContent = !blockers ||
                                                    blockers === null ||
                                                    blockers === undefined ||
                                                    blockers.toString().trim() === '' ||
                                                    blockers.toString().trim() === '<p></p>' ||
                                                    blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                              return !isEmptyContent ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
                            })()
                          }`}>
                            {(() => {
                            const blockers = report?.blockers;
                            const isEmptyContent = !blockers ||
                                                  blockers === null ||
                                                  blockers === undefined ||
                                                  blockers.toString().trim() === '' ||
                                                  blockers.toString().trim() === '<p></p>' ||
                                                  blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                            const hasBlockers = !isEmptyContent;
                            return (
                              <>
                                {hasBlockers
                                  ? <FiAlertCircle className="mr-1 h-3 w-3" />
                                  : <FiCheckCircle className="mr-1 h-3 w-3" />}
                                {hasBlockers ? "Has Blockers" : "No Blockers"}
                              </>
                            );
                          })()}
                          </span>
                  </div>
                  </div>
                      
                      <div className={`grid gap-3 ${(() => {
                            const blockers = report?.blockers;
                            const isEmptyContent = !blockers ||
                                                  blockers === null ||
                                                  blockers === undefined ||
                                                  blockers.toString().trim() === '' ||
                                                  blockers.toString().trim() === '<p></p>' ||
                                                  blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                            return !isEmptyContent ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
                          })()}`}>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 hover:bg-indigo-100/50 transition-colors">
                          <span className="font-medium text-indigo-700 block mb-0.5 flex items-center justify-center gap-1 text-xs">
                            <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">1</span>
                            Yesterday:
                          </span>
                          <div className="text-gray-700 break-words text-sm">
                            {report.yesterday ? (
                              <RichTextDisplay content={report.yesterday} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                            ) : (
                              <span className="italic text-gray-400">No update</span>
                            )}
                          </div>
                      </div>
                        
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 hover:bg-emerald-100/50 transition-colors">
                          <span className="font-medium text-emerald-700 block mb-0.5 flex items-center justify-center gap-1 text-xs">
                            <span className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700">2</span>
                            Today:
                          </span>
                          <div className="text-gray-700 break-words text-sm">
                            {report.today ? (
                              <RichTextDisplay content={report.today} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                            ) : (
                              <span className="italic text-gray-400">No update</span>
                            )}
                          </div>
                    </div>
                    
                        {(() => {
                            const blockers = report?.blockers;
                            const isEmptyContent = !blockers ||
                                                  blockers === null ||
                                                  blockers === undefined ||
                                                  blockers.toString().trim() === '' ||
                                                  blockers.toString().trim() === '<p></p>' ||
                                                  blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                            return !isEmptyContent;
                          })() && (
                          <div className="rounded-lg p-3 bg-amber-50 border border-amber-100 hover:bg-amber-100/50 hover:bg-opacity-70 transition-colors"> 
                          <span className="font-medium block mb-0.5 flex items-center justify-center gap-1 text-amber-700 text-xs">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-amber-200 text-amber-700">
                              3
                            </span>
                            Blockers:
                          </span>
                          <div className="break-words text-sm text-amber-700">
                            <RichTextDisplay content={report.blockers} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                          </div>
                        </div>
                      )}
                    </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
                    
        {/* Missing Reports Widget - Redesigned to be more compact and professional */}
        <motion.div 
          id="missing-reports-section"
          className="w-full max-w-5xl mx-auto mb-10 hidden"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants} 
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex flex-wrap items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md text-white mr-3">
                  <FiAlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    Missing Reports Today
                  </h2>
                  <p className="text-gray-500 text-sm">Team members who haven't submitted their daily standup</p>
                </div>
              </div>
              
              {isToday(date) && !loadingMissing && (
                <div className="flex items-center mt-2 sm:mt-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center px-3 py-1.5 mr-2">
                    <div className="text-center mr-3 pr-3 border-r border-gray-200">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-lg text-indigo-700">{teamMembers.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Missing</div>
                      <div className="font-bold text-lg text-indigo-700">{missingReports.length}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 flex items-center hover:bg-indigo-700 transition-colors"
                  >
                    <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              {isToday(date) ? (
                <>
                  {loadingMissing ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="w-8 h-8 absolute top-2 left-2 border-4 border-indigo-100 border-b-indigo-400 rounded-full animate-spin"></div>
                      </div>
                      <p className="ml-4 text-gray-500 font-medium">Loading team status...</p>
                    </div>
                  ) : missingReports.length === 0 ? (
                    <div className="p-6 mx-6 my-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 overflow-hidden relative">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-100 rounded-full opacity-30"></div>
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                          <FiCheckCircle className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-green-700 mb-1">All Caught Up!</h3>
                          <p className="text-green-600">Everyone on the team has submitted their reports for today.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex flex-wrap justify-between items-center mb-4">
                        <p className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-full inline-flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" /> 
                          {missingReports.length} {missingReports.length === 1 ? 'person' : 'people'} still need to submit a report
                        </p>
                        
                        {missingReports.length > 0 && (
                          <div className="mt-2 sm:mt-0 flex">
                            <div className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 mr-2 flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
                              <span>Last updated: {format(new Date(), 'h:mm a')}</span>
                            </div>
                            
                            <button
                              onClick={() => handleNewReport()}
                              className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 flex items-center hover:bg-indigo-700 transition-colors"
                            >
                              <FiPlus className="mr-1 h-3 w-3" />
                              Add Report
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {missingReports.map((member, index) => (
                          <motion.div
                            key={`missing-${member.id}-${index}`}
                            className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            onClick={() => navigate(`/profile/${member.id}`)}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                className="w-9 h-9 rounded-full object-cover shadow mr-3 border-2 border-indigo-100"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow mr-3">
                                {member.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{member.name}</p>
                              <p className="text-xs text-gray-600 truncate">{member.teams && member.teams.name || 'No Team'}</p>
                            </div>
                            <FiAlertCircle className="text-amber-500 ml-2" />
                            <FiChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12 px-6 bg-gray-50">
                  <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-400 mb-4">
                      <FiCalendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Historical View</h3>
                    <p className="text-gray-500 mb-4">Missing reports are only available for the current date.</p>
                    <motion.button 
                      onClick={() => setDate(new Date().toISOString().split('T')[0])}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors text-sm font-medium"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Switch to Today
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Fullscreen Modal */}
      <AnimatePresence>
      {showFullscreenModal && (
          <motion.div
            className="fixed inset-0 bg-black/95 z-50 p-6 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFullscreenModal}
          >
          <motion.button
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeFullscreenModal}
            >
              <FiX className="h-6 w-6" />
          </motion.button>
          
            <div 
              className="w-full max-w-5xl mx-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              {filteredReports.length > 0 && (
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            <motion.div
              key={currentReportIndex}
              custom={slideDirection}
              initial={(direction) => ({
                        x: direction === 'right' ? '100%' : '-100%',
                        opacity: 0
              })}
              animate={{
                x: 0,
                        opacity: 1
              }}
              exit={(direction) => ({
                        x: direction === 'right' ? '-100%' : '100%',
                        opacity: 0
              })}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                        mass: 0.8
                      }}
                      className="p-8"
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Current report content */}
                      <div className="flex items-center gap-5 mb-8 pb-5 border-b border-gray-200">
                        <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shadow-md">
                          {filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.name && filteredReports[currentReportIndex].users.name.charAt(0) || '?'}
                      </div>
                      <div>
                          <h3 className="text-3xl font-bold text-gray-900 mb-1">{filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.name || 'Unknown User'}</h3>
                          <div className="text-gray-500 flex items-center gap-3 text-lg">
                          <span className="font-medium">{filteredReports[currentReportIndex].users && filteredReports[currentReportIndex].users.teams && filteredReports[currentReportIndex].users.teams.name || 'Unassigned'}</span>
                            <span>&bull;</span>
                            <span className="flex items-center">
                              <FiClock className="mr-1.5" />
                              {filteredReports[currentReportIndex].created_at 
                                ? format(parseISO(filteredReports[currentReportIndex].created_at), 'MMM d, h:mm a') 
                                : ''}
                            </span>
                      </div>
                    </div>
                    
                        <div className="ml-auto text-sm bg-primary-50 text-primary-700 rounded-full px-4 py-1 border border-primary-100">
                          Report {currentReportIndex + 1} of {filteredReports.length}
                      </div>
                  </div>
                  
                      <div className={`grid gap-8 ${(() => {
                          const blockers = filteredReports[currentReportIndex]?.blockers;
                          const isEmptyContent = !blockers ||
                                                blockers === null ||
                                                blockers === undefined ||
                                                blockers.toString().trim() === '' ||
                                                blockers.toString().trim() === '<p></p>' ||
                                                blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                          return !isEmptyContent ? 'md:grid-cols-3' : 'md:grid-cols-2';
                        })()}`}>
                        <div className="bg-primary-50 rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border border-primary-100">
                          <h4 className="font-semibold text-primary-700 mb-1 flex items-center justify-center text-sm border-b border-primary-100 pb-0.5">
                            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">1</span>
                          Yesterday
                        </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                            {filteredReports[currentReportIndex].yesterday ? (
                              <RichTextDisplay content={filteredReports[currentReportIndex].yesterday} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                            ) : (
                              <span className="italic text-gray-400">No update</span>
                            )}
                        </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border border-green-100">
                          <h4 className="font-semibold text-green-700 mb-1 flex items-center justify-center text-sm border-b border-green-100 pb-0.5">
                            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs font-bold">2</span>
                          Today
                        </h4>
                          <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1">
                            {filteredReports[currentReportIndex].today ? (
                              <RichTextDisplay content={filteredReports[currentReportIndex].today} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                            ) : (
                              <span className="italic text-gray-400">No update</span>
                            )}
                        </div>
                        </div>
                        
                        {(() => {
                          const blockers = filteredReports[currentReportIndex]?.blockers;
                          const isEmptyContent = !blockers ||
                                                blockers === null ||
                                                blockers === undefined ||
                                                blockers.toString().trim() === '' ||
                                                blockers.toString().trim() === '<p></p>' ||
                                                blockers.toString().trim().replace(/<p><\/p>/g, '').trim() === '';
                          return !isEmptyContent;
                        })() && (
                          <div className="rounded-xl p-6 shadow-sm h-[390px] flex flex-col hover:shadow-md transition-all duration-300 border bg-red-50 border-red-100">
                            <h4 className="font-semibold mb-1 flex items-center justify-center text-sm pb-0.5 border-b text-red-700 border-red-100">
                              <span className="h-5 w-5 rounded-full flex items-center justify-center mr-2 text-xs font-bold bg-red-100 text-red-700">3</span>
                            Blockers
                          </h4>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 text-red-700">
                              <RichTextDisplay content={filteredReports[currentReportIndex].blockers} onTaskClick={(id) => { setActiveTaskId(id); setShowTaskModal(true); }} />
                            </div>
                        </div>
                      )}
                  </div>
                      
                      {/* Navigation indicator */}
                      <div className="flex items-center justify-center mt-8 gap-2">
                        {filteredReports.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-3 rounded-full transition-all cursor-pointer hover:scale-110 ${idx === currentReportIndex ? 'bg-primary-500 w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'}`}
                            onClick={() => setCurrentReportIndex(idx)}
              />
            ))}
          </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Left/Right Buttons for Navigation */}
                  {filteredReports.length > 1 && (
                    <>
                      <button 
                        className={`absolute left-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                        onClick={prevReport}
                        disabled={currentReportIndex === 0}
                      >
                        <FiChevronLeft size={28} />
                      </button>
                      <button 
                        className={`absolute right-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                        onClick={nextReport}
                        disabled={currentReportIndex === filteredReports.length - 1}
                      >
                        <FiChevronRight size={28} />
                      </button>
                    </>
                  )}
      </div>
    )}
    </div>
          </motion.div>
        )}
      </AnimatePresence>

      

      {/* Modal for Missing Reports */}
      <UserListModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        title="Missing Reports Today"
        users={missingReports}
        emptyMessage="Everyone has submitted their reports today!"
      />

      {/* Task Detail Modal for clickable task IDs in reports - Temporarily removed */}
      <AnimatePresence>
        {showTaskModal && activeTaskId && (
          <motion.div className="fixed inset-0 z-[9998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* TaskDetailView temporarily removed - needs to be re-implemented */}
            {/* TaskDetailView commented out
              isOpen={showTaskModal}
              onClose={() => { setShowTaskModal(false); setActiveTaskId(null); }}
              taskId={activeTaskId}
              onUpdate={() => { // no-op
              }}
            /> */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Team Availability Modal */}
      <AnimatePresence>
        {showOnLeaveModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOnLeaveModal(false)}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Team Availability</h2>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowOnLeaveModal(false)}
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <span className="font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                    {(() => {
                      const team = teams.find(t => t.id === userTeamId);
                      return team && team.name || 'Team';
                    })()}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="font-medium text-gray-700">
                    {format(new Date(), 'MMMM d, yyyy')}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-green-600 font-medium bg-green-100 px-2.5 py-1 rounded-full">
                    {availableMembers.length} Available
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-red-600 font-medium bg-red-100 px-2.5 py-1 rounded-full">
                    {onLeaveMembers.length} On Leave
                  </span>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* On Leave Members Section */}
                {onLeaveMembers.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">On Leave Today</h3>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {onLeaveMembers.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {onLeaveMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={() => navigate(`/profile/${member.id}`)}
                        >
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-red-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium text-sm shadow">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-red-700 font-medium bg-red-100 px-2 py-1 rounded-full w-fit mt-1">
                              On Leave Today
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Available Members Section */}
                {availableMembers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Available Today</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {availableMembers.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {availableMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={() => navigate(`/profile/${member.id}`)}
                        >
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm shadow">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full w-fit mt-1">
                              Available Today
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No members message */}
                {onLeaveMembers.length === 0 && availableMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No team members found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
   
    </motion.div>
  );
}
