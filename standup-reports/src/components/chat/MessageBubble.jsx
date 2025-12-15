import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FiCheck, FiCheckCircle, FiClock, FiMoreVertical, FiEdit2, FiTrash2,
  FiCornerUpLeft, FiSmile, FiPaperclip, FiEye, FiDownload, FiCopy
} from 'react-icons/fi';
import { useTaskModal } from '../../contexts/TaskModalContext';

const MessageBubble = ({
  message,
  currentUser,
  isOwnMessage,
  showTimestamp = false,
  isTyping = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onMarkAsRead,
  className = ""
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);

  const { openTask } = useTaskModal();

  // Available reactions
  const reactions = ['❤️', '👍', '😊', '🎉', '😂', '🤔', '👎', '😢'];

  // Message status
  const getMessageStatus = () => {
    if (!isOwnMessage) return null;

    if (message.deleted_at) {
      return <FiClock className="w-3.5 h-3.5 text-gray-400" title="Deleted" />;
    }

    if (message.read_at) {
      return <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" title="Read" />;
    }

    if (message.updated_at && message.updated_at !== message.created_at) {
      return <FiEdit2 className="w-3.5 h-3.5 text-yellow-500" title="Edited" />;
    }

    return <FiCheck className="w-3.5 h-3.5 text-gray-400" title="Sent" />;
  };

  // Check if this is a shared task message
  const isSharedTask = message.content && message.content.includes('TASK SHARED WITH YOU');

  // Parse shared task message
  const parseSharedTaskMessage = (content) => {
    try {
      const lines = content.split('\n');
      const titleLine = lines.find(l => l.startsWith('**') && !l.includes('TASK SHARED') && !l.includes('ID:') && !l.includes('Details'));
      const idLine = lines.find(l => l.includes('**ID:**'));

      const title = titleLine ? titleLine.replace(/\*\*/g, '').trim() : 'Shared Task';
      const shortId = idLine ? idLine.split('#')[1].trim() : '';

      // Extract details using regex for robustness
      const statusMatch = content.match(/Status: \*\*([^*]+)\*\*/);
      const priorityMatch = content.match(/Priority: \*\*([^*]+)\*\*/);
      const projectMatch = content.match(/Project: \*\*([^*]+)\*\*/);
      const dueDateMatch = content.match(/Due Date: \*\*([^*]+)\*\*/);
      const linkMatch = content.match(/Click to open: ([^\s]+)/);

      return {
        title,
        shortId,
        status: statusMatch ? statusMatch[1] : 'Unknown',
        priority: priorityMatch ? priorityMatch[1] : 'Normal',
        project: projectMatch ? projectMatch[1] : null,
        dueDate: dueDateMatch ? dueDateMatch[1] : null,
        url: linkMatch ? linkMatch[1] : null
      };
    } catch (e) {
      console.error("Error parsing shared task:", e);
      return null;
    }
  };

  const renderSharedTaskCard = () => {
    const taskData = parseSharedTaskMessage(message.content);
    if (!taskData) return message.content;

    return (
      <div className={`rounded-xl overflow-hidden border-2 ${isOwnMessage ? 'bg-indigo-600 border-indigo-400' : 'bg-white border-indigo-100'} text-left shadow-sm`}>
        {/* Header */}
        <div className={`px-4 py-3 ${isOwnMessage ? 'bg-indigo-700/50' : 'bg-indigo-50/80'} border-b ${isOwnMessage ? 'border-indigo-500' : 'border-indigo-100'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`font-bold text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'} leading-tight mb-1`}>
                {taskData.title}
              </h3>
              <div className={`text-xs font-mono opacity-80 ${isOwnMessage ? 'text-indigo-200' : 'text-indigo-600'}`}>
                ID: #{taskData.shortId}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-white/10' : 'bg-white shadow-sm border border-indigo-100'}`}>
              <FiCheckCircle className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-indigo-500'}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`${isOwnMessage ? 'bg-white/10' : 'bg-gray-50'} rounded px-2 py-1.5`}>
              <span className={`text-xs opacity-70 block mb-0.5 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>Status</span>
              <span className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>{taskData.status}</span>
            </div>
            <div className={`${isOwnMessage ? 'bg-white/10' : 'bg-gray-50'} rounded px-2 py-1.5`}>
              <span className={`text-xs opacity-70 block mb-0.5 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>Priority</span>
              <span className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>{taskData.priority}</span>
            </div>
            {taskData.project && (
              <div className={`col-span-2 ${isOwnMessage ? 'bg-white/10' : 'bg-gray-50'} rounded px-2 py-1.5`}>
                <span className={`text-xs opacity-70 block mb-0.5 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>Project</span>
                <span className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>{taskData.project}</span>
              </div>
            )}
            {taskData.dueDate && (
              <div className={`col-span-2 ${isOwnMessage ? 'bg-white/10' : 'bg-gray-50'} rounded px-2 py-1.5`}>
                <span className={`text-xs opacity-70 block mb-0.5 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>Due Date</span>
                <span className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>{taskData.dueDate}</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              if (taskData.shortId) {
                const userRole = currentUser?.role || 'member';
                openTask(taskData.shortId, { currentUser, userRole });
              } else if (taskData.url) {
                // Fallback to URL if no ID
                window.location.href = taskData.url;
              }
            }}
            className={`w-full mt-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2
              ${isOwnMessage
                ? 'bg-white text-indigo-600 hover:bg-gray-100 shadow-sm'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
          >
            <span>View Task</span>
            <FiCornerUpLeft className="w-4 h-4 transform rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  // Message content display
  const getMessageContent = () => {
    if (message.deleted_at) {
      return (
        <span className="text-gray-500 italic">
          {isOwnMessage ? 'You deleted this message' : 'This message was deleted'}
        </span>
      );
    }

    if (isSharedTask) {
      return renderSharedTaskCard();
    }

    return message.content;
  };

  // Attachment handling
  const renderAttachment = (attachment) => {
    if (attachment.type?.startsWith('image/')) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowAttachmentPreview(true)}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <FiPaperclip className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700 truncate flex-1">{attachment.name}</span>
        <button
          onClick={() => window.open(attachment.url, '_blank')}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <FiDownload className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>
    );
  };

  // Reactions display
  const renderReactions = () => {
    if (!message.reactions || !Array.isArray(message.reactions) || message.reactions.length === 0) return null;

    try {
      const groupedReactions = message.reactions.reduce((acc, reaction) => {
        const emoji = reaction.emoji || reaction;
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {});

      return (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(groupedReactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => onReaction?.(message.id, emoji)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-gray-600">{count}</span>
            </button>
          ))}
        </div>
      );
    } catch (error) {
      console.warn('Error rendering reactions:', error);
      return null;
    }
  };

  if (isTyping) {
    return (
      <div className={`flex items-end gap-2 mb-4 ${className}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {message.user_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-none shadow-sm border border-gray-200">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-end gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''} ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full overflow-hidden flex-shrink-0">
          {message.user?.avatar_url && message.user.avatar_url.trim() !== '' ? (
            <img
              src={message.user.avatar_url}
              alt={message.user?.name || message.user_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
            {(message.user?.name || message.user_name)?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-md lg:max-w-xl ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {!isOwnMessage && message.conversation_type === 'team' && (
          <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">
            {message.user?.name || message.user_name}
          </span>
        )}

        {/* Message Bubble */}
        <div className={`relative group/message transition-all duration-200 ${isOwnMessage
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm shadow-md'
          : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-white/40 ring-1 ring-black/5'
          }`}>
          {/* Message Text */}
          <div className="px-4 py-2">
            <p className="text-sm whitespace-pre-wrap break-words">
              {getMessageContent()}
            </p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index}>
                    {renderAttachment(attachment)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                  } top-0 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 px-1 py-1`}
              >
                <button
                  onClick={() => onReply?.(message)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Reply"
                >
                  <FiCornerUpLeft className="w-3.5 h-3.5 text-gray-600" />
                </button>

                {!message.deleted_at && (
                  <button
                    onClick={() => navigator.clipboard.writeText(message.content)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy"
                  >
                    <FiCopy className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}

                {isOwnMessage && !message.deleted_at && (
                  <>
                    <button
                      onClick={() => onEdit?.(message)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDelete?.(message.id)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Add reaction"
                >
                  <FiSmile className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                  } top-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2`}
              >
                <div className="grid grid-cols-4 gap-1">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction}
                      onClick={() => {
                        onReaction?.(message.id, reaction);
                        setShowReactionPicker(false);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors text-lg"
                    >
                      {reaction}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Timestamp and Status */}
        {(showTimestamp || isOwnMessage) && (
          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwnMessage ? 'flex-row-reverse' : ''
            }`}>
            {message.created_at && (
              <span>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            )}
            {isOwnMessage && getMessageStatus()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(MessageBubble);