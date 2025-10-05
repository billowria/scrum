import React from 'react';
import { motion } from 'framer-motion';

/**
 * Avatar Component - Display user avatar with fallback to initials
 */
const Avatar = ({
  user,
  size = 'md',
  className = '',
  showTooltip = false,
  onClick,
  status,
}) => {
  const { name, avatar_url, email } = user || {};

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  };

  // Status indicator sizes
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };

  // Status colors
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  };

  // Generate consistent color based on name
  const getColorFromName = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-amber-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-rose-500',
      'bg-teal-500',
      'bg-orange-500',
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const Component = onClick ? motion.button : motion.div;
  const interactionProps = onClick
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        onClick,
        className: `cursor-pointer ${className}`,
      }
    : { className };

  return (
    <div className={`relative inline-block ${sizeClasses[size]}`}>
      <Component
        {...interactionProps}
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden
          flex items-center justify-center
          font-semibold text-white
          ring-2 ring-white
          shadow-md
          transition-all duration-200
          ${className}
        `}
        title={showTooltip ? name || email : undefined}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={name || 'User'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`
            w-full h-full flex items-center justify-center
            ${getColorFromName(name)}
            ${avatar_url ? 'hidden' : ''}
          `}
        >
          {getInitials(name)}
        </div>
      </Component>

      {/* Status indicator */}
      {status && (
        <motion.div
          className={`
            absolute bottom-0 right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full
            border-2 border-white
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        />
      )}
    </div>
  );
};

// Avatar Group - Display multiple avatars
export const AvatarGroup = ({ users = [], max = 3, size = 'md', className = '' }) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <div
            key={user.id || index}
            className="relative"
            style={{ zIndex: displayUsers.length - index }}
          >
            <Avatar user={user} size={size} />
          </div>
        ))}
        {remaining > 0 && (
          <motion.div
            className={`
              ${sizeClasses[size]}
              rounded-full
              bg-gray-200 text-gray-600
              flex items-center justify-center
              text-xs font-semibold
              ring-2 ring-white
              shadow-md
            `}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            +{remaining}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Avatar;
