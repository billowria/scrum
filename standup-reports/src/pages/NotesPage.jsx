import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '../components/notes/ShareModal';

// Import notes components
import {
  NotesHeader,
  NotesSidebar,
  NotesEditor,
  ToastNotification
} from '../components/notes';

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

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Toast Notification */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />

      {/* Enhanced Header */}
      <NotesHeader
        notes={notes}
        favoriteNotes={favoriteNotes}
        sharedNotes={sharedNotes}
        selectedNote={selectedNote}
        isDirty={isDirty}
        stats={stats}
        searchQuery={searchQuery}
        viewMode={viewMode}
        sortBy={sortBy}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onSortChange={setSortBy}
        onNewNote={createNewNote}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex h-[calc(100vh-64px)]">
        {/* Notes Sidebar */}
        <NotesSidebar
          favoriteNotes={favoriteNotes}
          allNotes={allNotes}
          sharedNotes={sharedNotes}
          favoritesCollapsed={favoritesCollapsed}
          allNotesCollapsed={allNotesCollapsed}
          sharedCollapsed={sharedCollapsed}
          onToggleFavorites={() => setFavoritesCollapsed(!favoritesCollapsed)}
          onToggleAllNotes={() => setAllNotesCollapsed(!allNotesCollapsed)}
          onToggleShared={() => setSharedCollapsed(!sharedCollapsed)}
          onSelectNote={switchTab}
          onShareNote={handleShareNote}
          onToggleFavorite={toggleFavorite}
          onDeleteNote={deleteNote}
          selectedNote={selectedNote}
          openTabs={openTabs}
        />

        {/* Notes Editor */}
        <NotesEditor
          selectedNote={selectedNote}
          openTabs={openTabs}
          activeTabId={activeTabId}
          isDirty={isDirty}
          wordWrap={wordWrap}
          cursorPosition={cursorPosition}
          stats={stats}
          onTabClose={closeTab}
          onNewTab={createNewNote}
          onTabSwitch={switchTab}
          onUpdateNote={updateNote}
          onSaveNote={saveNote}
          onShareNote={handleShareNote}
          onToggleFavorite={toggleFavorite}
          onTogglePin={togglePin}
          onDeleteNote={deleteNote}
          onKeyDown={handleKeyDown}
          onCursorMove={handleCursorMove}
          onToggleWordWrap={() => setWordWrap(!wordWrap)}
        />
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