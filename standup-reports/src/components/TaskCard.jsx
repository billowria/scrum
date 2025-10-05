import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isAfter, isToday, isTomorrow } from 'date-fns';
import { 
  FiCalendar, 
  FiUser, 
  FiUsers, 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiStar,
  FiEye,
  FiMessageSquare,
  FiTag,
  FiZap,
  FiTarget
} from 'react-icons/fi';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const getStatusConfig = (status) => {
  switch (status) {
    case 'To Do':
      return {
        color: 'text-gray-700',
        bgColor: 'bg-gray-100/80',
        borderColor: 'border-gray-200/60',
        icon: FiClock,
        gradient: 'from-gray-400 to-gray-600',
        glassColor: 'bg-gray-500/10',
        accentColor: 'bg-gray-500/20'
      };
    case 'In Progress':
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100/80',
        borderColor: 'border-blue-200/60',
        icon: FiTrendingUp,
        gradient: 'from-blue-400 to-indigo-600',
        glassColor: 'bg-blue-500/10',
        accentColor: 'bg-blue-500/20'
      };
    case 'Review':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100/80',
        borderColor: 'border-amber-200/60',
        icon: FiAlertCircle,
        gradient: 'from-amber-400 to-orange-600',
        glassColor: 'bg-amber-500/10',
        accentColor: 'bg-amber-500/20'
      };
    case 'Completed':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100/80',
        borderColor: 'border-green-200/60',
        icon: FiCheckCircle,
        gradient: 'from-green-400 to-emerald-600',
        glassColor: 'bg-green-500/10',
        accentColor: 'bg-green-500/20'
      };
    default:
      return {
        color: 'text-gray-700',
        bgColor: 'bg-gray-100/80',
        borderColor: 'border-gray-200/60',
        icon: FiClock,
        gradient: 'from-gray-400 to-gray-600',
        glassColor: 'bg-gray-500/10',
        accentColor: 'bg-gray-500/20'
      };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return 'text-red-600 bg-red-100/80';
    case 'Medium':
      return 'text-orange-600 bg-orange-100/80';
    case 'Low':
      return 'text-green-600 bg-green-100/80';
    default:
      return 'text-gray-600 bg-gray-100/80';
  }
};

const getDueDateStatus = (dueDate) => {
  if (!dueDate) return { status: 'none', color: 'text-gray-400', bg: 'bg-gray-100/50' };
  
  const due = parseISO(dueDate);
  const today = new Date();
  
  if (isAfter(today, due)) {
    return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100/80' };
  } else if (isToday(due)) {
    return { status: 'today', color: 'text-orange-600', bg: 'bg-orange-100/80' };
  } else if (isTomorrow(due)) {
    return { status: 'tomorrow', color: 'text-blue-600', bg: 'bg-blue-100/80' };
  } else {
    return { status: 'future', color: 'text-gray-600', bg: 'bg-gray-100/50' };
  }
};

export default function TaskCard({ 
  task, 
  onEdit, 
  onUpdate,
  onDelete,
  onView,
  onSprintAssign,
  isDragging = false,
  columnColor = null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  };

  const {
    title,
    description,
    status,
    assignee,
    team,
    due_date,
    created_at,
    priority = 'Medium'
  } = task;

  const statusConfig = getStatusConfig(status);
  const dueDateStatus = getDueDateStatus(due_date);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isDragging ? 'shadow-2xl scale-105 rotate-2' : 'hover:scale-[1.02] hover:-translate-y-1'
      }`}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open detail view if clicking on the card itself, not buttons
        if (e.target.closest('button')) return;
        onView?.(task);
      }}
    >
      {/* Glassmorphic Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm" />
      
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${statusConfig.gradient}`} />
      
      {/* Card Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-bold text-sm leading-tight line-clamp-2 mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(priority)} backdrop-blur-sm`}>
              {priority}
            </span>
            
            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border backdrop-blur-sm flex items-center gap-1`}>
              <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
              <span className={`text-xs font-bold ${statusConfig.color}`}>
                {status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Task Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {assignee.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-700 truncate max-w-[80px]">
                  {assignee.name}
                </span>
              </div>
            )}
            
            {/* Team */}
            {team && (
              <div className="flex items-center gap-1">
                <FiUsers className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-600 truncate max-w-[60px]">
                  {team.name}
                </span>
              </div>
            )}
            
            {/* Sprint */}
          {task.metadata?.sprint_id && (
            <div className="flex items-center gap-1">
              <FiTarget className="w-3 h-3 text-purple-500" />
              <span className="font-medium text-gray-600 truncate max-w-[60px]">
                Sprint
              </span>
            </div>
          )}
          </div>
          
          {/* Due Date */}
          {due_date && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${dueDateStatus.bg} backdrop-blur-sm`}>
              <FiCalendar className={`w-3 h-3 ${dueDateStatus.color}`} />
              <span className={`text-xs font-bold ${dueDateStatus.color}`}>
                {format(new Date(due_date), 'MMM d')}
              </span>
            </div>
          )}
        </div>
        
        {/* Quick Actions - Shown on Hover */}
        <motion.div 
          className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
        >
          <motion.button
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-100/80 backdrop-blur-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiEdit2 className="w-3 h-3" />
          </motion.button>
          <motion.button
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-100/80 backdrop-blur-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiTrash2 className="w-3 h-3" />
          </motion.button>
          {onSprintAssign && (
            <motion.button
              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-100/80 backdrop-blur-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSprintAssign?.(task);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiTarget className="w-3 h-3" />
            </motion.button>
          )}
        </motion.div>
        
        {/* Task Indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {/* Created Date */}
            <div className="flex items-center gap-1 text-gray-400">
              <FiClock className="w-3 h-3" />
              <span>{format(new Date(created_at), 'MMM d')}</span>
            </div>
            
            {/* Comments Indicator */}
            <div className="flex items-center gap-1 text-gray-400">
              <FiMessageSquare className="w-3 h-3" />
              <span>0</span>
            </div>
          </div>
          
          {/* Favorite/Star */}
          <motion.button
            className="p-1 text-gray-300 hover:text-yellow-500 rounded-full hover:bg-yellow-100/50 backdrop-blur-sm transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiStar className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}