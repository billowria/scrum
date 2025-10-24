import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiFileText, FiHeart, FiShare2,
  FiClock, FiTag, FiX, FiSave, FiCopy, FiEdit3, FiFile, FiFolder, FiChevronDown,
  FiHash, FiType, FiAlignLeft, FiBold, FiItalic, FiUnderline, FiCode,
  FiMonitor, FiCpu, FiHardDrive, FiActivity, FiTrendingUp, FiInfo,
  FiStar, FiArchive, FiCalendar, FiUsers, FiTarget, FiTrash2,
  FiSettings, FiMoreVertical, FiEdit, FiEye
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '../components/notes/ShareModal';

const NotesPage = ({ sidebarOpen }) => {
  // Basic state
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('updated_at');

  // Advanced state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareNote, setShareNote] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);

  // UI state
  const [showFavorites, setShowFavorites] = useState(true);
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(true);
  const [allNotesCollapsed, setAllNotesCollapsed] = useState(false);
  const [sharedCollapsed, setSharedCollapsed] = useState(true);

  // Editor state
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Editor reference
  const editorRef = useRef(null);

  // Utility functions
  const getTextStats = (text) => {
    if (!text) return { characters: 0, words: 0, lines: 1 };
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    return { characters, words, lines };
  };

  // Computed values
  const stats = selectedNote ? getTextStats(selectedNote.content) : { words: 0, characters: 0, lines: 1 };
  const favoriteNotes = notes.filter(note => note.is_favorite);
  const allNotes = notes.filter(note => !note.is_favorite);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order(sortBy, { ascending: false });

      if (error) throw error;
      setNotes(data || []);

      // Also fetch shared notes
      await fetchSharedNotes(user.id);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedNotes = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          users:shared_by (id, name, email, avatar_url)
        `)
        .eq('is_shared', true)
        .contains('shared_with', [userId])
        .order('shared_at', { ascending: false });

      if (error) throw error;
      setSharedNotes(data || []);
    } catch (error) {
      console.error('Error fetching shared notes:', error);
    }
  };

  // Utility functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Tab management
  const createNewNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newNote = {
        title: 'Untitled Note',
        content: '',
        user_id: user.id,
        category: 'general',
        tags: [],
        is_pinned: false,
        background_color: '#ffffff',
        font_size: 16, // Medium font size as integer (16px)
        is_favorite: false,
        is_shared: false,
        shared_with: [],
        share_permission: 'read'
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      switchTab(data);
      showToast('New note created successfully', 'success');
    } catch (error) {
      console.error('Error creating note:', error);
      showToast('Failed to create note', 'error');
    }
  };

  const switchTab = useCallback((note) => {
    if (selectedNote?.id === note.id) return;

    setIsDirty(false);
    setSelectedNote(note);
    setActiveTabId(note.id);

    // Add to open tabs if not already there
    setOpenTabs(prev => {
      const exists = prev.find(tab => tab.id === note.id);
      if (!exists) {
        return [...prev, note];
      }
      return prev;
    });
  }, [selectedNote?.id]);

  const closeTab = useCallback((noteId) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== noteId));
    if (activeTabId === noteId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== noteId);
      if (remainingTabs.length > 0) {
        setSelectedNote(remainingTabs[0]);
        setActiveTabId(remainingTabs[0].id);
      } else {
        setSelectedNote(null);
        setActiveTabId(null);
      }
    }
  }, [activeTabId, openTabs]);

  // Note operations
  const updateNote = async (field, value) => {
    if (!selectedNote) return;

    const updatedNote = { ...selectedNote, [field]: value };
    setSelectedNote(updatedNote);
    setIsDirty(true);

    // Update in open tabs
    setOpenTabs(prev => prev.map(tab =>
      tab.id === selectedNote.id ? updatedNote : tab
    ));

    // Update in notes list
    setNotes(prev => prev.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    ));
  };

  const saveNote = async () => {
    if (!selectedNote || !isDirty) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: selectedNote.title,
          content: selectedNote.content,
          category: selectedNote.category,
          background_color: selectedNote.background_color,
          font_size: selectedNote.font_size,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      setIsDirty(false);
      showToast('Note saved successfully', 'success');
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('Failed to save note', 'error');
    }
  };

  const toggleFavorite = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prevNotes =>
        prevNotes.map(n =>
          n.id === noteId ? { ...n, is_favorite: !n.is_favorite } : n
        )
      );

      // Update selected note if it's the one being favorited
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => ({ ...prev, is_favorite: !prev.is_favorite }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const togglePin = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prevNotes =>
        prevNotes.map(n =>
          n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n
        )
      );

      // Update selected note if it's the one being pinned
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => ({ ...prev, is_pinned: !prev.is_pinned }));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));

      // Close tab if this note was open
      if (selectedNote?.id === noteId) {
        closeTab(noteId);
      }

      showToast(`"${note.title || 'Untitled'}" deleted successfully`, 'error');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note', 'error');
    }
  };

  // Share functionality
  const handleShareNote = (note) => {
    setShareNote(note);
    setShowShareModal(true);
  };

  const handleShareSuccess = (sharedUsers) => {
    // Update the note in local state to reflect sharing
    if (shareNote) {
      setNotes(prevNotes =>
        prevNotes.map(n =>
          n.id === shareNote.id
            ? {
                ...n,
                is_shared: true,
                shared_with: [...(n.shared_with || []), ...sharedUsers.map(u => u.userId)],
                shared_at: new Date().toISOString()
              }
            : n
        )
      );

      // Update selected note if it's the one being shared
      if (selectedNote?.id === shareNote.id) {
        setSelectedNote(prev => ({
          ...prev,
          is_shared: true,
          shared_with: [...(prev.shared_with || []), ...sharedUsers.map(u => u.userId)],
          shared_at: new Date().toISOString()
        }));
      }

      showToast(`Note shared with ${sharedUsers.length} member${sharedUsers.length > 1 ? 's' : ''}`, 'success');
    }
  };

  // Editor event handlers
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveNote();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      if (selectedNote) {
        handleShareNote(selectedNote);
      }
    }
  };

  const handleCursorMove = () => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const text = textarea.value;
    const cursorIndex = textarea.selectionStart;

    const textBeforeCursor = text.substring(0, cursorIndex);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    setCursorPosition({ line, column });
  };

  const NoteCard = ({ note }) => {
    const noteStats = getTextStats(note.content);
    const isSelected = selectedNote?.id === note.id;
    const isOpenInTab = openTabs.find(tab => tab.id === note.id);

    return (
      <div
        className={`border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
          isSelected
            ? 'border-blue-400 shadow-sm bg-blue-50/50'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
        }`}
        style={{
          height: '72px',
          marginBottom: '4px',
          backgroundColor: note.background_color || '#ffffff'
        }}
        onClick={() => switchTab(note)}
      >
        {/* Status indicator - thin vertical line */}
        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
          isOpenInTab
            ? 'bg-green-500'
            : note.is_favorite
              ? 'bg-amber-500'
              : note.is_shared
                ? 'bg-purple-500'
                : 'bg-gray-300'
        }`} />

        <div className="flex items-center h-full px-3 py-2">
          {/* Left side - Icon and title */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Pinned indicator */}
            {note.is_pinned && (
              <FiTarget className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            )}

            {/* Status dot */}
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isOpenInTab
                ? 'bg-green-500'
                : note.is_favorite
                  ? 'bg-amber-500'
                  : note.is_shared
                    ? 'bg-purple-500'
                    : 'bg-gray-300'
            }`} />

            {/* File icon */}
            <FiFileText className={`w-3.5 h-3.5 flex-shrink-0 ${
              isSelected ? 'text-blue-600' : 'text-gray-500'
            }`} />

            {/* Title and content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm font-medium truncate ${
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                }`} style={{ fontSize: `${note.font_size || 14}px` }}>
                  {note.title || 'Untitled'}
                </h3>

                {/* Category badge */}
                {note.category && note.category !== 'general' && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                    note.category === 'work' ? 'bg-blue-100 text-blue-700' :
                    note.category === 'personal' ? 'bg-green-100 text-green-700' :
                    note.category === 'ideas' ? 'bg-purple-100 text-purple-700' :
                    note.category === 'meeting' ? 'bg-yellow-100 text-yellow-700' :
                    note.category === 'project' ? 'bg-red-100 text-red-700' :
                    note.category === 'todo' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {note.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500 truncate">
                  {note.content || 'No content'}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-600"
                      >
                        <FiTag className="w-2 h-2 mr-0.5" />
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[9px] text-gray-500">+{note.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Stats and actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Shared indicator */}
            {note.is_shared && (
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <FiUsers className="w-3 h-3" />
              </div>
            )}

            {/* Word count */}
            <span className="text-xs text-gray-500 hidden sm:block">
              {noteStats.words}w
            </span>

            {/* Time */}
            <span className="text-xs text-gray-500">
              {new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Share button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareNote(note);
                }}
                className={`p-1 rounded transition-colors ${
                  note.is_shared
                    ? 'text-purple-500'
                    : 'text-gray-400 hover:text-purple-500'
                }`}
                title={note.is_shared ? 'Manage sharing' : 'Share note'}
              >
                <FiShare2 className="w-3.5 h-3.5" />
              </button>

              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(note.id);
                }}
                className={`p-1 rounded transition-colors ${
                  note.is_favorite
                    ? 'text-amber-500'
                    : 'text-gray-400 hover:text-amber-500'
                }`}
              >
                <FiStar className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-current' : ''}`} />
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="p-1 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <FiTrash2 className="w-5 h-5" />
            ) : (
              <FiSave className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Compact Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left Side - Brand and Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <FiFileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Notes</h1>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{notes.length} total</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FiHeart className="w-3 h-3 text-red-500" />
                    {favoriteNotes.length}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FiShare2 className="w-3 h-3 text-purple-500" />
                    {sharedNotes.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Note Info */}
            {selectedNote && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isDirty ? 'bg-orange-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-32">
                    {selectedNote.title || 'Untitled'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {stats.words} words
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              />
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="List view"
              >
                <FiList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Grid view"
              >
                <FiGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated_at">Recently Updated</option>
              <option value="created_at">Recently Created</option>
              <option value="title">Title A-Z</option>
              <option value="is_pinned">Pinned First</option>
            </select>

            {/* New Note Button */}
            <button
              onClick={createNewNote}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md"
            >
              <FiPlus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex h-[calc(100vh-64px)]">
        {/* Enhanced Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white/80 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">My Notes</h2>
          </div>

          {/* Scrollable Content Area */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            <div className="p-4">
              {/* Favorites Section */}
              <div className="mb-6">
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setFavoritesCollapsed(!favoritesCollapsed)}
                >
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FiHeart className="text-red-500" />
                    Favorites
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {favoriteNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: favoritesCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="text-gray-400" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!favoritesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {favoriteNotes.length > 0 ? (
                        favoriteNotes.map(note => (
                          <NoteCard key={note.id} note={note} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <FiHeart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No favorite notes yet
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* All Notes Section */}
              <div className="mb-6">
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setAllNotesCollapsed(!allNotesCollapsed)}
                >
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FiFileText />
                    All Notes
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {allNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: allNotesCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="text-gray-400" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!allNotesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {allNotes.length > 0 ? (
                        allNotes.map(note => (
                          <NoteCard key={note.id} note={note} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No notes found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shared Notes Section */}
              <div className="mb-6">
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setSharedCollapsed(!sharedCollapsed)}
                >
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FiShare2 className="text-purple-500" />
                    Shared with Me
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {sharedNotes.length}
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: sharedCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="text-gray-400" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {!sharedCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {sharedNotes.length > 0 ? (
                        sharedNotes.map(note => (
                          <NoteCard key={note.id} note={note} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <FiShare2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No shared notes
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Notepad++-like Editor Area */}
        <div className="flex-1 flex flex-col bg-white">
          {openTabs.length > 0 ? (
            <>
              {/* Tab Bar */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  {/* Tabs */}
                  <div className="flex-1 flex items-center overflow-x-auto">
                    {openTabs.map((tab) => (
                      <div
                        key={tab.id}
                        className={`group flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer transition-colors relative ${
                          activeTabId === tab.id
                            ? 'bg-white text-gray-900 border-t-2 border-t-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => switchTab(tab)}
                        style={{
                          backgroundColor: activeTabId === tab.id ? (tab.background_color || '#ffffff') : undefined
                        }}
                      >
                        {/* Tab Icon */}
                        <FiFileText className="w-4 h-4 mr-2 flex-shrink-0" />

                        {/* Tab Title */}
                        <span className="text-sm font-medium truncate max-w-32 mr-2">
                          {tab.title || 'Untitled'}
                        </span>

                        {/* Dirty Indicator */}
                        {isDirty && activeTabId === tab.id && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        )}

                        {/* Close Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 ${
                            activeTabId === tab.id ? 'opacity-100' : ''
                          }`}
                        >
                          <FiX className="w-3 h-3 text-gray-500 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* New Tab Button */}
                  <button
                    onClick={() => createNewNote()}
                    className="p-2 hover:bg-gray-200 transition-colors border-l border-gray-200"
                    title="New Note"
                  >
                    <FiPlus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Enhanced Toolbar */}
              <div className="border-b border-gray-200 bg-white px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* Formatting Controls */}
                    <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Bold">
                        <FiBold className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Italic">
                        <FiItalic className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Underline">
                        <FiUnderline className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Strikethrough">
                        <FiType className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Alignment Controls */}
                    <div className="flex items-center gap-1 px-2 border-r border-gray-200">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Align Left">
                        <FiAlignLeft className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Editor Controls */}
                    <div className="flex items-center gap-1 px-2 border-r border-gray-200">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Code Block">
                        <FiCode className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-1 px-2">
                      <button
                        onClick={() => saveNote()}
                        disabled={!isDirty}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isDirty
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={isDirty ? 'Save note (Ctrl+S)' : 'No changes to save'}
                      >
                        <FiSave className="w-3.5 h-3.5" />
                        {isDirty ? 'Save' : 'Saved'}
                      </button>
                    </div>
                  </div>

                  {/* Right Side Controls */}
                  <div className="flex items-center gap-2">
                    {/* Category Selector */}
                    <select
                      value={selectedNote?.category || 'general'}
                      onChange={(e) => updateNote('category', e.target.value)}
                      className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="general">General</option>
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="ideas">Ideas</option>
                      <option value="meeting">Meeting</option>
                      <option value="project">Project</option>
                      <option value="todo">To-Do</option>
                    </select>

                    {/* Font Size Selector */}
                    <select
                      value={selectedNote?.font_size || 16}
                      onChange={(e) => updateNote('font_size', parseInt(e.target.value))}
                      className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="12">Small</option>
                      <option value="16">Medium</option>
                      <option value="20">Large</option>
                      <option value="24">Extra Large</option>
                    </select>

                    {/* Action Buttons */}
                    <button
                      onClick={() => selectedNote && handleShareNote(selectedNote)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedNote?.is_shared
                          ? 'text-purple-500 bg-purple-50'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={selectedNote?.is_shared ? 'Manage sharing' : 'Share note'}
                    >
                      <FiShare2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => selectedNote && toggleFavorite(selectedNote.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedNote?.is_favorite
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={selectedNote?.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <FiHeart className={`w-4 h-4 ${selectedNote?.is_favorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => selectedNote && togglePin(selectedNote.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedNote?.is_pinned
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={selectedNote?.is_pinned ? 'Unpin note' : 'Pin note'}
                    >
                      <FiStar className={`w-4 h-4 ${selectedNote?.is_pinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => selectedNote && deleteNote(selectedNote.id)}
                      className="p-1.5 rounded text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete note"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Editor Area */}
              <div className="flex-1 flex">
                {/* Line Numbers */}
                <div className="w-16 bg-gray-50 border-r border-gray-200 px-2 py-4 text-xs text-gray-400 font-mono select-none">
                  {selectedNote?.content.split('\n').map((_, index) => (
                    <div key={index} className="text-right leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>

                {/* Main Editor */}
                <div className="flex-1 flex flex-col">
                  {/* Title Input */}
                  <div className="border-b border-gray-200 px-4 py-3">
                    <input
                      type="text"
                      value={selectedNote?.title || ''}
                      onChange={(e) => updateNote('title', e.target.value)}
                      className="w-full text-xl font-semibold border-0 outline-none placeholder-gray-400"
                      placeholder="Note title..."
                      style={{
                        fontSize: `${(selectedNote?.font_size || 16) + 4}px`
                      }}
                    />
                  </div>

                  {/* Content Editor */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={editorRef}
                      value={selectedNote?.content || ''}
                      onChange={(e) => updateNote('content', e.target.value)}
                      onKeyDown={handleKeyDown}
                      onSelect={handleCursorMove}
                      className="w-full h-full p-4 border-0 outline-none resize-none font-mono leading-6 placeholder-gray-400"
                      placeholder="Start typing your note..."
                      style={{
                        backgroundColor: selectedNote?.background_color || '#ffffff',
                        fontSize: `${selectedNote?.font_size || 16}px`,
                        lineHeight: '1.5'
                      }}
                      spellCheck={false}
                    />

                    {/* Word Wrap Toggle */}
                    <div className="absolute bottom-2 right-2">
                      <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                        title="Toggle word wrap"
                      >
                        {wordWrap ? 'Wrap' : 'No Wrap'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    {/* Language */}
                    <span className="flex items-center gap-1">
                      <FiCode className="w-3 h-3" />
                      Plain Text
                    </span>

                    {/* Encoding */}
                    <span>UTF-8</span>

                    {/* Line Endings */}
                    <span>LF</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Word Count */}
                    <span>Words: {stats.words}</span>

                    {/* Character Count */}
                    <span>Chars: {stats.characters}</span>

                    {/* Line Count */}
                    <span>Lines: {stats.lines}</span>

                    {/* Cursor Position */}
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>

                    {/* Share Status */}
                    {selectedNote?.is_shared && (
                      <span className="flex items-center gap-1 text-purple-600">
                        <FiShare2 className="w-3 h-3" />
                        Shared
                      </span>
                    )}

                    {/* Save Status */}
                    <span className={`flex items-center gap-1 ${isDirty ? 'text-orange-600' : 'text-green-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      {isDirty ? 'Modified' : 'Saved'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                    <FiFileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to SquadSync Notes</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Create beautiful notes with our professional editor. Organize your thoughts, collaborate with your team, and never lose an idea again.
                  </p>
                  <button
                    onClick={() => createNewNote()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FiPlus className="w-5 h-5" />
                    Create Your First Note
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareNote(null);
        }}
        note={shareNote}
        onShareSuccess={handleShareSuccess}
      />
    </div>
  );
};

export default NotesPage;