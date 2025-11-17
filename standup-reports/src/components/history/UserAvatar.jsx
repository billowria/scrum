import React from 'react';
import { motion } from 'framer-motion';
import './design-tokens.css';

export const UserAvatar = ({
  name,
  avatarUrl,
  size = 'md',
  showStatus = false,
  status = 'online',
  className = '',
  onClick = null
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  const statusColors = {
    online: 'var(--success-500)',
    away: 'var(--warning-500)',
    offline: 'var(--gray-400)',
    busy: 'var(--danger-500)'
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const avatarContent = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name || 'User'}
      className="w-full h-full rounded-full object-cover"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextElementSibling.style.display = 'flex';
      }}
    />
  ) : null;

  const initials = (
    <div
      className={`
        w-full h-full rounded-full flex items-center justify-center
        font-semibold bg-gradient-to-br from-primary-500 to-primary-600
        text-white shadow-md
        ${avatarUrl ? 'hidden' : 'flex'}
      `}
    >
      {getInitials(name)}
    </div>
  );

  const Component = onClick ? motion.button : motion.div;
  const interactiveProps = onClick ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    onClick,
    'aria-label': `${name} profile`
  } : {};

  return (
    <Component
      className={`
        relative flex-shrink-0
        ${sizeClasses[size]}
        ${className}
      `}
      {...interactiveProps}
    >
      <div className={`w-full h-full rounded-full overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}>
        {avatarContent}
        {initials}
      </div>

      {showStatus && (
        <>
          {/* White border for status indicator */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full"
            style={{ width: `calc(${statusSizes[size]} + 2px)`, height: `calc(${statusSizes[size]} + 2px)` }}
          />
          <motion.div
            className={`
              absolute bottom-0 right-0 rounded-full
              ${statusSizes[size]}
            `}
            style={{ backgroundColor: statusColors[status] }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      {/* Subtle ring effect */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/20" />
    </Component>
  );
};

export default UserAvatar;