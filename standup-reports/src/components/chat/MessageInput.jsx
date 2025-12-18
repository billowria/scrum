import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageInputArea from './MessageInputArea';
import MessageToolbar from './MessageToolbar';
import AttachmentPreview from './AttachmentPreview';
import VoiceRecorder from './VoiceRecorder';
import { FiMic } from 'react-icons/fi';

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
  conversation = null
}) => {
  const [attachments, setAttachments] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [localMentions, setLocalMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

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

  return (
    <div className={`bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300 ${className}`}>
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

      {/* Main Input Area */}
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

      {/* Quick Voice Recorder Button (Mobile) */}
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