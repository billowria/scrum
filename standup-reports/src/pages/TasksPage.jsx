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

export default function TasksPage() {
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
      {/* Reimagined Beautiful Header */}
      <div className="relative bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 shadow-sm border-b border-gray-200/60 sticky top-0 z-40 backdrop-blur-sm">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Main Header Content */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
          >
            {/* Left Section - Title and Description */}
            <div className="flex items-start space-x-4">
              {/* Animated Icon Container */}
              <motion.div 
                className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl"
                whileHover={{ 
                  scale: 1.05,
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
                animate={{
                  boxShadow: [
                    "0 20px 40px rgba(59, 130, 246, 0.3)",
                    "0 20px 40px rgba(147, 51, 234, 0.3)",
                    "0 20px 40px rgba(59, 130, 246, 0.3)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FiGrid className="w-8 h-8 text-white" />
                {/* Floating particles effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute top-1 left-1 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                  <div className="absolute bottom-2 right-2 w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              </motion.div>

              {/* Title and Description */}
              <div className="flex-1">
                <motion.h1 
                  className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2"
                  variants={itemVariants}
                >
                  Task Management
                </motion.h1>
                <motion.p 
                  className="text-lg text-gray-600 font-medium"
                  variants={itemVariants}
                >
                  {userRole === 'manager' 
                    ? 'Manage your team\'s workflow and track progress' 
                    : 'View and update your assigned tasks'
                  }
                </motion.p>
                <motion.div 
                  className="flex items-center gap-4 mt-3"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live updates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiUsers className="w-4 h-4" />
                    <span>{userRole === 'manager' ? 'Team view' : 'Personal view'}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <motion.div 
              className="flex items-center gap-3"
              variants={itemVariants}
            >
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  className="p-3 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/60 transition-all duration-200 backdrop-blur-sm border border-gray-200/50"
                  onClick={() => setShowStats(!showStats)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={showStats ? 'Hide Statistics' : 'Show Statistics'}
                >
                  {showStats ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  className="p-3 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/60 transition-all duration-200 backdrop-blur-sm border border-gray-200/50"
                  onClick={() => setCompactMode(!compactMode)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={compactMode ? 'Normal View' : 'Compact View'}
                >
                  <FiSettings className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  className="p-3 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/60 transition-all duration-200 backdrop-blur-sm border border-gray-200/50"
                  onClick={fetchTasks}
                  whileHover={{ scale: 1.05, y: -2, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  title="Refresh Tasks"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Create Task Button - Only for Managers */}
              {userRole === 'manager' && (
                <motion.button
                  className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl flex items-center font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group"
                  onClick={() => {
                    setShowCreateModal(true);
                    setEditingTask(null);
                  }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -5,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Animated background layers */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center">
                    <motion.div
                      className="mr-3 p-2 bg-white/20 rounded-xl backdrop-blur-sm"
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiPlus className="w-6 h-6" />
                    </motion.div>
                    <span>Create Task</span>
                  </div>
                  
                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <motion.div
                      className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full"
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute bottom-3 right-6 w-0.5 h-0.5 bg-white/40 rounded-full"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.4, 0.8, 0.4],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                  </div>
                  
                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-500"></div>
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Enhanced Controls Section */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            {/* Professional View Toggle */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-gray-200/60">
                  <div className="flex relative">
                    {/* Animated background slider */}
                    <motion.div
                      className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md"
                      initial={{ width: view === 'board' ? '50%' : '50%', x: view === 'board' ? 0 : '100%' }}
                      animate={{ 
                        width: '50%', 
                        x: view === 'board' ? 0 : '100%' 
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30 
                      }}
                    />
                    
                    <motion.button
                      className={`relative px-6 py-3 rounded-xl flex items-center font-semibold text-sm transition-all duration-300 z-10 ${
                        view === 'board' 
                          ? 'text-white' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => setView('board')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiGrid className="mr-2 w-4 h-4" />
                      Board
                    </motion.button>
                    
                    <motion.button
                      className={`relative px-6 py-3 rounded-xl flex items-center font-semibold text-sm transition-all duration-300 z-10 ${
                        view === 'list' 
                          ? 'text-white' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => setView('list')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiList className="mr-2 w-4 h-4" />
                      List
                    </motion.button>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl -z-10"></div>
              </div>

              {/* Enhanced Quick Filters */}
              <div className="flex items-center gap-3">
                <motion.button
                  className="group relative px-4 py-2.5 text-sm bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-300 border border-red-200/50 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                    <span className="font-medium">Overdue</span>
                    <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-xs font-bold">
                      {taskStats.overdue}
                    </span>
                  </div>
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-red-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
                
                <motion.button
                  className="group relative px-4 py-2.5 text-sm bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border border-blue-200/50 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-2 group-hover:animate-spin" />
                    <span className="font-medium">Due Today</span>
                  </div>
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </div>
            </div>

            {/* Enhanced User Info */}
            <motion.div 
              className="flex items-center gap-4 text-sm"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/80 rounded-xl backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                  <span className="font-semibold text-gray-700 capitalize">{userRole}</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                {currentUser && (
                  <span className="font-medium text-gray-800">{currentUser.name}</span>
                )}
              </div>
              
              {/* Status indicator */}
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">Active</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
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