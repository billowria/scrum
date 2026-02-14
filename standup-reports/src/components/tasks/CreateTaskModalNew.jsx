import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSave, FiLoader, FiAlertCircle, FiCalendar, FiEdit3, FiTag, FiFolder, FiClock, FiUser,
  FiCheck, FiStar, FiBook, FiCheckSquare, FiLayout, FiTrendingUp, FiZap, FiXCircle, FiChevronDown,
  FiAlignLeft, FiTarget, FiActivity, FiPause, FiPlay, FiXOctagon, FiEye, FiSearch,
  FiGitBranch, FiLayers, FiUsers, FiChevronUp
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { createTaskNotification } from '../../utils/notificationHelper';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../shared/Avatar';
import Badge from '../shared/Badge';

/* ─── OPTION DATA ─── */
const typeOptions = [
  { value: 'Bug', icon: FiXCircle, color: '#ef4444', accent: 'red' },
  { value: 'Feature', icon: FiStar, color: '#3b82f6', accent: 'blue' },
  { value: 'Story', icon: FiBook, color: '#10b981', accent: 'emerald' },
  { value: 'Task', icon: FiCheckSquare, color: '#8b5cf6', accent: 'violet' },
  { value: 'Epic', icon: FiLayout, color: '#f59e0b', accent: 'amber' },
  { value: 'Improvement', icon: FiTrendingUp, color: '#06b6d4', accent: 'cyan' },
  { value: 'Spike', icon: FiZap, color: '#6366f1', accent: 'indigo' }
];

const priorityOptions = [
  { value: 'Low', icon: FiCheck, color: '#10b981' },
  { value: 'Medium', icon: FiClock, color: '#f59e0b' },
  { value: 'High', icon: FiAlertCircle, color: '#f97316' },
  { value: 'Critical', icon: FiXOctagon, color: '#ef4444' }
];

const statusOptions = [
  { value: 'To Do', icon: FiPause, color: '#6b7280' },
  { value: 'In Progress', icon: FiPlay, color: '#3b82f6' },
  { value: 'Review', icon: FiEye, color: '#f59e0b' },
  { value: 'Completed', icon: FiCheckSquare, color: '#10b981' }
];

/* ─── MAIN COMPONENT ─── */
export default function CreateTaskModalNew({ isOpen, onClose, onSuccess, currentUser, userRole, task = null }) {
  const { currentCompany } = useCompany();
  const { themeMode } = useTheme();
  const titleInputRef = useRef(null);
  const assigneeRef = useRef(null);

  const isPremium = ['ocean', 'forest', 'space', 'diwali'].includes(themeMode);
  const isDarkMode = themeMode === 'dark' || isPremium;

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
    efforts_in_days: task?.efforts_in_days || '',
    parent_task_id: task?.parent_task_id || '',
    depends_on_task_id: task?.depends_on_task_id || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [parentTaskSearch, setParentTaskSearch] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');
  const [showRelationships, setShowRelationships] = useState(!!(task?.parent_task_id || task?.depends_on_task_id));

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Close assignee dropdown on outside click
  useEffect(() => {
    if (!showAssigneeDropdown) return;
    const handler = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAssigneeDropdown]);

  /* ─── DATA FETCHING ─── */
  useEffect(() => {
    if (!isOpen) return;
    const fetchOptions = async () => {
      try {
        const { data: { user: currentUserData }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!currentUserData) throw new Error('User not authenticated');
        const [{ data: usersData }, { data: teamsData }, { data: projectsData }, { data: tasksData }] = await Promise.all([
          supabase.from('users').select('id, name, avatar_url, email, team_id').eq('company_id', currentCompany?.id).order('name'),
          supabase.from('teams').select('id, name').eq('company_id', currentCompany?.id).order('name'),
          supabase.from('projects').select('id, name').eq('company_id', currentCompany?.id).order('name'),
          supabase.from('tasks').select('id, title, type, status, priority').eq('company_id', currentCompany?.id).order('created_at', { ascending: false }).limit(100),
        ]);
        setUsers(usersData || []);
        setTeams(teamsData || []);
        setAllProjects(projectsData || []);
        setTasks(tasksData || []);
        if (!task && currentUser) {
          setFormData(prev => ({ ...prev, assignee_id: currentUser.id, team_id: currentUser.team_id || '' }));
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
          const { data } = await supabase.from('sprints').select('id, name, status, start_date, end_date').eq('project_id', projectId).order('start_date', { ascending: false });
          setSprints(data || []);
          if (data && data.length > 0 && !formData.sprint_id && !task) {
            const activeSprint = data.find(s => s.status === 'active') || data[0];
            if (activeSprint) setFormData(prev => ({ ...prev, sprint_id: activeSprint.id }));
          }
        } catch (err) { setSprints([]); }
      };
      fetchSprints(formData.project_id);
    } else {
      setSprints([]);
      if (formData.sprint_id) setFormData(prev => ({ ...prev, sprint_id: '' }));
    }
  }, [formData.project_id]);

  /* ─── HANDLERS ─── */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    if (field === 'assignee_id') {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser?.team_id) setFormData(prev => ({ ...prev, team_id: selectedUser.team_id }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const payload = {
        title: formData.title.trim(), description: formData.description.trim(),
        type: formData.type, priority: formData.priority, status: formData.status,
        assignee_id: formData.assignee_id || null, team_id: formData.team_id || null,
        reporter_id: task?.reporter_id || user.id,
        project_id: formData.project_id || null, sprint_id: formData.sprint_id || null,
        due_date: formData.due_date || null,
        efforts_in_days: formData.efforts_in_days ? parseFloat(formData.efforts_in_days) : null,
        parent_task_id: formData.parent_task_id || null,
      };
      let result;
      if (task) {
        result = await supabase.from('tasks').update(payload).eq('id', task.id).select().single();
      } else {
        result = await supabase.from('tasks').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      if (formData.depends_on_task_id && !task) {
        await supabase.from('task_dependencies').insert({ task_id: result.data.id, depends_on_task_id: formData.depends_on_task_id, dependency_type: 'blocks' });
      }
      if (payload.assignee_id && payload.assignee_id !== user.id) {
        try {
          const currentUserData = users.find(u => u.id === user.id);
          await createTaskNotification(payload.assignee_id, result.data.id, result.data.title, 'assigned',
            `${currentUserData?.name || 'Someone'} assigned you to "${result.data.title}"`,
            { task_id: result.data.id, assigned_by: user.id, assigned_to: payload.assignee_id });
        } catch (e) { console.error('Notification error:', e); }
      }
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); closeAndReset(); }, 800);
    } catch (err) {
      console.error('save', err);
      setError(err.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const closeAndReset = () => {
    setFormData({ title: '', description: '', type: 'Task', priority: 'Medium', status: 'To Do', assignee_id: '', team_id: '', project_id: '', sprint_id: '', due_date: '', parent_task_id: '', efforts_in_days: '', depends_on_task_id: '' });
    setError(null); setSuccess(false); setShowAssigneeDropdown(false);
    setAssigneeSearch(''); setParentTaskSearch(''); setDependencySearch('');
    setShowRelationships(false); onClose?.();
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

  /* ─── COMPUTED ─── */
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.email.toLowerCase().includes(assigneeSearch.toLowerCase()));
  const filteredParentTasks = tasks.filter(t => t.title.toLowerCase().includes(parentTaskSearch.toLowerCase()) && t.id !== formData.parent_task_id);
  const filteredDependencyTasks = tasks.filter(t => t.title.toLowerCase().includes(dependencySearch.toLowerCase()) && t.id !== formData.depends_on_task_id && t.id !== formData.parent_task_id);
  const selectedAssignee = users.find(u => u.id === formData.assignee_id);
  const selectedParentTask = tasks.find(t => t.id === formData.parent_task_id);
  const selectedDependency = tasks.find(t => t.id === formData.depends_on_task_id);
  const selectedTeam = teams.find(t => t.id === formData.team_id);

  if (!isOpen) return null;

  /* ─── THEME-AWARE STYLES ─── */
  const modal = isDarkMode
    ? 'bg-slate-900 border-slate-700/80 shadow-2xl shadow-black/50'
    : 'bg-white border-gray-200 shadow-2xl';
  const headerBg = isDarkMode ? 'bg-slate-800/80' : 'bg-gray-50';
  const headerBorder = isDarkMode ? 'border-slate-700/60' : 'border-gray-200';
  const bodyBg = isDarkMode ? 'bg-slate-900' : 'bg-white';
  const sidebarBg = isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50/80';
  const sidebarBorder = isDarkMode ? 'border-slate-700/60' : 'border-gray-100';
  const footerBg = isDarkMode ? 'bg-slate-800/60' : 'bg-gray-50';
  const footerBorder = isDarkMode ? 'border-slate-700/60' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';
  const inputFocus = isDarkMode ? 'focus:border-indigo-500 focus:ring-indigo-500/20' : 'focus:border-indigo-400 focus:ring-indigo-100';
  const dropdownBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const dropdownHover = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  const dividerColor = isDarkMode ? 'border-slate-700/60' : 'border-gray-200';

  const pillBase = (isActive, color) =>
    isActive
      ? isDarkMode
        ? `bg-opacity-20 border-opacity-40 text-opacity-100`
        : ``
      : isDarkMode
        ? 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600 hover:text-gray-200'
        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700';

  /* ─── RENDER ─── */
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Overlay */}
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/40'}`} onClick={closeAndReset} />

          {/* Modal */}
          <motion.div
            className={`relative w-full max-w-[1200px] max-h-[92vh] rounded-2xl border flex flex-col overflow-hidden ${modal}`}
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >

            {/* ━━━ HEADER ━━━ */}
            <div className={`flex-shrink-0 flex items-center justify-between px-7 py-4 border-b ${headerBg} ${headerBorder}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25">
                  <FiEdit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>{task ? 'Edit Task' : 'New Task'}</h2>
                  <p className={`text-xs mt-0.5 ${textSecondary}`}>{task ? 'Update the details below' : 'Define your task with the details below'}</p>
                </div>
              </div>
              <button onClick={closeAndReset} className={`p-2 rounded-lg ${textMuted} hover:${textPrimary} ${dropdownHover} transition-colors`}>
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* ━━━ ALERTS ━━━ */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`flex-shrink-0 px-7 py-3 border-b ${isDarkMode ? 'bg-red-950/40 border-red-900/40' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-2.5">
                    <FiAlertCircle className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`flex-shrink-0 px-7 py-3 border-b ${isDarkMode ? 'bg-emerald-950/40 border-emerald-900/40' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-2.5">
                    <FiCheck className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Task {task ? 'updated' : 'created'} successfully!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ━━━ BODY ━━━ */}
            <div className={`flex-1 overflow-y-auto ${bodyBg}`}>
              <div className="flex flex-col lg:flex-row min-h-0">

                {/* ── LEFT: Main Form ── */}
                <div className={`flex-1 p-7 space-y-7 border-b lg:border-b-0 lg:border-r ${sidebarBorder}`}>

                  {/* Title */}
                  <div>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={formData.title}
                      onChange={e => handleChange('title', e.target.value)}
                      placeholder="What needs to be done?"
                      className={`w-full px-0 py-2 text-2xl font-bold bg-transparent border-0 border-b-2 outline-none transition-colors ${isDarkMode
                          ? 'text-white border-slate-700 focus:border-indigo-500 placeholder-gray-600'
                          : 'text-gray-900 border-gray-200 focus:border-indigo-500 placeholder-gray-300'
                        }`}
                    />
                  </div>

                  {/* Type Selector */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-3 ${textMuted}`}>
                      <FiTag className="w-3 h-3" /> Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map(opt => {
                        const Icon = opt.icon;
                        const isActive = formData.type === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => handleChange('type', opt.value)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${isActive
                                ? isDarkMode
                                  ? 'border-current shadow-sm'
                                  : 'border-current shadow-sm'
                                : isDarkMode
                                  ? 'bg-slate-800 border-slate-700 text-gray-400 hover:text-gray-200 hover:border-slate-600'
                                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            style={isActive ? { color: opt.color, backgroundColor: opt.color + '15', borderColor: opt.color + '50' } : {}}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority + Status Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                    <div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-3 ${textMuted}`}>
                        <FiTarget className="w-3 h-3" /> Priority
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {priorityOptions.map(opt => {
                          const Icon = opt.icon;
                          const isActive = formData.priority === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => handleChange('priority', opt.value)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${isActive
                                  ? ''
                                  : isDarkMode
                                    ? 'bg-slate-800 border-slate-700 text-gray-400 hover:text-gray-200 hover:border-slate-600'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              style={isActive ? { color: opt.color, backgroundColor: opt.color + '15', borderColor: opt.color + '50' } : {}}
                            >
                              <Icon className="w-3 h-3" />
                              {opt.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-3 ${textMuted}`}>
                        <FiActivity className="w-3 h-3" /> Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map(opt => {
                          const Icon = opt.icon;
                          const isActive = formData.status === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => handleChange('status', opt.value)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${isActive
                                  ? ''
                                  : isDarkMode
                                    ? 'bg-slate-800 border-slate-700 text-gray-400 hover:text-gray-200 hover:border-slate-600'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              style={isActive ? { color: opt.color, backgroundColor: opt.color + '15', borderColor: opt.color + '50' } : {}}
                            >
                              <Icon className="w-3 h-3" />
                              {opt.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-3 ${textMuted}`}>
                      <FiAlignLeft className="w-3 h-3" /> Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => handleChange('description', e.target.value)}
                      placeholder="Add a detailed description..."
                      rows={5}
                      className={`w-full px-4 py-3 text-sm rounded-xl border outline-none resize-none transition-all ${inputBg} ${inputFocus} focus:ring-2`}
                    />
                  </div>

                  {/* ── Relationships (Collapsible) ── */}
                  <div className={`border-t pt-5 ${dividerColor}`}>
                    <button type="button" onClick={() => setShowRelationships(!showRelationships)}
                      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] ${textMuted} hover:${textSecondary} transition-colors`}
                    >
                      <motion.div animate={{ rotate: showRelationships ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <FiChevronDown className="w-3.5 h-3.5" />
                      </motion.div>
                      <FiGitBranch className="w-3 h-3" />
                      Relationships & Dependencies
                      {(formData.parent_task_id || formData.depends_on_task_id) && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {(formData.parent_task_id ? 1 : 0) + (formData.depends_on_task_id ? 1 : 0)}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showRelationships && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Parent Task */}
                            <div>
                              <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                                <FiLayers className="w-3 h-3" /> Parent Task
                              </label>
                              {selectedParentTask ? (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-indigo-950/30 border-indigo-800/50' : 'bg-indigo-50 border-indigo-200'}`}>
                                  <Badge type="type" value={selectedParentTask.type} size="sm" />
                                  <span className={`flex-1 text-sm font-medium truncate ${textPrimary}`}>{selectedParentTask.title}</span>
                                  <button onClick={() => handleChange('parent_task_id', '')} className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-indigo-900/50' : 'hover:bg-indigo-100'}`}>
                                    <FiX className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input type="text" placeholder="Search tasks..." value={parentTaskSearch} onChange={e => setParentTaskSearch(e.target.value)}
                                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all ${inputBg} ${inputFocus} focus:ring-2`}
                                    />
                                  </div>
                                  {parentTaskSearch && (
                                    <div className={`mt-2 max-h-36 overflow-y-auto rounded-xl border p-1 ${dropdownBg}`}>
                                      {filteredParentTasks.slice(0, 5).map(t => (
                                        <button key={t.id} onClick={() => { handleChange('parent_task_id', t.id); setParentTaskSearch(''); }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors ${dropdownHover}`}>
                                          <Badge type="type" value={t.type} size="xs" />
                                          <span className={`text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.title}</span>
                                        </button>
                                      ))}
                                      {filteredParentTasks.length === 0 && <p className={`text-xs text-center py-3 ${textMuted}`}>No matching tasks</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Dependency */}
                            <div>
                              <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                                <FiGitBranch className="w-3 h-3" /> Depends On
                              </label>
                              {selectedDependency ? (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-amber-950/30 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}>
                                  <Badge type="type" value={selectedDependency.type} size="sm" />
                                  <span className={`flex-1 text-sm font-medium truncate ${textPrimary}`}>{selectedDependency.title}</span>
                                  <button onClick={() => handleChange('depends_on_task_id', '')} className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-amber-900/50' : 'hover:bg-amber-100'}`}>
                                    <FiX className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input type="text" placeholder="Search tasks..." value={dependencySearch} onChange={e => setDependencySearch(e.target.value)}
                                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all ${inputBg} ${inputFocus} focus:ring-2`}
                                    />
                                  </div>
                                  {dependencySearch && (
                                    <div className={`mt-2 max-h-36 overflow-y-auto rounded-xl border p-1 ${dropdownBg}`}>
                                      {filteredDependencyTasks.slice(0, 5).map(t => (
                                        <button key={t.id} onClick={() => { handleChange('depends_on_task_id', t.id); setDependencySearch(''); }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors ${dropdownHover}`}>
                                          <Badge type="type" value={t.type} size="xs" />
                                          <span className={`text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.title}</span>
                                        </button>
                                      ))}
                                      {filteredDependencyTasks.length === 0 && <p className={`text-xs text-center py-3 ${textMuted}`}>No matching tasks</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className={`lg:w-[340px] flex-shrink-0 p-7 space-y-5 ${sidebarBg}`}>

                  {/* Assignee */}
                  <div ref={assigneeRef}>
                    <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                      <FiUser className="w-3 h-3" /> Assignee
                    </label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left ${inputBg.replace('text-gray-900', '').replace('text-white', '')} ${isDarkMode ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {selectedAssignee ? (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar user={selectedAssignee} size="xs" />
                            <span className={`text-sm font-medium truncate ${textPrimary}`}>{selectedAssignee.name}</span>
                          </div>
                        ) : (
                          <span className={`text-sm ${textMuted}`}>Unassigned</span>
                        )}
                        <FiChevronDown className={`w-4 h-4 flex-shrink-0 ${textMuted}`} />
                      </button>

                      <AnimatePresence>
                        {showAssigneeDropdown && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className={`absolute z-50 mt-1.5 w-full rounded-xl shadow-xl border overflow-hidden ${dropdownBg}`}>
                            <div className="p-2">
                              <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input type="text" placeholder="Search..." value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} autoFocus
                                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-400'
                                    }`} />
                              </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto px-1 pb-1">
                              <button onClick={() => { handleChange('assignee_id', ''); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${textMuted} ${dropdownHover}`}>
                                Unassigned
                              </button>
                              {filteredUsers.map(user => (
                                <button key={user.id}
                                  onClick={() => { handleChange('assignee_id', user.id); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${dropdownHover}`}>
                                  <Avatar user={user} size="xs" />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${textPrimary}`}>{user.name}</p>
                                    <p className={`text-xs truncate ${textMuted}`}>{user.email}</p>
                                  </div>
                                  {user.id === currentUser?.id && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isDarkMode ? 'text-indigo-400 bg-indigo-950/50' : 'text-indigo-600 bg-indigo-50'}`}>You</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className={`border-t ${dividerColor}`} />

                  {/* Project */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                      <FiFolder className="w-3 h-3" /> Project
                    </label>
                    <select value={formData.project_id} onChange={e => handleChange('project_id', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none ${inputBg} ${inputFocus} focus:ring-2`}>
                      <option value="">No project</option>
                      {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Sprint */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                      <FiClock className="w-3 h-3" /> Sprint
                    </label>
                    {formData.project_id ? (
                      sprints.length > 0 ? (
                        <>
                          <select value={formData.sprint_id} onChange={e => handleChange('sprint_id', e.target.value)}
                            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none ${inputBg} ${inputFocus} focus:ring-2`}>
                            <option value="">No sprint</option>
                            {sprints.map(s => {
                              const icon = s.status === 'active' ? '🟢' : s.status === 'completed' ? '✅' : '📅';
                              return <option key={s.id} value={s.id}>{icon} {s.name}</option>;
                            })}
                          </select>
                          {formData.sprint_id && (() => {
                            const s = sprints.find(sp => sp.id === formData.sprint_id);
                            if (!s) return null;
                            return (
                              <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium border ${s.status === 'active'
                                  ? isDarkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isDarkMode ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                <div className="flex justify-between items-center">
                                  <span className="capitalize">{s.status}</span>
                                  {s.start_date && s.end_date && (
                                    <span className="opacity-70">{new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className={`px-3.5 py-2.5 text-sm rounded-xl border ${isDarkMode ? 'bg-slate-800 text-gray-500 border-slate-700' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          No sprints for this project
                        </div>
                      )
                    ) : (
                      <div className={`px-3.5 py-2.5 text-sm rounded-xl border ${isDarkMode ? 'bg-slate-800 text-gray-500 border-slate-700' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        Select a project first
                      </div>
                    )}
                  </div>

                  <div className={`border-t ${dividerColor}`} />

                  {/* Due Date + Effort */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                        <FiCalendar className="w-3 h-3" /> Due
                      </label>
                      <input type="date" value={formData.due_date} onChange={e => handleChange('due_date', e.target.value)}
                        className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all ${inputBg} ${inputFocus} focus:ring-2`} />
                    </div>
                    <div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 ${textMuted}`}>
                        <FiClock className="w-3 h-3" /> Effort
                      </label>
                      <input type="number" step="0.5" min="0" placeholder="Days" value={formData.efforts_in_days} onChange={e => handleChange('efforts_in_days', e.target.value)}
                        className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all ${inputBg} ${inputFocus} focus:ring-2`} />
                    </div>
                  </div>

                  {/* Team indicator */}
                  {selectedTeam && (
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${isDarkMode ? 'bg-blue-950/30 text-blue-400 border-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                      <FiUsers className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium truncate">{selectedTeam.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ━━━ FOOTER ━━━ */}
            <div className={`flex-shrink-0 flex items-center justify-between px-7 py-4 border-t ${footerBg} ${footerBorder}`}>
              <div className="flex items-center gap-2.5">
                <Avatar user={currentUser} size="sm" />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser?.name}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-medium ${textMuted}`}>Reporter</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`hidden sm:flex items-center gap-1.5 text-[10px] mr-2 ${textMuted}`}>
                  <kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>Esc</kbd>
                  <span>close</span>
                  <span className="mx-1">•</span>
                  <kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>⌘↵</kbd>
                  <span>save</span>
                </div>

                <button type="button" onClick={closeAndReset}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}>
                  Cancel
                </button>

                <motion.button type="button" onClick={handleSubmit} disabled={loading || !formData.title.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${loading || !formData.title.trim()
                      ? isDarkMode ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40'
                    }`}>
                  {loading ? (
                    <><FiLoader className="w-4 h-4 animate-spin" /><span>{task ? 'Saving...' : 'Creating...'}</span></>
                  ) : (
                    <><FiCheck className="w-4 h-4" /><span>{task ? 'Update' : 'Create Task'}</span></>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
