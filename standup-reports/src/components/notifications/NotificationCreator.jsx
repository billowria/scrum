import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUsers, FiCalendar, FiBell, FiStar, FiAlertCircle,
  FiTarget, FiHeart, FiCheck, FiMessageCircle, FiEdit3, FiZap,
  FiAward, FiTrendingUp, FiMail, FiRadio
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import notificationService, { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, NOTIFICATION_CATEGORIES } from '../../services/notificationService';

export default function NotificationCreator({ isOpen, onClose, onSuccess, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: NOTIFICATION_TYPES.TEAM_COMMUNICATION,
    priority: NOTIFICATION_PRIORITIES.LOW,
    recipients: {
      teams: [],
      users: [],
      all: false
    }
  });
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState({ title: 0, message: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    setCharCount({
      title: formData.title.length,
      message: formData.message.length
    });
  }, [formData.title, formData.message]);

  const fetchRecipients = async () => {
    try {
      const [teamsData, usersData] = await Promise.all([
        supabase.from('teams').select('id, name').order('name'),
        supabase.from('users').select('id, name, role').order('name')
      ]);
      setTeams(teamsData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: NOTIFICATION_TYPES.TEAM_COMMUNICATION,
      priority: NOTIFICATION_PRIORITIES.LOW,
      recipients: {
        teams: [],
        users: [],
        all: false
      }
    });
    setError('');
    setCharCount({ title: 0, message: 0 });
  };

  const handleRecipientToggle = (type, id) => {
    setFormData(prev => {
      const newRecipients = { ...prev.recipients };

      if (type === 'all') {
        newRecipients.all = !newRecipients.all;
        newRecipients.teams = [];
        newRecipients.users = [];
      } else {
        newRecipients.all = false;
        if (newRecipients[type].includes(id)) {
          newRecipients[type] = newRecipients[type].filter(item => item !== id);
        } else {
          newRecipients[type].push(id);
        }
      }

      return { ...prev, recipients: newRecipients };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const hasRecipients = formData.recipients.all ||
                        formData.recipients.teams.length > 0 ||
                        formData.recipients.users.length > 0;

    if (!hasRecipients) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        sender_id: currentUser.id,
        recipients: formData.recipients,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert([notificationData])
        .select();

      if (error) throw error;

      onSuccess?.(data[0]);
      onClose();
    } catch (error) {
      console.error('Error creating notification:', error);
      setError('Failed to create notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4">
        {/* Beautiful gradient backdrop */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Main Modal - Responsive sizing with proper scroll */}
        <motion.div
          className="relative w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl h-[90vh] sm:h-[85vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col m-2 sm:m-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Gradient Header - Responsive padding */}
          <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 pb-3 sm:pb-4 lg:pb-6">
            {/* Decorative elements - Responsive sizes */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full -mr-16 -mt-16 sm:-mr-24 sm:-mt-24 lg:-mr-32 lg:-mt-32" />
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white/10 rounded-full -ml-12 -mb-12 sm:-ml-18 sm:-mb-18 lg:-ml-24 lg:-mb-24" />

            {/* Close Button - Responsive positioning */}
            <motion.button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.button>

            {/* Header Content - Responsive layout */}
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FiMessageCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Create Notification</h1>
                  <p className="text-sm sm:text-base lg:text-lg text-white/80">
                    Share updates and announcements with your team
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Responsive form with proper scroll */}
          <div className="flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Title Input - Responsive sizing */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">Title</span>
                    <span className="text-xs sm:text-sm text-gray-500">{charCount.title}/100</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                      placeholder="Enter an engaging title..."
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 bg-gray-50"
                      required
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                      <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Message Textarea - Responsive sizing */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">Message</span>
                    <span className="text-xs sm:text-sm text-gray-500">{charCount.message}/500</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value.slice(0, 500) }))}
                    placeholder="Write your message here..."
                    rows={4}
                    className="w-full px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 bg-gray-50 resize-none"
                    required
                  />
                </div>

                {/* Compact Priority Selection - Only show color on selection */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-base sm:text-lg font-semibold text-gray-900">Priority Level</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        value: NOTIFICATION_PRIORITIES.LOW,
                        label: 'Low',
                        gradient: 'from-blue-400 to-cyan-400',
                        icon: FiHeart,
                        description: 'Standard priority'
                      },
                      {
                        value: NOTIFICATION_PRIORITIES.NORMAL,
                        label: 'Medium',
                        gradient: 'from-emerald-400 to-green-400',
                        icon: FiMessageCircle,
                        description: 'Normal priority'
                      },
                      {
                        value: NOTIFICATION_PRIORITIES.HIGH,
                        label: 'High',
                        gradient: 'from-amber-400 to-orange-400',
                        icon: FiAlertCircle,
                        description: 'High importance'
                      },
                      {
                        value: NOTIFICATION_PRIORITIES.URGENT,
                        label: 'Critical',
                        gradient: 'from-red-400 to-pink-400',
                        icon: FiZap,
                        description: 'Urgent attention needed'
                      }
                    ].map(({ value, label, gradient, icon: Icon, description }) => (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: value }))}
                        className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                          formData.priority === value
                            ? 'border-transparent shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:shadow-md'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {formData.priority === value ? (
                          <div className={`relative bg-gradient-to-r ${gradient} px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg overflow-hidden backdrop-blur-sm -m-px`}>
                            <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full opacity-50 blur-md`}></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent">
                              <motion.div
                                className="h-full"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: Math.random() * 2
                                }}
                              ></motion.div>
                            </div>
                            <div className="relative flex items-center gap-2">
                              <Icon className="w-3 h-3" />
                              <span>{label}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Icon className="w-3 h-3" />
                            <span>{label}</span>
                          </div>
                        )}
                        {formData.priority === value && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Recipients Section - Responsive layout */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-base sm:text-lg font-semibold text-gray-900">Send To</label>

                  {/* Send to All Option */}
                  <motion.button
                    type="button"
                    onClick={() => handleRecipientToggle('all')}
                    className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                      formData.recipients.all
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      <span className="font-semibold text-sm sm:text-base text-gray-900">All Users</span>
                    </div>
                    {formData.recipients.all && (
                      <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    )}
                  </motion.button>

                  {/* Teams and Users - Responsive grid */}
                  {!formData.recipients.all && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Teams */}
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Teams</h4>
                        <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                          {teams.map(team => (
                            <motion.button
                              key={team.id}
                              type="button"
                              onClick={() => handleRecipientToggle('teams', team.id)}
                              className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 flex items-center justify-between ${
                                formData.recipients.teams.includes(team.id)
                                  ? 'border-purple-400 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <span className="font-medium text-xs sm:text-sm text-gray-900">{team.name}</span>
                              {formData.recipients.teams.includes(team.id) && (
                                <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Users */}
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Individual Users</h4>
                        <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                          {users.map(user => (
                            <motion.button
                              key={user.id}
                              type="button"
                              onClick={() => handleRecipientToggle('users', user.id)}
                              className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 flex items-center justify-between ${
                                formData.recipients.users.includes(user.id)
                                  ? 'border-purple-400 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                                <span className="font-medium text-xs sm:text-sm text-gray-900">{user.name}</span>
                              </div>
                              {formData.recipients.users.includes(user.id) && (
                                <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message - Responsive sizing */}
                {error && (
                  <motion.div
                    className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl text-red-700 text-sm sm:text-base"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons - Responsive layout */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 hover:bg-gray-200 rounded-xl sm:rounded-2xl font-semibold text-gray-700 transition-all duration-200 text-sm sm:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className={`w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                        Send Notification
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}