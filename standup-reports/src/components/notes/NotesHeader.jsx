import React from 'react';
import { FiFileText, FiHeart, FiShare2, FiSearch, FiList, FiGrid, FiPlus } from 'react-icons/fi';

const NotesHeader = ({
  notes,
  favoriteNotes,
  sharedNotes,
  selectedNote,
  isDirty,
  stats,
  searchQuery,
  viewMode,
  sortBy,
  onSearchChange,
  onViewModeChange,
  onSortChange,
  onNewNote,
  className = ""
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left Side - Brand and Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Notes</h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{notes.length} total</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiHeart className="w-3 h-3 text-red-500" />
                  {favoriteNotes.length}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiShare2 className="w-3 h-3 text-purple-500" />
                  {sharedNotes.length}
                </span>
              </div>
            </div>
          </div>

          {/* Current Note Info */}
          {selectedNote && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isDirty ? 'bg-orange-500' : 'bg-green-500'
                }`}></div>
                <span className="text-xs font-medium text-gray-700 truncate max-w-32">
                  {selectedNote.title || 'Untitled'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {stats.words} words
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
            />
            <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
              title="List view"
            >
              <FiList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Grid view"
            >
              <FiGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated_at">Recently Updated</option>
            <option value="created_at">Recently Created</option>
            <option value="title">Title A-Z</option>
            <option value="is_pinned">Pinned First</option>
          </select>

          {/* New Note Button */}
          <button
            onClick={onNewNote}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <FiPlus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesHeader;