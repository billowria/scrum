import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * EmptyState Component
 * Shown when no conversation is selected
 */
export const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-4"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <ChatBubbleLeftRightIcon className="mx-auto h-20 w-20 text-indigo-300" />
        </motion.div>
        <h3 className="mt-6 text-xl font-semibold text-gray-900">
          Select a conversation
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Choose a conversation from the sidebar to start messaging with your team
        </p>
        <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-gray-400">
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Team Chats
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            Direct Messages
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmptyState;
