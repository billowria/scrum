import React from 'react';
import { motion } from 'framer-motion';

/**\n * TypingIndicator Component\n * Animated dots showing someone is typing\n */
export const TypingIndicator = ({ typingUsers = [], className = '' }) => {
  // Format the typing users text
  const formatTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name || 'Someone'} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name || 'User'} and ${typingUsers[1].name || 'User'} are typing`;
    } else {
      return `${typingUsers[0].name || 'User'} and ${typingUsers.length - 1} others are typing`;
    }
  };

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
      {typingUsers.length > 0 ? (
        <span className="text-sm text-gray-500 italic">
          {formatTypingText()}...
        </span>
      ) : (
        <span className="text-sm text-gray-500 italic">
          Someone is typing...
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;