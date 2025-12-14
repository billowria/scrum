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
    const [allProjectsExpanded, setAllProjectsExpanded] = useState(true); // Open by default

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
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors duration-150 ${isActive
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent hover:text-gray-900'
                    }`}
            >
                <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${isActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    {isFavorite ? (
                        <FiStar className={`w-3 h-3 ${isActive ? 'text-indigo-600' : 'text-amber-500'}`} fill="currentColor" />
                    ) : (
                        <FiFolder className={`w-3 h-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    )}
                </div>

                {!sidebarCollapsed && (
                    <span className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {project.name}
                    </span>
                )}

                {isActive && !sidebarCollapsed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
            </button>
        );
    };

    // Section header component
    const SectionHeader = ({ title, count, isExpanded, onToggle, icon: Icon, iconColor }) => (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors"
        >
            <div className="flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${iconColor}`} />
                <span>{title}</span>
                <span className="text-[10px] text-gray-400 font-normal">({count})</span>
            </div>
            <FiChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
        </button>
    );

    // Sidebar content component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
                <div
                    className={`flex items-center gap-2 ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
                    onClick={sidebarCollapsed ? onToggleSidebarCollapse : undefined}
                    title={sidebarCollapsed ? 'Expand sidebar' : undefined}
                >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${sidebarCollapsed ? 'hover:scale-110 transition-transform' : ''}`}>
                        <FiLayers className="w-3.5 h-3.5 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-sm font-semibold text-gray-800">Projects</span>
                    )}
                </div>

                {!sidebarCollapsed && (
                    <button
                        onClick={isMobile ? onClose : onToggleSidebarCollapse}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Collapse sidebar"
                    >
                        {isMobile ? <FiX className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4 rotate-180" />}
                    </button>
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
                <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
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
                            className={`fixed inset-y-0 left-0 z-50 w-56 shadow-xl ${className}`}
                            initial={{ x: '-100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
            className={`h-full border-r border-gray-100 ${className}`}
            initial={false}
            animate={{ width: sidebarCollapsed ? 52 : 200 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
            <SidebarContent />
        </motion.aside>
    );
};

export default ProjectsListSidebar;
