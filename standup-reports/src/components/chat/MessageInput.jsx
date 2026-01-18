import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageInputArea from './MessageInputArea';
import MessageToolbar from './MessageToolbar';
import AttachmentPreview from './AttachmentPreview';
import VoiceRecorder from './VoiceRecorder';
import { FiMic } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const MessageInput = ({
  placeholder = "Type a message...",
  value = "",
  onChange,
  onSend,
  onFileUpload,
  onImageUpload,
  onVoiceMessage,
  disabled = false,
  showTypingIndicator = false,
  className = "",
  mentions = [],
  onMentionSelect,
  currentUser = null,
  conversation = null,
  mobileLayout = false
}) => {
  const { themeMode } = useTheme();
  const isPremiumTheme = ['space', 'ocean', 'forest'].includes(themeMode);

  const [attachments, setAttachments] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [localMentions, setLocalMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Local state for mobile emoji picker

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Mobile specific: Toggle attachment menu from Plus button
  const [showMobileAttachments, setShowMobileAttachments] = useState(false);

  // Handle mention functionality
  const handleTextChange = useCallback((newValue) => {
    onChange(newValue);

    // Check for mentions if mentions prop is provided
    if (mentions && mentions.length > 0) {
      const cursorPosition = newValue.length;
      const textBeforeCursor = newValue.substring(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const filtered = mentions.filter(user =>
          user.name.toLowerCase().includes(mentionMatch[1].toLowerCase())
        );
        setLocalMentions(filtered);
        setShowMentions(true);
      } else {
        setShowMentions(false);
        setLocalMentions([]);
      }
    }
  }, [onChange, mentions]);

  // Handle mention selection
  const handleMentionSelect = useCallback((user) => {
    if (!user) return;

    const cursorPosition = value.length;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf('@');

    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(cursorPosition);

    const newValue = beforeMention + `@${user.name.replace(/\s+/g, '')} ` + afterCursor;
    onChange(newValue);
    setShowMentions(false);
    setLocalMentions([]);

    onMentionSelect?.(user);
  }, [value, onChange, onMentionSelect]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    const newValue = value + emoji;
    onChange(newValue);
  }, [value, onChange]);

  // Handle formatting
  const handleFormattingApply = useCallback((format) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }, [value, onChange]);

  // Handle file uploads
  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((files, type = 'file') => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      type: file.type,
      name: file.name,
      size: file.size,
      preview: type === 'image' ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);

    // Call upload callbacks
    newAttachments.forEach(attachment => {
      if (type === 'image') {
        onImageUpload?.(attachment.file);
      } else {
        onFileUpload?.(attachment.file);
      }
    });
  }, [onFileUpload, onImageUpload]);

  // Remove attachment
  const removeAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  // Handle voice message
  const handleVoiceMessageComplete = useCallback((voiceData) => {
    onVoiceMessage?.(voiceData);
    setShowVoiceRecorder(false);
  }, [onVoiceMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setShowVoiceRecorder(false);
    }
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if (value.trim() || attachments.length > 0) {
      onSend({
        content: value.trim(),
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          type: att.type,
          size: att.size,
          file: att.file,
          preview: att.preview
        }))
      });
      onChange('');
      setAttachments([]);
      setShowMentions(false);
    }
  }, [value, attachments, onSend, onChange]);

  const canSend = (value.trim() || attachments.length > 0) && !disabled;

  // Mobile Emojis
  const emojis = ['😀', '😊', '😍', '🤔', '😂', '👍', '❤️', '🎉', '😎', '🤗', '😢', '😡', '👎', '🤝', '✨', '🔥'];

  return (
    <div className={`border-t transition-colors duration-300 ${className} ${isPremiumTheme
      ? 'bg-transparent border-white/10'
      : `bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 ${mobileLayout ? 'bg-gray-50' : ''}`
      }`}>
      {/* Typing Indicator */}
      <AnimatePresence>
        {showTypingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400 italic"
          >
            Someone is typing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AttachmentPreview
        attachments={attachments}
        onRemove={removeAttachment}
      />

      {/* Voice Recorder */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30"
          >
            <VoiceRecorder
              onRecordingComplete={handleVoiceMessageComplete}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {mobileLayout ? (
        // Mobile Layout
        <div className={`p-3 ${isPremiumTheme ? 'bg-transparent' : 'bg-white'}`}>
          {/* Emoji Picker for Mobile */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-gray-100 mb-2 overflow-hidden"
              >
                <div className="grid grid-cols-8 gap-2 p-2 bg-gray-50 rounded-lg">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleEmojiSelect(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl hover:bg-gray-200 rounded p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            {/* Plus Button */}
            <div className="relative">
              <button
                onClick={() => setShowMobileAttachments(!showMobileAttachments)}
                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              {/* Mobile Attachment Popup */}
              <AnimatePresence>
                {showMobileAttachments && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 min-w-[150px]"
                  >
                    <button onClick={handleFileUpload} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                      <span>Document</span>
                    </button>
                    <button onClick={handleImageUpload} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                      <span>Gallery</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="flex-1 bg-gray-100 rounded-2xl flex items-center pr-2 relative">
              <MessageInputArea
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                isRecording={false}
                mentions={localMentions}
                showMentions={showMentions}
                onMentionSelect={handleMentionSelect}
                showFormatting={false}
                onFormattingApply={handleFormattingApply}
                className="!bg-transparent !border-0 flex-1"
              />
              {/* Smiley Button inside input */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-smile"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
              </button>
            </div>

            {/* Send Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={canSend ? handleSend : undefined}
              disabled={disabled || !canSend}
              className={`p-3 rounded-full flex items-center justify-center transition-all shadow-md
                     ${canSend
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-300 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </motion.button>
          </div>
        </div>
      ) : (
        // Desktop Layout (Existing)
        <div className="p-4">
          <div className="flex items-end gap-3">
            {/* Left Side - Message Input */}
            <MessageInputArea
              value={value}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              isRecording={false}
              mentions={localMentions}
              showMentions={showMentions}
              onMentionSelect={handleMentionSelect}
              showFormatting={false}
              onFormattingApply={handleFormattingApply}
            />

            {/* Right Side - Toolbar */}
            <MessageToolbar
              onFileUpload={handleFileUpload}
              onImageUpload={handleImageUpload}
              onEmojiSelect={handleEmojiSelect}
              onFormattingApply={handleFormattingApply}
              onVoiceRecord={() => setShowVoiceRecorder(!showVoiceRecorder)}
              isRecording={false}
              recordingTime={0}
              disabled={disabled}
              canSend={canSend}
              onSend={handleSend}
            />
          </div>
        </div>
      )}

      {/* Quick Voice Recorder Button (Mobile) - Keep existing if not mobileLayout ? or Maybe redundant now */}
      {!mobileLayout && (
        <div className="md:hidden px-4 pb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            disabled={disabled}
            className="w-full p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20
                   border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 font-medium
                   hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 transition-colors
                   flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <FiMic className="w-5 h-5" />
            {showVoiceRecorder ? 'Close Voice Recorder' : 'Voice Message'}
          </motion.button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'file')}
        className="hidden"
        accept="*"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default MessageInput;