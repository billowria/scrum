import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { format, parseISO, isAfter, isToday, isTomorrow } from 'date-fns';
import {
  FiPlus,
  FiMoreVertical,
  FiFilter,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiZap,
  FiTarget,
  FiSearch,
  FiChevronDown,
  FiFolder,
  FiX
} from 'react-icons/fi';
import TaskCard from './TaskCard';
import TaskList from './TaskList';

const statusColumns = [
  { 
    id: 'To Do', 
    label: 'To Do', 
    color: 'gray',
    bgColor: 'bg-gradient-to-br from-gray-50/80 to-gray-100/80',
    borderColor: 'border-gray-200/60',
    textColor: 'text-gray-700',
    icon: FiClock,
    gradient: 'from-gray-400 to-gray-600',
    glassColor: 'bg-gray-500/10',
    accentColor: 'bg-gray-500/20'
  },
  { 
    id: 'In Progress', 
    label: 'In Progress', 
    color: 'blue',
    bgColor: 'bg-gradient-to-br from-blue-50/80 to-indigo-100/80',
    borderColor: 'border-blue-200/60',
    textColor: 'text-blue-700',
    icon: FiTrendingUp,
    gradient: 'from-blue-400 to-indigo-600',
    glassColor: 'bg-blue-500/10',
    accentColor: 'bg-blue-500/20'
  },
  { 
    id: 'Review', 
    label: 'Review', 
    color: 'amber',
    bgColor: 'bg-gradient-to-br from-amber-50/80 to-orange-100/80',
    borderColor: 'border-amber-200/60',
    textColor: 'text-amber-700',
    icon: FiAlertCircle,
    gradient: 'from-amber-400 to-orange-600',
    glassColor: 'bg-amber-500/10',
    accentColor: 'bg-amber-500/20'
  },
  { 
    id: 'Completed', 
    label: 'Completed', 
    color: 'green',
    bgColor: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80',
    borderColor: 'border-green-200/60',
    textColor: 'text-green-700',
    icon: FiCheckCircle,
    gradient: 'from-green-400 to-emerald-600',
    glassColor: 'bg-green-500/10',
    accentColor: 'bg-green-500/20'
  }
];

const SortableColumn = ({ column, tasks, onTaskUpdate, onTaskEdit, onTaskDelete, onTaskView }) => {
  const [justReceivedTask, setJustReceivedTask] = useState(false);

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const columnTasks = tasks.filter(task => task.status === column.id);
  const ColumnIcon = column.icon;

  
  // Calculate progress percentage
  const totalTasks = tasks.length;
  const columnProgress = totalTasks > 0 ? (columnTasks.length / totalTasks) * 100 : 0;

  // Calculate overdue tasks in this column
  const overdueTasks = columnTasks.filter(task => {
    if (!task.due_date) return false;
    return isAfter(new Date(), parseISO(task.due_date));
  });

  return (
    <div className="flex-1 min-w-[320px] max-w-[420px] flex flex-col relative">
      {/* Droppable area overlay */}
      <div
        ref={setNodeRef}
        className={`absolute inset-0 rounded-2xl transition-all duration-300 z-10 ${
          isOver ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        } ${
          justReceivedTask ? 'ring-4 ring-green-400 ring-opacity-75' : ''
        }`}
        style={{ pointerEvents: isOver ? 'auto' : 'none' }}
      />

      <motion.div
        className={`flex-1 flex flex-col backdrop-blur-sm rounded-2xl border ${column.borderColor} transition-all duration-300 ${
          isOver ? 'scale-105' : 'hover:scale-[1.02]'
        } ${
          justReceivedTask ? 'scale-105' : ''
        }`}
        style={{
          background: column.bgColor,
          boxShadow: isOver
            ? `0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px ${column.glassColor}`
            : '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.1)'
        }}
        whileHover={{
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
      {/* Column Header */}
      <div className={`p-4 border-b ${column.borderColor} backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${column.glassColor} flex items-center justify-center backdrop-blur-sm`}>
              <ColumnIcon className={`w-5 h-5 ${column.textColor}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${column.textColor}`}>
                {column.label}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {columnTasks.length} task{columnTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${column.textColor} ${column.accentColor} backdrop-blur-sm`}>
              {columnTasks.length}
            </div>
            {overdueTasks.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 bg-red-100/80 text-red-700 rounded-full text-xs font-medium backdrop-blur-sm"
              >
                {overdueTasks.length} overdue
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="w-full bg-white/50 rounded-full h-2 mb-3 backdrop-blur-sm">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${column.gradient} shadow-lg`}
            initial={{ width: 0 }}
            animate={{ width: `${columnProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        {/* Column Stats */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">{columnProgress.toFixed(0)}% of total</span>
          <div className="flex items-center space-x-2">
            <FiTrendingUp className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 font-medium">
              {columnTasks.length} / {totalTasks}
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <AnimatePresence>
          {columnTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: "easeOut"
              }}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <TaskCard
                task={task}
                onEdit={onTaskEdit}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                onView={onTaskView}
                columnColor={column}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Empty State with Status Info */}
        {columnTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 px-4 mx-2 my-4 rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 border border-gray-200/50"
          >
            <div className={`w-16 h-16 ${column.glassColor} rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg`}>
              <ColumnIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium mb-2 text-gray-700">No tasks in {column.label}</p>
            {tasks.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <p className="text-xs text-gray-500 mb-2">
                  Tasks are available but none match the current filters
                </p>
                <p className="text-xs text-gray-400">
                  Try adjusting your filters or drag tasks here
                </p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <p className="text-xs text-gray-500 mb-2">
                  No tasks have been created yet
                </p>
                <p className="text-xs text-gray-400">
                  Create a task or drag tasks here when available
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      </motion.div>
    </div>
  );
};

export default function TaskBoard({
  tasks,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  search = '',
  setSearch = () => {},
  filters = { status: 'all', assignee: 'all' },
  setFilters = () => {},
  employees = [],
  sprints = [],
  selectedSprintId = 'all',
  setSelectedSprintId = () => {},
  selectedProjectId = 'all',
  setSelectedProjectId = () => {},
  projects = [],
  getStatusConfig = () => ({}),
  onClearAllFilters = null,
  onOpenSprintManagement = () => {}
}) {
  const [displayMode, setDisplayMode] = useState('board'); // 'board' or 'list'
  const [activeId, setActiveId] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSprintDropdown, setShowSprintDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  const statusDropdownRef = useRef(null);
  const sprintDropdownRef = useRef(null);
  const assigneeDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(event.target)) {
        setShowSprintDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch(event.key) {
        case '/':
          event.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with copy
          if (onClearAllFilters && typeof onClearAllFilters === 'function') {
            // Use the robust clear function from parent if available
            onClearAllFilters();
          } else {
            // Fallback to local clear logic
            try {
              setFilters(prevFilters => ({
                ...prevFilters,
                status: 'all',
                assignee: 'all',
                team: 'all',
                dueDate: 'all',
                sprint: 'all',
                search: ''
              }));
              setSelectedProjectId('all');
              setSelectedSprintId('all');
              setSearch('');
            } catch (err) {
              console.error('Error clearing filters:', err);
            }
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Filter tasks by search
  const filteredTasks = tasks.filter(task => {
    const q = search.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.assignee?.name?.toLowerCase().includes(q)
    );
  });

  // Debug: Log when tasks prop changes
  useEffect(() => {
    console.log('Tasks prop updated:', tasks.length, 'tasks');
    console.log('Tasks by status:', {
      'To Do': tasks.filter(t => t.status === 'To Do').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      'Review': tasks.filter(t => t.status === 'Review').length,
      'Completed': tasks.filter(t => t.status === 'Completed').length,
    });
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return statusColumns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => task.status === column.id);
      return acc;
    }, {});
  }, [tasks]);

  // Calculate board statistics
  const boardStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const overdue = tasks.filter(task => {
      if (!task.due_date) return false;
      return isAfter(new Date(), parseISO(task.due_date));
    }).length;
    const dueToday = tasks.filter(task => {
      if (!task.due_date) return false;
      return isToday(parseISO(task.due_date));
    }).length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      dueToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [tasks]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    console.log('DragStart triggered:', active.id);
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    console.log('DragEnd triggered:', { active: active.id, over: over?.id });
    console.log('Full event data:', { active, over });

    if (!over) {
      console.log('No drop target - drag cancelled');
      setActiveId(null);
      return;
    }

    // Check if over is a droppable container
    let overContainer = over.id;

    // If over.data exists and has the column info, use that
    if (over.data?.current?.column?.id) {
      overContainer = over.data.current.column.id;
      console.log('Using column ID from over.data:', overContainer);
    }

    // Get the current task to find its current column
    const task = tasks.find(t => t.id === active.id);
    if (!task) {
      console.error('Task not found:', active.id);
      setActiveId(null);
      return;
    }

    const activeContainer = task.status;

    console.log('Task details:', {
      taskTitle: task.title,
      currentStatus: activeContainer,
      targetContainer: overContainer,
      overData: over.data
    });

    // Only update if the task is moved to a different column
    if (activeContainer !== overContainer) {
      // Validate the new status
      const validStatuses = statusColumns.map(col => col.id);
      if (!validStatuses.includes(overContainer)) {
        console.error('Invalid status:', overContainer, 'Valid statuses:', validStatuses);
        setActiveId(null);
        return;
      }

      console.log('Moving task:', task.title, 'from', activeContainer, 'to', overContainer);

      // Update task status with proper error handling
      try {
        console.log('Calling onTaskUpdate with:', {
          ...task,
          status: overContainer
        });

        // Update the task immediately
        const updatedTask = {
          ...task,
          status: overContainer
        };

        console.log('About to call onTaskUpdate with updatedTask:', updatedTask);
        console.log('onTaskUpdate function:', typeof onTaskUpdate, onTaskUpdate);

        const result = onTaskUpdate(updatedTask);
        console.log('onTaskUpdate returned:', result);

        console.log('Task status updated successfully to:', overContainer);
      } catch (error) {
        console.error('Error updating task status:', error);
        // Show error feedback to user
        alert('Failed to update task status. Please try again.');
      }
    } else {
      console.log('Task dropped in same column - no change needed');
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <div className="space-y-4">
      {/* Stunning Modern Header with Integrated Filters */}
      <div className="relative z-[40] mb-4 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="p-4">
          {/* Top Row: Filters and Search */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Project Filter Dropdown - Beautiful & Animated */}
            <div className="relative" ref={projectDropdownRef}>
              <motion.button
                onClick={() => {
                  setShowProjectDropdown(!showProjectDropdown);
                  setShowStatusDropdown(false);
                  setShowSprintDropdown(false);
                  setShowAssigneeDropdown(false);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  selectedProjectId !== 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-2 border-indigo-400 shadow-indigo-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-200'
                }`}
              >
                <FiFolder className="w-4 h-4" />
                <span>
                  {selectedProjectId === 'all' 
                    ? 'Project' 
                    : projects.find(p => p.id === selectedProjectId)?.name || 'Project'
                  }
                </span>
                <motion.div
                  animate={{ rotate: showProjectDropdown ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showProjectDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute z-[90] mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 py-2 max-h-80 overflow-y-auto backdrop-blur-xl"
                    style={{ boxShadow: '0 20px 60px rgba(99, 102, 241, 0.2)' }}
                  >
                    <motion.button
                      onClick={() => {
                        setSelectedProjectId('all');
                        setShowProjectDropdown(false);
                      }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(238, 242, 255, 1)' }}
                      className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                        selectedProjectId === 'all' 
                          ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 font-bold border-l-4 border-indigo-500' 
                          : 'text-gray-700 font-medium hover:font-semibold'
                      }`}
                    >
                      <FiGrid className="w-4 h-4" />
                      All Projects
                    </motion.button>
                    {projects.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <FiFolder className="w-8 h-8 text-gray-400" />
                          <p>No projects available</p>
                        </div>
                      </div>
                    ) : projects.map((project, index) => (
                      <motion.button
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setShowProjectDropdown(false);
                        }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(238, 242, 255, 1)' }}
                        className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                          selectedProjectId === project.id 
                            ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 font-bold border-l-4 border-indigo-500' 
                            : 'text-gray-700 font-medium hover:font-semibold'
                        }`}
                      >
                        <FiFolder className="w-4 h-4" />
                        {project.name}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Filter Dropdown - Amber Themed */}
            <div className="relative" ref={statusDropdownRef}>
              <motion.button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowProjectDropdown(false);
                  setShowSprintDropdown(false);
                  setShowAssigneeDropdown(false);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  filters.status !== 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 shadow-amber-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 hover:from-amber-50 hover:to-orange-50 hover:border-amber-200'
                }`}
              >
                <FiFilter className="w-4 h-4" />
                <span>{filters.status === 'all' ? 'Status' : filters.status}</span>
                <motion.div
                  animate={{ rotate: showStatusDropdown ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute z-[90] mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-amber-100 py-2 backdrop-blur-xl"
                    style={{ boxShadow: '0 20px 60px rgba(245, 158, 11, 0.2)' }}
                  >
                    {['all', 'To Do', 'In Progress', 'Review', 'Completed'].map((status, index) => {
                      const config = getStatusConfig(status);
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            setFilters({ ...filters, status });
                            setShowStatusDropdown(false);
                          }}
                          whileHover={{ x: 4, backgroundColor: 'rgba(254, 243, 199, 1)' }}
                          className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                            filters.status === status 
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-bold border-l-4 border-amber-500' 
                              : 'text-gray-700 font-medium hover:font-semibold'
                          }`}
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{status === 'all' ? 'All Statuses' : status}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sprint Filter Dropdown - Fuchsia Themed */}
            <div className="relative" ref={sprintDropdownRef}>
              <motion.button
                onClick={() => {
                  setShowSprintDropdown(!showSprintDropdown);
                  setShowProjectDropdown(false);
                  setShowStatusDropdown(false);
                  setShowAssigneeDropdown(false);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  selectedSprintId !== 'all'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-2 border-fuchsia-400 shadow-fuchsia-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 hover:from-fuchsia-50 hover:to-pink-50 hover:border-fuchsia-200'
                }`}
              >
                <FiTarget className="w-4 h-4" />
                <span>
                  {selectedSprintId === 'all'
                    ? 'Sprint'
                    : sprints.find(s => s.id === selectedSprintId)?.name || 'Sprint'
                  }
                </span>
                <motion.div
                  animate={{ rotate: showSprintDropdown ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showSprintDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute z-[90] mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-fuchsia-100 py-2 max-h-80 overflow-y-auto backdrop-blur-xl"
                    style={{ boxShadow: '0 20px 60px rgba(217, 70, 239, 0.2)' }}
                  >
                    <motion.button
                      onClick={() => {
                        setSelectedSprintId('all');
                        setShowSprintDropdown(false);
                      }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(250, 232, 255, 1)' }}
                      className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                        selectedSprintId === 'all' 
                          ? 'bg-gradient-to-r from-fuchsia-50 to-pink-50 text-fuchsia-700 font-bold border-l-4 border-fuchsia-500' 
                          : 'text-gray-700 font-medium hover:font-semibold'
                      }`}
                    >
                      <FiZap className="w-4 h-4" />
                      All Sprints
                    </motion.button>
                    {sprints.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <FiTarget className="w-8 h-8 text-gray-400" />
                          <p>No sprints available</p>
                        </div>
                      </div>
                    ) : sprints.map((sprint, index) => (
                      <motion.button
                        key={sprint.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSelectedSprintId(sprint.id);
                          setShowSprintDropdown(false);
                        }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(250, 232, 255, 1)' }}
                        className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                          selectedSprintId === sprint.id 
                            ? 'bg-gradient-to-r from-fuchsia-50 to-pink-50 text-fuchsia-700 font-bold border-l-4 border-fuchsia-500' 
                            : 'text-gray-700 font-medium hover:font-semibold'
                        }`}
                      >
                        <FiTarget className="w-4 h-4" />
                        <span>{sprint.name}</span>
                        {sprint.status === 'Active' && (
                          <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">Active</span>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assignee Filter Dropdown - Emerald Themed */}
            <div className="relative" ref={assigneeDropdownRef}>
              <motion.button
                onClick={() => {
                  setShowAssigneeDropdown(!showAssigneeDropdown);
                  setShowProjectDropdown(false);
                  setShowStatusDropdown(false);
                  setShowSprintDropdown(false);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  filters.assignee !== 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-emerald-400 shadow-emerald-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-200'
                }`}
              >
                <FiUsers className="w-4 h-4" />
                <span>
                  {filters.assignee === 'all'
                    ? 'Assignee'
                    : employees.find(e => e.id === filters.assignee)?.name || 'Assignee'
                  }
                </span>
                <motion.div
                  animate={{ rotate: showAssigneeDropdown ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showAssigneeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute z-[90] mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-emerald-100 py-2 max-h-80 overflow-y-auto backdrop-blur-xl"
                    style={{ boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)' }}
                  >
                    <motion.button
                      onClick={() => {
                        setFilters({ ...filters, assignee: 'all' });
                        setShowAssigneeDropdown(false);
                      }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(209, 250, 229, 1)' }}
                      className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                        filters.assignee === 'all' 
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-bold border-l-4 border-emerald-500' 
                          : 'text-gray-700 font-medium hover:font-semibold'
                      }`}
                    >
                      <FiUsers className="w-4 h-4" />
                      All Assignees
                    </motion.button>
                    {employees.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        <div className="flex flex-col items-center gap-2 py-2">
                          <FiUsers className="w-8 h-8 text-gray-400" />
                          <p>No team members available</p>
                        </div>
                      </div>
                    ) : employees.map((emp, index) => (
                      <motion.button
                        key={emp.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setFilters({ ...filters, assignee: emp.id });
                          setShowAssigneeDropdown(false);
                        }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(209, 250, 229, 1)' }}
                        className={`w-full px-4 py-3 text-left text-sm transition-all rounded-lg mx-1 flex items-center gap-2 ${
                          filters.assignee === emp.id 
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-bold border-l-4 border-emerald-500' 
                            : 'text-gray-700 font-medium hover:font-semibold'
                        }`}
                      >
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt={emp.name} className="w-6 h-6 rounded-full ring-2 ring-emerald-100" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span>{emp.name}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear Filters - Animated */}
            <AnimatePresence>
              {(selectedProjectId !== 'all' || filters.status !== 'all' || selectedSprintId !== 'all' || filters.assignee !== 'all' || search) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (onClearAllFilters && typeof onClearAllFilters === 'function') {
                      // Use the robust clear function from parent if available
                      onClearAllFilters();
                    } else {
                      // Fallback to local clear logic
                      try {
                        setFilters(prevFilters => ({
                          ...prevFilters,
                          status: 'all',
                          assignee: 'all',
                          team: 'all',
                          dueDate: 'all',
                          sprint: 'all',
                          search: ''
                        }));
                        setSelectedProjectId('all');
                        setSelectedSprintId('all');
                        setSearch('');
                      } catch (err) {
                        console.error('Error clearing filters:', err);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border-2 border-red-200 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all shadow-md hover:shadow-lg"
                >
                  <FiX className="w-4 h-4" />
                  <span>Clear All</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Manage Sprints - Prominent Button */}
            <motion.button
              onClick={() => onOpenSprintManagement()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-500/70 shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              title="Open Sprint Management"
            >
              <FiTarget className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Sprints</span>
              <span className="sm:hidden">Sprints</span>
            </motion.button>

            {/* Display Mode Toggle - Beautiful Glassmorphic */}
            <motion.div
              className="bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center bg-white/20 rounded-lg backdrop-blur-sm">
                {[
                  { id: 'board', icon: FiGrid, label: 'Board', color: 'blue' },
                  { id: 'list', icon: FiList, label: 'List', color: 'purple' }
                ].map((mode) => (
                  <motion.button
                    key={mode.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDisplayMode(mode.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      displayMode === mode.id
                        ? `bg-gradient-to-r from-${mode.color}-500 to-${mode.color}-600 text-white shadow-lg`
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{mode.label}</span>
                    {displayMode === mode.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg"
                        animate={{ x: [0, 100, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Search Bar - Enhanced */}
            <motion.div 
              className="relative flex-1 min-w-[200px] max-w-xs"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks... (Press / to focus)"
                className="w-full pl-10 pr-10 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-blue-300 shadow-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              {search && (
                <motion.button
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  whileHover={{ scale: 1.2 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => setSearch('')}
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Compact Progress & Stats Row */}
          <div className="flex items-center gap-3">
            {/* Compact Progress Bar */}
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, 
                      ${boardStats.completionRate < 30 ? '#ef4444, #f97316' : 
                        boardStats.completionRate < 70 ? '#3b82f6, #8b5cf6' : 
                        '#10b981, #059669'})`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${boardStats.completionRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
              <motion.span 
                className="text-xs font-bold min-w-[3rem] text-right"
                style={{
                  background: boardStats.completionRate < 30 ? 'linear-gradient(to right, #ef4444, #f97316)' :
                        boardStats.completionRate < 70 ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' :
                        'linear-gradient(to right, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
                key={boardStats.completionRate}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {boardStats.completionRate}%
              </motion.span>
            </div>

            {/* Compact Stats Badges */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-blue-50 border border-blue-200 rounded-full px-2 py-1 text-xs">
                <FiGrid className="w-2.5 h-2.5 text-blue-600" />
                <span className="text-blue-700 font-bold">{boardStats.total}</span>
              </div>
              {boardStats.dueToday > 0 && (
                <div className="flex items-center gap-0.5 bg-orange-50 border border-orange-200 rounded-full px-2 py-1 text-xs">
                  <FiClock className="w-2.5 h-2.5 text-orange-600" />
                  <span className="text-orange-700 font-bold">{boardStats.dueToday}</span>
                </div>
              )}
              {boardStats.overdue > 0 && (
                <div className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded-full px-2 py-1 text-xs">
                  <FiAlertCircle className="w-2.5 h-2.5 text-red-600" />
                  <span className="text-red-700 font-bold">{boardStats.overdue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conditional rendering based on display mode */}
      <AnimatePresence mode="wait">
        {displayMode === 'board' ? (
          <motion.div
            key="board-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced Kanban Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always,
                },
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="flex gap-8 h-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {statusColumns.map(column => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    tasks={filteredTasks}
                    onTaskUpdate={onTaskUpdate}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onTaskView={onTaskView}
                  />
                ))}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId ? (
                  <TaskCard
                    task={tasks.find(task => task.id === activeId)}
                    isDragging
                    columnColor={statusColumns.find(col => col.id === tasks.find(t => t.id === activeId)?.status)}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TaskList
              tasks={filteredTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              onTaskView={onTaskView}
              employees={employees}
              projects={projects}
              getStatusConfig={getStatusConfig}
            />
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Beautiful Board Footer with Stats */}
      <motion.div 
        className="bg-gradient-to-r from-white via-purple-50/20 to-blue-50/20 backdrop-blur-md rounded-2xl border border-gray-200/60 px-5 py-3 shadow-lg hover:shadow-xl transition-all"
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                <FiZap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="font-bold text-gray-800">{boardStats.total}</span>
                <span className="text-gray-500 ml-1">Tasks</span>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
                <FiCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="font-bold text-gray-800">{boardStats.completed}</span>
                <span className="text-gray-500 ml-1">Done</span>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                <FiTrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="font-bold text-gray-800">{boardStats.inProgress}</span>
                <span className="text-gray-500 ml-1">Active</span>
              </div>
            </motion.div>
          </div>
          
                  </div>
      </motion.div>

          </div>
  );
}
