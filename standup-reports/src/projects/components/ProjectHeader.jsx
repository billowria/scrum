import React from 'react';
import { FiMenu, FiActivity, FiEdit2, FiCheck, FiSidebar, FiArrowLeft } from 'react-icons/fi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Avatar from '../../components/shared/Avatar';

const ProjectHeader = ({
    projectName,
    onToggleSidebar,
    onToggleActivity,
    sidebarOpen,
    isMobile,
    currentUser,
    editMode
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
        navigate('/projects');
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 flex items-center justify-between px-4 transition-all duration-200 shadow-sm">
            {/* Left: Sidebar Toggle and Back Link */}
            <div className="flex items-center gap-3 w-1/3">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
                    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <FiSidebar className="w-5 h-5" />
                </button>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <button
                    onClick={goBackToProjectList}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
                    title="Back to Projects"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm text-gray-500">Projects</span>
                </button>
            </div>

            {/* Center: Project Name */}
            <div className="flex items-center justify-center w-1/3">
                <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate max-w-[200px] md:max-w-md text-center tracking-tight">
                    {projectName}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2 w-1/3">
                <button
                    onClick={toggleEditMode}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${editMode
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {editMode ? (
                        <>
                            <FiCheck className="w-4 h-4" />
                            <span>Done</span>
                        </>
                    ) : (
                        <>
                            <FiEdit2 className="w-4 h-4" />
                            <span>Edit</span>
                        </>
                    )}
                </button>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <button
                    onClick={onToggleActivity}
                    className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group"
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
                    <div className="ml-2 pl-2 border-l border-gray-200">
                        <Avatar user={currentUser} size="xs" />
                    </div>
                )}
            </div>
        </header>
    );
};

export default ProjectHeader;
