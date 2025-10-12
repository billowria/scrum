import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUsers, FiCalendar, FiClock, FiTag, FiImage, FiLink,
  FiMessageSquare, FiTarget, FiZap, FiHeart, FiStar, FiAlertCircle,
  FiChevronDown, FiChevronRight, FiChevronLeft, FiCheck, FiEdit3, FiSettings,
  FiUser, FiGlobe, FiBell, FiMail, FiSmartphone
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import notificationService, { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, NOTIFICATION_CATEGORIES } from '../../services/notificationService';

// Template data
const QUICK_TEMPLATES = [
  {
    id: 'announcement',
    name: 'Team Announcement',
    icon: FiBell,
    color: 'from-blue-500 to-indigo-600',
    category: NOTIFICATION_CATEGORIES.COMMUNICATION,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    titleTemplate: 'Important Update',
    messageTemplate: 'Hi team! I wanted to share an important update with everyone...'
  },
  {
    id: 'meeting',
    name: 'Meeting Reminder',
    icon: FiCalendar,
    color: 'from-green-500 to-emerald-600',
    category: NOTIFICATION_CATEGORIES.ADMINISTRATIVE,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    titleTemplate: 'Meeting Reminder',
    messageTemplate: 'Don\'t forget about our upcoming meeting scheduled for...'
  },
  {
    id: 'achievement',
    name: 'Team Achievement',
    icon: FiStar,
    color: 'from-yellow-500 to-orange-600',
    category: NOTIFICATION_CATEGORIES.ACHIEVEMENT,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    titleTemplate: 'Congratulations Team!',
    messageTemplate: 'Amazing work everyone! We\'ve successfully achieved...'
  },
  {
    id: 'project_update',
    name: 'Project Update',
    icon: FiTarget,
    color: 'from-purple-500 to-pink-600',
    category: NOTIFICATION_CATEGORIES.PROJECT,
    type: NOTIFICATION_TYPES.PROJECT_UPDATE,
    titleTemplate: 'Project Status Update',
    messageTemplate: 'Here\'s the latest update on our project progress...'
  },
  {
    id: 'urgent',
    name: 'Urgent Notice',
    icon: FiAlertCircle,
    color: 'from-red-500 to-rose-600',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    type: NOTIFICATION_TYPES.SYSTEM_ALERT,
    titleTemplate: 'Urgent: Action Required',
    messageTemplate: 'This is an urgent notice that requires immediate attention...'
  },
  {
    id: 'celebration',
    name: 'Celebration',
    icon: FiHeart,
    color: 'from-pink-500 to-rose-600',
    category: NOTIFICATION_CATEGORIES.ACHIEVEMENT,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    titleTemplate: 'Let\'s Celebrate!',
    messageTemplate: 'It\'s time to celebrate another milestone...'
  }
];

// Recipient selection component
const RecipientSelector = ({ recipients, onRecipientsChange, currentUser }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeamsAndUsers();
  }, []);

  const fetchTeamsAndUsers = async () => {
    try {
      // Fetch teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role, team_id')
        .order('name');

      setTeams(teamsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const handleRecipientToggle = (type, id, name) => {
    const newRecipients = { ...recipients };
    
    if (newRecipients[type]) {
      if (newRecipients[type].some(r => r.id === id)) {
        newRecipients[type] = newRecipients[type].filter(r => r.id !== id);
      } else {
        newRecipients[type].push({ id, name });
      }
    } else {
      newRecipients[type] = [{ id, name }];
    }

    onRecipientsChange(newRecipients);
  };

  const getSelectedCount = () => {
    let count = 0;
    Object.values(recipients).forEach(list => {
      if (Array.isArray(list)) count += list.length;
    });
    return count;
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setShowSelector(!showSelector)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700">
            {getSelectedCount() > 0 
              ? `${getSelectedCount()} recipient${getSelectedCount() > 1 ? 's' : ''} selected`
              : 'Select recipients'
            }
          </span>
        </div>
        <motion.div
          animate={{ rotate: showSelector ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {/* Quick options */}
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Select</h4>
                <div className="space-y-2">
                  <motion.button
                    type="button"
                    onClick={() => handleRecipientToggle('all', 'everyone', 'Everyone')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                      recipients.all?.some(r => r.id === 'everyone') 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2">
                      <FiGlobe className="w-4 h-4" />
                      <span>Everyone</span>
                    </div>
                    {recipients.all?.some(r => r.id === 'everyone') && (
                      <FiCheck className="w-4 h-4 text-indigo-600" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Teams */}
              {filteredTeams.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teams</h4>
                  <div className="space-y-1">
                    {filteredTeams.map(team => (
                      <motion.button
                        key={team.id}
                        type="button"
                        onClick={() => handleRecipientToggle('teams', team.id, team.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                          recipients.teams?.some(r => r.id === team.id) 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-2">
          <FiUsers className="w-4 h-4" />
                          <span>{team.name}</span>
                        </div>
                        {recipients.teams?.some(r => r.id === team.id) && (
                          <FiCheck className="w-4 h-4 text-emerald-600" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Users */}
              {filteredUsers.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Individual Users</h4>
                  <div className="space-y-1">
                    {filteredUsers.map(user => (
                      <motion.button
                        key={user.id}
                        type="button"
                        onClick={() => handleRecipientToggle('users', user.id, user.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                          recipients.users?.some(r => r.id === user.id) 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4" />
                          <div className="text-left">
                            <div>{user.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                          </div>
                        </div>
                        {recipients.users?.some(r => r.id === user.id) && (
                          <FiCheck className="w-4 h-4 text-blue-600" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Template selector component
const TemplateSelector = ({ selectedTemplate, onTemplateSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {QUICK_TEMPLATES.map((template, index) => {
        const Icon = template.icon;
        const isSelected = selectedTemplate?.id === template.id;
        
        return (
          <motion.button
            key={template.id}
            type="button"
            onClick={() => onTemplateSelect(template)}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-xs text-gray-500">
              {(() => { const label = String(template.category || 'communication').replace('_', ' ');
                return label.charAt(0).toUpperCase() + label.slice(1);
              })()}
            </p>
            
            {isSelected && (
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <FiCheck className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default function NotificationCreator({ isOpen, onClose, onSuccess, currentUser }) {
  const [step, setStep] = useState(1); // 1: Template, 2: Compose, 3: Recipients, 4: Schedule, 5: Preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: NOTIFICATION_CATEGORIES.COMMUNICATION,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    expiresAt: '',
    scheduledFor: ''
  });
  const [recipients, setRecipients] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [formData.message]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      title: template.titleTemplate,
      message: template.messageTemplate,
      category: template.category,
      type: template.type
    }));
    setStep(2);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 2) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.message.trim()) newErrors.message = 'Message is required';
    }

    if (stepNum === 3) {
      const hasRecipients = Object.values(recipients).some(list => Array.isArray(list) && list.length > 0);
      if (!hasRecipients) newErrors.recipients = 'At least one recipient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      // Create notification using the service
      const notification = await notificationService.createAdvancedNotification({
        title: formData.title,
        message: formData.message,
        category: formData.category,
        type: formData.type,
        priority: formData.priority,
        userId: currentUser.id,
        createdBy: currentUser.id,
        recipients,
        expiresAt: formData.expiresAt || null,
        scheduledFor: formData.scheduledFor || null,
        metadata: {
          templateUsed: selectedTemplate?.id,
          createdFrom: 'notification-creator-v2'
        }
      });

      onSuccess(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      setErrors({ submit: 'Failed to create notification. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Choose Template';
      case 2: return 'Compose Message';
      case 3: return 'Select Recipients';
      case 4: return 'Schedule & Settings';
      case 5: return 'Preview & Send';
      default: return 'Create Notification';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return FiZap;
      case 2: return FiEdit3;
      case 3: return FiUsers;
      case 4: return FiSettings;
      case 5: return FiSend;
      default: return FiBell;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                {React.createElement(getStepIcon(), { className: "w-6 h-6" })}
              </div>
              <div>
                <h2 className="text-xl font-bold">{getStepTitle()}</h2>
                <p className="text-indigo-100 text-sm">Step {step} of 5</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="h-2 bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Template Selection */}
            {step === 1 && (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a template to get started</h3>
                  <p className="text-gray-600">Select a pre-designed template or start from scratch</p>
                </div>
                
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                />

                <div className="text-center pt-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setStep(2);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    Or start from scratch →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Compose Message */}
            {step === 2 && (
              <motion.div
                key="compose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter notification title..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    placeholder="Write your message here..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[120px] transition-colors ${
                      errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {formData.message.length} characters
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <button type="button" className="hover:text-gray-700">
                        <FiImage className="w-4 h-4" />
                      </button>
                      <button type="button" className="hover:text-gray-700">
                        <FiLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.values(NOTIFICATION_CATEGORIES).map(category => (
                        <option key={category || 'communication'} value={category || 'communication'}>
                          {String(category || 'communication').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.values(NOTIFICATION_PRIORITIES).map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Recipients */}
            {step === 3 && (
              <motion.div
                key="recipients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who should receive this notification? *
                  </label>
                  <RecipientSelector
                    recipients={recipients}
                    onRecipientsChange={setRecipients}
                    currentUser={currentUser}
                  />
                  {errors.recipients && (
                    <p className="mt-2 text-sm text-red-600">{errors.recipients}</p>
                  )}
                </div>

                {/* Selected recipients preview */}
                {Object.keys(recipients).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Recipients:</h4>
                    <div className="space-y-2">
                      {Object.entries(recipients).map(([type, list]) => (
                        Array.isArray(list) && list.length > 0 && (
                          <div key={type} className="flex flex-wrap gap-2">
                            {list.map(recipient => (
                              <span
                                key={`${type}-${recipient.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                              >
                                {type === 'teams' && <FiUsers className="w-3 h-3" />}
                                {type === 'users' && <FiUser className="w-3 h-3" />}
                                {type === 'all' && <FiGlobe className="w-3 h-3" />}
                                {recipient.name}
                              </span>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Schedule & Settings */}
            {step === 4 && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Send (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => handleFormChange('scheduledFor', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Leave empty to send immediately</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">When should this notification expire?</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Your Notification</h3>
                  <p className="text-gray-600">Review your notification before sending</p>
                </div>

                {/* Preview Card */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                      <FiBell className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">{formData.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          formData.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          formData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          formData.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formData.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{formData.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>From: {currentUser.name}</span>
                        <span>Category: {formData.category}</span>
                        <span>Now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {step > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Back
                </motion.button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              
              {step < 5 ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Send Notification
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}