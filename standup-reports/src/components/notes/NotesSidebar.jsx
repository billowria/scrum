import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiFileText, FiShare2, FiChevronDown, FiPlus, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi';
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
  openTabs,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  return (
    <motion.div
      className={`${isMobile ? 'w-full' : isCollapsed ? 'w-16' : 'w-80'} ${!isMobile ? 'border-r border-gray-100 dark:border-slate-700' : ''} bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20 relative`}
      animate={{ width: isMobile ? '100%' : isCollapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Collapse Toggle Button - Desktop Only */}
      {!isMobile && onToggleCollapse && (
        <motion.button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 z-30 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}
        </motion.button>
      )}

      {/* Sidebar Header */}
      <div className={`${isCollapsed && !isMobile ? 'p-3 justify-center' : 'p-6 justify-between'} border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 flex items-center`}>
        {isCollapsed && !isMobile ? (
          <motion.button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiMenu className="w-5 h-5" />
          </motion.button>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">My Notes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Organize your thoughts</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs ring-2 ring-blue-100 dark:ring-blue-500/30">
              {allNotes.length}
            </div>
          </>
        )}
      </div>

      {/* Scrollable Content Area - Hidden when collapsed */}
      <AnimatePresence>
        {(!isCollapsed || isMobile) && (
          <motion.div
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-6">
              {/* Favorites Section */}
              <div>
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-2 rounded-lg transition-all duration-200 group"
                  onClick={onToggleFavorites}
                >
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                    <FiHeart className="text-red-500 transition-transform group-hover:scale-110" />
                    Favorites
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                      {favoriteNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: favoritesCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400 dark:text-gray-500"
                  >
                    <FiChevronDown />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!favoritesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden pl-2"
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
                        <div className="text-center py-6 text-gray-300 dark:text-gray-600 text-xs border border-dashed border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800/50">
                          <FiHeart className="w-6 h-6 mx-auto mb-2 opacity-30" />
                          No favorite notes yet
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* All Notes Section */}
              <div>
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-2 rounded-lg transition-all duration-200 group"
                  onClick={onToggleAllNotes}
                >
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                    <FiFileText className="text-blue-500 transition-transform group-hover:scale-110" />
                    All Notes
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                      {allNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: allNotesCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400 dark:text-gray-500"
                  >
                    <FiChevronDown />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!allNotesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden pl-2"
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
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                          <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No notes found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shared Notes Section */}
              <div>
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-2 rounded-lg transition-all duration-200 group"
                  onClick={onToggleShared}
                >
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                    <FiShare2 className="text-purple-500 transition-transform group-hover:scale-110" />
                    Shared
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                      {sharedNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: sharedCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400 dark:text-gray-500"
                  >
                    <FiChevronDown />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!sharedCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden pl-2"
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
                        <div className="text-center py-6 text-gray-300 dark:text-gray-600 text-xs border border-dashed border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800/50">
                          <FiShare2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                          No shared notes
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Info */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium uppercase tracking-widest">
          Sync Notes Premium
        </div>
      )}
    </motion.div>
  );
};

export default NotesSidebar;