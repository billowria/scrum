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
  // Helper to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const plainTextContent = stripHtml(note.content);

  const getTextStats = (text) => {
    if (!text) return { characters: 0, words: 0, lines: 1 };
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    return { characters, words, lines };
  };

  const noteStats = getTextStats(plainTextContent);

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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <motion.div
      layout
      {...(!isMobile ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        whileHover: { y: -2 }
      } : {
        animate: { opacity: 1, y: 0 }
      })}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`border cursor-pointer transition-all duration-300 relative overflow-hidden group rounded-xl ${isSelected
        ? 'border-blue-500 shadow-md bg-white ring-1 ring-blue-500/20'
        : 'border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 bg-white'
        } ${isMobile ? 'active:bg-gray-50' : ''}`}
      style={{
        height: isMobile ? '90px' : '80px',
        marginBottom: '8px',
      }}
      onClick={() => onSelectNote(note)}
    >
      {/* Background Color Indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full transition-colors duration-300"
        style={{ backgroundColor: note.background_color !== '#ffffff' ? note.background_color : (isSelected ? '#3b82f6' : 'transparent') }}
      />

      <div className={`flex items-center h-full ${isMobile ? 'px-4 gap-3' : 'px-4 py-3 pl-5'}`}>
        {/* Left side - Icon and title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">

          {/* File icon with status dot */}
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
              <FiFileText className="w-5 h-5" />
            </div>

            {/* Status Dot Overlay */}
            {(isOpenInTab || note.is_favorite || note.is_shared) && (
              <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${isOpenInTab ? 'bg-green-500' :
                note.is_favorite ? 'bg-amber-500' :
                  'bg-purple-500'
                }`}>
                {note.is_favorite && <FiStar className="w-2 h-2 text-white fill-current" />}
              </div>
            )}
          </div>

          {/* Title and content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700'
                }`}>
                {note.title || 'Untitled'}
              </h3>

              {/* Category badge - Hide on mobile if too narrow, or use tiny icon */}
              {note.category && note.category !== 'general' && !isMobile && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase ${getCategoryColor(note.category)}`}>
                  {note.category}
                </span>
              )}

              {/* Pinned Icon */}
              {note.is_pinned && <FiTarget className="w-3 h-3 text-red-500" />}
            </div>

            <p className={`text-xs text-gray-400 truncate mt-0.5 leading-relaxed font-medium ${isMobile ? 'max-w-[180px]' : ''}`}>
              {plainTextContent || 'No content'}
            </p>
          </div>
        </div>

        {/* Right side - Stats and actions */}
        <div className="flex flex-col items-end gap-1.5 ml-2">
          {/* Time */}
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold whitespace-nowrap">
            {new Date(note.updated_at || note.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </span>

          {/* Action buttons */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${note.is_favorite
                ? 'text-amber-500 bg-amber-50'
                : 'text-gray-400 active:bg-amber-50 active:text-amber-500'
                }`}
            >
              <FiStar className={`w-4 h-4 ${note.is_favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              className="p-1.5 rounded-lg transition-colors text-gray-400 active:bg-red-50 active:text-red-500"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default NoteCard;