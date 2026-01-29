import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiInbox, FiAlertCircle, FiMessageSquare, FiCheckSquare,
    FiBriefcase, FiLayers, FiStar, FiSettings, FiArchive,
    FiChevronLeft, FiChevronRight, FiMenu, FiAtSign
} from 'react-icons/fi';

const NotificationSidebar = ({
    activeFilter,
    onFilterChange,
    counts = {},
    onOpenSettings,
    isOpen,
    onToggle,
    hideToggle = false,
    isAnimatedTheme = false
}) => {
    const menuItems = [
        { id: 'all', label: 'Inbox', icon: FiInbox, count: counts.unread },
        { id: 'unread', label: 'Unread Only', icon: FiAlertCircle, count: counts.unread },
        { type: 'separator' },
        { id: 'mention', label: 'Mentions', icon: FiAtSign, count: counts.mention },
        { id: 'task', label: 'Tasks', icon: FiCheckSquare, count: counts.task },
        { id: 'project', label: 'Projects', icon: FiBriefcase, count: counts.project },
        { id: 'system', label: 'System', icon: FiLayers, count: counts.system },
        { id: 'achievement', label: 'Achievements', icon: FiStar, count: counts.achievement },
    ];

    return (
        <div className={`w-full ${isAnimatedTheme ? 'bg-white/10 backdrop-blur-xl' : 'bg-white dark:bg-slate-900'} ${hideToggle ? '' : `rounded-2xl border ${isAnimatedTheme ? 'border-white/20' : 'border-gray-200 dark:border-slate-700'} shadow-sm h-[calc(100vh-8rem)] sticky top-24`} overflow-hidden flex flex-col transition-all duration-300`}>
            {/* Header */}
            {!hideToggle && (
                <div className={`p-4 border-b flex items-center ${isOpen ? 'justify-between' : 'justify-center'} ${isAnimatedTheme ? 'border-white/10 bg-white/5' : 'border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50'}`}>
                    {isOpen && (
                        <h2 className={`text-xs font-bold uppercase tracking-wider ${isAnimatedTheme ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                            Folders
                        </h2>
                    )}
                    <button
                        onClick={onToggle}
                        className={`p-1 rounded-lg transition-colors ${isAnimatedTheme ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
                        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {isOpen ? <FiChevronLeft className="w-4 h-4" /> : <FiMenu className="w-5 h-5" />}
                    </button>
                </div>
            )}

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">
                {menuItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className={`h-px my-2 mx-2 ${isAnimatedTheme ? 'bg-white/10' : 'bg-gray-100 dark:bg-slate-700'}`} />;
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
                                    ? isAnimatedTheme
                                        ? 'bg-white/20 text-white'
                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : isAnimatedTheme
                                        ? 'text-white/70 hover:bg-white/10 hover:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }
              `}
                            title={!isOpen ? item.label : undefined}
                        >
                            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center w-full'}`}>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive
                                    ? isAnimatedTheme ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                    : isAnimatedTheme ? 'text-white/50 group-hover:text-white/70' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
                                {isOpen && <span>{item.label}</span>}
                            </div>

                            {isOpen && item.count > 0 && (
                                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                                        ? isAnimatedTheme ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                        : isAnimatedTheme ? 'bg-white/10 text-white/70' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
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
            <div className={`p-2 border-t ${isAnimatedTheme ? 'border-white/10 bg-white/5' : 'border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50'}`}>
                <button
                    onClick={onOpenSettings}
                    className={`w-full flex items-center ${isOpen ? 'px-3 gap-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-medium transition-colors ${isAnimatedTheme ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'}`}
                    title="Notification Settings"
                >
                    <FiSettings className={`w-5 h-5 ${isAnimatedTheme ? 'text-white/50' : 'text-gray-400'}`} />
                    {isOpen && <span>Settings</span>}
                </button>
            </div>
        </div>
    );
};

export default NotificationSidebar;
