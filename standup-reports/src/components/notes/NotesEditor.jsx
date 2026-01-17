import React, { useEffect, useState, useCallback } from 'react';
import {
    FiSave, FiTrash2, FiStar, FiMapPin, FiClock, FiMaximize2, FiMinimize2,
    FiBold, FiItalic, FiUnderline, FiList, FiCode, FiMinus
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

const NotesEditor = ({ note, updateNote, saveNote, isDirty, onDelete, onToggleFavorite, onTogglePin, theme, themeMode }) => {
    const [isZenMode, setIsZenMode] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Title Editor - simplified, just for single line title
    const titleEditor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
                hardBreak: false,
                paragraph: {
                    HTMLAttributes: {
                        class: 'm-0 p-0',
                    },
                },
            }),
            Placeholder.configure({
                placeholder: 'Untitled',
                emptyNodeClass: 'is-empty',
            }),
        ],
        content: note.title ? `<p>${note.title}</p>` : '',
        editorProps: {
            attributes: {
                class: `text-3xl md:text-4xl font-bold outline-none leading-tight transition-colors ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`,
                style: 'min-height: auto;',
            },
            handleKeyDown: (view, event) => {
                // Prevent Enter in title
                if (event.key === 'Enter') {
                    event.preventDefault();
                    contentEditor?.chain().focus().run();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            updateNote(note.id, { title: text });
        },
    });

    // Content Editor with full features
    const contentEditor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                codeBlock: {
                    HTMLAttributes: {
                        class: `rounded-lg p-4 my-2 font-mono text-sm ${themeMode === 'light'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-200'
                            }`,
                    },
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder: 'Start writing your thoughts...',
            }),
        ],
        content: note.content || '',
        editorProps: {
            attributes: {
                class: `prose prose-sm md:prose-base max-w-none outline-none min-h-[50vh] [&>p:first-child]:mt-0 ${themeMode === 'light'
                    ? 'prose-slate'
                    : 'prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-code:text-indigo-300'}`,
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();
            updateNote(note.id, { content: html });

            // Update counts
            setCharCount(text.length);
            setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        },
    });

    // Sync editors when note changes
    useEffect(() => {
        if (titleEditor && note.title !== titleEditor.getText()) {
            titleEditor.commands.setContent(note.title ? `<p>${note.title}</p>` : '');
        }
    }, [note.id]);

    useEffect(() => {
        if (contentEditor && note.content !== contentEditor.getHTML()) {
            contentEditor.commands.setContent(note.content || '');
        }
    }, [note.id]);

    // Update word count on mount
    useEffect(() => {
        const text = note.content?.replace(/<[^>]*>/g, '') || '';
        setCharCount(text.length);
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }, [note.id]);

    // Keyboard shortcut for save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveNote();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [saveNote]);

    const accentColor = themeMode === 'space' ? 'purple' : 'indigo';

    if (!titleEditor || !contentEditor) {
        return (
            <div className={`flex items-center justify-center h-full ${theme.bg}`}>
                <div className="animate-pulse text-slate-500">Loading editor...</div>
            </div>
        );
    }

    return (
        <motion.div
            key={note.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col h-full ${isZenMode ? 'fixed inset-0 z-50' : ''} ${theme.bg} transition-colors duration-300`}
        >
            {/* Toolbar */}
            <div className={`flex items-center justify-between px-6 py-3 border-b ${theme.border} ${theme.card} sticky top-0 z-30 backdrop-blur-lg`}>
                {/* Left: Meta Info */}
                <div className={`flex items-center gap-4 text-xs font-medium ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1.5">
                        <FiClock className="w-3.5 h-3.5" />
                        <span>{formatDistanceToNow(new Date(note.updated_at || Date.now()), { addSuffix: true })}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md ${themeMode === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                        {wordCount} words
                    </div>
                    <div className={`px-2 py-0.5 rounded-md ${themeMode === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                        {charCount} chars
                    </div>
                    <AnimatePresence>
                        {isDirty && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-amber-500 font-semibold"
                            >
                                • Unsaved
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onTogglePin}
                        className={`p-2 rounded-lg transition-all ${note.is_pinned ? 'text-indigo-400 bg-indigo-400/10' : `${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}`}
                        title="Pin Note"
                    >
                        <FiMapPin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={onToggleFavorite}
                        className={`p-2 rounded-lg transition-all ${note.is_favorite ? 'text-amber-400 bg-amber-400/10' : `${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}`}
                        title="Favorite"
                    >
                        <FiStar className={`w-4 h-4 ${note.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={saveNote}
                        className={`p-2 rounded-lg transition-all ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-emerald-600' : 'text-slate-400 hover:bg-white/5 hover:text-emerald-400'}`}
                        title="Save (Cmd+S)"
                    >
                        <FiSave className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={`p-2 rounded-lg transition-all ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                        title={isZenMode ? 'Exit Zen Mode' : 'Zen Mode'}
                    >
                        {isZenMode ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
                    </button>
                    <div className={`w-px h-4 mx-1 ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                    <button
                        onClick={onDelete}
                        className={`p-2 rounded-lg transition-all ${themeMode === 'light' ? 'text-slate-500 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'}`}
                        title="Delete"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Formatting Toolbar */}
            <div className={`flex items-center gap-1 px-6 py-2 border-b ${theme.border} ${theme.card} overflow-x-auto`}>
                {/* Text Formatting */}
                <button
                    onClick={() => contentEditor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('bold')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Bold (Cmd+B)"
                >
                    <FiBold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('italic')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Italic (Cmd+I)"
                >
                    <FiItalic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('underline')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Underline"
                >
                    <FiUnderline className="w-4 h-4" />
                </button>

                <div className={`w-px h-4 mx-1 ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />

                {/* Lists */}
                <button
                    onClick={() => contentEditor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('bulletList')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Bullet List"
                >
                    <FiList className="w-4 h-4" />
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('orderedList')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Numbered List"
                >
                    <span className="text-xs font-bold">1.</span>
                </button>

                <div className={`w-px h-4 mx-1 ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />

                {/* Headings */}
                <button
                    onClick={() => contentEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${contentEditor.isActive('heading', { level: 2 })
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Heading"
                >
                    H2
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${contentEditor.isActive('heading', { level: 3 })
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Subheading"
                >
                    H3
                </button>

                <div className={`w-px h-4 mx-1 ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />

                {/* Code */}
                <button
                    onClick={() => contentEditor.chain().focus().toggleCode().run()}
                    className={`p-2 rounded-lg transition-all ${contentEditor.isActive('code')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Inline Code"
                >
                    <FiCode className="w-4 h-4" />
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().toggleCodeBlock().run()}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${contentEditor.isActive('codeBlock')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Code Block"
                >
                    {'</>'}
                </button>
                <button
                    onClick={() => contentEditor.chain().focus().setHorizontalRule().run()}
                    className={`p-2 rounded-lg transition-all ${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}
                    title="Divider"
                >
                    <FiMinus className="w-4 h-4" />
                </button>

                <div className={`w-px h-4 mx-1 ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />

                {/* Blockquote */}
                <button
                    onClick={() => contentEditor.chain().focus().toggleBlockquote().run()}
                    className={`px-2 py-1.5 rounded-lg text-sm transition-all ${contentEditor.isActive('blockquote')
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : `${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`
                        }`}
                    title="Quote"
                >
                    "
                </button>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className={`px-8 py-6 ${isZenMode ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
                    {/* Title */}
                    <EditorContent
                        editor={titleEditor}
                        className="mb-2 [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:m-0 [&_.ProseMirror_.is-empty]:before:text-slate-400"
                    />

                    {/* Content */}
                    <EditorContent
                        editor={contentEditor}
                        className="min-h-[50vh] [&_.ProseMirror]:min-h-[50vh] [&_.ProseMirror]:outline-none [&_.ProseMirror>*:first-child]:mt-0"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default NotesEditor;
