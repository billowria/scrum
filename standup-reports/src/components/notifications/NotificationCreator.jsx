import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUsers, FiAlertCircle, FiCheck,
  FiMessageSquare, FiCalendar, FiClock, FiSearch, FiChevronRight,
  FiChevronLeft, FiZap, FiBell, FiFileText, FiStar, FiTarget,
  FiMail, FiUser, FiLayers, FiSmile
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

// Notification Templates
const TEMPLATES = [
  {
    id: 'announcement',
    icon: FiBell,
    title: 'General Announcement',
    description: 'Share company-wide updates',
    color: 'blue',
    defaultTitle: 'Important Announcement',
    defaultMessage: '',
    type: 'announcement',
    priority: 'Medium'
  },
  {
    id: 'meeting',
    icon: FiCalendar,
    title: 'Meeting Reminder',
    description: 'Remind team about meetings',
    color: 'purple',
    defaultTitle: 'Meeting Reminder',
    defaultMessage: 'This is a reminder about our upcoming meeting. Please ensure you are prepared and join on time.',
    type: 'meeting',
    priority: 'High'
  },
  {
    id: 'task',
    icon: FiTarget,
    title: 'Task Update',
    description: 'Notify about task changes',
    color: 'emerald',
    defaultTitle: 'Task Update',
    defaultMessage: '',
    type: 'task_updated',
    priority: 'Medium'
  },
  {
    id: 'urgent',
    icon: FiZap,
    title: 'Urgent Alert',
    description: 'Critical time-sensitive message',
    color: 'rose',
    defaultTitle: 'Urgent: Action Required',
    defaultMessage: '',
    type: 'alert',
    priority: 'Critical'
  },
  {
    id: 'achievement',
    icon: FiStar,
    title: 'Celebration',
    description: 'Celebrate wins and milestones',
    color: 'amber',
    defaultTitle: '🎉 Congratulations!',
    defaultMessage: '',
    type: 'achievement',
    priority: 'Low'
  },
  {
    id: 'blank',
    icon: FiFileText,
    title: 'Start Fresh',
    description: 'Create from scratch',
    color: 'slate',
    defaultTitle: '',
    defaultMessage: '',
    type: 'announcement',
    priority: 'Medium'
  }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', color: 'emerald', label: 'Low' },
  { value: 'Medium', color: 'amber', label: 'Medium' },
  { value: 'High', color: 'orange', label: 'High' },
  { value: 'Critical', color: 'rose', label: 'Critical' }
];

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement', icon: FiBell },
  { value: 'alert', label: 'Alert', icon: FiAlertCircle },
  { value: 'task_updated', label: 'Task Update', icon: FiTarget },
  { value: 'meeting', label: 'Meeting', icon: FiCalendar },
  { value: 'achievement', label: 'Achievement', icon: FiStar }
];

// Common Emojis for quick access
const QUICK_EMOJIS = ['👋', '🎉', '⚡', '🔥', '💡', '✅', '🚀', '📢', '⭐', '💪', '🎯', '📅'];

export default function NotificationCreator({ isOpen, onClose, onSuccess, currentUser }) {
  const { isAnimatedTheme, themeMode } = useTheme();

  // State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    priority: 'Medium',
    recipients: {
      teams: [],
      users: [],
      all: true
    },
    selectedTemplate: null
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        title: '',
        message: '',
        type: 'announcement',
        priority: 'Medium',
        recipients: { teams: [], users: [], all: true },
        selectedTemplate: null
      });
      setScheduleEnabled(false);
      setScheduleDate('');
      setScheduleTime('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fetch recipients on mount
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const [teamsRes, usersRes] = await Promise.all([
          supabase.from('teams').select('id, name'),
          supabase.from('users').select('id, name, avatar_url, role')
        ]);
        setTeams(teamsRes.data || []);
        setUsers(usersRes.data || []);
      };
      fetchData();
    }
  }, [isOpen]);

  // Character count
  const messageCharCount = formData.message.length;
  const maxMessageLength = 500;

  // Filtered Users for Search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [users, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.defaultTitle,
      message: template.defaultMessage,
      type: template.type,
      priority: template.priority,
      selectedTemplate: template.id
    }));
    setStep(2);
  };

  // Handle emoji insert
  const handleEmojiInsert = (emoji) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + emoji
    }));
    setShowEmojiPicker(false);
  };

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      let scheduledAt = null;
      if (scheduleEnabled && scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const payload = {
        title: formData.title,
        content: formData.message,
        notification_type: formData.type,
        priority: formData.priority,
        team_id: formData.recipients.teams[0] || null,
        company_id: currentUser.company_id,
        created_by: currentUser.id,
        metadata: {
          recipients: formData.recipients,
          scheduled_at: scheduledAt,
          template_used: formData.selectedTemplate
        },
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('announcements')
        .insert(payload);

      if (error) throw error;

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create notification', err);
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware classes
  const modalBg = isAnimatedTheme
    ? 'bg-black/40 backdrop-blur-2xl border border-white/20'
    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700';

  const headerBg = isAnimatedTheme
    ? 'bg-white/5 border-white/10'
    : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700';

  const inputBg = isAnimatedTheme
    ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-white/30 focus:border-white/40'
    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-blue-500/20 focus:border-blue-500';

  const labelClass = isAnimatedTheme
    ? 'text-white/80'
    : 'text-gray-700 dark:text-gray-300';

  const textMuted = isAnimatedTheme
    ? 'text-white/50'
    : 'text-gray-500 dark:text-gray-400';

  const btnPrimary = isAnimatedTheme
    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  const btnSecondary = isAnimatedTheme
    ? 'bg-white/10 hover:bg-white/20 text-white/80'
    : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200';

  // Recipients count for display
  const recipientCount = formData.recipients.all
    ? users.length
    : formData.recipients.users.length +
    (formData.recipients.teams.length * 10); // Approximate team size

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className={`${modalBg} rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]`}>

              {/* Header */}
              <div className={`px-6 py-4 border-b ${headerBg} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAnimatedTheme ? 'bg-white/10' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                    <FiMail className={`w-5 h-5 ${isAnimatedTheme ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      Create Notification
                    </h2>
                    <p className={`text-sm ${textMuted}`}>
                      Step {step} of 3 • {step === 1 ? 'Choose Template' : step === 2 ? 'Recipients & Content' : 'Preview & Send'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isAnimatedTheme ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className={`h-1 ${isAnimatedTheme ? 'bg-white/10' : 'bg-gray-100 dark:bg-slate-700'}`}>
                <motion.div
                  className={`h-full ${isAnimatedTheme ? 'bg-white/60' : 'bg-indigo-600'}`}
                  initial={{ width: '33%' }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 1: Template Selection */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6"
                    >
                      <h3 className={`text-sm font-semibold mb-4 ${labelClass}`}>
                        Choose a template to get started
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TEMPLATES.map(template => {
                          const Icon = template.icon;
                          const colorMap = {
                            blue: isAnimatedTheme ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-50 text-blue-600 border-blue-200',
                            purple: isAnimatedTheme ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'bg-purple-50 text-purple-600 border-purple-200',
                            emerald: isAnimatedTheme ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
                            rose: isAnimatedTheme ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' : 'bg-rose-50 text-rose-600 border-rose-200',
                            amber: isAnimatedTheme ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-amber-50 text-amber-600 border-amber-200',
                            slate: isAnimatedTheme ? 'bg-white/10 text-white/70 border-white/20' : 'bg-gray-50 text-gray-600 border-gray-200'
                          };
                          return (
                            <motion.button
                              key={template.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleTemplateSelect(template)}
                              className={`p-4 rounded-2xl border text-left transition-all group ${colorMap[template.color]} hover:shadow-lg`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <Icon className="w-5 h-5" />
                                <span className="font-semibold text-sm">{template.title}</span>
                              </div>
                              <p className={`text-xs ${isAnimatedTheme ? 'text-white/50' : 'opacity-70'}`}>
                                {template.description}
                              </p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Recipients & Content */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 space-y-5"
                    >
                      {/* Recipients Section */}
                      <div>
                        <label className={`text-sm font-semibold mb-2 block ${labelClass}`}>
                          <FiUsers className="inline w-4 h-4 mr-1.5" />
                          Recipients
                        </label>

                        {/* Quick Toggle */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              recipients: { ...prev.recipients, all: true, users: [], teams: [] }
                            }))}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2
                              ${formData.recipients.all
                                ? isAnimatedTheme ? 'bg-white/20 text-white border-white/40' : 'bg-indigo-600 text-white border-indigo-600'
                                : isAnimatedTheme ? 'bg-white/5 text-white/60 border-white/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                              }`}
                          >
                            <FiUsers className="w-4 h-4" />
                            Everyone
                          </button>
                          <button
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              recipients: { ...prev.recipients, all: false }
                            }))}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2
                              ${!formData.recipients.all
                                ? isAnimatedTheme ? 'bg-white/20 text-white border-white/40' : 'bg-indigo-600 text-white border-indigo-600'
                                : isAnimatedTheme ? 'bg-white/5 text-white/60 border-white/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                              }`}
                          >
                            <FiUser className="w-4 h-4" />
                            Specific People
                          </button>
                        </div>

                        {/* User Search (when not all) */}
                        {!formData.recipients.all && (
                          <div className="relative">
                            <FiSearch className={`absolute left-3 top-3 ${isAnimatedTheme ? 'text-white/40' : 'text-gray-400'}`} />
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all ${inputBg}`}
                            />

                            {/* Search Results */}
                            {filteredUsers.length > 0 && (
                              <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg overflow-hidden z-20 ${isAnimatedTheme ? 'bg-black/80 backdrop-blur-xl border border-white/20' : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'}`}>
                                {filteredUsers.map(user => (
                                  <button
                                    key={user.id}
                                    onClick={() => {
                                      const current = formData.recipients.users;
                                      const newUsers = current.includes(user.id)
                                        ? current.filter(id => id !== user.id)
                                        : [...current, user.id];
                                      setFormData(p => ({
                                        ...p,
                                        recipients: { ...p.recipients, users: newUsers }
                                      }));
                                      setSearchQuery('');
                                    }}
                                    className={`w-full flex items-center px-4 py-3 text-left gap-3 transition-colors ${isAnimatedTheme ? 'hover:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                  >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isAnimatedTheme ? 'bg-white/10 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                      {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        user.name?.[0] || 'U'
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{user.name}</p>
                                      <p className={`text-xs ${textMuted}`}>{user.role || 'Team member'}</p>
                                    </div>
                                    {formData.recipients.users.includes(user.id) && (
                                      <FiCheck className={`w-5 h-5 ${isAnimatedTheme ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Selected Tags */}
                            {formData.recipients.users.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {formData.recipients.users.map(uId => {
                                  const user = users.find(u => u.id === uId);
                                  if (!user) return null;
                                  return (
                                    <span
                                      key={uId}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isAnimatedTheme ? 'bg-white/10 text-white border border-white/20' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'}`}
                                    >
                                      {user.name}
                                      <button
                                        onClick={() => setFormData(p => ({
                                          ...p,
                                          recipients: { ...p.recipients, users: p.recipients.users.filter(id => id !== uId) }
                                        }))}
                                        className="hover:opacity-70"
                                      >
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <label className={`text-sm font-semibold mb-2 block ${labelClass}`}>Title</label>
                        <input
                          type="text"
                          placeholder="Enter notification title..."
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl text-sm border transition-all font-medium ${inputBg}`}
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-sm font-semibold ${labelClass}`}>Message</label>
                          <span className={`text-xs ${messageCharCount > maxMessageLength ? 'text-rose-500' : textMuted}`}>
                            {messageCharCount}/{maxMessageLength}
                          </span>
                        </div>
                        <div className="relative">
                          <textarea
                            placeholder="Write your message here..."
                            rows={4}
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value.slice(0, maxMessageLength) })}
                            className={`w-full px-4 py-3 rounded-xl text-sm border transition-all resize-none ${inputBg}`}
                          />

                          {/* Emoji Button */}
                          <div className="absolute bottom-3 right-3">
                            <button
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className={`p-2 rounded-lg transition-colors ${isAnimatedTheme ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-400'}`}
                            >
                              <FiSmile className="w-5 h-5" />
                            </button>

                            {/* Quick Emoji Picker */}
                            <AnimatePresence>
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  className={`absolute bottom-full right-0 mb-2 p-2 rounded-xl grid grid-cols-6 gap-1 ${isAnimatedTheme ? 'bg-black/80 backdrop-blur-xl border border-white/20' : 'bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700'}`}
                                >
                                  {QUICK_EMOJIS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleEmojiInsert(emoji)}
                                      className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Type & Priority */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textMuted}`}>Type</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TYPE_OPTIONS.map(opt => {
                              const Icon = opt.icon;
                              const isActive = formData.type === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setFormData({ ...formData, type: opt.value })}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 
                                    ${isActive
                                      ? isAnimatedTheme ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                      : isAnimatedTheme ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textMuted}`}>Priority</label>
                          <div className="flex gap-1.5">
                            {PRIORITY_OPTIONS.map(opt => {
                              const isActive = formData.priority === opt.value;
                              const colorClass = {
                                emerald: isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200' : '',
                                amber: isActive ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200' : '',
                                orange: isActive ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200' : '',
                                rose: isActive ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200' : ''
                              };
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setFormData({ ...formData, priority: opt.value })}
                                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border
                                    ${isActive
                                      ? isAnimatedTheme ? 'bg-white/20 text-white border-white/30' : colorClass[opt.color]
                                      : isAnimatedTheme ? 'bg-white/5 text-white/40 border-transparent hover:bg-white/10' : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Schedule Toggle */}
                      <div className={`p-4 rounded-xl border ${isAnimatedTheme ? 'bg-white/5 border-white/10' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FiClock className={`w-4 h-4 ${isAnimatedTheme ? 'text-white/50' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${labelClass}`}>Schedule for later</span>
                          </div>
                          <button
                            onClick={() => setScheduleEnabled(!scheduleEnabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${scheduleEnabled
                              ? isAnimatedTheme ? 'bg-white/30' : 'bg-indigo-600'
                              : isAnimatedTheme ? 'bg-white/10' : 'bg-gray-200 dark:bg-slate-600'}`}
                          >
                            <motion.div
                              className={`absolute top-1 w-4 h-4 rounded-full ${isAnimatedTheme ? 'bg-white' : 'bg-white'}`}
                              animate={{ left: scheduleEnabled ? 24 : 4 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>

                        {scheduleEnabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-2 gap-3"
                          >
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={e => setScheduleDate(e.target.value)}
                              min={format(new Date(), 'yyyy-MM-dd')}
                              className={`px-3 py-2 rounded-lg text-sm border ${inputBg}`}
                            />
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={e => setScheduleTime(e.target.value)}
                              className={`px-3 py-2 rounded-lg text-sm border ${inputBg}`}
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Preview */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6"
                    >
                      <h3 className={`text-sm font-semibold mb-4 ${labelClass}`}>
                        Preview your notification
                      </h3>

                      {/* Preview Card */}
                      <div className={`p-5 rounded-2xl border mb-4 ${isAnimatedTheme ? 'bg-white/10 border-white/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm'}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAnimatedTheme ? 'bg-indigo-500/20' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                            <FiBell className={`w-6 h-6 ${isAnimatedTheme ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold text-base mb-1 ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {formData.title || 'Notification Title'}
                            </h4>
                            <p className={`text-sm mb-3 ${isAnimatedTheme ? 'text-white/70' : 'text-gray-600 dark:text-gray-300'}`}>
                              {formData.message || 'Your message will appear here...'}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${formData.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                  formData.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                    formData.priority === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                                      'bg-amber-100 text-amber-700'
                                }`}>
                                {formData.priority}
                              </span>
                              <span className={`text-xs ${textMuted}`}>
                                {scheduleEnabled && scheduleDate
                                  ? `Scheduled: ${format(new Date(`${scheduleDate}T${scheduleTime || '00:00'}`), 'MMM d, yyyy h:mm a')}`
                                  : 'Sending now'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className={`p-4 rounded-xl ${isAnimatedTheme ? 'bg-white/5' : 'bg-gray-50 dark:bg-slate-800/50'}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textMuted}`}>Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={textMuted}>Recipients</span>
                            <span className={`font-medium ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {formData.recipients.all ? 'Everyone' : `${formData.recipients.users.length} user(s)`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={textMuted}>Type</span>
                            <span className={`font-medium ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {TYPE_OPTIONS.find(t => t.value === formData.type)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={textMuted}>Priority</span>
                            <span className={`font-medium ${isAnimatedTheme ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {formData.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t flex items-center justify-between ${headerBg}`}>
                <button
                  onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${btnSecondary}`}
                >
                  <FiChevronLeft className="w-4 h-4" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>

                <div className="flex gap-3">
                  {step < 3 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 2 && (!formData.title || !formData.message)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${btnPrimary}`}
                    >
                      Continue
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !formData.title || !formData.message}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${btnPrimary}`}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          {scheduleEnabled ? 'Schedule' : 'Send Now'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}