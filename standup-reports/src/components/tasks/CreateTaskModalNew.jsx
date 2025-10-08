import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiCalendar,
  FiUsers,
  FiEdit3,
  FiTag,
  FiFolder,
  FiClock,
  FiLink,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiEye,
  FiCheck,
  FiStar,
  FiBook,
  FiCheckSquare,
  FiLayout,
  FiTrendingUp,
  FiZap,
  FiPlus,
  FiXCircle,
  FiMinus,
  FiMaximize,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { format } from 'date-fns';
import { supabase } from '../../supabaseClient';
import { createTaskNotification } from '../../utils/notificationHelper';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';

const typeOptions = [
  { value: 'Bug', label: 'Bug', icon: FiXCircle, color: 'bg-red-100 text-red-800 border-red-300', iconColor: 'text-red-600' },
  { value: 'Feature', label: 'Feature', icon: FiStar, color: 'bg-blue-100 text-blue-800 border-blue-300', iconColor: 'text-blue-600' },
  { value: 'Story', label: 'Story', icon: FiBook, color: 'bg-green-100 text-green-800 border-green-300', iconColor: 'text-green-600' },
  { value: 'Task', label: 'Task', icon: FiCheckSquare, color: 'bg-purple-100 text-purple-800 border-purple-300', iconColor: 'text-purple-600' },
  { value: 'Epic', label: 'Epic', icon: FiLayout, color: 'bg-orange-100 text-orange-800 border-orange-300', iconColor: 'text-orange-600' },
  { value: 'Improvement', label: 'Improvement', icon: FiTrendingUp, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', iconColor: 'text-yellow-600' },
  { value: 'Spike', label: 'Spike', icon: FiZap, color: 'bg-indigo-100 text-indigo-800 border-indigo-300', iconColor: 'text-indigo-600' }
];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
const statusOptions = ['To Do', 'In Progress', 'Review', 'Completed'];

export default function CreateTaskModalNew({ isOpen, onClose, onSuccess, currentUser, userRole, task = null }) {
  // Form state
  const [formData, setFormData] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'Task',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    assignee_id: task?.assignee_id || '',
    team_id: task?.team_id || '',
    project_id: task?.project_id || '',
    sprint_id: task?.sprint_id || '',
    due_date: task?.due_date || '',
    parent_task_id: task?.parent_task_id || '',
    depends_on_task_id: task?.depends_on_task_id || '',
  }));

  // Search state for task selection
  const [parentTaskSearch, setParentTaskSearch] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    classification: true,
    assignment: true,
    timeline: true
  });

  // Options
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  // Changed from all projects to filtered projects
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Fetch options when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchOptions = async () => {
      try {
        // First check if we can get the current user
        const { data: { user: currentUserData }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!currentUserData) throw new Error('User not authenticated');
        
        const [{ data: usersData, error: usersError }, 
              { data: teamsData, error: teamsError }, 
              { data: projectsData, error: projectsError }, 
              { data: tasksData, error: tasksError }] = await Promise.all([
          supabase.from('users').select('id, name, avatar_url, email, team_id').order('name'),
          supabase.from('teams').select('id, name').order('name'),
          supabase.from('projects').select('id, name').order('name'),
          supabase.from('tasks').select('id, title, type, status, assignee_id').order('created_at', { ascending: false }).limit(50),
        ]);
        
        // Check for individual errors
        if (usersError) {
          console.error('Users fetch error:', usersError);
          throw usersError;
        }
        if (teamsError) {
          console.error('Teams fetch error:', teamsError);
          throw teamsError;
        }
        if (projectsError) {
          console.error('Projects fetch error:', projectsError);
          throw projectsError;
        }
        if (tasksError) {
          console.error('Tasks fetch error:', tasksError);
          throw tasksError;
        }

        setUsers(usersData || []);
        setTeams(teamsData || []);
        setAllProjects(projectsData || []);
        setTasks(tasksData || []);
        
        // Debug log users
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetched users:', usersData);
        }
        
        // When assignee is selected, filter projects assigned to that user
        if (formData.assignee_id) {
          filterProjectsByAssignee(formData.assignee_id);
        } else {
          setFilteredProjects([]);
        }
      } catch (err) {
        console.error('fetchOptions', err);
        setError('Failed to load options: ' + err.message);
      }
    };

    fetchOptions();
    
    // Set default values if creating a new task
    if (!task && currentUser) {
      const defaultAssigneeId = currentUser.id;
      const defaultTeamId = currentUser.team_id || '';
      
      setFormData(prev => ({
        ...prev,
        assignee_id: defaultAssigneeId,
        team_id: defaultTeamId
      }));
      
      // Filter projects for the default assignee
      filterProjectsByAssignee(defaultAssigneeId);
    }
  }, [isOpen, currentUser, task]);

  // Filter projects based on selected assignee
  const filterProjectsByAssignee = async (assigneeId) => {
    try {
      // For now, show all projects for the selected user
      // In a real implementation, you'd have project assignments to users
      setFilteredProjects(allProjects);
    } catch (err) {
      console.error('filterProjectsByAssignee', err);
      setFilteredProjects([]);
    }
  };

  // Fetch sprints when project changes
  useEffect(() => {
    if (formData.project_id) {
      const fetchSprints = async (projectId) => {
        try {
          const { data } = await supabase
            .from('sprints')
            .select('id, name, status, start_date, end_date')
            .eq('project_id', projectId)
            .order('start_date', { ascending: false });
          setSprints(data || []);
        } catch (err) {
          console.error('fetchSprints', err);
          setSprints([]);
        }
      };
      fetchSprints(formData.project_id);
    } else {
      setSprints([]);
    }
  }, [formData.project_id]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // When assignee changes, update projects
    if (field === 'assignee_id') {
      filterProjectsByAssignee(value);
    }
  };

  const validate = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        assignee_id: formData.assignee_id || null,
        team_id: formData.team_id || null,
        reporter_id: task?.reporter_id || user.id,
        project_id: formData.project_id || null,
        sprint_id: formData.sprint_id || null,
        due_date: formData.due_date || null,
        parent_task_id: formData.parent_task_id || null,
        depends_on_task_id: formData.depends_on_task_id || null,
      };

      let result;
      let isNewTask = !task;
      
      if (task) {
        result = await supabase.from('tasks').update(payload).eq('id', task.id).select().single();
        if (result.error) throw result.error;
      } else {
        result = await supabase.from('tasks').insert(payload).select().single();
        if (result.error) throw result.error;
      }

      // Create notification if task is assigned to someone other than the creator
      if (payload.assignee_id && payload.assignee_id !== user.id) {
        try {
          const action = isNewTask ? 'assigned' : 'reassigned';
          const currentUserData = users.find(u => u.id === user.id);
          const assigneeUserData = users.find(u => u.id === payload.assignee_id);
          
          await createTaskNotification(
            payload.assignee_id,
            result.data.id,
            result.data.title,
            action,
            `${currentUserData?.name || 'Someone'} ${isNewTask ? 'assigned' : 'reassigned'} you to the task "${result.data.title}"`,
            {
              task_id: result.data.id,
              assigned_by: user.id,
              assigned_to: payload.assignee_id,
              task_title: result.data.title
            }
          );
        } catch (notificationError) {
          console.error('Error creating task notification:', notificationError);
          // Continue even if notification fails
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        closeAndReset();
      }, 600);
    } catch (err) {
      console.error('save', err);
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Task',
      priority: 'Medium',
      status: 'To Do',
      assignee_id: '',
      team_id: '',
      project_id: '',
      sprint_id: '',
      due_date: '',
      parent_task_id: '',
      depends_on_task_id: '',
    });
    setError(null);
    setSuccess(false);
    onClose?.();
  };

  // Keyboard: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Enter' && e.ctrlKey && !loading) handleSubmit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl text-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-100/50 backdrop-blur-sm">
                  <FiEdit3 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {task ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-gray-600">
                      {task ? 'Update task details' : 'Fill in the task information'}
                    </p>
                    {/* Task creation status indicator */}
                    <div className="flex items-center gap-3">
                      {formData.title.trim() ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck className="mr-1 h-3 w-3" />
                          Title added
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FiAlertCircle className="mr-1 h-3 w-3" />
                          Add title
                        </span>
                      )}
                      {formData.assignee_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiUser className="mr-1 h-3 w-3" />
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FiUser className="mr-1 h-3 w-3" />
                          Assign user
                        </span>
                      )}
                      {/* Overall readiness indicator */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        formData.title.trim() && formData.assignee_id 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formData.title.trim() && formData.assignee_id 
                          ? 'Ready to create' 
                          : 'More info needed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <div>Task {task ? 'updated' : 'created'} successfully!</div>
              </div>
            )}

            {/* Basics Section */}
            <motion.div 
              className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                onClick={() => toggleSection('basics')}
              >
                <div className="flex items-center gap-3">
                  <FiEdit3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                  {formData.title && (
                    <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                      Completed
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.basics ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSections.basics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder="Enter task title..."
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                          autoFocus
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignee
                          </label>
                          <select
                            value={formData.assignee_id}
                            onChange={(e) => {
                              handleChange('assignee_id', e.target.value);
                              const sel = users.find(u => u.id === e.target.value);
                              if (sel?.team_id) handleChange('team_id', sel.team_id);
                            }}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                          >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                              </option>
                            ))}
                          </select>
                          {formData.assignee_id && (
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar user={users.find(u => u.id === formData.assignee_id)} size="sm" />
                              <span className="text-sm text-gray-700">
                                {users.find(u => u.id === formData.assignee_id)?.name}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project
                          </label>
                          {/* Project dropdown only shows when user is selected */}
                          {formData.assignee_id ? (
                            filteredProjects.length > 0 ? (
                              <div className="relative">
                                <select
                                  value={formData.project_id}
                                  onChange={(e) => handleChange('project_id', e.target.value)}
                                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm appearance-none"
                                >
                                  <option value="">Select a project</option>
                                  {filteredProjects.map(project => (
                                    <option key={project.id} value={project.id}>
                                      {project.name}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                  <FiChevronDown className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-500 text-sm">
                                No projects available for this user
                              </div>
                            )
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-500 text-sm">
                              Select an assignee to view their projects
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Task Type
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {typeOptions.map((typeOption) => {
                            const IconComponent = typeOption.icon;
                            return (
                              <motion.button
                                key={typeOption.value}
                                type="button"
                                onClick={() => handleChange('type', typeOption.value)}
                                className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                  formData.type === typeOption.value
                                    ? `${typeOption.color} ring-2 ring-offset-1 ring-indigo-500 shadow-sm`
                                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className={`p-1 rounded ${formData.type === typeOption.value ? 'bg-white' : 'bg-gray-100'}`}>
                                  <IconComponent className={`w-4 h-4 ${formData.type === typeOption.value ? typeOption.iconColor : 'text-gray-600'}`} />
                                </div>
                                <span className={`text-[0.6rem] font-medium text-center ${formData.type === typeOption.value ? typeOption.iconColor.replace('text-', '') + '800' : 'text-gray-700'}`}>
                                  {typeOption.label}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Describe the task in detail..."
                          rows={6}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y transition-all shadow-sm min-h-[120px] max-h-[300px]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Classification Section */}
            <motion.div 
              className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                onClick={() => toggleSection('classification')}
              >
                <div className="flex items-center gap-3">
                  <FiTag className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Classification</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.classification ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSections.classification && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Priority
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {priorityOptions.map(priority => (
                            <motion.button
                              key={priority}
                              type="button"
                              onClick={() => handleChange('priority', priority)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${
                                formData.priority === priority
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  priority === 'Low' ? 'bg-green-500' :
                                  priority === 'Medium' ? 'bg-yellow-500' :
                                  priority === 'High' ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="text-xs font-medium">{priority}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {statusOptions.map(status => (
                              <motion.button
                                key={status}
                                type="button"
                                onClick={() => handleChange('status', status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  formData.status === status
                                    ? status === 'To Do' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                                      status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                      status === 'Review' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                      'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {status}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Assignment Section */}
            <motion.div 
              className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                onClick={() => toggleSection('assignment')}
              >
                <div className="flex items-center gap-3">
                  <FiUsers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.assignment ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSections.assignment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assignee
                        </label>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative flex-1">
                            <select
                              value={formData.assignee_id}
                              onChange={(e) => {
                                handleChange('assignee_id', e.target.value);
                                const sel = users.find(u => u.id === e.target.value);
                                if (sel?.team_id) handleChange('team_id', sel.team_id);
                              }}
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm appearance-none"
                            >
                              <option value="">Unassigned</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <FiChevronDown className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          {currentUser && (
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('assignee_id', currentUser.id);
                                if (currentUser.team_id) handleChange('team_id', currentUser.team_id);
                              }}
                              className="px-3 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors whitespace-nowrap text-sm font-medium"
                              title="Assign to me"
                            >
                              <FiUser className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {/* Debug information - REMOVE IN PRODUCTION */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Users loaded: {users.length} | Current user ID: {currentUser?.id}
                          </div>
                        )}
                        {formData.assignee_id && users.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Avatar user={users.find(u => u.id === formData.assignee_id)} size="sm" />
                            <span className="text-sm text-gray-700">
                              {users.find(u => u.id === formData.assignee_id)?.name}
                            </span>
                          </div>
                        )}
                        {users.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">Loading users...</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parent Task
                        </label>
                        <div className="space-y-3">
                          {/* Search Input */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search parent tasks..."
                              value={parentTaskSearch}
                              onChange={(e) => setParentTaskSearch(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          
                          {/* Task List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {/* Show selected task prominently if one is selected */}
                            {formData.parent_task_id && (
                              (() => {
                                const selectedTask = tasks.find(t => t.id === formData.parent_task_id);
                                if (selectedTask) {
                                  const typeOption = typeOptions.find(option => option.value === selectedTask.type) || typeOptions[3];
                                  const IconComponent = typeOption.icon;
                                  
                                  return (
                                    <motion.div
                                      key={selectedTask.id}
                                      className="p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 shadow-sm"
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className={`p-1.5 rounded-lg ${typeOption.color}`}>
                                            <IconComponent className={`w-4 h-4 ${typeOption.iconColor}`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{selectedTask.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge type="status" value={selectedTask.status} size="xs" />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleChange('parent_task_id', '')}
                                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                          title="Remove parent task"
                                        >
                                          <FiX className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  );
                                }
                                return null;
                              })()
                            )}
                            
                            {/* Show "No parent task" option when none selected */}
                            {!formData.parent_task_id && (
                              <div
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  !formData.parent_task_id
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                                onClick={() => handleChange('parent_task_id', '')}
                              >
                                <div className="flex items-center justify-between">
                                  <span>No parent task</span>
                                  {!formData.parent_task_id && <FiCheck className="w-4 h-4" />}
                                </div>
                              </div>
                            )}
                            
                            {/* Show other tasks only when no task is selected or when searching */}
                            {(!formData.parent_task_id || parentTaskSearch) && (
                              (() => {
                                const filteredTasks = tasks.filter(t => 
                                  t.title.toLowerCase().includes(parentTaskSearch.toLowerCase()) &&
                                  t.id !== formData.parent_task_id
                                );
                                const displayTasks = parentTaskSearch ? filteredTasks : filteredTasks.slice(0, 5);
                                
                                return (
                                  <>
                                    {displayTasks.map(t => {
                                      const typeOption = typeOptions.find(option => option.value === t.type) || typeOptions[3];
                                      const IconComponent = typeOption.icon;
                                      
                                      return (
                                        <motion.div
                                          key={t.id}
                                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                            formData.parent_task_id === t.id
                                              ? 'border-indigo-500 bg-indigo-50'
                                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                          }`}
                                          onClick={() => handleChange('parent_task_id', t.id)}
                                          whileHover={{ scale: 1.01 }}
                                          whileTap={{ scale: 0.99 }}
                                        >
                                          <div className={`p-1.5 rounded-lg ${typeOption.color}`}>
                                            <IconComponent className={`w-4 h-4 ${typeOption.iconColor}`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{t.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge type="status" value={t.status} size="xs" />
                                            </div>
                                          </div>
                                          {formData.parent_task_id === t.id && <FiCheck className="w-4 h-4 text-indigo-600" />}
                                        </motion.div>
                                      );
                                    })}
                                    {!parentTaskSearch && filteredTasks.length > 5 && (
                                      <div className="text-center py-2 text-sm text-gray-500">
                                        Showing 5 of {filteredTasks.length} tasks. Use search to find more.
                                      </div>
                                    )}
                                    {parentTaskSearch && filteredTasks.length === 0 && (
                                      <div className="text-center py-3 text-sm text-gray-500">
                                        No tasks found matching "{parentTaskSearch}"
                                      </div>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Depends On
                        </label>
                        <div className="space-y-3">
                          {/* Search Input */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search dependencies..."
                              value={dependencySearch}
                              onChange={(e) => setDependencySearch(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          
                          {/* Task List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {/* Show selected dependency prominently if one is selected */}
                            {formData.depends_on_task_id && (
                              (() => {
                                const selectedTask = tasks.find(t => t.id === formData.depends_on_task_id);
                                if (selectedTask) {
                                  const typeOption = typeOptions.find(option => option.value === selectedTask.type) || typeOptions[3];
                                  const IconComponent = typeOption.icon;
                                  
                                  return (
                                    <motion.div
                                      key={selectedTask.id}
                                      className="p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 shadow-sm"
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className={`p-1.5 rounded-lg ${typeOption.color}`}>
                                            <IconComponent className={`w-4 h-4 ${typeOption.iconColor}`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{selectedTask.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge type="status" value={selectedTask.status} size="xs" />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleChange('depends_on_task_id', '')}
                                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                          title="Remove dependency"
                                        >
                                          <FiX className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  );
                                }
                                return null;
                              })()
                            )}
                            
                            {/* Show "No dependencies" option when none selected */}
                            {!formData.depends_on_task_id && (
                              <div
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  !formData.depends_on_task_id
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                                onClick={() => handleChange('depends_on_task_id', '')}
                              >
                                <div className="flex items-center justify-between">
                                  <span>No dependencies</span>
                                  {!formData.depends_on_task_id && <FiCheck className="w-4 h-4" />}
                                </div>
                              </div>
                            )}
                            
                            {/* Show other tasks only when no dependency is selected or when searching */}
                            {(!formData.depends_on_task_id || dependencySearch) && (
                              (() => {
                                const filteredTasks = tasks
                                  .filter(t => t.id !== formData.parent_task_id)
                                  .filter(t => 
                                    t.title.toLowerCase().includes(dependencySearch.toLowerCase()) &&
                                    t.id !== formData.depends_on_task_id
                                  );
                                const displayTasks = dependencySearch ? filteredTasks : filteredTasks.slice(0, 5);
                                
                                return (
                                  <>
                                    {displayTasks.map(t => {
                                      const typeOption = typeOptions.find(option => option.value === t.type) || typeOptions[3]; // default to Task
                                      const IconComponent = typeOption.icon;
                                      
                                      return (
                                        <motion.div
                                          key={t.id}
                                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                            formData.depends_on_task_id === t.id
                                              ? 'border-indigo-500 bg-indigo-50'
                                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                          }`}
                                          onClick={() => handleChange('depends_on_task_id', t.id)}
                                          whileHover={{ scale: 1.01 }}
                                          whileTap={{ scale: 0.99 }}
                                        >
                                          <div className={`p-1.5 rounded-lg ${typeOption.color}`}>
                                            <IconComponent className={`w-4 h-4 ${typeOption.iconColor}`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{t.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge type="status" value={t.status} size="xs" />
                                            </div>
                                          </div>
                                          {formData.depends_on_task_id === t.id && <FiCheck className="w-4 h-4 text-indigo-600" />}
                                        </motion.div>
                                      );
                                    })}
                                    {!dependencySearch && filteredTasks.length > 5 && (
                                      <div className="text-center py-2 text-sm text-gray-500">
                                        Showing 5 of {filteredTasks.length} tasks. Use search to find more.
                                      </div>
                                    )}
                                    {dependencySearch && filteredTasks.length === 0 && (
                                      <div className="text-center py-3 text-sm text-gray-500">
                                        No tasks found matching "{dependencySearch}"
                                      </div>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Timeline Section */}
            <motion.div 
              className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200"
                onClick={() => toggleSection('timeline')}
              >
                <div className="flex items-center gap-3">
                  <FiClock className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.timeline ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSections.timeline && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiCalendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => handleChange('due_date', e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>

                        {formData.project_id && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sprint
                            </label>
                            <select
                              value={formData.sprint_id}
                              onChange={(e) => handleChange('sprint_id', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            >
                              <option value="">No sprint</option>
                              {sprints.map(sprint => (
                                <option key={sprint.id} value={sprint.id}>
                                  {sprint.name} ({sprint.status})
                                </option>
                              ))}
                            </select>
                            {sprints.length === 0 && (
                              <p className="text-xs text-gray-500 mt-1">No sprints available for this project</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar user={currentUser} size="sm" />
                <span className="text-sm font-medium text-gray-700">{currentUser?.name || 'You'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancel
              </button>
              
              {/* Show enhanced button when task is ready */}
              {formData.title.trim() && formData.assignee_id ? (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading || !formData.title.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-6 py-2.5 rounded-xl text-white flex items-center gap-2 font-medium shadow-lg ${
                    loading || !formData.title.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                  } transition-all`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      {task ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      {task ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading || !formData.title.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-6 py-2.5 rounded-xl text-white flex items-center gap-2 font-medium ${
                    loading || !formData.title.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl'
                  } transition-all`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      {task ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      {task ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
