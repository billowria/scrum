import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  FiPlus, FiFileText, FiX, FiBold, FiItalic, FiUnderline, FiType, FiAlignLeft,
  FiCode, FiSave, FiShare2, FiHeart, FiStar, FiTrash2, FiList, FiCheckSquare
} from 'react-icons/fi';

const NotesEditor = ({
  selectedNote,
  openTabs,
  activeTabId,
  isDirty,
  wordWrap,
  cursorPosition,
  stats,
  onTabClose,
  onNewTab,
  onTabSwitch,
  onUpdateNote,
  onSaveNote,
  onShareNote,
  onToggleFavorite,
  onTogglePin,
  onDeleteNote,
  onKeyDown,
  onCursorMove,
  onToggleWordWrap
}) => {

  // Refs to avoid stale closures in Tiptap's stable callbacks
  const onUpdateNoteRef = useRef(onUpdateNote);
  const selectedNoteRef = useRef(selectedNote);
  const onKeyDownRef = useRef(onKeyDown);

  // Update refs on every render
  useEffect(() => {
    onUpdateNoteRef.current = onUpdateNote;
    selectedNoteRef.current = selectedNote;
    onKeyDownRef.current = onKeyDown;
  });

  // Initialize editor with stable configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Start typing your note...',
      }),
    ],
    content: selectedNote?.content || '',
    editable: true,
    onUpdate: ({ editor }) => {
      // Use ref to call the latest version of the function
      if (onUpdateNoteRef.current) {
        onUpdateNoteRef.current('content', editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-blue prose-lg max-w-none w-full focus:outline-none min-h-[50vh] p-4 text-gray-800 leading-relaxed outline-none cursor-text pointer-events-auto',
      },
      handleKeyDown: (view, event) => {
        if (onKeyDownRef.current) {
          onKeyDownRef.current(event);
        }
        // Always return false to let the editor handle the event natively (typing etc)
        // unless the parent specifically prevented default (which our parent handler mostly doesn't for regular keys)
        return false;
      }
    },
  }, []);

  // Real fix: Sync content ONLY when note ID changes
  const lastNoteIdRef = useRef(selectedNote?.id);
  useEffect(() => {
    if (editor && selectedNote?.id !== lastNoteIdRef.current) {
      editor.commands.setContent(selectedNote?.content || '');
      lastNoteIdRef.current = selectedNote?.id;
      editor.commands.focus('end');
    }
  }, [selectedNote?.id, editor]);

  // Ensure editable
  useEffect(() => {
    if (editor && !editor.isEditable) {
      editor.setEditable(true);
    }
  }, [editor]);


  // Handle global keyboard shortcuts (outside of editor)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Forward save command
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSaveNote();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onSaveNote]);


  if (openTabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl flex items-center justify-center shadow-lg border border-white/50 backdrop-blur-md">
              <FiFileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Sync Notes</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Create beautiful notes with our professional editor. Organize your thoughts, collaborate with your team, and never lose an idea again.
            </p>
            <button
              onClick={onNewTab}
              className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2 mx-auto font-medium"
            >
              <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Your First Note
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      {/* Tab Bar */}
      <div className="border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center">
          {/* Tabs */}
          <div className="flex-1 flex items-center overflow-x-auto no-scrollbar">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={`group flex items-center h-10 px-4 border-r border-gray-100 cursor-pointer transition-all duration-200 relative select-none min-w-[120px] max-w-[200px] ${activeTabId === tab.id
                  ? 'bg-white text-blue-600 font-medium'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100/50 hover:text-gray-700'
                  }`}
                onClick={() => onTabSwitch(tab)}
              >
                {/* Active Tab Indicator */}
                {activeTabId === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}

                <FiFileText className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${activeTabId === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />

                <span className="text-xs truncate flex-1 mr-2">
                  {tab.title || 'Untitled'}
                </span>

                {/* Dirty Indicator */}
                <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-all duration-300 ${isDirty && activeTabId === tab.id ? 'opacity-100 bg-amber-500 scale-100' : 'opacity-0 scale-0'}`}></div>

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-all ${activeTabId === tab.id ? 'opacity-100' : ''}`}
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* New Tab Button */}
          <button
            onClick={onNewTab}
            className="h-10 w-10 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors border-l border-gray-100"
            title="New Note"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Toolbar */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 py-2 flex items-center justify-between sticky top-10 z-20 shadow-sm">
        <div className="flex items-center gap-1.5">
          {/* Formatting Controls */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-gray-100">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('bold') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Bold (Cmd+B)"
            >
              <FiBold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('italic') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Italic (Cmd+I)"
            >
              <FiItalic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('underline') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Underline (Cmd+U)"
            >
              <FiUnderline className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('strike') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Strikethrough"
            >
              <FiType className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-gray-100">
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('bulletList') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Bullet List"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('codeBlock') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              title="Code Block"
            >
              <FiCode className="w-4 h-4" />
            </button>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={onSaveNote}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${isDirty
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              title={isDirty ? 'Save note (Ctrl+S)' : 'No changes to save'}
            >
              <FiSave className="w-3.5 h-3.5" />
              {isDirty ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Properties */}
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
            {/* Category Selector */}
            <select
              value={selectedNote?.category || 'general'}
              onChange={(e) => onUpdateNote('category', e.target.value)}
              className="text-xs bg-transparent border-none text-gray-600 font-medium focus:ring-0 cursor-pointer"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="ideas">Ideas</option>
              <option value="meeting">Meeting</option>
              <option value="project">Project</option>
              <option value="todo">To-Do</option>
            </select>
          </div>

          <div className="w-px h-4 bg-gray-200"></div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => selectedNote && onShareNote(selectedNote)}
              className={`p-1.5 rounded-lg transition-all ${selectedNote?.is_shared
                ? 'text-purple-600 bg-purple-50 ring-1 ring-purple-100'
                : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
              title="Share"
            >
              <FiShare2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => selectedNote && onToggleFavorite(selectedNote.id)}
              className={`p-1.5 rounded-lg transition-all ${selectedNote?.is_favorite
                ? 'text-red-500 bg-red-50 ring-1 ring-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              title="Favorite"
            >
              <FiHeart className={`w-4 h-4 ${selectedNote?.is_favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => selectedNote && onTogglePin(selectedNote.id)}
              className={`p-1.5 rounded-lg transition-all ${selectedNote?.is_pinned
                ? 'text-amber-500 bg-amber-50 ring-1 ring-amber-100'
                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
              title="Pin"
            >
              <FiStar className={`w-4 h-4 ${selectedNote?.is_pinned ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => selectedNote && onDeleteNote(selectedNote.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto p-8 pb-32">
            {/* Title Input */}
            <input
              type="text"
              value={selectedNote?.title || ''}
              onChange={(e) => onUpdateNote('title', e.target.value)}
              className="w-full text-4xl font-bold text-gray-800 border-none outline-none placeholder-gray-300 bg-transparent mb-6 focus:ring-0 p-0"
              placeholder="Untitled Note"
            />

            {/* Tiptap Editor Content */}
            <div
              className="min-h-[50vh] cursor-text outline-none bg-white relative z-0"
              onClick={() => editor?.commands.focus()}
            >
              {editor ? (
                <EditorContent editor={editor} />
              ) : (
                <div className="text-gray-400 p-4">Loading editor...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Status Bar */}
      <div className="border-t border-gray-100 bg-white/80 backdrop-blur px-4 py-1.5 absolute bottom-0 w-full">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium font-mono uppercase tracking-wider">
          <div className="flex items-center gap-4">
            {/* Word Count */}
            <span>{editor?.storage.characterCount?.words() || stats.words || 0} WORDS</span>
            <span>{editor?.storage.characterCount?.characters() || stats.characters || 0} CHARS</span>

            {selectedNote?.updated_at && (
              <span>Last edited {new Date(selectedNote.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedNote?.is_shared && (
              <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                <FiShare2 className="w-3 h-3" />
                SHARED
              </span>
            )}

            <span className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${isDirty ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              {isDirty ? 'UNSAVED' : 'SYNCED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;