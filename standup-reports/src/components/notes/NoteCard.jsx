import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiMapPin, FiStar, FiShare2, FiTrash2, FiCheck } from 'react-icons/fi';

const NoteCard = ({
    note,
    isSelected,
    isMultiSelected,
    onToggleSelection,
    onClick,
    theme,
    themeMode,
    index,
    onShare,
    onDelete
}) => {
    const getSnippet = (html) => {
        if (!html) return 'No content yet...';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    };

    const accentColor = themeMode === 'space' ? 'purple' : 'indigo';

    const handleShare = (e) => {
        e.stopPropagation();
        if (onShare) onShare(note);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) onDelete(note.id);
    };

    const handleToggleSelect = (e) => {
        e.stopPropagation();
        if (onToggleSelection) onToggleSelection();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border group ${isSelected
                ? `${themeMode === 'light' ? 'bg-indigo-50 border-indigo-200' : `bg-${accentColor}-500/10 border-${accentColor}-500/30`} shadow-lg`
                : (isMultiSelected
                    ? `${themeMode === 'light' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white/10 border-indigo-500/50'}`
                    : `${themeMode === 'light' ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`)
                }`}
        >
            {/* Multi-select indicator */}
            <div
                className={`absolute top-3 right-3 z-20 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isMultiSelected
                    ? `bg-indigo-500 border-indigo-500`
                    : `opacity-0 group-hover:opacity-100 ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`
                    }`}
                onClick={handleToggleSelect}
            >
                {isMultiSelected && <FiCheck className="w-3 h-3 text-white" />}
            </div>
            {/* Selection Glow */}
            {isSelected && (
                <motion.div
                    layoutId="selected-note-glow"
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${themeMode === 'space' ? 'from-purple-500/20 to-fuchsia-500/20' : 'from-indigo-500/20 to-blue-500/20'} pointer-events-none`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}

            {/* Header */}
            <div className="flex items-start mb-2 relative z-10">
                <div className="flex gap-1 flex-shrink-0 items-center mr-2 pt-0.5">
                    {note.is_pinned && (
                        <FiMapPin className={`w-3.5 h-3.5 ${themeMode === 'space' ? 'text-purple-400' : 'text-indigo-400'}`} />
                    )}
                    {note.is_favorite && (
                        <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                    {note.is_shared && (
                        <FiShare2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                </div>
                <h3 className={`font-semibold text-sm truncate transition-colors flex-1 pr-8 ${isSelected
                    ? (themeMode === 'light' ? 'text-indigo-900' : 'text-white')
                    : (themeMode === 'light' ? 'text-slate-800 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-white')
                    }`}>
                    {note.title || 'Untitled Note'}
                </h3>
            </div>

            {/* Snippet */}
            <p className={`text-xs leading-relaxed line-clamp-2 mb-3 relative z-10 transition-colors ${isSelected
                ? (themeMode === 'light' ? 'text-indigo-700/70' : 'text-white/60')
                : (themeMode === 'light' ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-400')
                }`}>
                {getSnippet(note.content)}
            </p>

            {/* Footer with Actions */}
            <div className="flex items-center justify-between relative z-10">
                <span className={`text-[10px] font-medium uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {note.updated_at ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : 'Just now'}
                </span>

                {/* Action Buttons (visible on hover) */}
                <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                    <button
                        onClick={handleShare}
                        className={`p-1.5 rounded-lg transition-colors ${themeMode === 'light'
                            ? 'hover:bg-indigo-100 text-slate-400 hover:text-indigo-600'
                            : 'hover:bg-white/10 text-slate-500 hover:text-indigo-400'
                            }`}
                        title="Share Note"
                    >
                        <FiShare2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`p-1.5 rounded-lg transition-colors ${themeMode === 'light'
                            ? 'hover:bg-red-100 text-slate-400 hover:text-red-600'
                            : 'hover:bg-red-500/10 text-slate-500 hover:text-red-400'
                            }`}
                        title="Delete Note"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default NoteCard;
