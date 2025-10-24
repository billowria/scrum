import React from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiFileText, FiShare2, FiStar, FiTrash2, FiTag } from 'react-icons/fi';

const NoteCard = ({
  note,
  isSelected,
  isOpenInTab,
  onSelectNote,
  onShareNote,
  onToggleFavorite,
  onDeleteNote
}) => {
  const getTextStats = (text) => {
    if (!text) return { characters: 0, words: 0, lines: 1 };
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    return { characters, words, lines };
  };

  const noteStats = getTextStats(note.content);

  const getCategoryColor = (category) => {
    const colorMap = {
      work: 'bg-blue-100 text-blue-700',
      personal: 'bg-green-100 text-green-700',
      ideas: 'bg-purple-100 text-purple-700',
      meeting: 'bg-yellow-100 text-yellow-700',
      project: 'bg-red-100 text-red-700',
      todo: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colorMap[category] || colorMap.general;
  };

  return (
    <div
      className={`border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
        isSelected
          ? 'border-blue-400 shadow-sm bg-blue-50/50'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
      }`}
      style={{
        height: '72px',
        marginBottom: '4px',
        backgroundColor: note.background_color || '#ffffff'
      }}
      onClick={() => onSelectNote(note)}
    >
      {/* Status indicator - thin vertical line */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
        isOpenInTab
          ? 'bg-green-500'
          : note.is_favorite
            ? 'bg-amber-500'
            : note.is_shared
              ? 'bg-purple-500'
              : 'bg-gray-300'
      }`} />

      <div className="flex items-center h-full px-3 py-2">
        {/* Left side - Icon and title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Pinned indicator */}
          {note.is_pinned && (
            <FiTarget className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          )}

          {/* Status dot */}
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isOpenInTab
              ? 'bg-green-500'
              : note.is_favorite
                ? 'bg-amber-500'
                : note.is_shared
                  ? 'bg-purple-500'
                  : 'bg-gray-300'
          }`} />

          {/* File icon */}
          <FiFileText className={`w-3.5 h-3.5 flex-shrink-0 ${
            isSelected ? 'text-blue-600' : 'text-gray-500'
          }`} />

          {/* Title and content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-sm font-medium truncate ${
                isSelected ? 'text-gray-900' : 'text-gray-700'
              }`} style={{ fontSize: `${note.font_size || 14}px` }}>
                {note.title || 'Untitled'}
              </h3>

              {/* Category badge */}
              {note.category && note.category !== 'general' && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getCategoryColor(note.category)}`}>
                  {note.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 truncate">
                {note.content || 'No content'}
              </p>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {note.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-600"
                    >
                      <FiTag className="w-2 h-2 mr-0.5" />
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[9px] text-gray-500">+{note.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Stats and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Shared indicator */}
          {note.is_shared && (
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <FiShare2 className="w-3 h-3" />
            </div>
          )}

          {/* Word count */}
          <span className="text-xs text-gray-500 hidden sm:block">
            {noteStats.words}w
          </span>

          {/* Time */}
          <span className="text-xs text-gray-500">
            {new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Share button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onShareNote(note);
              }}
              className={`p-1 rounded transition-colors ${
                note.is_shared
                  ? 'text-purple-500'
                  : 'text-gray-400 hover:text-purple-500'
              }`}
            >
              <FiShare2 className="w-3.5 h-3.5" />
            </motion.button>

            {/* Favorite button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`p-1 rounded transition-colors ${
                note.is_favorite
                  ? 'text-amber-500'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
            >
              <FiStar className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Delete button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              className="p-1 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;