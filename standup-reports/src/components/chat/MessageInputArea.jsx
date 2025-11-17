import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageInputArea = ({
  value = '',
  onChange,
  onKeyDown,
  placeholder = 'Type a message...',
  disabled = false,
  isRecording = false,
  className = '',
  mentions = [],
  showMentions = false,
  onMentionSelect,
  showFormatting = false,
  onFormattingApply,
  children
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (typeof scrollHeight === 'number' && scrollHeight > 0) {
        textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
      }
    }
  }, [value]);

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e) => {
    onKeyDown(e);
  };

  return (
    <div className={`flex-1 relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isRecording}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   focus:bg-white transition-all duration-200 disabled:opacity-50
                   placeholder-gray-400 text-gray-900"
        rows={1}
        style={{ minHeight: '44px', maxHeight: '120px' }}
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        spellCheck="false"
      />

      {/* Mentions Dropdown */}
      <AnimatePresence>
        {showMentions && mentions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl
                       border border-gray-200 p-2 max-h-48 overflow-y-auto z-50"
          >
            {mentions.map((user) => (
              <button
                key={user.id}
                onClick={() => onMentionSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50
                         rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600
                              rounded-full flex items-center justify-center text-white
                              text-sm font-semibold shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500 block">{user.email || 'Team member'}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formatting Toolbar */}
      {children}
    </div>
  );
};

export default MessageInputArea;