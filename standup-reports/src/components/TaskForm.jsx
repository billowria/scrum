import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiX, FiCalendar, FiUser, FiUsers, FiAlertCircle, FiPlus, FiEdit3, FiCheck, FiClock, FiTag, FiLoader } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30,
      duration: 0.4
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.3 }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const inputVariants = {
  focus: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  hover: {
    scale: 1.02
  },
  tap: {
    scale: 0.98
  }
};

export default function TaskForm({ 
  isOpen, 
  onClose, 
  task = null, // If provided, we're editing an existing task
  onSuccess,
  currentUser = null,
  userRole = null
}) {
  // Form state
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'To Do');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id || null);
  const [teamId, setTeamId] = useState(task?.team_id || null);
  const [dueDate, setDueDate] = useState(task?.due_date || null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Options for dropdowns
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(task?.project_id || '');
  
  // Status options with colors
  const statusOptions = [
    { value: 'To Do', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
    { value: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'Review', label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-700' }
  ];
  
  // Prevent members from creating tasks
  const isManager = userRole === 'manager';
  const isEdit = !!task;
  
  // Fetch users and teams
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar_url, team_id');
        
        if (usersError) throw usersError;
        setUsers(usersData);
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');
        
        if (teamsError) throw teamsError;
        setTeams(teamsData);
        
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .order('name', { ascending: true });
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
        
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Failed to load form options. Please try again.');
      }
    };
    
    fetchOptions();
  }, []);
  
  // Update teamId when assignee changes
  useEffect(() => {
    if (assigneeId && users.length > 0) {
      const selectedUser = users.find(u => u.id === assigneeId);
      if (selectedUser && selectedUser.team_id) {
        setTeamId(selectedUser.team_id);
      } else {
        setTeamId(null);
      }
    }
  }, [assigneeId, users]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isManager && !isEdit) {
      setError('Only managers can create tasks.');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status,
        assignee_id: assigneeId,
        team_id: teamId,
        due_date: dueDate,
        reporter_id: task?.reporter_id || user.id,
        project_id: projectId || null
      };
      
      let result;
      
      if (task) {
        // Update existing task
        result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()
          .single();
      } else {
        // Create new task
        result = await supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();
      }
      
      const { error: dbError } = result;
      if (dbError) throw dbError;
      
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Error saving task:', err);
      setError(`Failed to ${task ? 'update' : 'create'} task. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Animated background blobs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-primary-400 via-indigo-400 to-blue-300 opacity-30 blur-2xl rounded-full animate-pulse" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tr from-blue-400 via-indigo-300 to-primary-300 opacity-20 blur-2xl rounded-full animate-pulse delay-2000" />
          </div>
          {/* Modal */}
          <motion.div
            className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden border border-white/30 z-10"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating close button */}
            <motion.button
              className="absolute top-3 right-3 bg-white/60 backdrop-blur-lg rounded-full p-2 shadow-lg hover:shadow-xl hover:bg-white/90 transition-all z-20"
              onClick={onClose}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX className="w-5 h-5 text-primary-700" />
            </motion.button>
            {/* Floating icon header */}
            <div className="flex flex-col items-center pt-7 pb-2 px-6 relative">
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 via-indigo-500 to-blue-400 flex items-center justify-center shadow-xl ring-4 ring-white/60">
                  {isEdit ? <FiEdit3 className="w-8 h-8 text-white drop-shadow-lg" /> : <FiPlus className="w-8 h-8 text-white drop-shadow-lg" />}
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-primary-900 text-center tracking-tight">{isEdit ? 'Edit Task' : 'Create New Task'}</h3>
              <p className="text-xs text-primary-500 text-center mt-1 mb-2">{isEdit ? 'Update task details and assignments' : 'Add a new task to your project'}</p>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 flex flex-col gap-4">
              {/* Title Field */}
              <div className="relative group">
                <label htmlFor="title" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Title</label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    id="title"
                    className="w-full border-2 border-indigo-100 rounded-xl p-2 pl-9 bg-white/90 text-indigo-700 font-semibold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all shadow-sm text-sm"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* Description Field */}
              <div className="relative group">
                <label htmlFor="description" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Description</label>
                <div className="relative">
                  <FiEdit3 className="absolute left-3 top-3 text-blue-400" />
                  <textarea
                    id="description"
                    className="w-full border-2 border-blue-100 rounded-xl p-2 pl-9 bg-white/90 text-blue-700 font-semibold focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all shadow-sm text-sm"
                    rows="2"
                    placeholder="Enter task description..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
              {/* Due Date Field */}
              <div className="relative group">
                <label htmlFor="dueDate" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Due Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                  <input
                    id="dueDate"
                    type="date"
                    className="w-full border-2 border-primary-100 rounded-xl p-2 pl-9 bg-white/90 text-primary-800 font-semibold focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all shadow-sm text-sm"
                    value={dueDate || ''}
                    onChange={e => setDueDate(e.target.value || null)}
                  />
                </div>
              </div>
              {/* Assignee Field */}
              <div className="relative group">
                <label htmlFor="assignee" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Assignee</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                  <select
                    id="assignee"
                    className="w-full border-2 border-green-100 rounded-xl p-2 pl-9 bg-white/90 text-green-700 font-semibold focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all shadow-sm text-sm"
                    value={assigneeId || ''}
                    onChange={e => setAssigneeId(e.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Team Field */}
              <div className="relative group">
                <label htmlFor="team" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Team</label>
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <select
                    id="team"
                    className="w-full border-2 border-purple-100 rounded-xl p-2 pl-9 bg-white/90 text-purple-700 font-semibold focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all shadow-sm text-sm"
                    value={teamId || ''}
                    onChange={e => setTeamId(e.target.value || null)}
                  >
                    <option value="">No team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Project Field */}
              <div className="relative group">
                <label htmlFor="project" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Project</label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <select
                    id="project"
                    className="w-full border-2 border-emerald-100 rounded-xl p-2 pl-9 bg-white/90 text-emerald-700 font-semibold focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all shadow-sm text-sm"
                    value={projectId || ''}
                    onChange={e => setProjectId(e.target.value || '')}
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Status Field (edit only) */}
              {isEdit && (
                <div className="relative group">
                  <label htmlFor="status" className="block text-xs font-bold text-primary-700 mb-1 ml-1">Status</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
                    <select
                      id="status"
                      className="w-full border-2 border-yellow-100 rounded-xl p-2 pl-9 bg-white/90 text-yellow-700 font-semibold focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition-all shadow-sm text-sm"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {/* Error message */}
              {error && (
                <motion.div 
                  className="mb-2 p-2 bg-red-100 text-red-800 rounded-xl border border-red-200 flex items-start gap-2 shadow animate-pulse text-xs"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}
              {/* Action Button */}
              <motion.button
                type="submit"
                className="mt-2 w-full py-3 bg-gradient-to-r from-primary-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-extrabold shadow-xl hover:from-primary-700 hover:to-blue-700 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !title.trim()}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                animate={loading || !title.trim() ? "disabled" : ""}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    {isEdit ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEdit ? <FiEdit3 /> : <FiPlus />}
                    {isEdit ? 'Save Changes' : 'Create Task'}
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 