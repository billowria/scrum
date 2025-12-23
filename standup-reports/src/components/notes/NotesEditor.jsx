import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  FiPlus, FiFileText, FiX, FiBold, FiItalic, FiUnderline, FiType, FiAlignLeft,
  FiCode, FiSave, FiShare2, FiHeart, FiStar, FiTrash2, FiList, FiCheckSquare,
  FiArrowLeft, FiChevronLeft
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
  onToggleWordWrap,
  isMobile = false,
  onBack
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
        class: 'prose prose-blue prose-lg dark:prose-invert max-w-none w-full focus:outline-none min-h-[50vh] p-4 text-gray-800 dark:text-gray-100 leading-relaxed outline-none cursor-text pointer-events-auto',
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
      <div className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="text-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-white/10 backdrop-blur-md">
              <FiFileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Welcome to Sync Notes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Create beautiful notes with our professional editor.
            </p>
            <button
              onClick={onNewTab}
              className="group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto font-medium"
            >
              <FiPlus className="w-5 h-5" />
              New Note
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 h-full relative overflow-hidden ${isMobile ? 'z-50' : ''}`}>
      {/* Tab Bar - Hidden on mobile if preferred, or made very compact */}
      {!isMobile && (
        <div className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center">
            {/* Tabs */}
            <div className="flex-1 flex items-center overflow-x-auto no-scrollbar">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex items-center h-10 px-4 border-r border-gray-100 dark:border-slate-700 cursor-pointer transition-all duration-200 relative select-none min-w-[120px] max-w-[200px] ${activeTabId === tab.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 hover:text-gray-700 dark:hover:text-gray-200'
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

                  <FiFileText className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${activeTabId === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />

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
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 transition-all ${activeTabId === tab.id ? 'opacity-100' : ''}`}
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* New Tab Button */}
            <button
              onClick={onNewTab}
              className="h-10 w-10 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 text-gray-500 dark:text-gray-400 transition-colors border-l border-gray-100 dark:border-slate-700"
              title="New Note"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar / Header */}
      <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 z-20 ${isMobile ? 'pt-4 pb-2 shadow-sm' : 'px-4 py-2 sticky top-10 flex items-center justify-between shadow-sm'}`}>
        {/* Mobile Header Top Row */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                {selectedNote?.title || 'Untitled'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSaveNote}
                disabled={!isDirty}
                className={`p-2 rounded-full ${isDirty ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'}`}
              >
                <FiSave className="w-5 h-5" />
              </button>
              <button
                onClick={() => selectedNote && onShareNote(selectedNote)}
                className="p-2 text-gray-500 dark:text-gray-400"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar ${isMobile ? 'px-4 pb-1' : ''}`}>
          {/* Formatting Controls */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-gray-100 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('bold') ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <FiBold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('italic') ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <FiItalic className="w-4 h-4" />
            </button>
            {!isMobile && (
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-lg transition-all ${editor?.isActive('underline') ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                <FiUnderline className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-gray-100 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg transition-all ${editor?.isActive('bulletList') ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <FiList className="w-4 h-4" />
            </button>
            {!isMobile && (
              <button
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded-lg transition-all ${editor?.isActive('codeBlock') ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                <FiCode className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Additional Actions for Mobile */}
          {isMobile && (
            <div className="flex items-center gap-0.5 pl-1 flex-shrink-0">
              <button
                onClick={() => selectedNote && onToggleFavorite(selectedNote.id)}
                className={`p-1.5 rounded-lg ${selectedNote?.is_favorite ? 'text-red-500' : 'text-gray-400'}`}
              >
                <FiHeart className={`w-4 h-4 ${selectedNote?.is_favorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => selectedNote && onTogglePin(selectedNote.id)}
                className={`p-1.5 rounded-lg ${selectedNote?.is_pinned ? 'text-amber-500' : 'text-gray-400'}`}
              >
                <FiStar className={`w-4 h-4 ${selectedNote?.is_pinned ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={onSaveNote}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${isDirty
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                }`}
            >
              <FiSave className="w-3.5 h-3.5" />
              {isDirty ? 'Save' : 'Saved'}
            </button>
          )}
        </div>

        {/* Desktop-only Property Controls */}
        {!isMobile && (
          <div className="flex items-center gap-3">
            <select
              value={selectedNote?.category || 'general'}
              onChange={(e) => onUpdateNote('category', e.target.value)}
              className="text-xs bg-gray-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-300 font-medium focus:ring-0 cursor-pointer"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="ideas">Ideas</option>
              <option value="meeting">Meeting</option>
              <option value="project">Project</option>
              <option value="todo">To-Do</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => selectedNote && onToggleFavorite(selectedNote.id)}
                className={`p-1.5 rounded-lg ${selectedNote?.is_favorite ? 'text-red-500' : 'text-gray-400'}`}
              >
                <FiHeart className={`w-4 h-4 ${selectedNote?.is_favorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => selectedNote && onDeleteNote(selectedNote.id)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto pb-24">
          <div className={`w-full mx-auto ${isMobile ? 'p-4' : 'max-w-4xl p-8 pb-32'}`}>
            {/* Title Input */}
            <input
              type="text"
              value={selectedNote?.title || ''}
              onChange={(e) => onUpdateNote('title', e.target.value)}
              className={`w-full font-bold text-gray-800 dark:text-white border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 bg-transparent focus:ring-0 p-0 ${isMobile ? 'text-2xl mb-4' : 'text-4xl mb-6'}`}
              placeholder="Note Title"
            />

            {/* Editor Content */}
            <div
              className={`min-h-[60vh] cursor-text outline-none relative z-0 ${isMobile ? 'text-base' : 'text-lg'}`}
              onClick={() => editor?.commands.focus()}
            >
              {editor ? (
                <EditorContent editor={editor} />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">Loading...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`border-t border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 absolute bottom-0 w-full ${isMobile ? 'pb-6' : ''}`}>
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span>{editor?.storage.characterCount?.words() || stats.words || 0} WORDS</span>
            {!isMobile && <span>{editor?.storage.characterCount?.characters() || stats.characters || 0} CHARS</span>}
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span>{isDirty ? 'UNSAVED' : 'SYNCED'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;