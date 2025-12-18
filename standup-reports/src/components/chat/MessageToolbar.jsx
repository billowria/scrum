import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPaperclip, FiSmile, FiType, FiBold, FiItalic, FiCode,
  FiFile, FiImage, FiMic, FiSend
} from 'react-icons/fi';

const MessageToolbar = ({
  onFileUpload,
  onImageUpload,
  onEmojiSelect,
  onFormattingApply,
  onVoiceRecord,
  isRecording = false,
  recordingTime = 0,
  disabled = false,
  canSend = false,
  onSend,
  className = ''
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const emojis = ['😀', '😊', '😍', '🤔', '😂', '👍', '❤️', '🎉', '😎', '🤗', '😢', '😡', '👎', '🤝', '✨', '🔥'];

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Attachment Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowAttachmentMenu(!showAttachmentMenu);
            setShowEmojiPicker(false);
            setShowFormatting(false);
          }}
          disabled={disabled}
          className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800
                   rounded-xl transition-all duration-200 disabled:opacity-50"
          title="Add attachment"
        >
          <FiPaperclip className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl
                         border border-gray-200 dark:border-slate-800 p-2 z-50"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    onFileUpload();
                    setShowAttachmentMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800
                           rounded-lg transition-colors group"
                >
                  <FiFile className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Upload File</span>
                </button>
                <button
                  onClick={() => {
                    onImageUpload();
                    setShowAttachmentMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800
                           rounded-lg transition-colors group"
                >
                  <FiImage className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Upload Image</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formatting */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowFormatting(!showFormatting);
            setShowEmojiPicker(false);
            setShowAttachmentMenu(false);
          }}
          disabled={disabled}
          className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800
                   rounded-xl transition-all duration-200 disabled:opacity-50"
          title="Formatting"
        >
          <FiType className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {showFormatting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl
                         border border-gray-200 dark:border-slate-800 p-2 z-50"
            >
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onFormattingApply('bold');
                    setShowFormatting(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  title="Bold"
                >
                  <FiBold className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onFormattingApply('italic');
                    setShowFormatting(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  title="Italic"
                >
                  <FiItalic className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onFormattingApply('code');
                    setShowFormatting(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  title="Inline code"
                >
                  <FiCode className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emoji Picker */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowFormatting(false);
            setShowAttachmentMenu(false);
          }}
          disabled={disabled}
          className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800
                   rounded-xl transition-all duration-200 disabled:opacity-50"
          title="Add emoji"
        >
          <FiSmile className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl
                         border border-gray-200 dark:border-slate-800 p-3 z-50"
            >
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-lg"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Recording / Send Button */}
      {isRecording ? (
        <motion.button
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          onClick={onVoiceRecord}
          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl
                   transition-all duration-200 flex items-center gap-2"
          title="Stop recording"
        >
          <div className="flex items-center gap-1.5">
            <FiMic className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-medium">{formatRecordingTime(recordingTime)}</span>
          </div>
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: canSend ? 1.05 : 1 }}
          whileTap={{ scale: canSend ? 0.95 : 1 }}
          onClick={canSend ? onSend : undefined}
          disabled={disabled || !canSend}
          className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 px-3 ${canSend
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            } disabled:opacity-50`}
          title={canSend ? 'Send message' : 'Type a message first'}
        >
          <FiSend className="w-4 h-4" />
          <span className="text-sm font-medium">Send</span>
        </motion.button>
      )}
    </div>
  );
};

export default MessageToolbar;