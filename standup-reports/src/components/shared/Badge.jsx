import React from 'react';
import { motion } from 'framer-motion';
import { taskPriorities, taskTypes, taskStatuses } from '../../config/designSystem';

/**
 * Badge Component - Reusable badge for task metadata
 * Supports priorities, types, statuses, and custom variants
 */
const Badge = ({
  variant = 'default',
  type = 'priority', // 'priority', 'type', 'status', 'custom'
  value,
  size = 'md',
  className = '',
  icon,
  animate = true,
  onClick,
}) => {
  // Get configuration based on type and value
  const getConfig = () => {
    switch (type) {
      case 'priority':
        return taskPriorities[value] || taskPriorities.Medium;
      case 'type':
        return taskTypes[value] || taskTypes.Task;
      case 'status':
        return taskStatuses[value] || taskStatuses['To Do'];
      case 'custom':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: icon,
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
        };
    }
  };

  const config = getConfig();

  // Size variants
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const Component = animate ? motion.span : 'span';
  const animationProps = animate
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        whileHover: onClick ? { scale: 1.05 } : {},
        whileTap: onClick ? { scale: 0.95 } : {},
        transition: { type: 'spring', stiffness: 500, damping: 30 },
      }
    : {};

  return (
    <Component
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${config.bg} ${config.text} border ${config.border}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
      {...animationProps}
    >
      {(config.icon || icon) && (
        <span className={iconSizes[size]} role="img" aria-label={value}>
          {config.icon || icon}
        </span>
      )}
      <span>{value}</span>
    </Component>
  );
};

export default Badge;
