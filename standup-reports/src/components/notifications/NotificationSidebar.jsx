import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiInbox, FiAlertCircle, FiMessageSquare, FiCheckSquare,
    FiBriefcase, FiLayers, FiStar, FiSettings, FiArchive,
    FiChevronLeft, FiChevronRight, FiMenu
} from 'react-icons/fi';

const NotificationSidebar = ({
    activeFilter,
    onFilterChange,
    counts = {},
    onOpenSettings,
    isOpen,
    onToggle
}) => {
    const menuItems = [
        { id: 'all', label: 'Inbox', icon: FiInbox, count: counts.unread },
        { id: 'unread', label: 'Unread Only', icon: FiAlertCircle, count: counts.unread },
        { type: 'separator' },
        { id: 'mention', label: 'Mentions', icon: FiMessageSquare, count: counts.mention },
        { id: 'task', label: 'Tasks', icon: FiCheckSquare, count: counts.task },
        { id: 'project', label: 'Projects', icon: FiBriefcase, count: counts.project },
        { id: 'system', label: 'System', icon: FiLayers, count: counts.system },
        { id: 'achievement', label: 'Achievements', icon: FiStar, count: counts.achievement },
    ];

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)] sticky top-24 transition-all duration-300">
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 bg-gray-50/50 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
                {isOpen && (
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Folders
                    </h2>
                )}
                <button
                    onClick={onToggle}
                    className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                    title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isOpen ? <FiChevronLeft className="w-4 h-4" /> : <FiMenu className="w-5 h-5" />}
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">
                {menuItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className="h-px bg-gray-100 my-2 mx-2" />;
                    }

                    const isActive = activeFilter === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onFilterChange(item.id)}
                            className={`
                w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-1'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group
                ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }
              `}
                            title={!isOpen ? item.label : undefined}
                        >
                            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center w-full'}`}>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                {isOpen && <span>{item.label}</span>}
                            </div>

                            {isOpen && item.count > 0 && (
                                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }
                `}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onOpenSettings}
                    className={`w-full flex items-center ${isOpen ? 'px-3 gap-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
                    title="Notification Settings"
                >
                    <FiSettings className="w-5 h-5 text-gray-400" />
                    {isOpen && <span>Settings</span>}
                </button>
            </div>
        </div>
    );
};

export default NotificationSidebar;
