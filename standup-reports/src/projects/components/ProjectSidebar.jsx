import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiChevronRight, FiPlus, FiFileText, FiSearch, FiFile,
    FiMoreVertical, FiEdit2, FiTrash2, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import { supabase } from '../../supabaseClient';

const SidebarItem = ({
    icon: Icon,
    label,
    active,
    onClick,
    onToggle,
    depth = 0,
    hasChildren = false,
    isExpanded = false,
    editMode = false,
    onRename,
    onDelete,
    onAddPage,
    type = 'content' // Default to 'content', can be 'section', 'topic', or 'content'
}) => {
    // Define color configurations for different types
    const getColorConfig = (itemType, isActive) => {
        if (!isActive) return {};

        switch (itemType) {
            case 'section':
                return {
                    bg: '', // No background for sections
                    text: 'text-rose-700',
                    indicator: 'bg-gradient-to-b from-rose-400 to-pink-500',
                    hoverBg: 'hover:bg-rose-50'
                };
            case 'topic':
                return {
                    bg: '', // No background for topics
                    text: 'text-green-700',
                    indicator: 'bg-gradient-to-b from-lime-400 to-green-500',
                    hoverBg: 'hover:bg-green-50'
                };
            case 'content':
                return {
                    bg: 'bg-blue-100/80',
                    text: 'text-blue-700',
                    indicator: 'bg-gradient-to-b from-cyan-400 to-blue-500',
                    hoverBg: 'hover:bg-blue-50'
                };
            default:
                return {
                    bg: '',
                    text: 'text-gray-700',
                    indicator: 'bg-gradient-to-b from-gray-400 to-gray-600',
                    hoverBg: 'hover:bg-gray-100'
                };
        }
    };
    const colorConfig = getColorConfig(type, active);

    return (
        <motion.div
            layout
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative ${
                active
                    ? `${colorConfig.bg ? colorConfig.bg + ' ' : ''}${colorConfig.text} font-medium shadow-sm ${colorConfig.hoverBg || 'hover:bg-gray-100'}`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={hasChildren ? onToggle : onClick}
            whileHover={{ x: 2 }}
        >
            {/* Expansion Toggle */}
            {hasChildren && (
                <div className="p-0.5 text-gray-400 transition-colors">
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FiChevronRight className="w-3.5 h-3.5" />
                    </motion.div>
                </div>
            )}

            {/* Icon */}
            {!hasChildren && Icon && (
                <Icon className={`w-4 h-4 ${active ? colorConfig.text : 'text-gray-400 group-hover:text-gray-500'}`} />
            )}

            {/* Label */}
            <span className="flex-1 truncate text-sm select-none">{label}</span>

            {/* Edit Mode Actions */}
            {editMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {onAddPage && (
                        <button
                            onClick={onAddPage}
                            className="p-1 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600"
                            title="Add Page"
                        >
                            <FiPlus className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <Menu as="div" className="relative">
                        <Menu.Button className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                            <FiMoreVertical className="w-3.5 h-3.5" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 focus:outline-none">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onRename}
                                        className={`${active ? 'bg-gray-50' : ''} flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-600`}
                                    >
                                        <FiEdit2 className="w-3 h-3" /> Rename
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onDelete}
                                        className={`${active ? 'bg-red-50' : ''} flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600`}
                                    >
                                        <FiTrash2 className="w-3 h-3" /> Delete
                                    </button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Menu>
                </div>
            )}

            {/* Active Indicator */}
            {active && (
                <motion.div
                    layoutId={type === 'section' ? 'activeSectionItem' : type === 'topic' ? 'activeTopicItem' : 'activeContentItem'}
                    className={`absolute left-0 top-0 w-0.5 ${colorConfig.indicator} rounded-r-full transition-all duration-200`}
                    style={{ height: '100%' }}
                />
            )}
        </motion.div>
    );
};

const ProjectSidebar = ({
    sections = [],
    selectedTopic,
    selectedContent,
    onSelectTopic,
    onSelectContent,
    onAddSection,
    onAddTopic,
    onRenameSection,
    onDeleteSection,
    onRenameTopic,
    onDeleteTopic,
    onAddContent,
    isOpen,
    onToggle,
    className = '',
    editMode = false
}) => {
    const [expandedSections, setExpandedSections] = useState({});
    const [expandedTopics, setExpandedTopics] = useState({});
    const [contentByTopic, setContentByTopic] = useState({});
    const [loadingContent, setLoadingContent] = useState({});
    const [allExpanded, setAllExpanded] = useState(false);

    // Fetch content items for a topic
    const fetchTopicContent = async (topicId) => {
        if (contentByTopic[topicId]) return; // Already fetched

        setLoadingContent(prev => ({ ...prev, [topicId]: true }));
        try {
            const { data, error } = await supabase
                .from('project_topic_content')
                .select('id, title, created_at')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setContentByTopic(prev => ({ ...prev, [topicId]: data || [] }));
        } catch (err) {
            console.error('Error fetching topic content:', err);
        } finally {
            setLoadingContent(prev => ({ ...prev, [topicId]: false }));
        }
    };

    // Handle "Expand All"
    const toggleAll = () => {
        if (allExpanded) {
            setExpandedSections({});
            setExpandedTopics({});
        } else {
            const newExpandedSections = {};
            const newExpandedTopics = {};
            sections.forEach(s => {
                newExpandedSections[s.id] = true;
                s.project_topics?.forEach(t => {
                    newExpandedTopics[t.id] = true;
                    fetchTopicContent(t.id);
                });
            });
            setExpandedSections(newExpandedSections);
            setExpandedTopics(newExpandedTopics);
        }
        setAllExpanded(!allExpanded);
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const toggleTopic = (topicId) => {
        const willExpand = !expandedTopics[topicId];
        setExpandedTopics(prev => ({
            ...prev,
            [topicId]: willExpand
        }));

        // Fetch content when expanding
        if (willExpand) {
            fetchTopicContent(topicId);
        }
    };

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isOpen ? 280 : 40,
                opacity: isOpen ? 1 : 0.6
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
            className={`h-full bg-slate-50/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col overflow-hidden ${className}`}
        >
            {/* Sidebar Header */}
            <div className="p-4 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 space-y-3">
                {isOpen && (
                    <div className="flex items-center gap-2 text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm w-full focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
                        <FiSearch className="w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
                        />
                    </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    {isOpen && <span>Workspace</span>}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleAll}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                            title={allExpanded ? "Collapse All" : "Expand All"}
                        >
                            {allExpanded ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
                        </button>
                        {editMode && (
                            <button
                                onClick={onAddSection}
                                className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                title="Add Section"
                            >
                                <FiPlus className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tree */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {isOpen ? (
                    <div className="px-3 py-2 space-y-1">
                        {sections.map(section => (
                            <React.Fragment key={section.id}>
                                <SidebarItem
                                    label={section.name}
                                    hasChildren={true}
                                    isExpanded={expandedSections[section.id]}
                                    onToggle={() => toggleSection(section.id)}
                                    editMode={editMode}
                                    onAddPage={() => onAddTopic(section.id)}
                                    onRename={() => onRenameSection(section)}
                                    onDelete={() => onDeleteSection(section)}
                                    type="section"
                                    active={section.project_topics?.some(topic =>
                                        selectedTopic?.id === topic.id ||
                                        (selectedContent && selectedContent.topic_id === topic.id)
                                    )}
                                />

                                <AnimatePresence>
                                    {expandedSections[section.id] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            {section.project_topics?.map(topic => (
                                                <React.Fragment key={topic.id}>
                                                    <SidebarItem
                                                        icon={FiFileText}
                                                        label={topic.name}
                                                        depth={1}
                                                        hasChildren={true}
                                                        isExpanded={expandedTopics[topic.id]}
                                                        active={selectedTopic?.id === topic.id || (selectedContent && selectedContent.topic_id === topic.id)}
                                                        onToggle={() => toggleTopic(topic.id)}
                                                        onClick={() => onSelectTopic(topic)}
                                                        editMode={editMode}
                                                        onRename={() => onRenameTopic(topic)}
                                                        onDelete={() => onDeleteTopic(topic)}
                                                        onAddPage={() => onAddContent && onAddContent(topic.id)} // Allow adding content under the topic
                                                        type="topic"
                                                    />

                                                    {/* Content Items under Topic */}
                                                    <AnimatePresence>
                                                        {expandedTopics[topic.id] && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                {loadingContent[topic.id] ? (
                                                                    <div className="px-3 py-2 text-xs text-gray-400" style={{ paddingLeft: '48px' }}>
                                                                        Loading...
                                                                    </div>
                                                                ) : (
                                                                    contentByTopic[topic.id]?.map(content => (
                                                                        <SidebarItem
                                                                            key={content.id}
                                                                            icon={FiFile}
                                                                            label={content.title}
                                                                            depth={2}
                                                                            active={selectedContent?.id === content.id}
                                                                            onClick={() => onSelectContent(content, topic)}
                                                                            type="content"
                                                                        />
                                                                    ))
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            ))}

                                            {/* Add Topic Button (Inline) */}
                                            {editMode && (
                                                <motion.button
                                                    whileHover={{ x: 4 }}
                                                    onClick={() => onAddTopic(section.id)}
                                                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-indigo-600 transition-colors w-full text-left"
                                                    style={{ paddingLeft: '36px' }}
                                                >
                                                    <FiPlus className="w-3 h-3" />
                                                    <span>Add Page</span>
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}

                        {sections.length === 0 && editMode && (
                            <div className="text-center py-8 px-4">
                                <p className="text-xs text-gray-400 mb-3">No sections yet</p>
                                <button
                                    onClick={onAddSection}
                                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                >
                                    Create Section
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4 space-y-2">
                        {sections.map(section => (
                            <React.Fragment key={section.id}>
                                <button
                                    className={`p-2 rounded-lg w-8 h-8 flex items-center justify-center transition-colors ${
                                        section.project_topics?.some(topic =>
                                            selectedTopic?.id === topic.id ||
                                            (selectedContent && selectedContent.topic_id === topic.id)
                                        ) ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                                    title={section.name}
                                    onClick={() => {
                                        // Expand section and go to first topic
                                        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
                                        if (section.project_topics?.length > 0) {
                                            onSelectTopic(section.project_topics[0]);
                                        }
                                    }}
                                >
                                    <FiFileText className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                    {expandedSections[section.id] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden w-full"
                                        >
                                            {section.project_topics?.map(topic => (
                                                <React.Fragment key={topic.id}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            className={`p-2 rounded-lg w-8 h-8 flex items-center justify-center transition-colors mx-auto ${
                                                                selectedTopic?.id === topic.id || (selectedContent && selectedContent.topic_id === topic.id)
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'text-gray-500 hover:bg-gray-200'
                                                            }`}
                                                            title={topic.name}
                                                            onClick={() => onSelectTopic(topic)}
                                                        >
                                                            <FiFileText className="w-4 h-4" />
                                                        </button>
                                                        {editMode && onAddContent && (
                                                            <button
                                                                className="p-1 rounded w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                                                                title={`Add content to ${topic.name}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddContent(topic.id);
                                                                }}
                                                            >
                                                                <FiPlus className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </motion.aside>
    );
};

export default ProjectSidebar;
