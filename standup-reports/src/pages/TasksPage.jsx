import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiLayers
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import TaskForm from '../components/TaskForm';
import TaskUpdateModal from '../components/TaskUpdateModal';
import TaskBoard from '../components/TaskBoard';
import TaskList from '../components/TaskList';
import SprintBoard from '../components/SprintBoard';
import SprintModal from '../components/SprintModal';
import SprintAssignmentModal from '../components/SprintAssignmentModal';

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

export default function TasksPage({ sidebarOpen }) {
  // State management
  const [view, setView] = useState('board'); // 'board' or 'list'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(null);
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
  
  // Sprint planning state
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('all');
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintLoading, setSprintLoading] = useState(false);
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
      const { error } = await supabase
        .from('sprints')
        .update({
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sprintId);
        
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('sprints')
        .update({
          status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sprintId);
        
      if (error) throw error;
      
      // Refresh sprints
      fetchSprints();
    } catch (err) {
      console.error('Error completing sprint:', err);
      setError('Failed to complete sprint. Please try again.');
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

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Role-based filtering
      if (userRole === 'manager' && currentUser) {
        // Manager: show tasks assigned to any member in their team
        if (currentUser.team_id) {
          query = query.eq('team_id', currentUser.team_id);
        }
      } else if (userRole === 'member' && currentUser) {
        // Member: show only their own tasks
        query = query.eq('assignee_id', currentUser.id);
      }

      // Project filter
      if (selectedProjectId !== 'all') {
        query = query.eq('project_id', selectedProjectId);
      }

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.assignee !== 'all') {
        query = query.eq('assignee_id', filters.assignee);
      }
      if (filters.team !== 'all') {
        query = query.eq('team_id', filters.team);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      // Sprint filter
      if (selectedSprintId !== 'all') {
        query = query.eq('sprint_id', selectedSprintId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and real-time subscription
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
            fetchTasks();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filters, userRole, currentUser, selectedProjectId]);
  
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
      {/* Sprint Planning Modal */}
      <AnimatePresence>
        {showSprintModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
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
                <h2 className="text-xl font-bold mb-4">{editingSprint ? 'Edit Sprint' : 'Create New Sprint'}</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const sprintData = {
                    name: formData.get('name'),
                    goal: formData.get('goal'),
                    start_date: formData.get('start_date'),
                    end_date: formData.get('end_date'),
                    project_id: formData.get('project_id')
                  };
                  handleSprintSubmit(sprintData);
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      defaultValue={editingSprint?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Goal</label>
                    <textarea 
                      name="goal" 
                      defaultValue={editingSprint?.goal || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input 
                        type="date" 
                        name="start_date" 
                        defaultValue={editingSprint?.start_date || format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input 
                        type="date" 
                        name="end_date" 
                        defaultValue={editingSprint?.end_date || format(addWeeks(new Date(), 2), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select 
                      name="project_id" 
                      defaultValue={editingSprint?.project_id || selectedProjectId !== 'all' ? selectedProjectId : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={() => {
                        setShowSprintModal(false);
                        setEditingSprint(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      {editingSprint ? 'Update Sprint' : 'Create Sprint'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Professional Responsive Header */}
      <motion.div
        className={`sticky top-16 z-30 transition-all duration-300 w-full`}
        id="tasks-header"
      >
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 py-4">
            {/* Main Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Section: Title and Key Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <FiGrid className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-600">{format(new Date(), 'EEEE, MMM d, yyyy')}</p>
                  </div>
                </div>

                {/* Key Stats Cards */}
                <div className="flex flex-wrap items-center gap-2">
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <FiGrid className="w-4 h-4" />
                    <span className="text-sm font-medium">{taskStats.total}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm font-medium">{taskStats.inProgress}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{taskStats.completed}</span>
                  </motion.div>
                  
                  {taskStats.overdue > 0 && (
                    <motion.div 
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg shadow"
                      whileHover={{ scale: 1.03 }}
                      animate={{ 
                        boxShadow: ['0 0 0 0 rgba(244, 63, 94, 0.4)', '0 0 0 6px rgba(244, 63, 94, 0)', '0 0 0 0 rgba(244, 63, 94, 0.4)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{taskStats.overdue}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Section: Primary Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-inner">
                <motion.button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    view === 'board' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setView('board')}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiGrid className="w-4 h-4" />
                  <span className="hidden xs:inline">Board</span>
                </motion.button>
                <motion.button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    view === 'list' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setView('list')}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiList className="w-4 h-4" />
                  <span className="hidden xs:inline">List</span>
                </motion.button>
                <motion.button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    view === 'sprint' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setView('sprint')}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTarget className="w-4 h-4" />
                  <span className="hidden xs:inline">Sprints</span>
                </motion.button>
              </div>

                {/* Refresh Button */}
                <motion.button
                  className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg shadow-sm hover:shadow transition-all"
                  onClick={fetchTasks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, rotate: 180 }}
                  title="Refresh Tasks"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </motion.button>

                {/* Export Button */}
                <motion.button
                  className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  onClick={exportTasksToCSV}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  title="Export Tasks to CSV"
                >
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </motion.button>

                {/* Create Task Button - Only for Managers */}
                {userRole === 'manager' && (
                  <motion.button
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setShowCreateModal(true);
                      setEditingTask(null);
                    }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Task</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Secondary Row: Filters and Search */}
            <div className="mt-4 flex flex-col gap-4">
              {/* Filters Section - colorful pill controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Project Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-3 text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">Project</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700"><FiFolder className="w-4 h-4" /></div>
                    <select
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedSprintId('all');
                      }}
                    >
                      <option value="all">All Projects</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-3 text-xs px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-sm">Status</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm focus-within:ring-2 focus-within:ring-amber-400">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><FiFilter className="w-4 h-4" /></div>
                    <select
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                      value={filters.status}
                      onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="all">All Statuses</option>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Sprint Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-3 text-xs px-2 py-0.5 rounded-full bg-fuchsia-600 text-white shadow-sm">Sprint</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-200 shadow-sm focus-within:ring-2 focus-within:ring-fuchsia-400">
                    <div className="p-2 rounded-lg bg-fuchsia-100 text-fuchsia-700"><FiTarget className="w-4 h-4" /></div>
                    <select
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                      value={selectedSprintId}
                      onChange={e => setSelectedSprintId(e.target.value)}
                    >
                      <option value="all">All Sprints</option>
                      {sprints.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name} {sprint.status === 'Active' ? '(Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employee Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-3 text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">Assignee</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm focus-within:ring-2 focus-within:ring-emerald-400">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><FiUsers className="w-4 h-4" /></div>
                    <select
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                      value={filters.assignee}
                      onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}
                    >
                      <option value="all">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick actions and search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {currentUser && (
                    <motion.button
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                        filters.assignee === currentUser.id 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200' 
                          : 'bg-white/80 backdrop-blur border border-gray-200 text-gray-700 hover:bg-white'
                      }`}
                      onClick={() => setFilters(f => ({ ...f, assignee: f.assignee === currentUser.id ? 'all' : currentUser.id }))}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      title="Toggle Assigned to Me"
                    >
                      <FiUser className="inline w-3 h-3 mr-1" />
                      My Tasks
                    </motion.button>
                  )}

                  <motion.button
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
                    onClick={() => { setFilters({ status: 'all', assignee: 'all', team: 'all', dueDate: 'all', search: '' }); setSearch(''); setSelectedProjectId('all'); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    title="Clear All Filters"
                  >
                    Clear
                  </motion.button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-auto">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-64 text-sm rounded-xl border border-gray-200 bg-white/90 backdrop-blur focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              </div>
            </div>

            {/* Compact Stats Row with Progress Indicator */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Progress Indicator */}
              {taskStats.total > 0 && (
                <motion.div 
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <FiBarChart2 className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {Math.round((taskStats.completed / taskStats.total) * 100)}%
                  </span>
                </motion.div>
              )}
              
              {/* Toggle Stats Visibility */}
              <motion.button
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-all"
                onClick={() => setShowStats(!showStats)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                title={showStats ? 'Hide Detailed Statistics' : 'Show Detailed Statistics'}
              >
                {showStats ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                <span className="hidden xs:inline">
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Active Filters Bar */}
      <div className="px-6 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {selectedProjectId !== 'all' && (
            <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">Project: {projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId}</span>
          )}
          {filters.status !== 'all' && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border">Status: {filters.status}</span>
          )}
          {filters.assignee !== 'all' && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border">Assignee: {employees.find(e => e.id === filters.assignee)?.name || 'Me'}</span>
          )}
          {filters.search && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border">Search: {filters.search}</span>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-4">
        {/* Content */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading tasks...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
              {error}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
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
            <div className={compactMode ? 'p-2' : 'p-6'}>
              {view === 'board' ? (
                <TaskBoard
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  search={search}
                  setSearch={setSearch}
                />
              ) : view === 'list' ? (
                <TaskList
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                />
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Sprint Board</h2>
                    {userRole === 'manager' && (
                      <motion.button
                        onClick={() => {
                          setEditingSprint(null);
                          setShowSprintModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>New Sprint</span>
                      </motion.button>
                    )}
                  </div>
                  
                  <SprintBoard
                    sprints={sprints}
                    onEditSprint={(sprint) => {
                      setEditingSprint(sprint);
                      setShowSprintModal(true);
                    }}
                    onStartSprint={startSprint}
                    onCompleteSprint={completeSprint}
                    selectedSprintId={selectedSprintId}
                    onSelectSprint={(sprintId) => setSelectedSprintId(sprintId === selectedSprintId ? 'all' : sprintId)}
                  />
                </div>)}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && userRole === 'manager' && (
          <TaskForm
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
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
      </AnimatePresence>
    </motion.div>
  );
}