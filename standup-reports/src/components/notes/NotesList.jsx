import React from 'react';
import { FiSearch, FiPlus, FiChevronLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import NoteCard from './NoteCard';

const NotesList = ({ notes, selectedNote, setSelectedNote, searchQuery, setSearchQuery, onNewNote, theme, themeMode, onToggleCollapse, onShareNote, onDeleteNote }) => {
    return (
        <div className={`flex flex-col h-full w-80 border-r ${theme.border} ${theme.card} transition-colors duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b ${theme.border} sticky top-0 z-20`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleCollapse}
                            className={`p-1.5 rounded-lg transition-colors ${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/5 text-slate-400'}`}
                            title="Collapse List"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <h2 className="text-lg font-bold tracking-tight">Library</h2>
                    </div>
                    <button
                        onClick={onNewNote}
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${themeMode === 'space' ? 'from-purple-500 to-fuchsia-600' : 'from-indigo-500 to-blue-600'} text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all`}
                        title="Create New Note"
                    >
                        <FiPlus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${themeMode === 'light' ? 'text-slate-400 group-focus-within:text-indigo-500' : 'text-slate-500 group-focus-within:text-indigo-400'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${themeMode === 'light'
                                ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/30 focus:border-indigo-500/50'
                                : 'bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:ring-indigo-500/30 focus:border-indigo-500/50'
                            }`}
                    />
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {notes.map((note, index) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            isSelected={selectedNote?.id === note.id}
                            onClick={() => setSelectedNote(note)}
                            theme={theme}
                            themeMode={themeMode}
                            index={index}
                            onShare={onShareNote}
                            onDelete={onDeleteNote}
                        />
                    ))}
                </AnimatePresence>

                {notes.length === 0 && (
                    <div className="text-center py-16 opacity-50">
                        <p className="text-sm">No notes found</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className={`p-3 border-t ${theme.border} text-center`}>
                <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {notes.length} note{notes.length !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};

export default NotesList;
