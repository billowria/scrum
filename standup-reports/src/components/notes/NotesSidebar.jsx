import React from 'react';
import { FiFolder, FiHeart, FiShare2, FiHash, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const NotesSidebar = ({ selectedFolder, setSelectedFolder, isOpen, setIsOpen, theme, themeMode }) => {
    const folders = [
        { id: 'all', label: 'All Notes', icon: FiFolder },
        { id: 'favorites', label: 'Favorites', icon: FiHeart },
        { id: 'shared', label: 'Shared', icon: FiShare2 },
    ];

    const accentColor = themeMode === 'space' ? 'purple' : 'indigo';

    return (
        <motion.div
            animate={{ width: isOpen ? 240 : 72 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`${theme.card} border-r ${theme.border} flex flex-col transition-colors duration-300 relative z-20`}
        >
            {/* Header */}
            <div className={`h-16 flex items-center ${isOpen ? 'px-5' : 'justify-center'} border-b ${theme.border}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-${accentColor}-500 to-${accentColor}-600 flex items-center justify-center text-white shadow-lg`}>
                    <FiFolder className="w-4 h-4" />
                </div>
                {isOpen && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-3 font-bold text-lg tracking-tight"
                    >
                        Notes
                    </motion.span>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {folders.map(folder => {
                    const isActive = selectedFolder === folder.id;
                    const Icon = folder.icon;

                    return (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`w-full flex items-center ${isOpen ? 'px-3' : 'justify-center'} py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? `bg-${accentColor}-500/10 text-${accentColor}-${themeMode === 'light' ? '600' : '400'}`
                                    : `hover:${theme.card} ${themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`
                                }`}
                            title={!isOpen ? folder.label : ''}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-folder-pill"
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-${accentColor}-500`}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`} />

                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="ml-3 text-sm font-medium whitespace-nowrap"
                                >
                                    {folder.label}
                                </motion.span>
                            )}
                        </button>
                    );
                })}

                {/* Tags Section */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 px-3"
                    >
                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tags
                        </h3>
                        <div className="space-y-1.5">
                            {['work', 'ideas', 'personal'].map(tag => (
                                <div key={tag} className={`flex items-center text-sm gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-500 hover:bg-white/5'}`}>
                                    <FiHash className="w-3 h-3" />
                                    <span className="capitalize">{tag}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Collapse Toggle */}
            <div className={`p-3 border-t ${theme.border}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    {isOpen ? <FiChevronLeft className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    );
};

export default NotesSidebar;
