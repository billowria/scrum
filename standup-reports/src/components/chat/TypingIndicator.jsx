import React from 'react';
import { motion } from 'framer-motion';

/**
 * TypingIndicator Component
 * Animated dots showing someone is typing
 */
export const TypingIndicator = ({ userName, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
        ))}
      </div>
      {userName && (
        <span className="text-sm text-gray-500 italic">
          {userName} is typing...
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;
