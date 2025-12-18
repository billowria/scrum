import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiUser, FiPlus, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import Avatar from '../../components/shared/Avatar';
import RichTextEditor from '../components/RichTextEditor';

const ContentCard = ({ item, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(item.content);
    const [editTitle, setEditTitle] = useState(item.title);

    const handleSave = async () => {
        await onUpdate(item.id, { title: editTitle, content: editContent });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-900/10 rounded-2xl shadow-md border-2 border-indigo-200 dark:border-indigo-500/30 p-8 ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b-2 border-indigo-200 dark:border-indigo-500/30 pb-3 focus:border-indigo-500 outline-none bg-transparent"
                    placeholder="Entry Title"
                />
                <RichTextEditor
                    content={editContent}
                    onChange={setEditContent}
                    placeholder="Write something..."
                    className="min-h-[250px] prose prose-lg prose-indigo dark:prose-invert max-w-none"
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium"
                    >
                        <FiX className="w-4 h-4" /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium"
                    >
                        <FiSave className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 border-gray-100 dark:border-slate-800 p-8 hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-700 transition-all group"
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4 flex-1">
                    <Avatar user={item.created_by} size="md" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <FiUser className="w-3.5 h-3.5" />
                                {item.created_by?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <FiClock className="w-3.5 h-3.5" />
                                {new Date(item.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {canEdit && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 p-2.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                        title="Edit Content"
                    >
                        <FiEdit2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div
                className="prose prose-lg prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.content }}
            />
        </motion.div>
    );
};

const TopicView = ({
    topic,
    content = [],
    selectedContent,
    loading,
    onAddContent,
    onUpdateContent,
    currentUser,
    canEdit,
    showAddContent,
    setShowAddContent
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        if (showAddContent && canEdit) {
            setIsAdding(true);
        }
    }, [showAddContent, canEdit]);

    const handleSubmit = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        await onAddContent(newTitle, newContent);
        setIsAdding(false);
        setNewTitle('');
        setNewContent('');

        // Reset the showAddContent state after submitting
        if (setShowAddContent) {
            setShowAddContent(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8 space-y-6">
                <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-gray-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // Single Content View
    if (selectedContent) {
        return (
            <div className="max-w-5xl mx-auto px-8 py-12">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">{topic.name}</span>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedContent.title}</span>
                </div>

                {/* Single Content Card */}
                <ContentCard
                    item={selectedContent}
                    onUpdate={onUpdateContent}
                    canEdit={canEdit}
                />
            </div>
        );
    }

    // Topic Overview with Content List
    return (
        <div className="max-w-5xl mx-auto px-8 py-12">
            {/* Topic Header */}
            <div className="mb-12 pb-8 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">Topic</span>
                </div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">{topic.name}</h1>
                {topic.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-3xl">{topic.description}</p>
                )}
            </div>

            {/* Content List Preview */}
            {content.length > 0 && (
                <div className="space-y-6 mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content</h2>
                    <div className="grid gap-4">
                        {content.map(item => (
                            <div
                                key={item.id}
                                className="p-6 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <FiUser className="w-3.5 h-3.5" />
                                        {item.created_by?.name || 'Unknown'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiClock className="w-3.5 h-3.5" />
                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Content Button/Form */}
            {canEdit && (
                <div className="mt-12">
                    {!isAdding ? (
                        <button
                            onClick={() => {
                                setIsAdding(true);
                                if (setShowAddContent) {
                                    setShowAddContent(true);
                                }
                            }}
                            className="w-full py-5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-3 font-medium group"
                        >
                            <div className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                <FiPlus className="w-5 h-5" />
                            </div>
                            <span className="text-base">Add New Entry</span>
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900/30 p-8 ring-4 ring-indigo-50/50 dark:ring-indigo-900/10"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">New Entry</h3>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full text-xl font-medium text-gray-900 dark:text-white mb-6 border-b-2 border-gray-200 dark:border-slate-700 pb-3 focus:border-indigo-500 outline-none bg-transparent placeholder-gray-300 dark:placeholder-slate-600"
                                placeholder="Entry Title"
                                autoFocus
                            />
                            <RichTextEditor
                                content={newContent}
                                onChange={setNewContent}
                                placeholder="Write something..."
                                className="min-h-[250px] prose prose-lg prose-indigo dark:prose-invert max-w-none"
                            />
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        if (setShowAddContent) {
                                            setShowAddContent(false);
                                        }
                                        setNewTitle('');
                                        setNewContent('');
                                    }}
                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!newTitle.trim() || !newContent.trim()}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                >
                                    Post Entry
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopicView;
