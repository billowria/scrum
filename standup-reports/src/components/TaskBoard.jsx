import React, { useState, useMemo } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  FiSearch
} from 'react-icons/fi';
import TaskCard from './TaskCard';

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

const SortableColumn = ({ column, tasks, onTaskUpdate, onTaskEdit, onTaskDelete }) => {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
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
    <motion.div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col backdrop-blur-sm rounded-2xl border ${column.borderColor} transition-all duration-300 ${
        isOver ? 'ring-2 ring-opacity-50 scale-105' : 'hover:scale-[1.02]'
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
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <SortableContext
          items={columnTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
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
                  columnColor={column}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Enhanced Empty State */}
        {columnTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <div className={`w-16 h-16 ${column.glassColor} rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm`}>
              <ColumnIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium mb-2">No tasks in {column.label}</p>
            <p className="text-xs text-gray-400 text-center">
              Drag tasks here to move them<br />
              or create new ones
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function TaskBoard({ 
  tasks, 
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  search = '',
  setSearch = () => {}
}) {
  const [activeId, setActiveId] = useState(null);
  const [showStats, setShowStats] = useState(true);
  
  // Filter tasks by search
  const filteredTasks = tasks.filter(task => {
    const q = search.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.assignee?.name?.toLowerCase().includes(q)
    );
  });

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
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // Find the containers (columns) involved in the drag
    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId;
    
    if (activeContainer !== overContainer) {
      // Find the task that was dragged
      const task = tasks.find(t => t.id === active.id);
      if (!task) return;

      // Update task status
      onTaskUpdate({
        ...task,
        status: overContainer
      });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Board Statistics */}
      

      {/* Integrated Board Header with Search and Progress */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Section */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks by title, description, or assignee..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/90 backdrop-blur-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setSearch('')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Progress</span>
            </div>
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${boardStats.completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'progress-shimmer 3s ease-in-out infinite'
                  }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 min-w-[2.5rem] text-right">
                {boardStats.completionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

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
        <div className="flex gap-6 h-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {statusColumns.map(column => (
            <SortableColumn
              key={column.id}
              column={column}
              tasks={filteredTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
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

      {/* Enhanced Board Footer */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 shadow-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Total Tasks: {boardStats.total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiTarget className="w-4 h-4 text-green-500" />
              <span className="font-medium">Completion Rate: {boardStats.completionRate}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiAlertCircle className="w-4 h-4 text-red-500" />
              <span className="font-medium">Overdue: {boardStats.overdue}</span>
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors"
          >
            {showStats ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
} 