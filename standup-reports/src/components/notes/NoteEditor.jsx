import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiShare2, FiMoreVertical, FiBold, FiItalic, FiList, FiLink, FiImage } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

const NoteEditor = ({ note, onUpdate, onShare }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [saving, setSaving] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note]);

  const saveNote = async () => {
    if (!note) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);

      if (error) throw error;

      onUpdate({
        ...note,
        title,
        content,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const insertText = (text) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.substring(0, start) + text + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note?.title || content !== note?.content) {
        saveNote();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, note]);

  if (!note) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-white">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none flex-1 placeholder-gray-400"
            placeholder="Note title..."
          />
          
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Share note"
            >
              <FiShare2 className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveNote}
              disabled={saving}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
            >
              <FiSave className="w-3.5 h-3.5" />
              Save
            </motion.button>
          </div>
        </div>
      </div>

      {/* Simple Toolbar */}
      {showToolbar && (
        <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              title="Bold"
            >
              <FiBold className="w-3.5 h-3.5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              title="Italic"
            >
              <FiItalic className="w-3.5 h-3.5" />
            </motion.button>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              title="Bullet list"
            >
              <FiList className="w-3.5 h-3.5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              title="Link"
            >
              <FiLink className="w-3.5 h-3.5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              title="Image"
            >
              <FiImage className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full resize-none outline-none text-gray-700 leading-relaxed placeholder-gray-400 font-mono text-sm"
          placeholder="Start writing your note..."
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Last updated: {new Date(note.updated_at || note.created_at).toLocaleString()}
          </span>
          <span>
            {content.length} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
