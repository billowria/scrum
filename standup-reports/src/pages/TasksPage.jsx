import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { notifySprintUpdate } from '../utils/notificationHelper';
import { useCompany } from '../contexts/CompanyContext';
import { format, addWeeks, parseISO, isWithinInterval } from 'date-fns';
import {
  FiGrid,
  FiList,
  FiPlus,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiUsers,
  FiRefreshCw,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiUpload,
  FiSettings,
  FiBell,
  FiStar,
  FiEye,
  FiEyeOff,
  FiUser,
  FiFolder,
  FiFlag,
  FiTarget,
  FiBarChart2,
  FiLayers,
  FiX,
  FiPlay,
  FiCircle,
  FiChevronDown,
  FiChevronsDown,
  FiChevronsUp,
  FiCheck,
  FiChevronLeft
} from 'react-icons/fi';
import { createTaskNotification } from '../utils/notificationHelper';
import { getSprintStatus } from '../utils/sprintUtils';
import { uuidToShortId, shortIdToUuidPrefix, isShortId } from '../utils/taskIdUtils';
import TaskForm from '../components/TaskForm';
import TaskUpdateModal from '../components/TaskUpdateModal';
import CreateTaskModalNew from '../components/tasks/CreateTaskModalNew';
import TaskDetailView from '../components/tasks/TaskDetailView';
import TaskBoard from '../components/TaskBoard';
import TaskList from '../components/TaskList';
import SprintBoard from '../components/SprintBoard';
import SprintModal from '../components/SprintModal';
import SprintManagement from '../components/sprint/SprintManagement';
import SprintDetailView from '../components/sprint/SprintDetailView';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import GlassmorphicToast from '../components/GlassmorphicToast';

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
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'To Do':
      return {
        color: 'text-gray-700',
        bgColor: 'bg-gray-100/80',
        borderColor: 'border-gray-200/60',
        icon: FiClock,
        gradient: 'from-gray-400 to-gray-600',
        glassColor: 'bg-gray-500/10',
        accentColor: 'bg-gray-500/20'
      };
    case 'In Progress':
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100/80',
        borderColor: 'border-blue-200/60',
        icon: FiTrendingUp,
        gradient: 'from-blue-400 to-blue-600',
        glassColor: 'bg-blue-500/10',
        accentColor: 'bg-blue-500/20'
      };
    case 'Review':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100/80',
        borderColor: 'border-amber-200/60',
        icon: FiAlertCircle,
        gradient: 'from-amber-400 to-orange-600',
        glassColor: 'bg-amber-500/10',
        accentColor: 'bg-amber-500/20'
      };
    case 'Completed':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100/80',
        borderColor: 'border-green-200/60',
        icon: FiCheckCircle,
        gradient: 'from-green-400 to-emerald-600',
        glassColor: 'bg-green-500/10',
        accentColor: 'bg-green-500/20'
      };
    default:
      return {
        color: 'text-gray-700',
        bgColor: 'bg-gray-100/80',
        borderColor: 'border-gray-200/60',
        icon: FiClock,
        gradient: 'from-gray-400 to-gray-600',
        glassColor: 'bg-gray-500/10',
        accentColor: 'bg-gray-500/20'
      };
  }
};

// Expandable Filter Button Component
const FilterButton = ({ icon: Icon, label, color, isActive, expandedContent, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const buttonClass = `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${isActive
    ? `${color} text-white shadow-lg`
    : 'bg-gray-100 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 shadow-sm'
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        className={buttonClass}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
        {isActive && (
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </button>
      {isExpanded && expandedContent}
    </div>
  );
};

// Active Filter Tag Component
const FilterTag = ({ label, color, onRemove }) => (
  <motion.div
    className={`px-3 py-1.5 rounded-full ${color} border flex items-center gap-2 text-sm font-medium`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
  >
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10"
    >
      <FiX className="w-3 h-3" />
    </button>
  </motion.div>
);

export default function TasksPage({ sidebarOpen, sidebarMode }) {
  const { currentCompany } = useCompany();
  // State management
  const [view, setView] = useState('tasks'); // 'tasks' or 'sprint'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [displayMode, setDisplayMode] = useState('board'); // 'board' or 'list' for TaskBoard
  const [editingTask, setEditingTask] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all',
    team: 'all',
    dueDate: 'all',
    search: '',
    sprint: 'all'
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const headerRef = useRef(null);

  // Sprint planning state
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('all');
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintLoading, setSprintLoading] = useState(false);
  const [showSprintDetailView, setShowSprintDetailView] = useState(false);
  const [selectedSprintForDetail, setSelectedSprintForDetail] = useState(null);
  // Fetch sprints
  const fetchSprints = async () => {
    try {
      setSprintLoading(true);

      let query = supabase
        .from('sprints')
        .select('*');

      // Filter by project if selected
      if (selectedProjectId !== 'all') {
        query = query.eq('project_id', selectedProjectId);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      // Don't set error state to avoid disrupting the UI
    } finally {
      setSprintLoading(false);
    }
  };

  // Create or update sprint
  const handleSprintSubmit = async (sprintData) => {
    try {
      const { name, goal, start_date, end_date, project_id } = sprintData;

      if (editingSprint) {
        // Update existing sprint
        const { error } = await supabase
          .from('sprints')
          .update({
            name,
            goal,
            start_date,
            end_date,
            project_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSprint.id);

        if (error) throw error;
      } else {
        // Create new sprint
        const { error } = await supabase
          .from('sprints')
          .insert({
            name,
            goal,
            start_date,
            end_date,
            project_id,
            created_by: currentUser?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'Planning'
          });

        if (error) throw error;
      }

      // Refresh sprints
      fetchSprints();
      setShowSprintModal(false);
      setEditingSprint(null);
    } catch (err) {
      console.error('Error saving sprint:', err);
      setError('Failed to save sprint. Please try again.');
    }
  };

  // Assign tasks to sprint
  const assignTasksToSprint = async (taskIds, sprintId) => {
    try {
      const updates = taskIds.map(taskId => ({
        id: taskId,
        sprint_id: sprintId,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('tasks')
        .upsert(updates);

      if (error) throw error;

      // Refresh tasks
      fetchTasks();
      setShowSprintAssignModal(false);
    } catch (err) {
      console.error('Error assigning tasks to sprint:', err);
      setError('Failed to assign tasks to sprint. Please try again.');
    }
  };

  // Start sprint
  const startSprint = async (sprintId) => {
    try {
      // Get sprint details
      const sprint = sprints.find(s => s.id === sprintId);

      const { error } = await supabase
        .from('sprints')
        .update({
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sprintId);

      if (error) throw error;

      // Send notification about sprint start
      if (sprint && sprint.project_id) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('team_id')
            .eq('id', sprint.project_id)
            .single();

          if (projectData?.team_id && currentUser) {
            await notifySprintUpdate(
              sprint.name,
              'started',
              projectData.team_id,
              currentUser.id
            );
          }
        } catch (notificationError) {
          console.error('Error sending sprint notification:', notificationError);
          // Continue even if notification fails
        }
      }

      // Refresh sprints
      fetchSprints();
    } catch (err) {
      console.error('Error starting sprint:', err);
      setError('Failed to start sprint. Please try again.');
    }
  };

  // Complete sprint
  const completeSprint = async (sprintId) => {
    try {
      // Get sprint details
      const sprint = sprints.find(s => s.id === sprintId);

      const { error } = await supabase
        .from('sprints')
        .update({
          status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sprintId);

      if (error) throw error;

      // Send notification about sprint completion
      if (sprint && sprint.project_id) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('team_id')
            .eq('id', sprint.project_id)
            .single();

          if (projectData?.team_id && currentUser) {
            await notifySprintUpdate(
              sprint.name,
              'completed',
              projectData.team_id,
              currentUser.id
            );
          }
        } catch (notificationError) {
          console.error('Error sending sprint notification:', notificationError);
          // Continue even if notification fails
        }
      }

      // Refresh sprints
      fetchSprints();
    } catch (err) {
      console.error('Error completing sprint:', err);
      setError('Failed to complete sprint. Please try again.');
    }
  };

  // Delete sprint
  const deleteSprint = async (sprintId) => {
    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      // Refresh sprints
      fetchSprints();
    } catch (err) {
      console.error('Error deleting sprint:', err);
      setError('Failed to delete sprint. Please try again.');
    }
  };

  // Handle sprint selection for detail view
  const handleSprintSelect = (sprint) => {
    setSelectedSprintForDetail(sprint);
    setShowSprintDetailView(true);
  };

  // Clear all filters with proper state management
  const handleClearAllFilters = () => {
    try {
      // Reset all filter states systematically
      setFilters({
        status: 'all',
        assignee: 'all',
        team: 'all',
        dueDate: 'all',
        search: '',
        sprint: 'all'
      });

      // Reset to the first project if available
      if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      } else {
        setSelectedProjectId(null);
      }

      setSelectedSprintId('all');
      setSearch('');

      // Clear any error state
      setError(null);

      console.log('All filters cleared successfully');
    } catch (err) {
      console.error('Error clearing filters:', err);
      setError('Failed to clear filters. Please refresh the page.');
    }
  };

  // Export visible tasks to CSV
  const exportTasksToCSV = () => {
    if (!tasks || tasks.length === 0) return;
    const headers = [
      'Title', 'Status', 'Assignee', 'Team', 'Project', 'Due Date', 'Created At'
    ];
    const rows = tasks.map(t => [
      (t.title || '').replaceAll('\n', ' ').replaceAll(',', ' '),
      t.status || '',
      t.assignee?.name || '',
      t.team?.name || '',
      t.project?.name || '',
      t.due_date || '',
      t.created_at || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks_${selectedProjectId !== 'all' ? selectedProjectId : 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'To Do').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    review: tasks.filter(t => t.status === 'Review').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'Completed';
    }).length
  };

  // Calculate active filter count for header badge
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedProjectId && selectedProjectId !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (selectedSprintId !== 'all') count++;
    const assigneeActive = Array.isArray(filters.assignee) ? filters.assignee.length > 0 : (filters.assignee !== 'all' && filters.assignee);
    if (assigneeActive) count++;
    return count;
  }, [selectedProjectId, filters.status, selectedSprintId, filters.assignee]);

  // Fetch current user and role
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          setUserRole(null);
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, team_id, manager_id')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setCurrentUser(data);
        setUserRole(data.role);
      } catch (err) {
        setCurrentUser(null);
        setUserRole(null);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch employees/team members for filter
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUser || !userRole || !currentCompany?.id) return;
      try {
        let query = supabase.from('users').select('id, name, avatar_url')
          .eq('company_id', currentCompany.id);
        if (userRole === 'manager' && currentUser.team_id) {
          query = query.eq('team_id', currentUser.team_id);
        } else if (userRole === 'member') {
          query = query.eq('id', currentUser.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [currentUser, userRole]);

  // Handle CMD+/ for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchFocused(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch tasks with enhanced validation and error handling
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required dependencies before proceeding
      if (!currentUser || !userRole) {
        console.warn('fetchTasks: Missing current user or role data');
        return;
      }

      let query = supabase
        .from('tasks')
        .select(`
          id, title, description, status, due_date, created_at, updated_at, project_id, sprint_id, efforts_in_days,
          assignee:users!assignee_id(
            id,
            name,
            email,
            role,
            team_id,
            avatar_url
          ),
          reporter:users!reporter_id(
            id,
            name,
            avatar_url
          ),
          team:team_id(id, name),
          project:project_id(id, name),
          sprint:sprint_id(id, name),
          comments:comments(id),
          assignee_id
        `);

      // Role-based filtering with validation
      if (userRole === 'manager' && currentUser) {
        // Manager: show tasks assigned to any member in their team
        if (currentUser.team_id) {
          query = query.eq('team_id', currentUser.team_id);
        }
      } else if (userRole === 'member' && currentUser) {
        // Member: show only their own tasks
        query = query.eq('assignee_id', currentUser.id);
      }

      // Project filter with validation using debounced value
      const currentProjectId = debouncedSelectedProjectId || selectedProjectId;
      if (currentProjectId && currentProjectId !== 'all' && currentProjectId.trim() !== '') {
        // Validate that currentProjectId is a valid UUID/identifier
        try {
          query = query.eq('project_id', currentProjectId);
        } catch (projectError) {
          console.warn('Invalid project ID in filter:', currentProjectId);
        }
      }

      // Apply filters with validation using debounced values
      const currentFilters = debouncedFilters || filters;
      const currentSearch = debouncedSearch || search;

      if (currentFilters && typeof currentFilters === 'object') {
        if (currentFilters.status && currentFilters.status !== 'all' && currentFilters.status.trim() !== '') {
          const validStatuses = ['To Do', 'In Progress', 'Review', 'Completed'];
          if (validStatuses.includes(currentFilters.status)) {
            query = query.eq('status', currentFilters.status);
          }
        }

        if (currentFilters.assignee && currentFilters.assignee !== 'all') {
          // Handle both array (multi-select) and string (single-select)
          if (Array.isArray(currentFilters.assignee)) {
            if (currentFilters.assignee.length > 0) {
              query = query.in('assignee_id', currentFilters.assignee);
            }
          } else if (currentFilters.assignee.trim() !== '') {
            try {
              query = query.eq('assignee_id', currentFilters.assignee);
            } catch (assigneeError) {
              console.warn('Invalid assignee ID in filter:', currentFilters.assignee);
            }
          }
        }

        if (currentFilters.team && currentFilters.team !== 'all' && currentFilters.team.trim() !== '') {
          try {
            query = query.eq('team_id', currentFilters.team);
          } catch (teamError) {
            console.warn('Invalid team ID in filter:', currentFilters.team);
          }
        }
      }

      // Apply search filter with validation
      if (currentSearch && typeof currentSearch === 'string' && currentSearch.trim() !== '') {
        const searchTerm = currentSearch.trim();
        if (searchTerm.length >= 1) {
          // Check if search looks like a task short ID (e.g., first 4-8 chars of UUID)
          if (isShortId(searchTerm)) {
            const idPrefix = shortIdToUuidPrefix(searchTerm);
            // Search title or ID prefix
            query = query.or(`title.ilike.%${searchTerm}%,id.ilike.${idPrefix}%`);
          } else {
            query = query.ilike('title', `%${searchTerm}%`);
          }
        }
      }

      // Sprint filter with validation using debounced value
      const currentSprintId = debouncedSelectedSprintId || selectedSprintId;
      if (currentSprintId && currentSprintId !== 'all' && currentSprintId.trim() !== '') {
        try {
          query = query.eq('sprint_id', currentSprintId);
        } catch (sprintError) {
          console.warn('Invalid sprint ID in filter:', currentSprintId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Validate data before setting
      const validatedTasks = Array.isArray(data) ? data : [];
      setTasks(validatedTasks);

    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(`Failed to load tasks: ${err.message || 'Please try again.'}`);
      setTasks([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch tasks to prevent rapid successive calls
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [debouncedSelectedProjectId, setDebouncedSelectedProjectId] = useState(selectedProjectId);
  const [debouncedSelectedSprintId, setDebouncedSelectedSprintId] = useState(selectedSprintId);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce filter changes to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSelectedProjectId(selectedProjectId);
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [selectedProjectId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSelectedSprintId(selectedSprintId);
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [selectedSprintId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // Longer debounce for search

    return () => clearTimeout(debounceTimer);
  }, [search]);

  // Initial fetch and real-time subscription using debounced values
  useEffect(() => {
    // Only fetch tasks if we have user data AND a valid project selected
    // This prevents the initial "all tasks" fetch before project is set
    const hasValidProject = debouncedSelectedProjectId && debouncedSelectedProjectId !== 'all';

    if (currentUser && userRole && hasValidProject) {
      fetchTasks();
    }

    // Set up real-time subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Change received!', payload);
          // Only refetch if we have user data and valid project
          const hasProject = debouncedSelectedProjectId && debouncedSelectedProjectId !== 'all';
          if (currentUser && userRole && hasProject) {
            // Debounce real-time updates too
            setTimeout(() => {
              fetchTasks();
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [debouncedFilters, userRole, currentUser, debouncedSelectedProjectId, debouncedSelectedSprintId, debouncedSearch]);

  // Fetch sprints when project changes
  useEffect(() => {
    if (currentUser && userRole) {
      fetchSprints();
    }
  }, [currentUser, selectedProjectId]);

  // Fetch projects relevant to the current user

  // URL Parameter Handling for Deep Linking
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTaskId = searchParams.get('taskId');

  useEffect(() => {
    const handleDeepLink = async () => {
      if (!urlTaskId) return;

      try {
        let taskIdToFetch = urlTaskId;

        // Check if it's a Short ID (numeric)
        if (isShortId(urlTaskId)) {
          console.log(`Deep link: Detected Short ID ${urlTaskId}`);
          const prefix = shortIdToUuidPrefix(urlTaskId);
          if (prefix) {
            // PostgREST doesn't support id::text casting in JS client filters
            // So we'll fetch task IDs and filter client-side
            const { data: allTaskIds, error } = await supabase
              .from('tasks')
              .select('id')
              .limit(1000); // Reasonable limit for most use cases

            if (allTaskIds && allTaskIds.length > 0) {
              // Find matching task by UUID prefix (case-insensitive)
              const matchingTask = allTaskIds.find(t =>
                t.id.toLowerCase().startsWith(prefix.toLowerCase())
              );

              if (matchingTask) {
                taskIdToFetch = matchingTask.id;
                console.log(`Deep link: Resolved Short ID ${urlTaskId} to UUID ${taskIdToFetch}`);
              } else {
                console.warn(`Deep link: No task found for Short ID ${urlTaskId} (prefix: ${prefix})`);
                return;
              }
            } else {
              console.warn(`Deep link: Failed to fetch tasks for resolution`);
              return;
            }
          }
        }

        // Fetch full task details
        const { data: task, error } = await supabase
          .from('tasks')
          .select(`
            id, title, description, status, due_date, created_at, updated_at, project_id, sprint_id,
            assignee:users!assignee_id(
              id, name, email, role, team_id, avatar_url
            ),
            reporter:users!reporter_id(
              id, name, avatar_url
            ),
            team:team_id(id, name),
            project:project_id(id, name),
            sprint:sprint_id(id, name),
            comments:comments(id),
            assignee_id
          `)
          .eq('id', taskIdToFetch)
          .single();

        if (error) throw error;

        if (task) {
          setViewingTask(task);
          setShowDetailModal(true);
        }
      } catch (err) {
        console.error('Error handling deep link:', err);
      }
    };

    if (currentUser) {
      handleDeepLink();
    }
  }, [urlTaskId, currentUser]);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setProjects([]);

      // Fetch projects where the user is assigned or created_by the user
      // Note: Using OR filter; some rows may duplicate - we will de-dup client-side.
      let query = supabase
        .from('projects')
        .select('id, name, created_by, project_assignments(user_id)')
        .order('name', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by involvement: show created_by user or assigned (for members)
      const filtered = (data || []).filter((p) => {
        const assigned = (p.project_assignments || []).some(a => a.user_id === user.id);
        if (userRole === 'manager') {
          return assigned || p.created_by === user.id;
        }
        return assigned;
      });

      // De-duplicate by id
      const uniqueById = Array.from(new Map(filtered.map(p => [p.id, { id: p.id, name: p.name }])).values());
      setProjects(uniqueById);

      // Select first project by default if none selected
      if (uniqueById.length > 0) {
        setSelectedProjectId(prev => prev && prev !== 'all' ? prev : uniqueById[0].id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  };

  // Load projects when user data available
  useEffect(() => {
    if (currentUser && userRole) {
      fetchProjects();
    }
  }, [currentUser, userRole]);

  // Task operation handlers
  const handleTaskUpdate = (task) => {
    setUpdatingTask(task);
    setShowUpdateModal(true);
  };

  // Direct task update for drag and drop
  const handleDirectTaskUpdate = async (task) => {
    try {
      console.log('Direct task update:', task);

      const { error } = await supabase
        .from('tasks')
        .update({
          status: task.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      // Create task status change notification
      if (task.status && currentUser) {
        try {
          const oldStatus = task.previousStatus || 'unknown';
          await createTaskNotification(
            task.assignee_id || currentUser.id,
            task.id,
            task.title,
            'status_changed',
            `Task "${task.title}" status changed from ${oldStatus} to ${task.status}`,
            {
              previousStatus: oldStatus,
              newStatus: task.status,
              priority: task.priority === 'High' ? 'High' : 'Medium',
              createdBy: currentUser.id
            }
          );
        } catch (notificationError) {
          console.error('Error creating task status notification:', notificationError);
          // Continue even if notification fails
        }
      }

      console.log('Task updated successfully, fetching tasks...');
      // Show glassmorphic toast notification after successful DB save
      showToast(
        'save',
        'Task status saved successfully!',
        `"${task.title}" moved to ${task.status}`
      );
      // Refresh tasks from database
      await fetchTasks();

    } catch (err) {
      console.error('Error in handleDirectTaskUpdate:', err);
      setError('Failed to update task. Please try again.');
      showToast('error', 'Failed to update task', 'Please try again');
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const handleTaskView = (task) => {
    setViewingTask(task);
    setShowDetailModal(true);
    // Sync URL with Short ID
    setSearchParams({ taskId: uuidToShortId(task.id) });
  };

  const handleTaskDelete = async (task) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);

        if (error) throw error;

        // Refresh tasks after deletion
        fetchTasks();
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task. Please try again.');
      }
    }
  };

  const handleSprintAssign = (task) => {
    setCurrentTask(task);
    setShowSprintAssignModal(true);
  };

  // Sprint assignment modal state
  const [showSprintAssignModal, setShowSprintAssignModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    message: '',
    description: ''
  });

  // Show toast notification function
  const showToast = (type, message, description = null) => {
    setToast({
      isVisible: true,
      type,
      message,
      description
    });
  };

  // Hide toast notification function
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };



  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      variants={statVariants}
      className={`bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border-l-4 ${color} hover:shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm dark:border-opacity-50`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-50')} dark:bg-slate-800/50`}>
          <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-2 text-xs">
          <FiTrendingUp className="w-3 h-3 text-green-500 mr-1" />
          <span className="text-green-600 dark:text-green-400">{trend}</span>
        </div>
      )}
    </motion.div>
  );

  // Calculate header styles based on sidebar mode
  const getHeaderStyles = () => {
    if (sidebarMode === 'hidden') {
      return { left: '0px', width: '100%' };
    }
    if (sidebarMode === 'collapsed') {
      return { left: '100px', width: 'calc(100% - 100px)' };
    }
    // Default to expanded
    return { left: '272px', width: 'calc(100% - 272px)' };
  };

  const headerStyles = getHeaderStyles();

  return (
    <motion.div
      className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <SideFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        setSelectedSprintId={setSelectedSprintId}
        filters={filters}
        setFilters={setFilters}
        employees={employees}
        onClearAllFilters={handleClearAllFilters}
        activeFilterCount={activeFilterCount}
      />


      {/* Creative Modern Tasks Header */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            className="fixed top-16 right-0 z-50 px-6 py-4 pointer-events-none"
            id="tasks-header"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            style={{
              left: headerStyles.left,
              width: headerStyles.width,
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Liquid Glass Header */}
            <div
              ref={headerRef}
              className="pointer-events-auto relative overflow-hidden bg-white/10 dark:bg-slate-900/60 backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 border border-white/20 dark:border-slate-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-between group min-h-[70px]"
              style={{
                boxShadow: `
                0 8px 32px 0 rgba(31, 38, 135, 0.15),
                inset 0 0 0 1px rgba(255, 255, 255, 0.2),
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

              {/* Chromatic Edge Simulation (Fake Refraction) */}
              <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-50 mix-blend-overlay bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />

              {/* Left: Title & Context */}
              <div className="flex items-center gap-4 px-4 relative z-10">
                <div className="relative group/icon cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover/icon:opacity-60 transition-opacity"></div>
                  <div className="relative p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 group-hover/icon:scale-105 transition-transform duration-300">
                    {view === 'sprint' ? <FiTarget className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                    {view === 'sprint' ? 'Sprint Management' : 'Tasks'}
                  </h1>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    {view === 'sprint' ? 'Plan, track, and deliver' : 'Manage your workflow'}
                  </p>
                </div>
              </div>

              {/* Center: Futuristic Toggle - Fixed at Center */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-gray-100/30 backdrop-blur-xl p-1.5 rounded-2xl z-20 border border-white/40 shadow-inner overflow-hidden">
                {[
                  { id: 'tasks', icon: FiGrid, label: 'Tasks' },
                  { id: 'sprint', icon: FiTarget, label: 'Sprint' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 z-10 ${view === tab.id
                      ? 'text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-600/40'
                      }`}
                    onClick={() => setView(tab.id)}
                    whileHover={{
                      scale: 1.05,
                      rotateY: view === tab.id ? 0 : 2,
                      z: 10
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Active Indicator Background */}
                    {view === tab.id && (
                      <>
                        <motion.div
                          className={`absolute inset-0 rounded-xl shadow-lg border border-white/20 ${tab.id === 'sprint'
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500' // Sprint -> Pink/Purple
                            : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500' // Tasks -> Blue/Cyan
                            }`}
                          layoutId="activeTabTasks"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />

                        {/* Inner Pulse/Glow */}
                        <motion.div
                          className={`absolute inset-0.5 rounded-xl opacity-50 ${tab.id === 'sprint'
                            ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400'
                            : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400'
                            }`}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Diagonal Surface Shine */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-xl"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                      </>
                    )}

                    <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                      <tab.icon className={`w-4 h-4 ${view === tab.id ? 'text-white' : ''}`} />
                      {tab.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 px-2 relative z-10">

                {/* Professional Search Bar */}
                <div className="relative flex items-center group/search">
                  <motion.div
                    initial={false}
                    animate={{
                      width: searchFocused || search ? (window.innerWidth < 1280 ? 160 : 220) : 42,
                      backgroundColor: searchFocused ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: searchFocused ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none'
                    }}
                    className={`relative flex items-center bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border ${searchFocused ? 'border-indigo-500/50' : 'border-white/20 dark:border-slate-700/50'} rounded-xl transition-all duration-500 overflow-hidden min-h-[42px]`}
                  >
                    <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-indigo-400' : 'text-gray-400'} w-4 h-4 pointer-events-none`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder="Search tasks or ID..."
                      className={`w-full bg-transparent border-none focus:ring-0 text-sm py-2 pl-10 pr-10 text-gray-900 dark:text-white transition-opacity duration-300 ${searchFocused || search ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Clear Button */}
                    <AnimatePresence>
                      {search && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setSearch('')}
                          className="absolute right-2 px-2 py-1 text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Search Shortcut Hint */}
                  {!searchFocused && !search && (
                    <div className="absolute right-3 pointer-events-none hidden lg:flex items-center gap-0.5 opacity-40 group-hover/search:opacity-10 transition-opacity">
                      <kbd className="text-[9px] font-bold px-1 bg-gray-500/20 rounded">⌘</kbd>
                      <kbd className="text-[9px] font-bold px-1 bg-gray-500/20 rounded">/</kbd>
                    </div>
                  )}
                </div>

                {/* Compact View Toggle - repositioned to header */}
                {view === 'tasks' && (
                  <div className="flex bg-white/10 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-1 border border-white/20 dark:border-slate-700/50 h-[42px] items-center">
                    {[
                      { id: 'board', icon: FiGrid, label: 'Kanban' },
                      { id: 'list', icon: FiList, label: 'List' }
                    ].map((mode) => (
                      <motion.button
                        key={mode.id}
                        onClick={() => setDisplayMode(mode.id)}
                        whileHover={{ backgroundColor: displayMode === mode.id ? '' : 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${displayMode === mode.id ? 'text-white' : 'text-gray-500'}`}
                        title={`${mode.label} View`}
                      >
                        {displayMode === mode.id && (
                          <motion.div
                            layoutId="headerViewToggle"
                            className="absolute inset-0 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <mode.icon className="w-3.5 h-3.5 relative z-10" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Advanced Filter Button with Active Badge */}
                <motion.button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-2.5 rounded-xl border border-white/20 dark:border-slate-700/50 transition-all flex items-center justify-center min-w-[42px] min-h-[42px] ${activeFilterCount > 0
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-400'
                    : 'bg-white/10 dark:bg-slate-700/40 text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-slate-600/60'}`}
                >
                  <FiFilter className="w-5 h-5" />
                  {activeFilterCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white dark:ring-slate-900"
                    >
                      {activeFilterCount}
                    </motion.span>
                  )}
                </motion.button>

                <div className="w-px h-6 bg-white/20 dark:bg-slate-700/50 mx-1 hidden sm:block" />

                {/* Refresh Button */}
                <motion.button
                  className="p-2.5 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-white/30 dark:hover:bg-slate-600/60 transition-all min-w-[42px] min-h-[42px]"
                  onClick={view === 'sprint' ? fetchSprints : fetchTasks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={view === 'sprint' ? 'Refresh Sprints' : 'Refresh Tasks'}
                >
                  <FiRefreshCw className={`w-5 h-5 ${loading || sprintLoading ? 'animate-spin' : ''}`} />
                </motion.button>

                {/* Professional Create Button */}
                {userRole === 'manager' && (
                  <motion.button
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-indigo-500/20 border border-white/10 hover:border-white/30 transition-all ml-1 min-h-[42px]"
                    onClick={() => view === 'sprint' ? setShowSprintModal(true) : setShowCreateModal(true)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden lg:inline">{view === 'sprint' ? 'New Sprint' : 'New Task'}</span>
                  </motion.button>
                )}

                {/* Hide Header Button */}
                <motion.button
                  className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-white/5 dark:bg-slate-800/20 rounded-xl transition-all hover:bg-white/20"
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
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar scroll-smooth">
        <div className={`w-full space-y-6 px-2 transition-all duration-500 ease-out ${showHeader ? 'pt-32' : 'pt-4'}`}>
          {/* Show Header Button - Icon Only, Clean Design */}
          <AnimatePresence>
            {!showHeader && (
              <motion.button
                className="fixed top-20 z-[99999] p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all"
                style={{
                  right: '24px'
                }}
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
          </AnimatePresence>
          {/* Content */}
          <motion.div
            variants={itemVariants}
            className="bg-transparent overflow-hidden"
          >
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500 dark:text-red-400 bg-white dark:bg-slate-900 rounded-xl">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
                {error}
              </div>
            ) : (
              <div className="p-0">
                {view === 'tasks' ? (
                  <TaskBoard
                    tasks={tasks}
                    onTaskUpdate={handleDirectTaskUpdate}
                    onTaskEdit={handleTaskEdit}
                    onTaskDelete={handleTaskDelete}
                    onTaskView={handleTaskView}
                    search={search}
                    setSearch={setSearch}
                    filters={filters}
                    setFilters={setFilters}
                    employees={employees}
                    sprints={sprints}
                    selectedSprintId={selectedSprintId}
                    setSelectedSprintId={setSelectedSprintId}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                    projects={projects}
                    teams={[]} // TODO: Add teams data fetching if needed
                    getStatusConfig={getStatusConfig}
                    onClearAllFilters={handleClearAllFilters}
                    onOpenSprintManagement={() => setView('sprint')}
                    currentUser={currentUser}
                    userRole={userRole}
                    displayMode={displayMode}
                    setDisplayMode={setDisplayMode}
                    hideInternalControls={true} // New prop to hide old controls
                    showHeader={showHeader}
                  />
                ) : (
                  <SprintManagement
                    sprints={sprints}
                    tasks={tasks}
                    onCreateSprint={() => {
                      setEditingSprint(null);
                      setShowSprintModal(true);
                    }}
                    onEditSprint={(sprint) => {
                      setEditingSprint(sprint);
                      setShowSprintModal(true);
                    }}
                    onDeleteSprint={deleteSprint}
                    onSelectSprint={handleSprintSelect}
                    onStartSprint={startSprint}
                    onCompleteSprint={completeSprint}
                    selectedSprintId={selectedSprintForDetail?.id}
                    userRole={userRole}
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                  />)}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && userRole === 'manager' && (
          <CreateTaskModalNew
            key="create-task-modal"
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTask(null);
            }}
            onSuccess={() => {
              fetchTasks();
              setEditingTask(null);
            }}
            task={editingTask}
            currentUser={currentUser}
            userRole={userRole}
          />
        )}

        {showUpdateModal && (
          <TaskUpdateModal
            key="update-task-modal"
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
              setUpdatingTask(null);
            }}
            onSuccess={() => {
              fetchTasks();
              setUpdatingTask(null);
            }}
            task={updatingTask}
          />
        )}

        {showDetailModal && viewingTask && (
          <TaskDetailView
            key={`task-detail-${viewingTask.id}`}
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setViewingTask(null);
              // Clear URL param on close
              setSearchParams({});
            }}
            taskId={viewingTask.id}
            onUpdate={() => {
              fetchTasks();
            }}
            currentUser={currentUser}
            userRole={userRole}
            parentTaskId={viewingTask.parentTaskId} // Pass parent task ID if available
            onNavigateToTask={(taskId) => {
              // Close current detail view and open new one for the clicked task
              setShowDetailModal(false);
              setViewingTask(null);

              // Find the task and open its detail view
              const clickedTask = tasks.find(t => t.id === taskId);
              if (clickedTask) {
                setViewingTask({ ...clickedTask, parentTaskId: viewingTask?.id });
                setShowDetailModal(true);
                // Update URL for the new task
                setSearchParams({ taskId: uuidToShortId(clickedTask.id) });
              }
            }}
          />
        )}

        {/* Sprint Modal */}
        <SprintModal
          isOpen={showSprintModal}
          onClose={() => {
            setShowSprintModal(false);
            setEditingSprint(null);
          }}
          onSubmit={handleSprintSubmit}
          sprint={editingSprint}
          projects={projects}
        />

        {/* Sprint Assignment Modal */}
        {showSprintAssignModal && (
          <motion.div
            className="fixed inset-0 z-[99997] flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border dark:border-slate-800"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Assign Tasks to Sprint</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const sprintId = formData.get('sprint_id');
                  const selectedTaskIds = tasks
                    .filter(task => task.selected)
                    .map(task => task.id);

                  if (selectedTaskIds.length === 0) {
                    setError('Please select at least one task to assign');
                    return;
                  }

                  assignTasksToSprint(selectedTaskIds, sprintId);
                }}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint</label>
                    <select
                      name="sprint_id"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a sprint</option>
                      {sprints
                        .filter(sprint => sprint.status !== 'Completed')
                        .map(sprint => (
                          <option key={sprint.id} value={sprint.id}>
                            {sprint.name} {sprint.status === 'Active' ? '(Active)' : '(Planning)'}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Tasks</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-md p-2">
                      {tasks.filter(task => task.selected).length > 0 ? (
                        <ul className="space-y-1">
                          {tasks
                            .filter(task => task.selected)
                            .map(task => (
                              <li key={task.id} className="text-sm py-1 px-2 bg-gray-50 dark:bg-slate-800/50 rounded flex justify-between">
                                <span className="truncate text-gray-700 dark:text-gray-300">{task.title}</span>
                                <span className="text-xs text-gray-500">{task.status}</span>
                              </li>
                            ))
                          }
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 py-2 text-center">No tasks selected</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={() => setShowSprintAssignModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      disabled={tasks.filter(task => task.selected).length === 0}
                    >
                      Assign to Sprint
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sprint Detail View Modal */}
        {showSprintDetailView && selectedSprintForDetail && (
          <SprintDetailView
            sprint={selectedSprintForDetail}
            isOpen={showSprintDetailView}
            onClose={() => {
              setShowSprintDetailView(false);
              setSelectedSprintForDetail(null);
            }}
            onUpdate={() => {
              fetchTasks();
              fetchSprints();
            }}
            onEdit={() => {
              setEditingSprint(selectedSprintForDetail);
              setShowSprintModal(true);
              setShowSprintDetailView(false);
            }}
            onStart={startSprint}
            onComplete={completeSprint}
            onAddTasks={() => {
              // Close detail view and show task assignment
              setShowSprintDetailView(false);
              setShowSprintAssignModal(true);
            }}
            userRole={userRole}
          />
        )}
      </AnimatePresence>

      {/* Glassmorphic Toast Notification */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </motion.div>
  );

}


// --- ADVANCED SIDE FILTER DRAWER ---
const SideFilterDrawer = ({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  sprints,
  selectedSprintId,
  setSelectedSprintId,
  filters,
  setFilters,
  employees,
  onClearAllFilters,
  activeFilterCount
}) => {
  const [expandedSections, setExpandedSections] = useState({
    project: false,
    status: false,
    sprint: false,
    assignee: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const allExpanded = Object.values(expandedSections).every(v => v);

  const toggleAllSections = () => {
    const newState = !allExpanded;
    setExpandedSections({
      project: newState,
      status: newState,
      sprint: newState,
      assignee: newState
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[9999]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border-l border-white/20 dark:border-slate-800/60 z-[10000] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Liquid Edge Refraction (Design Detail) */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500/20 via-pink-500/20 to-purple-500/20" />

            {/* Header */}
            <div className="p-8 border-b border-gray-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Filters</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                    {activeFilterCount} Active Filters
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAllSections}
                  className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-indigo-500 hover:text-white transition-colors"
                  title={allExpanded ? "Collapse All" : "Expand All"}
                >
                  {allExpanded ? <FiChevronsUp className="w-5 h-5" /> : <FiChevronsDown className="w-5 h-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
              {/* Reset All (Float Top Right) */}
              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                      onClearAllFilters();
                      // We don't close the drawer so they can start over
                    }}
                    className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </motion.button>
                </div>
              )}

              {/* Project Selection */}
              <CollapsibleSection
                label="Project Context"
                icon={FiFolder}
                isOpen={expandedSections.project}
                onToggle={() => toggleSection('project')}
              >
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {projects.map(p => (
                    <DrawerFilterItem
                      key={p.id}
                      label={p.name}
                      isActive={selectedProjectId === p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                    />
                  ))}
                </div>
              </CollapsibleSection>

              {/* Status Selection */}
              <CollapsibleSection
                label="Task Status"
                icon={FiCircle}
                isOpen={expandedSections.status}
                onToggle={() => toggleSection('status')}
              >
                <div className="flex flex-wrap gap-2 mt-4">
                  {['all', 'To Do', 'In Progress', 'Review', 'Completed'].map(s => (
                    <DrawerPillItem
                      key={s}
                      label={s === 'all' ? 'All Statuses' : s}
                      isActive={filters.status === s}
                      onClick={() => setFilters({ ...filters, status: s })}
                    />
                  ))}
                </div>
              </CollapsibleSection>

              {/* Sprint Selection */}
              <CollapsibleSection
                label="Sprint Cycle"
                icon={FiTarget}
                isOpen={expandedSections.sprint}
                onToggle={() => toggleSection('sprint')}
              >
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <DrawerFilterItem
                    label="All Sprints"
                    isActive={selectedSprintId === 'all'}
                    onClick={() => setSelectedSprintId('all')}
                  />
                  {sprints.map(s => (
                    <DrawerFilterItem
                      key={s.id}
                      label={s.name}
                      isActive={selectedSprintId === s.id}
                      onClick={() => setSelectedSprintId(s.id)}
                      badge={s.status === 'Active' ? 'Active' : null}
                    />
                  ))}
                </div>
              </CollapsibleSection>

              {/* Assignee Selection */}
              <CollapsibleSection
                label="Assignee"
                icon={FiUsers}
                isOpen={expandedSections.assignee}
                onToggle={() => toggleSection('assignee')}
              >
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <DrawerFilterItem
                    label="All Team Members"
                    isActive={filters.assignee === 'all'}
                    onClick={() => setFilters({ ...filters, assignee: 'all' })}
                  />
                  {employees.map(e => (
                    <DrawerFilterItem
                      key={e.id}
                      label={e.name}
                      isActive={Array.isArray(filters.assignee) ? filters.assignee.includes(e.id) : filters.assignee === e.id}
                      onClick={() => {
                        const current = Array.isArray(filters.assignee) ? filters.assignee : (filters.assignee === 'all' ? [] : [filters.assignee]);
                        const next = current.includes(e.id) ? current.filter(id => id !== e.id) : [...current, e.id];
                        setFilters({ ...filters, assignee: next.length === 0 ? 'all' : next });
                      }}
                      image={e.avatar_url}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800/60">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all border border-indigo-400/30"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence >
  );
};

// --- SUB-COMPONENTS FOR DRAWER ---
const CollapsibleSection = ({ label, icon: Icon, children, isOpen, onToggle }) => (
  <div className="bg-white/5 dark:bg-slate-900/40 rounded-3xl border border-white/10 dark:border-slate-800/60 overflow-hidden shadow-sm">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-5 transition-all duration-300 ${isOpen ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl transition-colors duration-300 ${isOpen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-slate-300'}`}>{label}</span>
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        className={`${isOpen ? 'text-indigo-500' : 'text-gray-400'} transition-colors duration-300`}
      >
        <FiChevronDown className="w-5 h-5" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="border-t border-white/5 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/20">
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-5 space-y-1">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FilterSectionLabel = ({ label, icon: Icon }) => (
  <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
    <Icon className="w-4 h-4 text-indigo-500" />
    <span className="text-xs font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</span>
  </div>
);

const DrawerFilterItem = ({ label, isActive, onClick, image, badge }) => (
  <motion.button
    whileHover={{ x: 8 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border ${isActive
      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
      : 'bg-white dark:bg-slate-900/40 text-gray-700 dark:text-slate-300 border-gray-100 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
  >
    <div className="flex items-center gap-3">
      {image && <img src={image} alt="" className="w-6 h-6 rounded-full ring-2 ring-white/20" />}
      <span className="text-sm font-bold">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded-md border border-green-500/30">{badge}</span>}
      {isActive && <FiCheck className="w-4 h-4" />}
    </div>
  </motion.button>
);

const DrawerPillItem = ({ label, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${isActive
      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-white/20 shadow-lg shadow-indigo-500/20'
      : 'bg-gray-100 dark:bg-slate-800/60 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-800/60 hover:bg-gray-200 dark:hover:bg-slate-700'
      }`}
  >
    {label}
  </motion.button>
);
