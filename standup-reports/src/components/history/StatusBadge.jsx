import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import './design-tokens.css';

const statusConfig = {
  submitted: {
    bg: 'var(--success-50)',
    text: 'var(--success-700)',
    border: 'var(--success-200)',
    icon: FiCheckCircle,
    label: 'Submitted',
    pulseColor: 'var(--success-500)'
  },
  pending: {
    bg: 'var(--warning-50)',
    text: 'var(--warning-700)',
    border: 'var(--warning-200)',
    icon: FiClock,
    label: 'Pending',
    pulseColor: 'var(--warning-500)'
  },
  missing: {
    bg: 'var(--danger-50)',
    text: 'var(--danger-700)',
    border: 'var(--danger-200)',
    icon: FiAlertCircle,
    label: 'Missing',
    pulseColor: 'var(--danger-500)'
  }
};

export const StatusBadge = ({
  status,
  variant = 'default',
  size = 'md',
  showPulse = false,
  className = ''
}) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const baseClasses = `
    inline-flex items-center gap-1.5 font-medium rounded-full
    border transition-all duration-200 relative
    ${sizeClasses[size]}
    ${className}
  `;

  const style = {
    backgroundColor: config.bg,
    color: config.text,
    borderColor: config.border
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1.5 text-gray-600">
        <Icon className={iconSizes[size]} style={{ color: 'var(--gray-500)' }} />
        <span className="text-sm">{config.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      style={style}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {showPulse && status === 'pending' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: config.pulseColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      <Icon className={`${iconSizes[size]} relative z-10`} />
      <span className="relative z-10">{config.label}</span>
    </motion.div>
  );
};

export default StatusBadge;