import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiFileText, FiX, FiBold, FiItalic, FiUnderline, FiType, FiAlignLeft,
  FiCode, FiSave, FiShare2, FiHeart, FiStar, FiTrash2
} from 'react-icons/fi';

const NotesEditor = ({
  selectedNote,
  openTabs,
  activeTabId,
  isDirty,
  wordWrap,
  cursorPosition,
  stats,
  onTabClose,
  onNewTab,
  onTabSwitch,
  onUpdateNote,
  onSaveNote,
  onShareNote,
  onToggleFavorite,
  onTogglePin,
  onDeleteNote,
  onKeyDown,
  onCursorMove,
  onToggleWordWrap
}) => {
  const editorRef = useRef(null);

  // Focus editor when note becomes active
  useEffect(() => {
    if (selectedNote && editorRef.current) {
      editorRef.current.focus();
    }
  }, [selectedNote]);

  if (openTabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
              <FiFileText className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Sync Notes</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create beautiful notes with our professional editor. Organize your thoughts, collaborate with your team, and never lose an idea again.
            </p>
            <button
              onClick={onNewTab}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <FiPlus className="w-5 h-5" />
              Create Your First Note
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Tab Bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          {/* Tabs */}
          <div className="flex-1 flex items-center overflow-x-auto">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={`group flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer transition-colors relative ${activeTabId === tab.id
                    ? 'bg-white text-gray-900 border-t-2 border-t-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => onTabSwitch(tab)}
                style={{
                  backgroundColor: activeTabId === tab.id ? (tab.background_color || '#ffffff') : undefined
                }}
              >
                {/* Tab Icon */}
                <FiFileText className="w-4 h-4 mr-2 flex-shrink-0" />

                {/* Tab Title */}
                <span className="text-sm font-medium truncate max-w-32 mr-2">
                  {tab.title || 'Untitled'}
                </span>

                {/* Dirty Indicator */}
                {isDirty && activeTabId === tab.id && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                )}

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 ${activeTabId === tab.id ? 'opacity-100' : ''
                    }`}
                >
                  <FiX className="w-3 h-3 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            ))}
          </div>

          {/* New Tab Button */}
          <button
            onClick={onNewTab}
            className="p-2 hover:bg-gray-200 transition-colors border-l border-gray-200"
            title="New Note"
          >
            <FiPlus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Enhanced Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Formatting Controls */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Bold">
                <FiBold className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Italic">
                <FiItalic className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Underline">
                <FiUnderline className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Strikethrough">
                <FiType className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Alignment Controls */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200">
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Align Left">
                <FiAlignLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Editor Controls */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200">
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Code Block">
                <FiCode className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-1 px-2">
              <button
                onClick={onSaveNote}
                disabled={!isDirty}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isDirty
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                title={isDirty ? 'Save note (Ctrl+S)' : 'No changes to save'}
              >
                <FiSave className="w-3.5 h-3.5" />
                {isDirty ? 'Save' : 'Saved'}
              </button>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Category Selector */}
            <select
              value={selectedNote?.category || 'general'}
              onChange={(e) => onUpdateNote('category', e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="ideas">Ideas</option>
              <option value="meeting">Meeting</option>
              <option value="project">Project</option>
              <option value="todo">To-Do</option>
            </select>

            {/* Font Size Selector */}
            <select
              value={selectedNote?.font_size || 16}
              onChange={(e) => onUpdateNote('font_size', parseInt(e.target.value))}
              className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
            >
              <option value="12">Small</option>
              <option value="16">Medium</option>
              <option value="20">Large</option>
              <option value="24">Extra Large</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={() => selectedNote && onShareNote(selectedNote)}
              className={`p-1.5 rounded transition-colors ${selectedNote?.is_shared
                  ? 'text-purple-500 bg-purple-50'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
              title={selectedNote?.is_shared ? 'Manage sharing' : 'Share note'}
            >
              <FiShare2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => selectedNote && onToggleFavorite(selectedNote.id)}
              className={`p-1.5 rounded transition-colors ${selectedNote?.is_favorite
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
              title={selectedNote?.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <FiHeart className={`w-4 h-4 ${selectedNote?.is_favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => selectedNote && onTogglePin(selectedNote.id)}
              className={`p-1.5 rounded transition-colors ${selectedNote?.is_pinned
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
              title={selectedNote?.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <FiStar className={`w-4 h-4 ${selectedNote?.is_pinned ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => selectedNote && onDeleteNote(selectedNote.id)}
              className="p-1.5 rounded text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete note"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Professional Editor Area */}
      <div className="flex-1 flex">
        {/* Line Numbers */}
        <div className="w-16 bg-gray-50 border-r border-gray-200 px-2 py-4 text-xs text-gray-400 font-mono select-none">
          {selectedNote?.content.split('\n').map((_, index) => (
            <div key={index} className="text-right leading-6">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Title Input */}
          <div className="border-b border-gray-200 px-4 py-3">
            <input
              type="text"
              value={selectedNote?.title || ''}
              onChange={(e) => onUpdateNote('title', e.target.value)}
              className="w-full text-xl font-semibold border-0 outline-none placeholder-gray-400"
              placeholder="Note title..."
              style={{
                fontSize: `${(selectedNote?.font_size || 16) + 4}px`
              }}
            />
          </div>

          {/* Content Editor */}
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={selectedNote?.content || ''}
              onChange={(e) => onUpdateNote('content', e.target.value)}
              onKeyDown={onKeyDown}
              onSelect={onCursorMove}
              className="w-full h-full p-4 border-0 outline-none resize-none font-mono leading-6 placeholder-gray-400"
              placeholder="Start typing your note..."
              style={{
                backgroundColor: selectedNote?.background_color || '#ffffff',
                fontSize: `${selectedNote?.font_size || 16}px`,
                lineHeight: '1.5'
              }}
              spellCheck={false}
            />

            {/* Word Wrap Toggle */}
            <div className="absolute bottom-2 right-2">
              <button
                onClick={onToggleWordWrap}
                className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                title="Toggle word wrap"
              >
                {wordWrap ? 'Wrap' : 'No Wrap'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            {/* Language */}
            <span className="flex items-center gap-1">
              <FiCode className="w-3 h-3" />
              Plain Text
            </span>

            {/* Encoding */}
            <span>UTF-8</span>

            {/* Line Endings */}
            <span>LF</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Word Count */}
            <span>Words: {stats.words}</span>

            {/* Character Count */}
            <span>Chars: {stats.characters}</span>

            {/* Line Count */}
            <span>Lines: {stats.lines}</span>

            {/* Cursor Position */}
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>

            {/* Share Status */}
            {selectedNote?.is_shared && (
              <span className="flex items-center gap-1 text-purple-600">
                <FiShare2 className="w-3 h-3" />
                Shared
              </span>
            )}

            {/* Save Status */}
            <span className={`flex items-center gap-1 ${isDirty ? 'text-orange-600' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              {isDirty ? 'Modified' : 'Saved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;