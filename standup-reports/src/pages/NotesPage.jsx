import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { NotesSidebar, NotesEditor, ToastNotification, NotesList } from '../components/notes';
import ShareModal from '../components/notes/ShareModal';
import { FiEdit3, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const NotesPage = () => {
    const { themeMode } = useTheme();

    // --- State: Data ---
    const [notes, setNotes] = useState([]);
    const [sharedNotes, setSharedNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State: Selection & Navigation ---
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedNoteIds, setSelectedNoteIds] = useState([]); // Multi-select
    const [searchQuery, setSearchQuery] = useState('');

    // --- State: Editor ---
    const [isDirty, setIsDirty] = useState(false);

    // --- State: UI ---
    const [folderSidebarOpen, setFolderSidebarOpen] = useState(true);
    const [listSidebarOpen, setListSidebarOpen] = useState(true);
    const [toast, setToast] = useState(null);

    // --- State: Share Modal ---
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareNote, setShareNote] = useState(null);

    // Theme-aware background classes
    const getThemeClasses = () => {
        switch (themeMode) {
            case 'light':
                return {
                    bg: 'bg-slate-100',
                    text: 'text-slate-900',
                    card: 'bg-white/80',
                    border: 'border-slate-200',
                    accent: 'bg-indigo-500'
                };
            case 'space':
                return {
                    bg: 'bg-transparent',
                    text: 'text-slate-100',
                    card: 'bg-transparent',
                    border: 'border-white/10',
                    accent: 'bg-purple-500'
                };
            case 'ocean':
                return {
                    bg: 'bg-transparent',
                    text: 'text-slate-100',
                    card: 'bg-transparent',
                    border: 'border-white/10',
                    accent: 'bg-cyan-500'
                };
            case 'forest':
            case 'diwali':
                return {
                    bg: 'bg-transparent',
                    text: 'text-slate-100',
                    card: 'bg-transparent',
                    border: 'border-white/10',
                    accent: 'bg-emerald-500' // Using emerald/gold hybrid feel? Or maybe modify slightly. For simplicity, reusing object structure.
                };
            default: // dark
                return {
                    bg: 'bg-[#0a0a0f]',
                    text: 'text-slate-200',
                    card: 'bg-slate-900/50',
                    border: 'border-white/5',
                    accent: 'bg-indigo-500'
                };
        }
    };

    const theme = getThemeClasses();

    // --- Data Fetching ---
    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: personalData, error: personalError } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (personalError) throw personalError;
            setNotes(personalData || []);

            const { data: sharedData, error: sharedError } = await supabase
                .from('notes')
                .select(`*, users:shared_by (id, name, email, avatar_url)`)
                .eq('is_shared', true)
                .contains('shared_with', [user.id])
                .order('shared_at', { ascending: false });

            if (sharedError) throw sharedError;
            setSharedNotes(sharedData || []);

        } catch (error) {
            console.error('Error fetching notes:', error);
            showToast('Failed to load notes', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const createNewNote = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newNote = {
                title: '',
                content: '',
                user_id: user.id,
                category: 'general',
                is_pinned: false,
                is_favorite: false,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('notes')
                .insert([newNote])
                .select()
                .single();

            if (error) throw error;

            setNotes([data, ...notes]);
            setSelectedNote(data);
            setSelectedNoteIds([]); // Clear selection on new note
            showToast('New note created', 'success');
        } catch (error) {
            console.error('Error creating note:', error);
            showToast('Failed to create note', 'error');
        }
    };

    const toggleNoteSelection = (noteId) => {
        setSelectedNoteIds(prev =>
            prev.includes(noteId)
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId]
        );
    };

    const clearSelection = () => {
        setSelectedNoteIds([]);
    };

    const toggleSelectAll = () => {
        if (selectedNoteIds.length === filteredNotes.length && filteredNotes.length > 0) {
            setSelectedNoteIds([]);
        } else {
            setSelectedNoteIds(filteredNotes.map(n => n.id));
        }
    };

    const updateNote = (noteId, updates) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates, updated_at: new Date().toISOString() } : n));
        if (selectedNote?.id === noteId) {
            setSelectedNote(prev => ({ ...prev, ...updates }));
        }
        setIsDirty(true);
    };

    const saveNote = async () => {
        if (!selectedNote || !isDirty) return;
        try {
            const { error } = await supabase
                .from('notes')
                .update({
                    title: selectedNote.title,
                    content: selectedNote.content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedNote.id);

            if (error) throw error;
            setIsDirty(false);
            showToast('Saved', 'success');
        } catch (error) {
            console.error('Error saving:', error);
            showToast('Failed to save', 'error');
        }
    };

    const deleteNote = async (noteId) => {
        try {
            const { error } = await supabase.from('notes').delete().eq('id', noteId);
            if (error) throw error;

            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (selectedNote?.id === noteId) setSelectedNote(null);
            setSelectedNoteIds(prev => prev.filter(id => id !== noteId));
            showToast('Note deleted', 'success');
        } catch (error) {
            console.error('Error deleting:', error);
            showToast('Failed to delete', 'error');
        }
    };

    const bulkDeleteNotes = async () => {
        if (selectedNoteIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedNoteIds.length} notes?`)) return;

        try {
            const { error } = await supabase.from('notes').delete().in('id', selectedNoteIds);
            if (error) throw error;

            setNotes(prev => prev.filter(n => !selectedNoteIds.includes(n.id)));
            if (selectedNote && selectedNoteIds.includes(selectedNote.id)) setSelectedNote(null);
            setSelectedNoteIds([]);
            showToast(`${selectedNoteIds.length} notes deleted`, 'success');
        } catch (error) {
            console.error('Error in bulk delete:', error);
            showToast('Failed to delete notes', 'error');
        }
    };

    const toggleFavorite = async (noteId, currentStatus) => {
        const newStatus = !currentStatus;
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_favorite: newStatus } : n));
        if (selectedNote?.id === noteId) {
            setSelectedNote(prev => ({ ...prev, is_favorite: newStatus }));
        }

        try {
            const { error } = await supabase.from('notes').update({ is_favorite: newStatus }).eq('id', noteId);
            if (error) throw error;
        } catch (error) {
            console.error('Error toggling fav:', error);
        }
    };

    const togglePin = async (noteId, currentStatus) => {
        const newStatus = !currentStatus;
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: newStatus } : n));
        if (selectedNote?.id === noteId) {
            setSelectedNote(prev => ({ ...prev, is_pinned: newStatus }));
        }

        try {
            const { error } = await supabase.from('notes').update({ is_pinned: newStatus }).eq('id', noteId);
            if (error) throw error;
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    // --- Share Functions ---
    const handleShareNote = (note) => {
        setShareNote(note);
        setShowShareModal(true);
    };

    const handleBulkShare = () => {
        if (selectedNoteIds.length === 0) return;
        const notesToShare = notes.filter(n => selectedNoteIds.includes(n.id));
        setShareNote(notesToShare); // Pass array instead of single note
        setShowShareModal(true);
    };

    const handleShareSuccess = (sharedUsers) => {
        // ... updates state as before, but handles array
        const sharedIds = Array.isArray(shareNote) ? shareNote.map(n => n.id) : [shareNote.id];

        setNotes(prevNotes =>
            prevNotes.map(n =>
                sharedIds.includes(n.id)
                    ? {
                        ...n,
                        is_shared: true,
                        shared_with: [...(n.shared_with || []), ...sharedUsers.map(u => u.userId)],
                        shared_at: new Date().toISOString()
                    }
                    : n
            )
        );

        if (selectedNote && sharedIds.includes(selectedNote.id)) {
            setSelectedNote(prev => ({
                ...prev,
                is_shared: true,
                shared_with: [...(prev.shared_with || []), ...sharedUsers.map(u => u.userId)],
                shared_at: new Date().toISOString()
            }));
        }

        showToast(`Shared with ${sharedUsers.length} member${sharedUsers.length > 1 ? 's' : ''}`, 'success');
    };

    // --- Filter Logic ---
    const getFilteredNotes = () => {
        let filtered = selectedFolder === 'shared' ? sharedNotes : notes;

        if (selectedFolder === 'favorites') {
            filtered = filtered.filter(n => n.is_favorite);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                (n.title?.toLowerCase() || '').includes(q) ||
                (n.content?.toLowerCase() || '').includes(q)
            );
        }
        return filtered;
    };

    const filteredNotes = getFilteredNotes();

    return (
        <div className={`flex h-screen ${theme.bg} ${theme.text} overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300`}>
            <ToastNotification toast={toast} onClose={() => setToast(null)} />

            {/* Pane 1: Folder Sidebar */}
            <NotesSidebar
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                isOpen={folderSidebarOpen}
                setIsOpen={setFolderSidebarOpen}
                theme={theme}
                themeMode={themeMode}
            />

            {/* Pane 2: Notes List */}
            <AnimatePresence initial={false}>
                {listSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex-shrink-0 overflow-hidden"
                    >
                        <NotesList
                            notes={filteredNotes}
                            selectedNote={selectedNote}
                            setSelectedNote={setSelectedNote}
                            selectedNoteIds={selectedNoteIds}
                            toggleNoteSelection={toggleNoteSelection}
                            toggleSelectAll={toggleSelectAll}
                            clearSelection={clearSelection}
                            onBulkDelete={bulkDeleteNotes}
                            onBulkShare={handleBulkShare}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onNewNote={createNewNote}
                            theme={theme}
                            themeMode={themeMode}
                            onToggleCollapse={() => setListSidebarOpen(false)}
                            onShareNote={handleShareNote}
                            onDeleteNote={deleteNote}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pane 3: Editor */}
            <div className={`flex-1 min-w-0 ${theme.bg} relative flex flex-col transition-colors duration-300`}>
                {/* Expand List Button (visible when list is collapsed) */}
                {!listSidebarOpen && (
                    <button
                        onClick={() => setListSidebarOpen(true)}
                        className={`absolute left-4 top-4 z-40 p-2 rounded-xl ${theme.card} ${theme.border} border shadow-lg hover:scale-105 transition-all flex items-center gap-2`}
                        title="Show Notes List"
                    >
                        <FiChevronRight className="w-4 h-4" />
                        <span className="text-xs font-medium">Library</span>
                    </button>
                )}

                {selectedNote ? (
                    <NotesEditor
                        note={selectedNote}
                        updateNote={updateNote}
                        saveNote={saveNote}
                        isDirty={isDirty}
                        onDelete={() => deleteNote(selectedNote.id)}
                        onToggleFavorite={() => toggleFavorite(selectedNote.id, selectedNote.is_favorite)}
                        onTogglePin={() => togglePin(selectedNote.id, selectedNote.is_pinned)}
                        theme={theme}
                        themeMode={themeMode}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <div className={`w-20 h-20 rounded-3xl ${theme.card} ${theme.border} border flex items-center justify-center mb-6`}>
                            <FiEdit3 className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium">Select a note to start editing</p>
                        <p className="text-sm mt-2 opacity-60">Or create a new one from the sidebar</p>
                    </div>
                )}
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
