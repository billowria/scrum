import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { currentCompany } = useCompany();
  // State management
  const [view, setView] = useState('tasks'); // 'tasks' or 'sprint'
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
        let query = supabase.from('users').select('id, name')
          .eq('company_id', currentCompany?.id);
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
          id, title, description, status, due_date, created_at, updated_at, project_id, sprint_id,
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
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Creative Modern Tasks Header */}
      {showHeader && (
        <motion.div
          className={`fixed top-16 ${sidebarOpen ? 'left-64' : 'left-20'} right-0 z-[35] transition-all duration-200`}
          id="tasks-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          style={{
            width: `calc(100% - ${sidebarOpen ? '16rem' : '5rem'})`,
            transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), left 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Light Glassmorphism Header with Glowing Effects */}
          <div className="relative bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-2xl overflow-hidden">
            {/* Animated glowing background */}
            <div className="absolute inset-0">
              {/* Gradient glow layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 via-purple-100/30 to-pink-100/30"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/20 via-blue-100/20 to-emerald-100/20"></div>

              {/* Animated glowing orbs */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full blur-3xl"
                  style={{
                    width: `${150 + Math.random() * 200}px`,
                    height: `${150 + Math.random() * 200}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 50 - 25],
                    y: [0, Math.random() * 50 - 25],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: Math.random() * 4 + 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: Math.random() * 2,
                  }}
                >
                  <div className={`w-full h-full rounded-full bg-gradient-to-r ${
                    i % 3 === 0 ? 'from-blue-200/40 to-teal-200/40' :
                    i % 3 === 1 ? 'from-cyan-200/40 to-emerald-200/40' :
                    'from-pink-200/40 to-rose-200/40'
                  }`} />
                </motion.div>
              ))}

              {/* Floating sparkles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  animate={{
                    x: [0, Math.random() * 60 - 30],
                    y: [0, Math.random() * 60 - 30],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 2 + 1,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    filter: 'blur(0.5px)',
                  }}
                >
                  <div className="w-full h-full bg-white/80 rounded-full shadow-lg shadow-white/50" />
                </motion.div>
              ))}
            </div>

            {/* Glass reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/10"></div>

            {/* Content */}
            <div className="relative px-4 sm:px-6 lg:px-8 pt-4 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section - Brand & Title */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Glowing animated logo/icon */}
                  <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {/* Multi-layer glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-xl backdrop-blur-sm border border-white/20">
                      <FiGrid className="w-5 h-5 text-white" />
                    </div>
                    {/* Glowing orbiting dots */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full"
                        animate={{
                          rotate: [0, 360],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.3,
                        }}
                        style={{
                          top: '50%',
                          left: '50%',
                          transformOrigin: `0 ${20 + i * 8}px`,
                          filter: 'blur(0.5px)',
                        }}
                      >
                        <div className="w-full h-full bg-white rounded-full shadow-lg shadow-blue-400/50" />
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tasks</h1>
                      <motion.div
                        className="px-2 py-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        PRO
                      </motion.div>
                    </div>
                    <p className="text-sm text-gray-600 hidden sm:block">Manage your workflow with style</p>
                  </div>
                </div>

                {/* Center Section - Enhanced Modern View Toggle */}
                <div className="flex items-center justify-center">
                  <div className="relative group">
                    {/* Enhanced Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-teal-400/30 to-cyan-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Main Container */}
                    <div className="relative bg-white/25 backdrop-blur-2xl p-2 rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
                      {/* Animated Background Layers */}
                      <div className="absolute inset-0">
                        {/* Metallic Shimmer Layer */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-200/10 via-teal-200/15 to-cyan-200/10"
                          animate={{
                            x: ['-100%', '100%'],
                            opacity: [0, 0.3, 0]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: 1
                          }}
                        />
                        {/* Depth Layer */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5"></div>
                      </div>

                      {/* Floating Particles */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-30"
                          initial={{
                            x: Math.random() * 240,
                            y: Math.random() * 48,
                            scale: 0
                          }}
                          animate={{
                            y: [Math.random() * 48, Math.random() * 48, Math.random() * 48],
                            x: [Math.random() * 240, Math.random() * 240, Math.random() * 240],
                            scale: [0, 1, 0],
                            opacity: [0, 0.6, 0]
                          }}
                          transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                        />
                      ))}

                      <div className="relative flex items-center gap-1.5">
                        {[
                          { id: 'tasks', icon: FiGrid, label: 'Tasks' },
                          { id: 'sprint', icon: FiTarget, label: 'Sprint' }
                        ].map((tab, index) => (
                          <motion.button
                            key={tab.id}
                            className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                              view === tab.id
                                ? 'text-white shadow-2xl'
                                : 'text-gray-700/90 hover:text-gray-900 hover:bg-white/20'
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
                            {/* Enhanced Active Indicator */}
                            {view === tab.id && (
                              <>
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl border border-white/30"
                                  layoutId="activeTab"
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                />
                                {/* Inner Glow */}
                                <motion.div
                                  className="absolute inset-0.5 bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400 rounded-2xl opacity-50"
                                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                {/* Pulsing Border */}
                                <motion.div
                                  className="absolute inset-0 rounded-2xl border-2 border-white/60"
                                  animate={{ opacity: [0.8, 0.3, 0.8] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              </>
                            )}

                            {/* Enhanced Hover Glow for Inactive */}
                            {view !== tab.id && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-teal-400/30 to-cyan-400/20 rounded-2xl opacity-0 transition-opacity"
                                whileHover={{ opacity: 1 }}
                              />
                            )}

                            <div className="relative flex items-center gap-2.5">
                              <motion.div
                                animate={view === tab.id ? { rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                              >
                                <tab.icon className={view === tab.id ? "w-4 h-4" : "w-4 h-4"} />
                              </motion.div>
                              <span className="hidden sm:inline tracking-wide">{tab.label}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Glowing Stats & Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Glowing Stats Pills */}
                  <div className="hidden md:flex items-center gap-2">
                    {[
                      { value: taskStats.total, label: 'Total', colors: ['from-blue-400', 'to-cyan-400'], icon: FiGrid },
                      { value: taskStats.inProgress, label: 'In Progress', colors: ['from-amber-400', 'to-orange-400'], icon: FiClock },
                      { value: taskStats.completed, label: 'Done', colors: ['from-emerald-400', 'to-green-400'], icon: FiCheckCircle }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className={`relative bg-gradient-to-r ${stat.colors[0]} ${stat.colors[1]} px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg overflow-hidden backdrop-blur-sm`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        whileHover={{ y: -2, scale: 1.05 }}
                      >
                        {/* Glowing effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${stat.colors[0]} ${stat.colors[1]} rounded-full opacity-50 blur-md`}></div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        />
                        <div className="relative flex items-center gap-1">
                          <stat.icon className="w-3 h-3" />
                          <span>{stat.value}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Glowing Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Refresh button with glow */}
                    <motion.button
                      className="relative p-2.5 bg-white/40 backdrop-blur-xl border border-white/50 text-gray-700 rounded-xl hover:bg-white/60 transition-all group"
                      onClick={fetchTasks}
                      whileHover={{ scale: 1.05, rotate: 180 }}
                      whileTap={{ scale: 0.95 }}
                      title="Refresh Tasks"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <FiRefreshCw className="w-4 h-4 relative z-10" />
                    </motion.button>

                    {/* Glowing Create Task Button */}
                    {userRole === 'manager' && (
                      <motion.button
                        className="relative px-4 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-medium text-sm shadow-lg overflow-hidden group backdrop-blur-sm"
                        onClick={() => {
                          setShowCreateModal(true);
                          setEditingTask(null);
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Multi-layer glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-xl blur-md opacity-60"></div>
                        {/* Background shimmer on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <div className="relative flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <FiPlus className="w-4 h-4" />
                          </motion.div>
                          <span className="hidden sm:inline">Create</span>
                        </div>
                      </motion.button>
                    )}

                    {/* Glowing Hide/Show Header Toggle */}
                    <motion.button
                      className="relative p-2.5 bg-white/40 backdrop-blur-xl border border-white/50 text-gray-700 hover:text-gray-900 rounded-xl transition-all group"
                      onClick={() => setShowHeader(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Hide Header"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <FiEyeOff className="w-4 h-4 relative z-10" />
                    </motion.button>
                  </div>
                </div>
              </div>

              </div>
          </div>
        </motion.div>
      )}
      
      {/* Main Content */}
      <div className="pt-6 sm:pt-10 md:pt-12">
        {/* Light Glowing Header Toggle Button - appears when header is hidden */}
        {!showHeader && (
          <motion.button
            className={`fixed ${sidebarOpen ? 'right-4' : 'right-6'} z-[99999] px-4 py-2.5 bg-white/60 backdrop-blur-xl border border-white/60 text-gray-700 rounded-2xl shadow-2xl hover:shadow-3xl flex items-center gap-2 transition-all group`}
            onClick={() => setShowHeader(true)}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title="Show Header"
            style={{
              transition: 'right 200ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Multi-layer glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl blur-md opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/10 via-blue-300/10 to-emerald-300/10 rounded-2xl blur-lg"></div>
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-2xl"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="relative z-10"
            >
              <FiEye className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium relative z-10">Show Header</span>
            {/* Glowing notification dot */}
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full shadow-lg"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
            </motion.div>
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
                  getStatusConfig={getStatusConfig}
                  onClearAllFilters={handleClearAllFilters}
                  onOpenSprintManagement={() => setView('sprint')}
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
