import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiUser, FiFile, FiCheckSquare, FiInfo, FiGrid,
    FiClock, FiLink, FiDownload, FiChevronRight
} from 'react-icons/fi';
import Avatar from '../shared/Avatar';
import { useTheme } from '../../context/ThemeContext';

const ChatRightSidebar = ({
    conversation,
    isOpen,
    onClose,
    currentUser
}) => {
    const { themeMode } = useTheme();
    const isPremiumTheme = ['space', 'ocean', 'forest'].includes(themeMode);

    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', icon: FiInfo, label: 'Overview' },
        { id: 'files', icon: FiFile, label: 'Files' },
        { id: 'tasks', icon: FiCheckSquare, label: 'Tasks' }
    ];

    // Dummy data for visual purposes
    const mockFiles = [
        { id: 1, name: 'Project_Specs.pdf', type: 'pdf', size: '2.4 MB', date: '2h ago' },
        { id: 2, name: 'Design_System_v2.fig', type: 'figma', size: '15 MB', date: '1d ago' },
        { id: 3, name: 'screenshot_error.png', type: 'image', size: '1.2 MB', date: '5h ago' },
    ];

    const mockTasks = [
        { id: 1, title: 'Review PR #123', status: 'pending', priority: 'high' },
        { id: 2, title: 'Update documentation', status: 'in-progress', priority: 'medium' },
        { id: 3, title: 'Fix navigation bug', status: 'done', priority: 'high' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`h-full flex flex-col overflow-hidden relative z-20 ${isPremiumTheme
                        ? 'bg-transparent border-l border-white/10'
                        : 'bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-xl'
                        }`}
                    style={{ boxShadow: isPremiumTheme ? 'none' : '-4px 0 15px rgba(0,0,0,0.02)' }}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-5 ${isPremiumTheme ? 'border-b border-white/10' : 'border-b border-gray-100'}`}>
                        <h3 className={`font-semibold ${isPremiumTheme ? 'text-white' : 'text-gray-800'}`}>Directory</h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isPremiumTheme ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User/Group Info Header */}
                    <div className={`p-6 flex flex-col items-center ${isPremiumTheme ? 'border-b border-white/10' : 'border-b border-gray-50 bg-gradient-to-b from-transparent to-gray-50/50'}`}>
                        <div className="mb-4 relative">
                            <div className={`w-20 h-20 rounded-full p-1 shadow-sm ${isPremiumTheme ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white ring-1 ring-gray-100'}`}>
                                {conversation?.type === 'direct' ? (
                                    <Avatar user={conversation.otherUser} size="lg" className="w-full h-full" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {conversation?.name?.charAt(0) || '#'}
                                    </div>
                                )}
                            </div>
                            {conversation?.type === 'direct' && conversation.otherUser?.is_online && (
                                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                        </div>
                        <h2 className={`text-lg font-bold text-center ${isPremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                            {conversation?.type === 'direct' ? conversation.otherUser?.name : conversation?.name}
                        </h2>
                        <p className={`text-sm mt-1 ${isPremiumTheme ? 'text-white/60' : 'text-gray-500'}`}>
                            {conversation?.type === 'direct' ? conversation.otherUser?.email : `${conversation?.participants?.length || 0} members`}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className={`flex px-4 pt-4 ${isPremiumTheme ? 'border-b border-white/10' : 'border-b border-gray-100'}`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 pb-3 text-sm font-medium flex justify-center items-center gap-2 relative transition-colors ${activeTab === tab.id
                                    ? (isPremiumTheme ? 'text-white' : 'text-indigo-600')
                                    : (isPremiumTheme ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${isPremiumTheme ? 'bg-white' : 'bg-indigo-600'}`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-200">

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {conversation?.description || "No description provided for this conversation."}
                                    </p>
                                </div>

                                {conversation?.type === 'team' && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                            Members ({conversation?.participants?.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {conversation?.participants?.map(user => (
                                                <div key={user.id} className="flex items-center gap-3">
                                                    <Avatar user={user} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{user.role || 'Member'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shared Links</h4>
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                        <div className="flex items-start gap-2 text-sm text-indigo-600">
                                            <FiLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="truncate underline cursor-pointer">figma.com/design-file</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-indigo-600">
                                            <FiLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="truncate underline cursor-pointer">github.com/repo/pr-123</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Files Tab */}
                        {activeTab === 'files' && (
                            <div className="space-y-4">
                                {mockFiles.map(file => (
                                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                            <FiFile className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{file.size} • {file.date}</p>
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                            <FiDownload className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tasks Tab */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Related Tasks</h4>
                                </div>
                                {mockTasks.map(task => (
                                    <div key={task.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-4 h-4 rounded border ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                                            <div>
                                                <p className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button className="w-full py-2 mt-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-200 transition-all">
                                    + Link new task
                                </button>
                            </div>
                        )}

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatRightSidebar;
