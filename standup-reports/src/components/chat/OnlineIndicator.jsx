import React from 'react';
import { motion } from 'framer-motion';

/**
 * OnlineIndicator Component
 * Shows a colored dot indicating online/offline status with animation
 */
export const OnlineIndicator = ({ isOnline, size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute inset-0 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {isOnline && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-green-500"
        />
      )}
    </div>
  );
};

export default OnlineIndicator;
