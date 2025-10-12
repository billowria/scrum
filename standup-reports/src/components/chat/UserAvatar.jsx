import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/chatUtils';
import OnlineIndicator from './OnlineIndicator';

/**
 * UserAvatar Component
 * Displays user avatar with optional online status indicator
 */
export const UserAvatar = ({ 
  user, 
  size = 'md', 
  showOnline = false, 
  isOnline = false,
  className = '',
  onClick
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const indicatorPositions = {
    xs: 'bottom-0 right-0',
    sm: 'bottom-0 right-0',
    md: 'bottom-0.5 right-0.5',
    lg: 'bottom-1 right-1',
    xl: 'bottom-1 right-1'
  };

  const indicatorSizes = {
    xs: 'xs',
    sm: 'xs',
    md: 'sm',
    lg: 'sm',
    xl: 'md'
  };

  if (!user) return null;

  const avatarColor = getAvatarColor(user.id);
  const initials = getInitials(user.name);

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={`relative inline-block ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={onClick ? `View ${user.name}'s profile` : undefined}
      title={onClick ? `View ${user.name}'s profile` : undefined}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm`}
        >
          {initials}
        </div>
      )}
      
      {showOnline && (
        <div className={`absolute ${indicatorPositions[size]} transform translate-x-1/4 translate-y-1/4`}>
          <OnlineIndicator isOnline={isOnline} size={indicatorSizes[size]} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
