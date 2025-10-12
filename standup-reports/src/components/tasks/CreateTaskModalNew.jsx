import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSave, FiLoader, FiAlertCircle, FiCalendar, FiEdit3, FiTag, FiFolder, FiClock, FiUser,
  FiCheck, FiStar, FiBook, FiCheckSquare, FiLayout, FiTrendingUp, FiZap, FiXCircle, FiChevronDown,
  FiAlignLeft, FiTarget, FiActivity, FiPause, FiPlay, FiXOctagon, FiEye, FiSearch, FiLink,
  FiGitBranch, FiLayers, FiUserPlus, FiUsers, FiChevronRight
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { createTaskNotification } from '../../utils/notificationHelper';
import Avatar from '../shared/Avatar';
import Badge from '../shared/Badge';

const typeOptions = [
  { value: 'Bug', icon: FiXCircle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', ring: 'ring-red-400' },
  { value: 'Feature', icon: FiStar, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', ring: 'ring-blue-400' },
  { value: 'Story', icon: FiBook, gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', ring: 'ring-green-400' },
  { value: 'Task', icon: FiCheckSquare, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400' },
  { value: 'Epic', icon: FiLayout, gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', ring: 'ring-orange-400' },
  { value: 'Improvement', icon: FiTrendingUp, gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', ring: 'ring-yellow-400' },
  { value: 'Spike', icon: FiZap, gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', ring: 'ring-indigo-400' }
];

const priorityOptions = [
  { value: 'Low', icon: FiCheck, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  { value: 'Medium', icon: FiClock, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  { value: 'High', icon: FiAlertCircle, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  { value: 'Critical', icon: FiXOctagon, color: 'from-red-500 to-rose-700', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' }
];

const statusOptions = [
  { value: 'To Do', icon: FiPause, color: 'from-gray-500 to-slate-600', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
  { value: 'In Progress', icon: FiPlay, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'Review', icon: FiEye, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  { value: 'Completed', icon: FiCheckSquare, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' }
];

export default function CreateTaskModalNew({ isOpen, onClose, onSuccess, currentUser, userRole, task = null }) {
  const titleInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
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
  });

  const [activeTab, setActiveTab] = useState('essentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [parentTaskSearch, setParentTaskSearch] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchOptions = async () => {
      try {
        const { data: { user: currentUserData }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!currentUserData) throw new Error('User not authenticated');
        
        const [{ data: usersData }, { data: teamsData }, { data: projectsData }, { data: tasksData }] = await Promise.all([
          supabase.from('users').select('id, name, avatar_url, email, team_id').order('name'),
          supabase.from('teams').select('id, name').order('name'),
          supabase.from('projects').select('id, name').order('name'),
          supabase.from('tasks').select('id, title, type, status, priority').order('created_at', { ascending: false }).limit(100),
        ]);
        
        setUsers(usersData || []);
        setTeams(teamsData || []);
        setAllProjects(projectsData || []);
        setTasks(tasksData || []);
        
        if (!task && currentUser) {
          setFormData(prev => ({
            ...prev,
            assignee_id: currentUser.id,
            team_id: currentUser.team_id || ''
          }));
          setFilteredProjects(projectsData || []);
        } else if (formData.assignee_id) {
          setFilteredProjects(projectsData || []);
        }
      } catch (err) {
        console.error('fetchOptions', err);
        setError('Failed to load options: ' + err.message);
      }
    };

    fetchOptions();
    setTimeout(() => titleInputRef.current?.focus(), 100);
  }, [isOpen]);

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
    
    if (field === 'assignee_id') {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser?.team_id) {
        setFormData(prev => ({ ...prev, team_id: selectedUser.team_id }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      setActiveTab('essentials');
      return;
    }
    
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
      };

      let result;
      
      if (task) {
        result = await supabase.from('tasks').update(payload).eq('id', task.id).select().single();
        if (result.error) throw result.error;
      } else {
        result = await supabase.from('tasks').insert(payload).select().single();
        if (result.error) throw result.error;
      }

      // Add dependency if specified
      if (formData.depends_on_task_id && !task) {
        await supabase.from('task_dependencies').insert({
          task_id: result.data.id,
          depends_on_task_id: formData.depends_on_task_id,
          dependency_type: 'blocks'
        });
      }

      if (payload.assignee_id && payload.assignee_id !== user.id) {
        try {
          const currentUserData = users.find(u => u.id === user.id);
          await createTaskNotification(
            payload.assignee_id,
            result.data.id,
            result.data.title,
            'assigned',
            `${currentUserData?.name || 'Someone'} assigned you to "${result.data.title}"`,
            { task_id: result.data.id, assigned_by: user.id, assigned_to: payload.assignee_id }
          );
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        closeAndReset();
      }, 800);
    } catch (err) {
      console.error('save', err);
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setFormData({
      title: '', description: '', type: 'Task', priority: 'Medium', status: 'To Do',
      assignee_id: '', team_id: '', project_id: '', sprint_id: '', due_date: '',
      parent_task_id: '', depends_on_task_id: '',
    });
    setError(null);
    setSuccess(false);
    setShowAssigneeDropdown(false);
    setAssigneeSearch('');
    setParentTaskSearch('');
    setDependencySearch('');
    setActiveTab('essentials');
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeAndReset();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) handleSubmit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, formData]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const filteredParentTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(parentTaskSearch.toLowerCase()) &&
    t.id !== formData.parent_task_id
  );

  const filteredDependencyTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(dependencySearch.toLowerCase()) &&
    t.id !== formData.depends_on_task_id &&
    t.id !== formData.parent_task_id
  );

  const selectedAssignee = users.find(u => u.id === formData.assignee_id);
  const selectedParentTask = tasks.find(t => t.id === formData.parent_task_id);
  const selectedDependency = tasks.find(t => t.id === formData.depends_on_task_id);

  const tabs = [
    { id: 'essentials', label: 'Essentials', icon: FiEdit3, count: 0 },
    { id: 'classification', label: 'Classification', icon: FiTag, count: 0 },
    { id: 'relationships', label: 'Relationships', icon: FiGitBranch, count: (formData.parent_task_id ? 1 : 0) + (formData.depends_on_task_id ? 1 : 0) },
    { id: 'timeline', label: 'Timeline', icon: FiClock, count: formData.due_date ? 1 : 0 }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeAndReset}
        >
          <motion.div
            className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white flex-shrink-0">
              <button
                onClick={closeAndReset}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiEdit3 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{task ? 'Edit Task' : 'Create New Task'}</h2>
                  <p className="text-purple-100 text-sm mt-0.5">Fill in the details to create a comprehensive task</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-purple-700 shadow-lg'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'bg-white/30'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-red-200 bg-red-50"
                >
                  <div className="p-4 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-green-200 bg-green-50"
                >
                  <div className="p-4 flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 font-medium">Task {task ? 'updated' : 'created'} successfully!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Essentials Tab */}
                {activeTab === 'essentials' && (
                  <motion.div
                    key="essentials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Task Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      />
                    </div>

                    {/* Assignee & Project Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Assignee */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiUser className="inline w-4 h-4 mr-1" />
                          Assignee
                        </label>
                        <div className="relative">
                          <button
                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-left flex items-center justify-between"
                          >
                            {selectedAssignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar user={selectedAssignee} size="xs" />
                                <span className="text-sm font-medium truncate">{selectedAssignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Select assignee...</span>
                            )}
                            <FiChevronDown className="w-4 h-4 text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {showAssigneeDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden"
                              >
                                <div className="p-2">
                                  <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder="Search users..."
                                      value={assigneeSearch}
                                      onChange={(e) => setAssigneeSearch(e.target.value)}
                                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                      autoFocus
                                    />
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  <button
                                    onClick={() => {
                                      handleChange('assignee_id', '');
                                      setShowAssigneeDropdown(false);
                                      setAssigneeSearch('');
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-gray-50 text-left text-sm text-gray-600 transition-colors"
                                  >
                                    Unassigned
                                  </button>
                                  {filteredUsers.map(user => (
                                    <button
                                      key={user.id}
                                      onClick={() => {
                                        handleChange('assignee_id', user.id);
                                        setShowAssigneeDropdown(false);
                                        setAssigneeSearch('');
                                      }}
                                      className="w-full px-4 py-2.5 hover:bg-purple-50 text-left transition-colors flex items-center gap-3"
                                    >
                                      <Avatar user={user} size="xs" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                      </div>
                                      {user.id === currentUser?.id && (
                                        <span className="text-xs text-purple-600 font-medium">You</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Project */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiFolder className="inline w-4 h-4 mr-1" />
                          Project
                        </label>
                        <select
                          value={formData.project_id}
                          onChange={(e) => handleChange('project_id', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        >
                          <option value="">No project</option>
                          {filteredProjects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiAlignLeft className="inline w-4 h-4 mr-1" />
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Add details about the task..."
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none resize-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Classification Tab */}
                {activeTab === 'classification' && (
                  <motion.div
                    key="classification"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <FiTag className="inline w-4 h-4 mr-1" />
                        Task Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {typeOptions.map(type => {
                          const Icon = type.icon;
                          const isSelected = formData.type === type.value;
                          return (
                            <motion.button
                              key={type.value}
                              type="button"
                              onClick={() => handleChange('type', type.value)}
                              className={`relative p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? `${type.border} bg-gradient-to-br ${type.gradient} text-white shadow-lg ring-4 ${type.ring} ring-opacity-50`
                                  : `${type.border} ${type.bg} ${type.text} hover:shadow-md`
                              }`}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : ''}`} />
                                <span className="text-xs font-bold">{type.value}</span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                                >
                                  <FiCheck className="w-3 h-3 text-purple-600" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <FiTarget className="inline w-4 h-4 mr-1" />
                        Priority Level
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {priorityOptions.map(priority => {
                          const Icon = priority.icon;
                          const isSelected = formData.priority === priority.value;
                          return (
                            <motion.button
                              key={priority.value}
                              type="button"
                              onClick={() => handleChange('priority', priority.value)}
                              className={`relative p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? `${priority.border} bg-gradient-to-br ${priority.color} text-white shadow-lg ring-4 ring-opacity-50`
                                  : `${priority.border} ${priority.bg} ${priority.text} hover:shadow-md`
                              }`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : ''}`} />
                                <span className="text-sm font-bold">{priority.value}</span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                                >
                                  <FiCheck className="w-3 h-3 text-gray-900" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <FiActivity className="inline w-4 h-4 mr-1" />
                        Status
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {statusOptions.map(status => {
                          const Icon = status.icon;
                          const isSelected = formData.status === status.value;
                          return (
                            <motion.button
                              key={status.value}
                              type="button"
                              onClick={() => handleChange('status', status.value)}
                              className={`relative p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? `${status.border} bg-gradient-to-br ${status.color} text-white shadow-lg ring-4 ring-opacity-50`
                                  : `${status.border} ${status.bg} ${status.text} hover:shadow-md`
                              }`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : ''}`} />
                                <span className="text-sm font-bold">{status.value}</span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                                >
                                  <FiCheck className="w-3 h-3 text-gray-900" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Relationships Tab */}
                {activeTab === 'relationships' && (
                  <motion.div
                    key="relationships"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Parent Task */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <FiLayers className="inline w-4 h-4 mr-1" />
                        Parent Task
                      </label>
                      
                      {selectedParentTask && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3 p-4 bg-indigo-50 border-2 border-indigo-300 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Badge type="type" value={selectedParentTask.type} size="sm" />
                            <span className="font-medium text-gray-900">{selectedParentTask.title}</span>
                          </div>
                          <button
                            onClick={() => handleChange('parent_task_id', '')}
                            className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <FiX className="w-4 h-4 text-indigo-600" />
                          </button>
                        </motion.div>
                      )}

                      <div className="relative mb-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search parent tasks..."
                          value={parentTaskSearch}
                          onChange={(e) => setParentTaskSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {!formData.parent_task_id && (
                          <button
                            onClick={() => handleChange('parent_task_id', '')}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-left transition-colors"
                          >
                            <span className="text-gray-600">No parent task</span>
                          </button>
                        )}
                        {filteredParentTasks.slice(0, 5).map(t => {
                          const typeOption = typeOptions.find(opt => opt.value === t.type) || typeOptions[3];
                          const Icon = typeOption.icon;
                          return (
                            <motion.button
                              key={t.id}
                              onClick={() => handleChange('parent_task_id', t.id)}
                              className="w-full p-3 bg-white border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-left transition-all flex items-center gap-3"
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${typeOption.gradient}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{t.title}</div>
                                <Badge type="status" value={t.status} size="xs" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dependencies */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <FiGitBranch className="inline w-4 h-4 mr-1" />
                        Depends On
                      </label>
                      
                      {selectedDependency && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Badge type="type" value={selectedDependency.type} size="sm" />
                            <span className="font-medium text-gray-900">{selectedDependency.title}</span>
                          </div>
                          <button
                            onClick={() => handleChange('depends_on_task_id', '')}
                            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <FiX className="w-4 h-4 text-amber-600" />
                          </button>
                        </motion.div>
                      )}

                      <div className="relative mb-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search dependencies..."
                          value={dependencySearch}
                          onChange={(e) => setDependencySearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {!formData.depends_on_task_id && (
                          <button
                            onClick={() => handleChange('depends_on_task_id', '')}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-left transition-colors"
                          >
                            <span className="text-gray-600">No dependencies</span>
                          </button>
                        )}
                        {filteredDependencyTasks.slice(0, 5).map(t => {
                          const typeOption = typeOptions.find(opt => opt.value === t.type) || typeOptions[3];
                          const Icon = typeOption.icon;
                          return (
                            <motion.button
                              key={t.id}
                              onClick={() => handleChange('depends_on_task_id', t.id)}
                              className="w-full p-3 bg-white border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-left transition-all flex items-center gap-3"
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${typeOption.gradient}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{t.title}</div>
                                <Badge type="status" value={t.status} size="xs" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiCalendar className="inline w-4 h-4 mr-1" />
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => handleChange('due_date', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        />
                      </div>

                      {/* Sprint */}
                      {formData.project_id && sprints.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiClock className="inline w-4 h-4 mr-1" />
                            Sprint
                          </label>
                          <select
                            value={formData.sprint_id}
                            onChange={(e) => handleChange('sprint_id', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                          >
                            <option value="">No sprint</option>
                            {sprints.map(sprint => (
                              <option key={sprint.id} value={sprint.id}>
                                {sprint.name} ({sprint.status})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Team Info */}
                    {formData.team_id && (
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-700">
                          <FiUsers className="w-5 h-5" />
                          <span className="font-medium">Team: {teams.find(t => t.id === formData.team_id)?.name}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar user={currentUser} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">Reporter</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeAndReset}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading || !formData.title.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-6 py-2.5 rounded-xl text-white flex items-center gap-2 font-medium shadow-lg transition-all ${
                    loading || !formData.title.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      {task ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      {task ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="px-6 pb-3 text-center text-xs text-gray-500 flex-shrink-0">
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Esc</kbd> to close •{' '}
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">⌘ Enter</kbd> to save
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
