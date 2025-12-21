import React from 'react';
import { FiMenu, FiActivity, FiEdit2, FiCheck, FiSidebar, FiArrowLeft, FiLayers } from 'react-icons/fi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Avatar from '../../components/shared/Avatar';

const ProjectHeader = ({
    projectName,
    onToggleSidebar,
    onToggleActivity,
    onToggleProjectsList,
    sidebarOpen,
    isMobile,
    currentUser,
    editMode,
    onBack,
    isInline
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const toggleEditMode = () => {
        const newParams = new URLSearchParams(searchParams);
        if (editMode) {
            newParams.delete('editMode');
        } else {
            newParams.set('editMode', 'true');
        }
        setSearchParams(newParams);
    };

    const navigate = useNavigate();

    const goBackToProjectList = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/projects');
        }
    };

    return (
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 transition-all duration-200 shadow-sm">
            {/* Left: Sidebar Toggle and Back Link */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Projects List Toggle - only on mobile and when not inline */}
                {isMobile && !isInline && onToggleProjectsList && (
                    <button
                        onClick={onToggleProjectsList}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Projects List"
                    >
                        <FiLayers className="w-5 h-5" />
                    </button>
                )}

                {/* Project Sections Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <FiSidebar className="w-5 h-5" />
                </button>

                <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                <button
                    onClick={goBackToProjectList}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all flex items-center gap-2"
                    title="Back to Projects"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">Projects</span>
                </button>
            </div>

            {/* Center: Project Name */}
            <div className="flex items-center justify-center flex-1 min-w-0 px-2">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate max-w-full text-center tracking-tight">
                    {projectName}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                    onClick={toggleEditMode}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${editMode
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                >
                    {editMode ? (
                        <>
                            <FiCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Done</span>
                        </>
                    ) : (
                        <>
                            <FiEdit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </>
                    )}
                </button>

                <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                <button
                    onClick={onToggleActivity}
                    className="relative p-2.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all group"
                    title="Activity Feed"
                >
                    <FiActivity className="w-5 h-5" />
                    {/* Pulse indicator */}
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                </button>

                {currentUser && (
                    <div className="ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-gray-200 dark:border-slate-700">
                        <Avatar user={currentUser} size="xs" />
                    </div>
                )}
            </div>
        </header>
    );
};

export default ProjectHeader;
