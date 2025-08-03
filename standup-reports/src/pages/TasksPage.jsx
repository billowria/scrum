import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
  FiEyeOff
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import TaskForm from '../components/TaskForm';
import TaskUpdateModal from '../components/TaskUpdateModal';
import TaskBoard from '../components/TaskBoard';
import TaskList from '../components/TaskList';

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
    search: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);

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
          id, title, description, status, due_date, created_at, updated_at,
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
  }, [filters, userRole, currentUser]);

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
      {/* Modern Compact Header */}
      <motion.div
        className={`fixed top-16 ${sidebarOpen ? 'left-64' : 'left-20'} z-30 transition-all duration-300`}
        id="tasks-header"
        style={{ right: 0 }}
      >
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title and Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <FiGrid className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-600">{format(new Date(), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="hidden md:flex items-center gap-4">
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">{taskStats.total} Total</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-orange-700">{taskStats.inProgress} Active</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">{taskStats.completed} Done</span>
                  </motion.div>
                  
                  {taskStats.overdue > 0 && (
                    <motion.div 
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      animate={{ 
                        boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.4)', '0 0 0 4px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0.4)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FiAlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-medium text-red-700">{taskStats.overdue} Overdue</span>
                    </motion.div>
                  )}
                </div>

                {/* Progress Bar */}
                {taskStats.total > 0 && (
                  <div className="hidden lg:flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((taskStats.completed / taskStats.total) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {Math.round((taskStats.completed / taskStats.total) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <motion.button
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setView('board')}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiGrid className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setView('list')}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiList className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Quick Actions */}
                <motion.button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                  onClick={fetchTasks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, rotate: 180 }}
                  title="Refresh Tasks"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </motion.button>

                <motion.button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                  onClick={() => setShowStats(!showStats)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={showStats ? 'Hide Statistics' : 'Show Statistics'}
                >
                  {showStats ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </motion.button>

                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-48 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mr-2"
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="all">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
                {/* Employee Filter */}
                <select
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mr-2"
                  value={filters.assignee}
                  onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>

                {/* Create Task Button - Only for Managers */}
                {userRole === 'manager' && (
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      setShowCreateModal(true);
                      setEditingTask(null);
                    }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Task</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
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
              ) : (
                <TaskList
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                />
              )}
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
      </AnimatePresence>
    </motion.div>
  );
} 