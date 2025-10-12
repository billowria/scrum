import React from 'react';
import { HashtagIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

export const ChatHeader = ({ conversation, currentUser, isOnline = false, onRefresh, isRefreshing = false }) => {
  if (!conversation) return null;
  const navigate = useNavigate();

  const isTeamChat = conversation.type === 'team';
  const otherUser = conversation.type === 'direct' ? conversation.otherUser : null;
  const participantCount = conversation.participants?.length || 0;

  return (
    <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {isTeamChat ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <HashtagIcon className="w-5 h-5 text-white" />
          </div>
        ) : otherUser ? (
          <UserAvatar 
            user={otherUser} 
            size="md" 
            showOnline 
            isOnline={isOnline}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${otherUser.id}`);
            }}
          />
        ) : null}
        
        <div>
          <button
            type="button"
            onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
            className="text-left"
            title={otherUser ? `View ${otherUser.name}'s profile` : undefined}
          >
            <h2 className="text-lg font-semibold text-gray-900 hover:underline">
              {conversation.name}
            </h2>
          </button>
          <p className="text-sm text-gray-500">
            {isTeamChat ? `${participantCount} members` : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Refresh Button */}
        <motion.button
          onClick={onRefresh}
          disabled={isRefreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh messages"
        >
          <ArrowPathIcon 
            className={`w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors ${
              isRefreshing ? 'animate-spin text-indigo-600' : ''
            }`}
          />
        </motion.button>

        {/* Info Button */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Channel info">
          <InformationCircleIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
