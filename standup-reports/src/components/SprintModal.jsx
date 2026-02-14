import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCalendar,
  FiTarget,
  FiFolder,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiTrendingUp
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { notifySprintUpdate } from '../utils/notificationHelper';
import { differenceInDays, format, addWeeks, parseISO } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const SprintModal = ({ isOpen, onClose, onSubmit, sprint, projects }) => {
  const { themeMode } = useTheme();
  const isPremiumTheme = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode);
  const isDark = themeMode === 'dark' || isPremiumTheme;
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
    project_id: '',
    status: 'Planning'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Calculate sprint duration and other metrics
  const sprintDuration = formData.start_date && formData.end_date
    ? differenceInDays(parseISO(formData.end_date), parseISO(formData.start_date)) + 1
    : 0;

  // Quick duration presets
  const durationPresets = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '3 Weeks', days: 21 },
    { label: '4 Weeks', days: 28 }
  ];

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name || '',
        goal: sprint.goal || '',
        start_date: sprint.start_date || '',
        end_date: sprint.end_date || '',
        project_id: sprint.project_id || '',
        status: sprint.status || 'Planning'
      });
    } else {
      // Set default dates for new sprint (today to 2 weeks from now)
      const today = new Date();
      const twoWeeksLater = addWeeks(today, 2);

      setFormData({
        name: '',
        goal: '',
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(twoWeeksLater, 'yyyy-MM-dd'),
        project_id: projects.length > 0 ? projects[0].id : '',
        status: 'Planning'
      });
    }
    setErrors({});
    setCurrentStep(1);
  }, [sprint, projects, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Apply duration preset
  const applyDurationPreset = (days) => {
    if (formData.start_date) {
      const startDate = parseISO(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      setFormData(prev => ({
        ...prev,
        end_date: format(endDate, 'yyyy-MM-dd')
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Sprint name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Sprint name must be at least 3 characters';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = parseISO(formData.start_date);
      const end = parseISO(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
      if (differenceInDays(end, start) > 60) {
        newErrors.end_date = 'Sprint duration should not exceed 60 days';
      }
    }

    if (!formData.project_id) {
      newErrors.project_id = 'Please select a project';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the original onSubmit
      await onSubmit(formData);

      // Send notification if creating a new sprint
      if (!sprint && formData.project_id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Get the project's team_id
            const { data: projectData } = await supabase
              .from('projects')
              .select('name, team_id, created_by')
              .eq('id', formData.project_id)
              .single();

            if (projectData) {
              await notifySprintUpdate(
                formData.name,
                'created',
                projectData.team_id,
                user.id
              );
            }
          }
        } catch (error) {
          console.error('Error sending sprint notification:', error);
          // Continue even if notification fails
        }
      }
    } catch (error) {
      console.error('Error submitting sprint:', error);
      setErrors({ submit: 'Failed to save sprint. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className={`rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border ${isPremiumTheme ? 'bg-slate-900 border-white/10' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
        >
          {/* Minimal Compact Header */}
          <div className="relative bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FiTarget className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {sprint ? 'Edit Sprint' : 'Create Sprint'}
                </h3>
              </div>
              <motion.button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-4 h-4 text-white/80 hover:text-white" />
              </motion.button>
            </div>
          </div>

          {/* Form Content */}
          <div className="h-[calc(95vh-80px)] sm:h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
              {/* Error Banner */}
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Sprint Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <motion.div
                      className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FiZap className="w-3 h-3 text-white" />
                    </motion.div>
                    Sprint Name
                    <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    whileFocus={{ scale: 1.01 }}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${errors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100'
                      }`}
                    placeholder="e.g., Sprint 1: User Authentication & Dashboard"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
                    >
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* Sprint Goal */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <motion.div
                      className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FiTarget className="w-3 h-3 text-white" />
                    </motion.div>
                    Sprint Goal
                    <span className="text-xs text-emerald-600 font-normal bg-emerald-50 px-2 py-1 rounded-full">(Optional)</span>
                  </label>
                  <motion.textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    rows="3"
                    whileFocus={{ scale: 1.01 }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                    placeholder="What do you want to achieve in this sprint? Define clear, measurable objectives..."
                  />
                  <motion.div
                    className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <FiInfo className="w-3.5 h-3.5" />
                    Tip: A clear goal helps the team stay focused and aligned
                  </motion.div>
                </div>

                {/* Project Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <motion.div
                      className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FiFolder className="w-3 h-3 text-white" />
                    </motion.div>
                    Project
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <motion.select
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleChange}
                      whileFocus={{ scale: 1.01 }}
                      className={`w-full px-4 py-3 border-2 rounded-xl appearance-none transition-all duration-200 ${errors.project_id
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </motion.select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <motion.div
                        animate={{ rotate: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  {errors.project_id && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
                    >
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      {errors.project_id}
                    </motion.p>
                  )}
                </div>

                {/* Date Range with Duration Display */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <motion.div
                      className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FiCalendar className="w-3 h-3 text-white" />
                    </motion.div>
                    Sprint Duration
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Quick Duration Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {durationPresets.map((preset) => (
                      <motion.button
                        key={preset.days}
                        type="button"
                        onClick={() => applyDurationPreset(preset.days)}
                        className={`relative px-3 py-2 text-xs font-semibold rounded-full border-2 transition-all duration-200 overflow-hidden ${sprintDuration === preset.days
                            ? 'border-transparent bg-gradient-to-r from-emerald-400 to-green-400 text-white shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:shadow-md'
                          }`}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {sprintDuration === preset.days && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-50 blur-md"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
                          <motion.div
                            className="h-full"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          ></motion.div>
                        </div>
                        <span className="relative">{preset.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${errors.start_date
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                          }`}
                      />
                      {errors.start_date && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-red-600"
                        >
                          {errors.start_date}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        min={formData.start_date}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${errors.end_date
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                          }`}
                      />
                      {errors.end_date && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-red-600"
                        >
                          {errors.end_date}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Duration Display */}
                  {sprintDuration > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="relative mt-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl overflow-hidden"
                    >
                      {/* Shimmer effect for recommended duration */}
                      {sprintDuration >= 10 && sprintDuration <= 14 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent">
                          <motion.div
                            className="h-full"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          ></motion.div>
                        </div>
                      )}

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-center"
                            animate={{ rotate: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <FiClock className="w-4 h-4 text-white" />
                          </motion.div>
                          <div>
                            <span className="text-sm font-semibold text-emerald-900">
                              Sprint Duration: <span className="font-bold text-lg">{sprintDuration}</span> days
                            </span>
                            {sprintDuration >= 10 && sprintDuration <= 14 && (
                              <p className="text-xs text-emerald-700 mt-1">Perfect for agile development</p>
                            )}
                          </div>
                        </div>
                        {sprintDuration >= 10 && sprintDuration <= 14 && (
                          <motion.div
                            className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-3 py-2 rounded-full border border-emerald-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiCheckCircle className="w-3 h-3" />
                            Recommended
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Status (only for editing) */}
                {sprint && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FiTrendingUp className="w-4 h-4 text-amber-600" />
                      Sprint Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all appearance-none"
                    >
                      <option value="Planning">📋 Planning</option>
                      <option value="Active">🚀 Active</option>
                      <option value="Completed">✅ Completed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-6 border-t border-gray-200">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className={`relative w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden backdrop-blur-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  disabled={isSubmitting}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl opacity-50 blur-md"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
                    <motion.div
                      className="h-full"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    ></motion.div>
                  </div>
                  <div className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        {sprint ? (
                          <>
                            <FiCheckCircle className="w-5 h-5" />
                            <span>Update Sprint</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="w-5 h-5" />
                            <span>Create Sprint</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SprintModal;