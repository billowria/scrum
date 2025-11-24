import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiCalendar, FiUsers, FiClock, FiCheckCircle, FiCircle, FiAlertCircle,
    FiActivity, FiShare2, FiMoreHorizontal
} from 'react-icons/fi';
import Avatar, { AvatarGroup } from '../../components/shared/Avatar';

const StatusChip = ({ status, onChange }) => {
    const getStatusConfig = (s) => {
        switch (s) {
            case 'active': return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCircle };
            case 'completed': return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: FiCheckCircle };
            case 'archived': return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: FiClock };
            default: return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: FiAlertCircle };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border} hover:shadow-sm transition-all cursor-pointer`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
        </div>
    );
};

const ProjectHero = ({
    project,
    onUpdate,
    teamMembers = [],
    onToggleActivity,
    editMode = false
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(project?.name || '');
    const titleInputRef = useRef(null);

    useEffect(() => {
        setTitle(project?.name || '');
    }, [project]);

    const handleTitleSave = () => {
        setIsEditingTitle(false);
        if (title !== project.name) {
            onUpdate({ name: title });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setTitle(project.name);
            setIsEditingTitle(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-8 pt-12 pb-6">
            {/* Icon & Title */}
            <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center text-4xl shrink-0">
                    📁
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    {isEditingTitle && editMode ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full text-5xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 focus:ring-0 p-0 tracking-tight"
                            autoFocus
                            placeholder="Project Name"
                        />
                    ) : (
                        <h1
                            onClick={() => editMode && setIsEditingTitle(true)}
                            className={`text-5xl font-bold text-gray-900 rounded-xl -ml-3 px-3 py-1 transition-colors truncate tracking-tight ${editMode ? 'cursor-text hover:bg-gray-50' : 'cursor-default'
                                }`}
                        >
                            {title}
                        </h1>
                    )}

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-gray-500">
                        <StatusChip status={project?.status} />

                        <div className="h-4 w-px bg-gray-200" />

                        <div className="flex items-center gap-2 hover:text-gray-900 transition-colors cursor-pointer group">
                            <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                                <FiCalendar className="w-3.5 h-3.5" />
                            </div>
                            <span>
                                {new Date(project?.start_date).toLocaleDateString()} - {new Date(project?.end_date).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="h-4 w-px bg-gray-200" />

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Team</span>
                            <AvatarGroup max={4} size="sm">
                                {teamMembers.map(member => (
                                    <Avatar key={member.id} user={member} />
                                ))}
                            </AvatarGroup>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg max-w-none text-gray-600 pl-[104px]">
                {project?.description ? (
                    <div dangerouslySetInnerHTML={{ __html: project.description }} />
                ) : (
                    <p className="text-gray-400 italic cursor-pointer hover:text-gray-600 transition-colors">
                        Add a description...
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProjectHero;
