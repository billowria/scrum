import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { notifySprintUpdate } from '../utils/notificationHelper';
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
  FiX
} from 'react-icons/fi';
import { createTaskNotification } from '../utils/notificationHelper';
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
        gradient: 'from-blue-400 to-indigo-600',
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

  const buttonClass = `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
    isActive 
      ? `${color} text-white shadow-lg` 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
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

export default function TasksPage({ sidebarOpen }) {
  // State management
  const [view, setView] = useState('board'); // 'board' or 'list'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
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
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showHeader, setShowHeader] = useState(true);
  
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
      setSelectedProjectId('all');
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
    link.download = `tasks_${selectedProjectId !== 'all' ? selectedProjectId : 'all'}_${new Date().toISOString().slice(0,10)}.csv`;
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
      if (!currentUser || !userRole) return;
      try {
        let query = supabase.from('users').select('id, name');
        if (userRole === 'manager' && currentUser.team_id) {
          query = query.eq('team_id', currentUser.team_id);
        } else if (userRole === 'member') {
          query = query.eq('id', currentUser.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [currentUser, userRole]);

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
          id, title, description, status, due_date, created_at, updated_at, project_id,
          assignee:team_members_view!assignee_id(
            id, 
            name,
            email,
            role,
            team_id,
            team_name
          ),
          reporter:team_members_view!reporter_id(
            id,
            name,
            team_name
          ),
          team:team_id(id, name),
          project:project_id(id, name),
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
        
        if (currentFilters.assignee && currentFilters.assignee !== 'all' && currentFilters.assignee.trim() !== '') {
          try {
            query = query.eq('assignee_id', currentFilters.assignee);
          } catch (assigneeError) {
            console.warn('Invalid assignee ID in filter:', currentFilters.assignee);
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
        if (searchTerm.length >= 1) { // Minimum search length
          query = query.ilike('title', `%${searchTerm}%`);
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
    // Only fetch tasks if we have user data
    if (currentUser && userRole) {
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
          // Only refetch if we have user data
          if (currentUser && userRole) {
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

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };
  
  const handleTaskView = (task) => {
    setViewingTask(task);
    setShowDetailModal(true);
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



  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      variants={statVariants}
      className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${color} hover:shadow-md transition-all duration-200 cursor-pointer`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-50')}`}>
          <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-2 text-xs">
          <FiTrendingUp className="w-3 h-3 text-green-500 mr-1" />
          <span className="text-green-600">{trend}</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Compact Minimal Header */}
      {showHeader && (
        <motion.div
          className="sticky top-16 z-[30] w-full -mt-4"
          id="tasks-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
            <div className="px-4 sm:px-6 py-2">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Title */}
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FiGrid className="w-4 h-4 text-white" />
                  </motion.div>
                  <h1 className="text-lg font-bold text-gray-900">Tasks</h1>
                </div>
                
                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <motion.button
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                        view === 'board' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setView('board')}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiGrid className="w-3 h-3" />
                      <span className="hidden sm:inline">Board</span>
                    </motion.button>
                    <motion.button
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                        view === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setView('list')}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiList className="w-3 h-3" />
                      <span className="hidden sm:inline">List</span>
                    </motion.button>
                    <motion.button
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                        view === 'sprint' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setView('sprint')}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiTarget className="w-3 h-3" />
                      <span className="hidden sm:inline">Sprint</span>
                    </motion.button>
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      <FiGrid className="w-3 h-3" />
                      {taskStats.total}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                      <FiClock className="w-3 h-3" />
                      {taskStats.inProgress}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                      <FiCheckCircle className="w-3 h-3" />
                      {taskStats.completed}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <motion.button
                    className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg"
                    onClick={fetchTasks}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Refresh"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                  </motion.button>

                  {userRole === 'manager' && (
                    <motion.button
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5"
                      onClick={() => {
                        setShowCreateModal(true);
                        setEditingTask(null);
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New</span>
                    </motion.button>
                  )}

                  {/* Hide Header Button */}
                  <motion.button
                    className="p-2 bg-gray-100 text-gray-600 hover:text-indigo-600 rounded-lg"
                    onClick={() => setShowHeader(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Hide Header"
                  >
                    <FiEyeOff className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Main Content */}
      <div className="pt-0">
        {/* Header Toggle Button - appears when header is hidden */}
        {!showHeader && (
          <motion.button
            className="fixed top-20 right-4 z-[99999] w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
            onClick={() => setShowHeader(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Show Header"
          >
            <FiEye className="w-3 h-3" />
          </motion.button>
        )}
        

        
        {/* Content */}
        <motion.div 
          variants={itemVariants} 
          className="bg-transparent overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center bg-white rounded-xl">
              <div className="inline-flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading tasks...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 bg-white rounded-xl">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
              {error}
            </div>
          ) : (
            <div className="p-0">
              {view === 'board' ? (
                <TaskBoard
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
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
                  getStatusConfig={getStatusConfig}
                  onClearAllFilters={handleClearAllFilters}
                  onOpenSprintManagement={() => setView('sprint')}
                />
              ) : view === 'list' ? (
                tasks.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-xl">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiGrid className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-6">
                      {search || filters.status !== 'all' 
                        ? 'Try adjusting your filters or search terms.'
                        : 'Get started by creating your first task.'
                      }
                    </p>
                    {userRole === 'manager' && (
                      <motion.button
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={() => setShowCreateModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiPlus className="mr-2" />
                        Create Your First Task
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <TaskList
                    tasks={tasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskEdit={handleTaskEdit}
                    onTaskDelete={handleTaskDelete}
                    onTaskView={handleTaskView}
                  />
                )
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

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && userRole === 'manager' && (
          <CreateTaskModalNew
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
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setViewingTask(null);
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
              
              // Find the task and open its detail view, passing current task as parent
              const clickedTask = tasks.find(t => t.id === taskId);
              if (clickedTask) {
                setViewingTask({...clickedTask, parentTaskId: viewingTask?.id}); // Pass current task ID as parent
                setShowDetailModal(true);
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
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Assign Tasks to Sprint</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sprint</label>
                    <select 
                      name="sprint_id" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tasks</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {tasks.filter(task => task.selected).length > 0 ? (
                        <ul className="space-y-1">
                          {tasks
                            .filter(task => task.selected)
                            .map(task => (
                              <li key={task.id} className="text-sm py-1 px-2 bg-gray-50 rounded flex justify-between">
                                <span className="truncate">{task.title}</span>
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
    </motion.div>
  );
}
