import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiFileText, FiShare2, FiChevronDown } from 'react-icons/fi';
import NoteCard from './NoteCard';

const NotesSidebar = ({
  favoriteNotes,
  allNotes,
  sharedNotes,
  favoritesCollapsed,
  allNotesCollapsed,
  sharedCollapsed,
  onToggleFavorites,
  onToggleAllNotes,
  onToggleShared,
  onSelectNote,
  onShareNote,
  onToggleFavorite,
  onDeleteNote,
  selectedNote,
  openTabs
}) => {
  return (
    <div className="w-80 border-r border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 bg-white/80 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">My Notes</h2>
      </div>

      {/* Scrollable Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        <div className="p-4">
          {/* Favorites Section */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={onToggleFavorites}
            >
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <FiHeart className="text-red-500" />
                Favorites
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {favoriteNotes.length}
                </span>
              </h3>
              <motion.div
                animate={{ rotate: favoritesCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="text-gray-400" />
              </motion.div>
            </div>
            <AnimatePresence>
              {!favoritesCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 overflow-hidden"
                >
                  {favoriteNotes.length > 0 ? (
                    favoriteNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSelected={selectedNote?.id === note.id}
                        isOpenInTab={openTabs.find(tab => tab.id === note.id)}
                        onSelectNote={onSelectNote}
                        onShareNote={onShareNote}
                        onToggleFavorite={onToggleFavorite}
                        onDeleteNote={onDeleteNote}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <FiHeart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No favorite notes yet
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* All Notes Section */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={onToggleAllNotes}
            >
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <FiFileText />
                All Notes
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {allNotes.length}
                </span>
              </h3>
              <motion.div
                animate={{ rotate: allNotesCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="text-gray-400" />
              </motion.div>
            </div>
            <AnimatePresence>
              {!allNotesCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 overflow-hidden"
                >
                  {allNotes.length > 0 ? (
                    allNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSelected={selectedNote?.id === note.id}
                        isOpenInTab={openTabs.find(tab => tab.id === note.id)}
                        onSelectNote={onSelectNote}
                        onShareNote={onShareNote}
                        onToggleFavorite={onToggleFavorite}
                        onDeleteNote={onDeleteNote}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No notes found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shared Notes Section */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={onToggleShared}
            >
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <FiShare2 className="text-purple-500" />
                Shared with Me
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {sharedNotes.length}
                </span>
              </h3>
              <motion.div
                animate={{ rotate: sharedCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="text-gray-400" />
              </motion.div>
            </div>
            <AnimatePresence>
              {!sharedCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 overflow-hidden"
                >
                  {sharedNotes.length > 0 ? (
                    sharedNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSelected={selectedNote?.id === note.id}
                        isOpenInTab={openTabs.find(tab => tab.id === note.id)}
                        onSelectNote={onSelectNote}
                        onShareNote={onShareNote}
                        onToggleFavorite={onToggleFavorite}
                        onDeleteNote={onDeleteNote}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <FiShare2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No shared notes
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesSidebar;