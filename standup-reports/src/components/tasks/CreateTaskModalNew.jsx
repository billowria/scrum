import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiCalendar,
  FiUser,
  FiUsers,
  FiClock,
  FiLink,
  FiTag,
  FiEdit3,
  FiTarget,
  FiFolder,
  FiZap,
  FiFlag,
  FiLayers,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { supabase } from '../../supabaseClient';
import { colors, animations } from '../../config/designSystem';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';

/**
 * CreateTaskModalNew - Professional multi-step task creation wizard
 * Inspired by Jira with modern UX
 */
const CreateTaskModalNew = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  userRole,
  task = null, // If provided, we're editing
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Simplified from 7 to 4 for better UX

  // Form state
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

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Options data
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Step definitions
  const steps = [
    {
      id: 1,
      title: 'Basics',
      icon: FiEdit3,
      description: 'Task title and description',
    },
    {
      id: 2,
      title: 'Classification',
      icon: FiTag,
      description: 'Type, priority, and status',
    },
    {
      id: 3,
      title: 'Assignment',
      icon: FiUsers,
      description: 'Assign to team and members',
    },
    {
      id: 4,
      title: 'Timeline',
      icon: FiCalendar,
      description: 'Due date and sprint',
    },
  ];

  // Type options
  const typeOptions = ['Bug', 'Feature', 'Story', 'Task', 'Epic', 'Improvement', 'Spike'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['To Do', 'In Progress', 'Review', 'Completed'];

  // Fetch options on mount
  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      // Auto-assign to current user if creating new
      if (!task && currentUser) {
        setFormData((prev) => ({
          ...prev,
          assignee_id: currentUser.id,
          team_id: currentUser.team_id || '',
        }));
      }
    }
  }, [isOpen, currentUser, task]);

  // Fetch sprints when project changes
  useEffect(() => {
    if (formData.project_id) {
      fetchSprints(formData.project_id);
    } else {
      setSprints([]);
    }
  }, [formData.project_id]);

  const fetchOptions = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, avatar_url, email, team_id')
        .order('name');
      setUsers(usersData || []);

      // Fetch teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      setTeams(teamsData || []);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      setProjects(projectsData || []);

      // Fetch tasks for dependencies
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, type, status')
        .order('created_at', { ascending: false })
        .limit(50);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const fetchSprints = async (projectId) => {
    try {
      const { data } = await supabase
        .from('sprints')
        .select('id, name, status, start_date, end_date')
        .eq('project_id', projectId)
        .order('start_date', { ascending: false });
      setSprints(data || []);
    } catch (err) {
      console.error('Error fetching sprints:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          setError('Task title is required');
          return false;
        }
        return true;
      case 2:
        return true; // Type, priority, status have defaults
      case 3:
        return true; // Assignment is optional
      case 4:
        return true; // Timeline is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const taskData = {
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

      if (result.error) throw result.error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1000);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message || `Failed to ${task ? 'update' : 'create'} task`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
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
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {task ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-indigo-100 text-sm">
                  Step {currentStep} of {totalSteps}: {steps[currentStep - 1].description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-indigo-800/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Steps indicator */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          transition-colors duration-200
                          ${
                            isCompleted
                              ? 'bg-indigo-600 text-white'
                              : isActive
                              ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600'
                              : 'bg-gray-200 text-gray-500'
                          }
                        `}
                        whileHover={{ scale: 1.05 }}
                      >
                        {isCompleted ? (
                          <FiCheck className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </motion.div>
                      <span
                        className={`
                          mt-2 text-xs font-medium
                          ${isActive ? 'text-indigo-600' : 'text-gray-500'}
                        `}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gray-200 mx-2 mt-[-24px]">
                        <motion.div
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Basics */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Task Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Fix login button not responding"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Provide details about what needs to be done..."
                        rows="6"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project
                      </label>
                      <select
                        value={formData.project_id}
                        onChange={(e) => handleInputChange('project_id', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        <option value="">No project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Classification */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Task Type
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {typeOptions.map((type) => (
                          <motion.button
                            key={type}
                            type="button"
                            onClick={() => handleInputChange('type', type)}
                            className={`
                              p-4 rounded-xl border-2 transition-all
                              flex flex-col items-center gap-2
                              ${
                                formData.type === type
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Badge type="type" value={type} size="sm" animate={false} />
                            <span className="text-xs font-medium text-gray-600">{type}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Priority
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {priorityOptions.map((priority) => (
                          <motion.button
                            key={priority}
                            type="button"
                            onClick={() => handleInputChange('priority', priority)}
                            className={`
                              p-4 rounded-xl border-2 transition-all
                              flex flex-col items-center gap-2
                              ${
                                formData.priority === priority
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Badge type="priority" value={priority} size="sm" animate={false} />
                            <span className="text-xs font-medium text-gray-600">{priority}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3: Assignment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Assignee
                      </label>
                      <select
                        value={formData.assignee_id}
                        onChange={(e) => {
                          handleInputChange('assignee_id', e.target.value);
                          // Auto-set team based on assignee
                          const selectedUser = users.find((u) => u.id === e.target.value);
                          if (selectedUser?.team_id) {
                            handleInputChange('team_id', selectedUser.team_id);
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                          </option>
                        ))}
                      </select>
                      {formData.assignee_id && (
                        <div className="mt-3 flex items-center gap-2">
                          <Avatar
                            user={users.find((u) => u.id === formData.assignee_id)}
                            size="sm"
                          />
                          <span className="text-sm text-gray-600">
                            {users.find((u) => u.id === formData.assignee_id)?.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Team
                      </label>
                      <select
                        value={formData.team_id}
                        onChange={(e) => handleInputChange('team_id', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        <option value="">No team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Parent Task (for subtasks)
                      </label>
                      <select
                        value={formData.parent_task_id}
                        onChange={(e) => handleInputChange('parent_task_id', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        <option value="">No parent task</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Timeline */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      />
                    </div>

                    {formData.project_id && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sprint
                        </label>
                        <select
                          value={formData.sprint_id}
                          onChange={(e) => handleInputChange('sprint_id', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                          disabled={sprints.length === 0}
                        >
                          <option value="">No sprint</option>
                          {sprints.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                              {sprint.name} ({sprint.status})
                            </option>
                          ))}
                        </select>
                        {sprints.length === 0 && (
                          <p className="mt-2 text-sm text-gray-500">
                            No sprints available for this project
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Depends On (blocker)
                      </label>
                      <select
                        value={formData.depends_on_task_id}
                        onChange={(e) => handleInputChange('depends_on_task_id', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                      >
                        <option value="">No dependencies</option>
                        {tasks
                          .filter((t) => t.id !== formData.parent_task_id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.status})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Summary */}
                    <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        Task Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Title:</span>
                          <span className="font-medium text-gray-900">{formData.title || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Type:</span>
                          <Badge type="type" value={formData.type} size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Priority:</span>
                          <Badge type="priority" value={formData.priority} size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          <Badge type="status" value={formData.status} size="sm" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assignee:</span>
                          <span className="font-medium text-gray-900">
                            {users.find((u) => u.id === formData.assignee_id)?.name || 'Unassigned'}
                          </span>
                        </div>
                        {formData.due_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date(formData.due_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <motion.div
                className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Success message */}
            {success && (
              <motion.div
                className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FiCheck className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Task {task ? 'updated' : 'created'} successfully!
                </span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all
                  flex items-center gap-2
                  ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <FiChevronLeft className="w-5 h-5" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep < totalSteps && (
                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    Next
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                )}

                {currentStep === totalSteps && (
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title.trim()}
                    className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        {task ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        {task ? 'Save Changes' : 'Create Task'}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTaskModalNew;
