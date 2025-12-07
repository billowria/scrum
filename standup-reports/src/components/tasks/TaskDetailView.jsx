import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiEdit2, FiSave, FiTrash2, FiClock, FiCalendar,
  FiUser, FiUserPlus, FiArrowLeft, FiUsers, FiLink, FiMessageSquare,
  FiCheckSquare, FiActivity, FiPaperclip, FiFolder, FiCopy,
  FiExternalLink, FiAlertCircle, FiCheck, FiLoader, FiPlus,
  FiMinus, FiMoreVertical, FiShare2, FiBell, FiBellOff,
  FiGitBranch, FiXCircle, FiSearch, FiTrendingUp, FiBarChart2,
  FiLayers, FiFileText, FiChevronDown, FiChevronUp, FiSend,
  FiDownload, FiTarget, FiHash
} from 'react-icons/fi';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { supabase } from '../../supabaseClient';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// --- EINSTEIN DESIGN SYSTEM ---
// "Precision" Color Palette & Utilities

const THEME = {
  colors: {
    primary: 'blue',
    people: 'indigo',
    date: 'orange',
    project: 'teal',
    sprint: 'purple',
    dependency: 'rose',
    success: 'emerald'
  },
  glass: "backdrop-blur-md bg-white/90 border border-white/20 shadow-xl",
  input: "transition-all duration-200 outline-none focus:ring-2 ring-offset-1 focus:ring-blue-500/50 rounded-lg",
};

// --- SMART FIELDS (Modular Inline Editing) ---

const EditTrigger = ({ onClick, color = 'gray' }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-${color}-100 text-${color}-500 hover:text-${color}-700`}
  >
    <FiEdit2 className="w-3 h-3" />
  </button>
);

const SmartField = ({ label, icon: Icon, children, onEdit, color = 'gray', className = '' }) => (
  <div className={`group relative p-3 rounded-xl border border-transparent hover:bg-white hover:border-${color}-100 hover:shadow-sm transition-all ${className}`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider text-${color}-400`}>{label}</p>
          {onEdit && <EditTrigger onClick={onEdit} color={color} />}
        </div>
        <div className="font-medium text-gray-900">{children}</div>
      </div>
    </div>
  </div>
);

const SmartUserSelect = ({ label, icon, user, onSave, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase.from('users').select('id, name, avatar_url, email').ilike('name', `%${search}%`).limit(10);
        setUsers(data || []);
        setLoading(false);
      };
      fetchUsers();
    }
  }, [isEditing, search]);

  return (
    <div className="relative">
      <SmartField label={label} icon={icon} color={color} onEdit={() => setIsEditing(!isEditing)}>
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar user={user} size="xs" />
            <span className="truncate">{user.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic">Unassigned</span>
        )}
      </SmartField>

      {isEditing && (
        <div className="absolute top-full left-0 z-50 w-full min-w-[200px] mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          <input
            autoFocus
            placeholder="Search users..."
            className="w-full p-2 text-sm border-b border-gray-100 focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { onSave(u.id); setIsEditing(false); }}
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-sm text-left"
              >
                <Avatar user={u} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.name}</div>
                  <div className="text-xs text-gray-400 truncate">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const TaskDetailView = ({
  isOpen,
  onClose,
  taskId,
  onUpdate,
  currentUser,
  onNavigateToTask,
  parentTaskId
}) => {
  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Relations
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [projects, setProjects] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('comments');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  // Inputs
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [depSearch, setDepSearch] = useState('');
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);

  // Refs
  const modalRef = useRef(null);

  // --- Initial Fetch ---
  useEffect(() => {
    if (isOpen && taskId) fetchAllData();
  }, [isOpen, taskId]);

  // --- Scoped Dependency Search ---
  useEffect(() => {
    if (isAddingDep && task?.project_id) {
      const search = async () => {
        let query = supabase
          .from('tasks')
          .select('id, title, status, project_id')
          .eq('project_id', task.project_id) // SCOPED to project
          .neq('id', taskId);

        if (depSearch) query = query.ilike('title', `%${depSearch}%`);

        const { data } = await query.limit(10);
        setAvailableTasks(data || []);
      };
      search();
    }
  }, [isAddingDep, depSearch, task?.project_id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: t, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!assignee_id(id, name, avatar_url, email),
          reporter:users!reporter_id(id, name, avatar_url, email),
          team:teams(id, name),
          project:projects(id, name),
          sprint:sprints(id, name)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(t);

      // Parallel fetch for relations
      await Promise.all([
        fetchSubtasks(t.id),
        fetchComments(t.id),
        fetchActivities(t.id),
        fetchDependencies(t.id),
        fetchProjects()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async (id) => {
    const { data } = await supabase.from('tasks').select('*, assignee:users!assignee_id(id,name,avatar_url)').eq('parent_task_id', id).order('created_at', { ascending: true });
    setSubtasks(data || []);
  };
  const fetchComments = async (id) => {
    const { data } = await supabase.from('comments').select('*, user:users(id,name,avatar_url)').eq('task_id', id).order('created_at', { ascending: false });
    setComments(data || []);
  };
  const fetchActivities = async (id) => {
    const { data } = await supabase.from('task_activities').select('*, user:users(id,name)').eq('task_id', id).order('created_at', { ascending: false }).limit(20);
    setActivities(data || []);
  };
  const fetchDependencies = async (id) => {
    const { data } = await supabase.from('task_dependencies').select('*, depends_on_task:tasks!depends_on_task_id(id,title,status)').eq('task_id', id);
    setDependencies(data || []);
  };
  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    setProjects(data || []);
  };

  // --- Auto-Save Actions ---

  const updateTask = async (updates) => {
    // Optimistic UI interaction could be added here for even faster feel
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (!error) {
      setTask(prev => ({ ...prev, ...updates }));
      if (onUpdate) onUpdate();
      // Refetch if complex relational changes
      if (updates.project_id || updates.assignee_id) fetchAllData();
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const { error } = await supabase.from('tasks').insert({
      title: newSubtask,
      parent_task_id: taskId,
      project_id: task.project_id,
      team_id: task.team_id,
      status: 'To Do',
      created_by: currentUser.id
    });
    if (!error) {
      setNewSubtask('');
      fetchSubtasks(taskId);
      // log activity
    }
  };

  const addDependency = async (depId) => {
    const { error } = await supabase.from('task_dependencies').insert({
      task_id: taskId,
      depends_on_task_id: depId,
      dependency_type: 'blocks'
    });
    if (!error) {
      setIsAddingDep(false);
      fetchDependencies(taskId);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: currentUser.id,
      content: newComment
    });
    if (!error) {
      setNewComment('');
      fetchComments(taskId);
    }
  };

  // --- Render Helpers ---

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          layoutId={`task-${taskId}`}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-[95vw] h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/50"
        >
          {loading ? (
            <LoadingContent />
          ) : (
            <>
              {/* --- HEADER: The "Control Deck" --- */}
              <div className="bg-white border-b border-gray-100 p-6 flex flex-col gap-6 z-20">

                {/* Top Row: Breadcrumbs & Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {/* Functional Project Picker in Breadcrumb */}
                    <div className="relative group">
                      <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors">
                        <FiBarChart2 className="text-teal-500" />
                        <span className="font-semibold text-gray-700 group-hover:text-teal-700">{task.project?.name || 'No Project'}</span>
                        <FiChevronDown className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => updateTask({ project_id: p.id })}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-700 text-sm font-medium transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-300">/</span>
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">TASK-{task.id.slice(0, 4)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><FiShare2 /></button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><FiMoreVertical /></button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"><FiX className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Hero Row: Title & Status */}
                <div className="flex items-start gap-8">
                  <div className="flex-1 group">
                    {/* Inline Title Edit (Auto-growing, blur to save) */}
                    <input
                      className="w-full text-4xl font-bold text-gray-900 bg-transparent outline-none border-b-2 border-transparent focus:border-blue-500 placeholder-gray-300 transition-all font-display"
                      value={task.title}
                      onChange={(e) => setTask({ ...task, title: e.target.value })}
                      onBlur={(e) => updateTask({ title: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    {/* Status Pill */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusOpen(!statusOpen)}
                        className={`h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            task.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                          }`}
                      >
                        {task.status} <FiChevronDown />
                      </button>
                      {statusOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-50">
                          {['To Do', 'In Progress', 'Review', 'Completed'].map(s => (
                            <button key={s} onClick={() => { updateTask({ status: s }); setStatusOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Priority Pill */}
                    <div className="relative">
                      <button
                        onClick={() => setPriorityOpen(!priorityOpen)}
                        className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${task.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                      >
                        <FiTrendingUp />
                      </button>
                      {priorityOpen && ( /* Priority Dropdown similar to status */
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-50">
                          {['Low', 'Medium', 'High', 'Critical'].map(p => (
                            <button key={p} onClick={() => { updateTask({ priority: p }); setPriorityOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">{p}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- MAIN GRID: "The Lab" Workspace --- */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50/30">

                {/* COL 1: Content (Description, Tasks, Activity) */}
                <div className="flex-1 overflow-y-auto px-8 py-8 md:pr-12 border-r border-gray-100 bg-white">
                  <div className="max-w-3xl mx-auto space-y-12">

                    {/* Description */}
                    <section className="group">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <FiFileText className="text-gray-300" /> Description
                        </h3>
                      </div>
                      <textarea
                        className="w-full min-h-[150px] p-4 rounded-xl bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-700 leading-relaxed resize-none focus:outline-none"
                        placeholder="Add detailed description..."
                        value={task.description || ''}
                        onChange={(e) => setTask({ ...task, description: e.target.value })}
                        onBlur={(e) => updateTask({ description: e.target.value })}
                      />
                    </section>

                    {/* Subtasks */}
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                        <FiCheckSquare className="text-gray-300" /> Subtasks
                        <span className="bg-gray-100 text-gray-600 px-2 rounded-full font-bold">{subtasks.filter(s => s.status === 'Completed').length}/{subtasks.length}</span>
                      </h3>

                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {subtasks.map(sub => (
                          <div key={sub.id} className="group flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <button
                              onClick={() => {
                                const ns = sub.status === 'Completed' ? 'To Do' : 'Completed';
                                supabase.from('tasks').update({ status: ns }).eq('id', sub.id).then(() => fetchSubtasks(taskId));
                              }}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${sub.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent hover:border-emerald-400'}`}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <span className={`flex-1 font-medium ${sub.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{sub.title}</span>
                            {sub.assignee && <Avatar user={sub.assignee} size="xs" />}
                          </div>
                        ))}
                        <div className="p-4 bg-gray-50/50 flex items-center gap-3">
                          <FiPlus className="text-gray-400" />
                          <input
                            className="flex-1 bg-transparent font-medium text-gray-700 placeholder-gray-400 focus:outline-none"
                            placeholder="Add a subtask..."
                            value={newSubtask}
                            onChange={e => setNewSubtask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSubtask()}
                          />
                          <button onClick={addSubtask} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">ADD</button>
                        </div>
                      </div>
                    </section>

                    {/* Activity / Comments */}
                    <section>
                      <div className="flex items-center gap-6 mb-6">
                        {['comments', 'history'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {activeTab === 'comments' ? (
                        <div className="space-y-6">
                          <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <Avatar user={currentUser} size="sm" />
                            <div className="flex-1">
                              <textarea
                                className="w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                                rows={2}
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={addComment}
                                  disabled={!newComment.trim()}
                                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  <FiSend className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {comments.map(c => (
                              <div key={c.id} className="flex gap-4 group">
                                <Avatar user={c.user} size="sm" />
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-gray-900 text-sm">{c.user?.name}</span>
                                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                  </div>
                                  <div className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-r-xl rounded-bl-xl border border-gray-100 shadow-sm">{c.content}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pl-4 border-l-2 border-gray-100 space-y-6">
                          {activities.map(a => (
                            <div key={a.id} className="relative text-sm">
                              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white" />
                              <p className="text-gray-600"><span className="font-bold text-gray-900">{a.user?.name}</span> {a.description}</p>
                              <span className="text-xs text-gray-400">{format(new Date(a.created_at), 'MMM d, h:mm a')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>

                {/* COL 2: Sidebar (Properties Panel) */}
                <div className="w-full md:w-[360px] bg-gray-50 p-6 overflow-y-auto border-l border-gray-100">
                  <div className="space-y-8">

                    {/* PEOPLE GROUP */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">People</h4>
                      <SmartUserSelect
                        label="Assignee"
                        icon={FiUser}
                        user={task.assignee}
                        color={THEME.colors.people}
                        onSave={(uid) => updateTask({ assignee_id: uid })}
                      />
                      <SmartUserSelect
                        label="Reporter"
                        icon={FiUsers}
                        user={task.reporter}
                        color={THEME.colors.people}
                        onSave={(uid) => updateTask({ reporter_id: uid })}
                      />
                    </div>

                    {/* PLANNING GROUP */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Planning</h4>
                      <SmartField label="Due Date" icon={FiCalendar} color={THEME.colors.date} onEdit={() => {/* Date picker logic */ }}>
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : <span className="text-gray-400 italic">No Date</span>}
                      </SmartField>
                      <SmartField label="Sprint" icon={FiTarget} color={THEME.colors.sprint}>
                        {task.sprint?.name || <span className="text-gray-400 italic">Backlog</span>}
                      </SmartField>
                    </div>

                    {/* DATA GROUP */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                        <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Created</div>
                        <div className="font-medium text-gray-700">{format(new Date(task.created_at), 'MMM d')}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                        <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Updated</div>
                        <div className="font-medium text-gray-700">{format(new Date(task.updated_at), 'MMM d')}</div>
                      </div>
                    </div>

                    {/* RELATIONS GROUP */}
                    <div className="space-y-3 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Dependencies</h4>
                        <button
                          onClick={() => setIsAddingDep(!isAddingDep)}
                          className="text-[10px] font-bold bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-600 transition-colors"
                        >
                          {isAddingDep ? 'CANCEL' : '+ ADD'}
                        </button>
                      </div>

                      {isAddingDep && (
                        <div className="bg-white p-2 rounded-xl border border-blue-200 shadow-lg animate-in fade-in slide-in-from-top-2">
                          <input
                            autoFocus
                            className="w-full text-xs p-2 border-b border-gray-100 focus:outline-none mb-2"
                            placeholder="Search current project..."
                            value={depSearch}
                            onChange={e => setDepSearch(e.target.value)}
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {availableTasks.map(t => (
                              <button
                                key={t.id}
                                onClick={() => addDependency(t.id)}
                                className="w-full text-left text-xs p-1.5 hover:bg-gray-50 rounded flex justify-between"
                              >
                                <span className="truncate flex-1">{t.title}</span>
                                <span className="ml-2 text-gray-400">{t.status}</span>
                              </button>
                            ))}
                            {availableTasks.length === 0 && <div className="text-xs text-gray-400 italic p-2 text-center">No tasks found</div>}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {dependencies.map(d => (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-rose-200 transition-colors cursor-pointer">
                            <FiGitBranch className="text-rose-400 w-4 h-4" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{d.depends_on_task?.title}</div>
                              <div className="text-[10px] text-gray-400">{d.depends_on_task?.status}</div>
                            </div>
                          </div>
                        ))}
                        {dependencies.length === 0 && !isAddingDep && (
                          <div className="text-xs text-gray-400 italic text-center p-4 border border-dashed border-gray-200 rounded-xl">No dependencies linked</div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const LoadingContent = () => (
  <div className="w-full h-full p-8 flex items-start gap-8 bg-white">
    <div className="flex-1 space-y-8">
      <div className="space-y-4">
        <LoadingSkeleton variant="text" width="200px" />
        <LoadingSkeleton variant="title" width="70%" />
      </div>
      <div className="flex gap-4">
        <LoadingSkeleton variant="rectangle" width="100px" height="40px" />
        <LoadingSkeleton variant="rectangle" width="100px" height="40px" />
      </div>
      <div className="space-y-4 mt-12">
        <LoadingSkeleton variant="text" width="100px" />
        <LoadingSkeleton variant="text" count={5} />
      </div>
    </div>
    <div className="w-96 space-y-6">
      <LoadingSkeleton variant="card" height="100px" />
      <LoadingSkeleton variant="card" height="100px" />
      <LoadingSkeleton variant="card" height="100px" />
    </div>
  </div>
);

export default TaskDetailView;