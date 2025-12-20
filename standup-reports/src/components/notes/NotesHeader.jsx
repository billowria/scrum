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
  isMobile = false,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300 ${isMobile ? 'px-4 py-4' : 'px-6 py-2.5'} ${className}`}>
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
        {/* Left Side - Brand and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-sm'} font-bold text-gray-900 dark:text-white`}>Notes</h1>
              {!isMobile && (
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
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
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={onNewNote}
                className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            )}

            {!isMobile && selectedNote && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-32">
                    {selectedNote.title || 'Untitled'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {stats.words} words
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side / Search Area */}
        <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
          {/* Search */}
          <div className={`relative ${isMobile ? 'flex-1' : ''}`}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes..."
              className={`pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white ${isMobile ? 'w-full' : 'w-64'}`}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>

          {!isMobile && (
            <>
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  title="List view"
                >
                  <FiList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  title="Grid view"
                >
                  <FiGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-950/50 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-8"
                >
                  <option value="updated_at">Recently Updated</option>
                  <option value="created_at">Recently Created</option>
                  <option value="title">Title A-Z</option>
                  <option value="is_pinned">Pinned First</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <FiList className="w-3 h-3" />
                </div>
              </div>

              {/* New Note Button */}
              <button
                onClick={onNewNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 text-sm font-semibold shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                New Note
              </button>
            </>
          )}
        </div>
      </div>
    </div>

  );
};

export default NotesHeader;