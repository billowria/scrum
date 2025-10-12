import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

/**
 * MessageInput Component
 * Text input with emoji picker and send button
 */
export const MessageInput = ({ 
  onSend, 
  onTyping,
  disabled = false,
  placeholder = 'Type a message...'
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle typing indicator
  const handleTyping = () => {
    if (onTyping) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleKeyDown = (e) => {
    // Enter to send (unless Shift is held for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Ctrl/Cmd + Enter also sends
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Escape to clear input
    if (e.key === 'Escape') {
      setMessage('');
      if (onTyping) onTyping(false);
      return;
    }

    // Ctrl/Cmd + B for bold (future markdown support)
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
      return;
    }

    // Ctrl/Cmd + I for italic (future markdown support)
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
      return;
    }
  };

  const insertMarkdown = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const newText = message.substring(0, start) + before + selectedText + after + message.substring(end);
    
    setMessage(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSend) {
      onSend(trimmedMessage);
      setMessage('');
      
      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Focus back on textarea
      textareaRef.current?.focus();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji.native + message.substring(end);
    
    setMessage(newMessage);
    setShowEmojiPicker(false);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.native.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-end space-x-2">
        {/* Emoji Picker Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaceSmileIcon className="w-6 h-6" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl rounded-lg overflow-hidden">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="search"
              />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex-shrink-0"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Enhanced hint text with keyboard shortcuts */}
      <div className="text-[10px] text-gray-500 mt-2 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd>
            <span>send</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Shift+Enter</kbd>
            <span>new line</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Esc</kbd>
            <span>clear</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">⌘B</kbd>
            <span>bold</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">⌘I</kbd>
            <span>italic</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
