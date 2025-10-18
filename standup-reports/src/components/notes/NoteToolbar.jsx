import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Icons
import { FiPlus, FiSearch, FiSidebar, FiMaximize2, FiMinimize2, FiSettings, FiDownload, FiUpload, FiPrinter, FiShare, FiBookmark, FiHeart, FiEdit3, FiSave, FiRefreshCw, FiCode, FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiAlignCenter, FiAlignRight } from 'react-icons/fi';

const NoteToolbar = ({ 
  onNewNote, 
  onSearch, 
  onToggleSidebar, 
  onToggleFullscreen, 
  isFullscreen, 
  activeNote, 
  noteCount,
  onSave,
  onExport,
  onPrint,
  onShare
}) => {
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleSave = () => {
    if (onSave && activeNote) {
      onSave();
    }
  };

  const handleExport = () => {
    if (onExport && activeNote) {
      onExport(activeNote);
    }
  };

  const handlePrint = () => {
    if (onPrint && activeNote) {
      onPrint(activeNote);
    }
  };

  const handleShare = () => {
    if (onShare && activeNote) {
      onShare(activeNote);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-gray-700 shadow-2xl">
      <div className="px-4 py-3">
        {/* Main Toolbar */}
        <div className="flex items-center justify-between">
          {/* Left Section - File Operations */}
          <div className="flex items-center gap-2">
            {/* New Note */}
            <motion.button
              onClick={onNewNote}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="New Note (Ctrl+N)"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
            </motion.button>

            {/* Save */}
            <motion.button
              onClick={handleSave}
              disabled={!activeNote}
              className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl ${
                activeNote
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={activeNote ? { scale: 1.05 } : {}}
              whileTap={activeNote ? { scale: 0.95 } : {}}
              title="Save (Ctrl+S)"
            >
              <FiSave className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </motion.button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-600 mx-2" />

            {/* Search */}
            <motion.button
              onClick={onSearch}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Search (Ctrl+F)"
            >
              <FiSearch className="w-4 h-4" />
            </motion.button>

            {/* Format Options */}
            <div className="relative">
              <motion.button
                onClick={() => setShowFormatOptions(!showFormatOptions)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Format Options"
              >
                <FiEdit3 className="w-4 h-4" />
              </motion.button>

              {/* Format Dropdown */}
              {showFormatOptions && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Bold"
                      >
                        <FiBold className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Italic"
                      >
                        <FiItalic className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Underline"
                      >
                        <FiUnderline className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Align Left"
                      >
                        <FiAlignLeft className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Align Center"
                      >
                        <FiAlignCenter className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Align Right"
                      >
                        <FiAlignRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Section - Note Info */}
          <div className="flex items-center gap-3">
            {activeNote ? (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Current Note</div>
                  <div className="text-sm font-medium text-white truncate max-w-xs">
                    {activeNote.title === 'Untitled Note' ? 'New Note' : activeNote.title}
                  </div>
                </div>
                
                {/* Note Status Indicators */}
                <div className="flex items-center gap-2">
                  {activeNote.is_pinned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1.5 bg-indigo-600 rounded-full"
                      title="Pinned"
                    >
                      <FiBookmark className="w-3 h-3" />
                    </motion.div>
                  )}
                  
                  {activeNote.is_favorite && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1.5 bg-red-600 rounded-full"
                      title="Favorite"
                    >
                      <FiHeart className="w-3 h-3" />
                    </motion.div>
                  )}
                  
                  {activeNote.is_shared && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1.5 bg-blue-600 rounded-full"
                      title="Shared"
                    >
                      <FiShare className="w-3 h-3" />
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-400">No note selected</div>
                <div className="text-xs text-gray-500">{noteCount} {noteCount === 1 ? 'note' : 'notes'} total</div>
              </div>
            )}
          </div>

          {/* Right Section - View & Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={handleShare}
                disabled={!activeNote}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeNote
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={activeNote ? { scale: 1.1 } : {}}
                whileTap={activeNote ? { scale: 0.9 } : {}}
                title="Share Note"
              >
                <FiShare className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={handleExport}
                disabled={!activeNote}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeNote
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={activeNote ? { scale: 1.1 } : {}}
                whileTap={activeNote ? { scale: 0.9 } : {}}
                title="Export Note"
              >
                <FiDownload className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={handlePrint}
                disabled={!activeNote}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeNote
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={activeNote ? { scale: 1.1 } : {}}
                whileTap={activeNote ? { scale: 0.9 } : {}}
                title="Print Note"
              >
                <FiPrinter className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-600 mx-2" />

            {/* View Controls */}
            <motion.button
              onClick={onToggleSidebar}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Toggle Sidebar"
            >
              <FiSidebar className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={onToggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </motion.button>

            {/* More Options */}
            <div className="relative">
              <motion.button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="More Options"
              >
                <FiSettings className="w-4 h-4" />
              </motion.button>

              {/* More Options Dropdown */}
              {showMoreOptions && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                      <FiRefreshCw className="w-4 h-4" />
                      Refresh Notes
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                      <FiUpload className="w-4 h-4" />
                      Import Notes
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                      <FiCode className="w-4 h-4" />
                      View Source
                    </button>
                    <hr className="my-2 border-gray-700" />
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                      <FiSettings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Toolbar - Quick Stats */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>Words: {activeNote?.content?.split(/\s+/).filter(word => word.length > 0).length || 0}</span>
              <span>Characters: {activeNote?.content?.length || 0}</span>
              {activeNote?.category && (
                <span className="px-2 py-1 bg-indigo-600 text-white rounded-full">
                  {activeNote.category}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {activeNote?.updated_at && (
                <span>Last saved: {new Date(activeNote.updated_at).toLocaleTimeString()}</span>
              )}
              <span>{noteCount} {noteCount === 1 ? 'note' : 'notes'} open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteToolbar;
