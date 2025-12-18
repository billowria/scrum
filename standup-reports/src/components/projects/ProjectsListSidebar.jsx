import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiFolder, FiChevronRight, FiX, FiLayers, FiChevronDown } from 'react-icons/fi';

const ProjectsListSidebar = ({
    projects = [],
    activeProjectId,
    onProjectSelect,
    isOpen,
    onClose,
    isMobile,
    sidebarCollapsed,
    onToggleSidebarCollapse,
    className = ''
}) => {
    const [favoritesExpanded, setFavoritesExpanded] = useState(false); // Closed by default
    const [allProjectsExpanded, setAllProjectsExpanded] = useState(false); // Changed to closed by default for compactness

    // Filter favorite projects for quick access section
    const favoriteProjectsList = projects.filter(project => project.is_favorite === true);


    const renderProjectItem = (project, isFavorite = false) => {
        const isActive = activeProjectId === project.id;

        return (
            <button
                key={project.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect(project);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-xl transition-all duration-200 border ${isActive
                    ? 'bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800/60 border-transparent hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-100/80 dark:bg-indigo-900/60 shadow-inner' : 'bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50'}`}>
                    {isFavorite ? (
                        <FiStar className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500'}`} fill={isFavorite ? 'currentColor' : 'none'} />
                    ) : (
                        <FiFolder className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`} />
                    )}
                </div>

                {!sidebarCollapsed && (
                    <span className={`text-xs font-semibold truncate flex-1 tracking-tight ${isActive ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {project.name}
                    </span>
                )}

                {isActive && !sidebarCollapsed && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    />
                )}
            </button>
        );
    };

    // Section header component
    const SectionHeader = ({ title, count, isExpanded, onToggle, icon: Icon, iconColor }) => (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all duration-200 group"
        >
            <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform ${iconColor}`}>
                    <Icon className="w-3 h-3" />
                </div>
                <span>{title}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-600 font-medium">({count})</span>
            </div>
            <FiChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
        </button>
    );

    // Sidebar content component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl">
            {/* Header */}
            <div className="px-3 py-4 border-b border-gray-200/30 dark:border-slate-700/30 flex items-center justify-between">
                <div
                    className={`flex items-center gap-2.5 ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
                    onClick={sidebarCollapsed ? onToggleSidebarCollapse : undefined}
                    title={sidebarCollapsed ? 'Expand sidebar' : undefined}
                >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] ${sidebarCollapsed ? 'hover:scale-110 transition-transform' : ''}`}>
                        <FiLayers className="w-4 h-4 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Projects</span>
                            <span className="text-[10px] text-gray-500 dark:text-slate-500 font-medium">Workspace</span>
                        </div>
                    )}
                </div>

                {!sidebarCollapsed && (
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isMobile ? onClose : onToggleSidebarCollapse}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                        title="Collapse sidebar"
                    >
                        {isMobile ? <FiX className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4 rotate-180" />}
                    </motion.button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">

                {/* Favorites Section */}
                {favoriteProjectsList.length > 0 && !sidebarCollapsed && (
                    <div>
                        <SectionHeader
                            title="Favorites"
                            count={favoriteProjectsList.length}
                            isExpanded={favoritesExpanded}
                            onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
                            icon={FiStar}
                            iconColor="text-amber-500"
                        />
                        <AnimatePresence>
                            {favoritesExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-0.5 mt-1">
                                        {favoriteProjectsList.map(project => renderProjectItem(project, true))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* All Projects Section */}
                {!sidebarCollapsed && (
                    <div>
                        <SectionHeader
                            title="All Projects"
                            count={projects.length}
                            isExpanded={allProjectsExpanded}
                            onToggle={() => setAllProjectsExpanded(!allProjectsExpanded)}
                            icon={FiFolder}
                            iconColor="text-gray-400"
                        />
                        <AnimatePresence>
                            {allProjectsExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-0.5 mt-1">
                                        {projects.map(project => renderProjectItem(project, project.is_favorite))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Collapsed state - just show icons */}
                {sidebarCollapsed && (
                    <div className="space-y-1">
                        {projects.slice(0, 8).map(project => renderProjectItem(project, project.is_favorite))}
                        {projects.length > 8 && (
                            <div className="text-center text-[10px] text-gray-400 py-1">
                                +{projects.length - 8}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!sidebarCollapsed && (
                <div className="px-3 py-3 border-t border-gray-200/30 dark:border-slate-700/30 text-[9px] font-bold text-gray-400 dark:text-slate-600 text-center uppercase tracking-widest">
                    {projects.length} project{projects.length !== 1 ? 's' : ''} active
                </div>
            )}
        </div>
    );

    // Mobile drawer
    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                        />
                        {/* Drawer */}
                        <motion.aside
                            className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl border-r border-white/20 dark:border-white/10 ${className}`}
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }

    // Desktop sidebar
    return (
        <motion.aside
            className={`h-full border-r border-gray-200/50 dark:border-slate-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none ${className}`}
            initial={false}
            animate={{ width: sidebarCollapsed ? 64 : 240 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        >
            <SidebarContent />
        </motion.aside>
    );
};

export default ProjectsListSidebar;
