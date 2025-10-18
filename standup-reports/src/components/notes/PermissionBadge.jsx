import React from 'react';
import { motion } from 'framer-motion';

// Icons
import { FiEdit, FiEye, FiLock } from 'react-icons/fi';

const PermissionBadge = ({ permission, size = 'sm', showIcon = true }) => {
  const getPermissionConfig = (perm) => {
    switch (perm) {
      case 'edit':
        return {
          label: 'Can Edit',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: FiEdit
        };
      case 'read':
      default:
        return {
          label: 'Read Only',
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: FiEye
        };
    }
  };

  const config = getPermissionConfig(permission);
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      whileHover={{ scale: 1.05 }}
    >
      {showIcon && (
        <Icon className={iconSizes[size]} />
      )}
      <span>{config.label}</span>
    </motion.span>
  );
};

export default PermissionBadge;
