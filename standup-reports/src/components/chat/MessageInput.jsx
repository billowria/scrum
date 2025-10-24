import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiPaperclip, FiSmile, FiMic, FiX, FiBold, FiItalic, FiCode,
  FiAtSign, FiHash, FiPlus, FiImage, FiFile, FiType
} from 'react-icons/fi';

const MessageInput = ({
  placeholder = "Type a message...",
  value = "",
  onChange,
  onSend,
  onFileUpload,
  onImageUpload,
  disabled = false,
  showTypingIndicator = false,
  className = ""
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mentions, setMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Common emojis
  const emojis = ['😀', '😊', '😍', '🤔', '😂', '👍', '❤️', '🎉', '😎', '🤗', '😢', '😡', '👎', '🤝', '✨', '🔥'];

  // Mock users for mentions
  const mockUsers = [
    { id: 1, name: 'Alice Johnson', avatar_url: null },
    { id: 2, name: 'Bob Smith', avatar_url: null },
    { id: 3, name: 'Carol White', avatar_url: null },
    { id: 4, name: 'David Brown', avatar_url: null }
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Handle text change
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      // Filter users based on query
      const filtered = mockUsers.filter(user =>
        user.name.toLowerCase().includes(mentionMatch[1].toLowerCase())
      );
      setMentions(filtered);
    } else {
      setShowMentions(false);
      setMentions([]);
      setMentionQuery("");
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf('@');

    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(cursorPosition);

    const newValue = beforeMention + `@${user.name.replace(/\s+/g, '')} ` + afterCursor;
    onChange(newValue);
    setShowMentions(false);
    setMentions([]);
    setMentionQuery("");

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        beforeMention.length + user.name.replace(/\s+/g, '').length + 2,
        beforeMention.length + user.name.replace(/\s+/g, '').length + 2
      );
    }, 0);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    const newValue = value + emoji;
    onChange(newValue);
    setShowEmojiPicker(false);
    textareaRef.current.focus();
  };

  // Handle file selection
  const handleFileSelect = (files, type = 'file') => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      type: file.type,
      name: file.name,
      size: file.size,
      preview: type === 'image' ? URL.createObjectURL(file) : null
    }));

    setAttachments([...attachments, ...newAttachments]);

    // Upload files
    newAttachments.forEach(attachment => {
      if (type === 'image') {
        onImageUpload?.(attachment.file);
      } else {
        onFileUpload?.(attachment.file);
      }
    });
  };

  // Remove attachment
  const removeAttachment = (id) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  // Handle recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecordingTime(0);
  };

  // Format recording time
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle formatting
  const applyFormatting = (format) => {
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
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
    setShowFormatting(false);
  };

  // Handle send
  const handleSend = () => {
    if (value.trim() || attachments.length > 0) {
      onSend({ content: value.trim(), attachments });
      onChange('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowFormatting(false);
      setShowAttachmentMenu(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowFormatting(false);
      setShowAttachmentMenu(false);
      setShowMentions(false);
    }
  };

  return (
    <div className={`relative bg-white border-t border-gray-200 ${className}`}>
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-b border-gray-200"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {attachment.type?.startsWith('image/') ? (
                    <>
                      <img
                        src={attachment.preview}
                        alt={attachment.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <FiImage className="w-4 h-4 text-gray-500" />
                    </>
                  ) : (
                    <FiFile className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-700 truncate max-w-32">
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <FiX className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      <AnimatePresence>
        {showTypingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 text-xs text-gray-500 italic"
          >
            Someone is typing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-2 p-4">
        {/* Left Side Actions */}
        <div className="flex items-center gap-1">
          {/* Attachment Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowEmojiPicker(false);
                setShowFormatting(false);
              }}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Add attachment"
            >
              <FiPaperclip className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                    >
                      <FiFile className="w-4 h-4" />
                      Upload File
                    </button>
                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                    >
                      <FiImage className="w-4 h-4" />
                      Upload Image
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Formatting */}
          <button
            onClick={() => {
              setShowFormatting(!showFormatting);
              setShowEmojiPicker(false);
              setShowAttachmentMenu(false);
            }}
            disabled={disabled}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Formatting"
          >
            <FiType className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowFormatting(false);
                setShowAttachmentMenu(false);
              }}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Add emoji"
            >
              <FiSmile className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isRecording}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Mentions Dropdown */}
          <AnimatePresence>
            {showMentions && mentions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-1 max-h-48 overflow-y-auto"
              >
                {mentions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleMentionSelect(user)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formatting Toolbar */}
          <AnimatePresence>
            {showFormatting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyFormatting('bold')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Bold"
                  >
                    <FiBold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormatting('italic')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Italic"
                  >
                    <FiItalic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormatting('code')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Inline code"
                  >
                    <FiCode className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {/* Voice Recording */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              title="Stop recording"
            >
              <div className="flex items-center gap-1">
                <FiMic className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-medium">{formatRecordingTime(recordingTime)}</span>
              </div>
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Voice message"
            >
              <FiMic className="w-5 h-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!value.trim() && attachments.length === 0)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 px-3 ${
              value.trim() || attachments.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
            title={value.trim() || attachments.length > 0 ? 'Send message' : 'Type a message or add attachment'}
          >
            <FiSend className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </button>
        </div>
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