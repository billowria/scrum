import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiFileText, FiHeart, FiShare2, FiClock, FiTag } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

import NoteSidebar from '../components/notes/NoteSidebar';
import NoteEditor from '../components/notes/NoteEditor';
import NoteSearch from '../components/notes/NoteSearch';
import ShareModal from '../components/notes/ShareModal';

const NotesPage = ({ sidebarOpen }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');

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
        .order(sortBy, { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newNote = {
        title: 'Untitled Note',
        content: '',
        user_id: user.id,
        is_favorite: false,
        is_shared: false,
        tags: []
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single();

      if (error) throw error;
      
      setNotes([data, ...notes]);
      setSelectedNote(data);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const toggleFavorite = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.map(n => 
        n.id === noteId ? { ...n, is_favorite: !n.is_favorite } : n
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NoteCard = ({ note }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200 ${
        selectedNote?.id === note.id ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      }`}
      onClick={() => setSelectedNote(note)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">{note.title || 'Untitled'}</h3>
          <p className="text-xs text-gray-500 mt-1">
            <FiClock className="inline w-3 h-3 mr-1" />
            {new Date(note.updated_at || note.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(note.id);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              note.is_favorite 
                ? 'bg-red-100 text-red-500' 
                : 'bg-gray-100 text-gray-400 hover:text-red-500'
            }`}
          >
            <FiHeart className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-current' : ''}`} />
          </motion.button>
        </div>
      </div>

      <div className="text-xs text-gray-600 line-clamp-2">
        {note.content || 'No content'}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700"
            >
              <FiTag className="w-2.5 h-2.5 mr-0.5" />
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiFileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
              <p className="text-xs text-gray-500">{filteredNotes.length} notes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiSearch className="w-4 h-4" />
            </motion.button>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <FiGrid className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <FiList className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* New Note */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createNewNote}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              New Note
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <NoteSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onClose={() => setShowSearch(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-[calc(100%-64px)]">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ${
          selectedNote ? 'w-80' : 'w-96'
        } bg-white border-r border-gray-200 overflow-hidden flex flex-col h-full`}>
          <NoteSidebar
            notes={filteredNotes}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            viewMode={viewMode}
            NoteCard={NoteCard}
            loading={loading}
          />
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onUpdate={(updatedNote) => {
                setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
                setSelectedNote(updatedNote);
              }}
              onShare={() => setShowShareModal(true)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a note to start editing</p>
                <p className="text-sm mt-2">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedNote && (
          <ShareModal
            note={selectedNote}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesPage;
