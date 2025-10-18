import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiHeart, FiShare2, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const NoteSidebar = ({ 
  notes, 
  selectedNote, 
  setSelectedNote, 
  viewMode, 
  NoteCard, 
  loading 
}) => {
  const [activeTab, setActiveTab] = useState('my-notes');
  const [expandedSections, setExpandedSections] = useState({
    'my-notes': true,
    'shared': true,
    'favorites': true
  });

  const myNotes = notes.filter(note => !note.is_shared);
  const sharedNotes = notes.filter(note => note.is_shared);
  const favoriteNotes = notes.filter(note => note.is_favorite);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const TabButton = ({ id, icon, label, count }) => (
    <motion.button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
        activeTab === id
          ? 'bg-primary-100 text-primary-700 border-primary-300'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
      } border-b-2`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
          activeTab === id
            ? 'bg-primary-200 text-primary-800'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </motion.button>
  );

  const SectionHeader = ({ title, icon, count, sectionId }) => (
    <motion.div
      className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(sectionId)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
        {count > 0 && (
          <span className="text-gray-500">({count})</span>
        )}
      </h3>
      <motion.div
        animate={{ rotate: expandedSections[sectionId] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {expandedSections[sectionId] ? (
          <FiChevronUp className="w-3 h-3 text-gray-500" />
        ) : (
          <FiChevronDown className="w-3 h-3 text-gray-500" />
        )}
      </motion.div>
    </motion.div>
  );

  const NotesList = ({ notesList, emptyMessage }) => (
    <div className="p-2">
      {notesList.length > 0 ? (
        <div className="space-y-1">
          <AnimatePresence>
            {notesList.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FiFileText className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <TabButton
          id="my-notes"
          icon={<FiFileText className="w-4 h-4" />}
          label="My Notes"
          count={myNotes.length}
        />
        <TabButton
          id="shared"
          icon={<FiShare2 className="w-4 h-4" />}
          label="Shared"
          count={sharedNotes.length}
        />
        <TabButton
          id="favorites"
          icon={<FiHeart className="w-4 h-4" />}
          label="Favorites"
          count={favoriteNotes.length}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'my-notes' && (
            <motion.div
              key="my-notes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {expandedSections['my-notes'] && (
                <>
                  <SectionHeader
                    title="My Notes"
                    icon={<FiFileText className="w-3 h-3" />}
                    count={myNotes.length}
                    sectionId="my-notes"
                  />
                  <NotesList
                    notesList={myNotes}
                    emptyMessage="No personal notes yet"
                  />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'shared' && (
            <motion.div
              key="shared"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {expandedSections['shared'] && (
                <>
                  <SectionHeader
                    title="Shared with Me"
                    icon={<FiShare2 className="w-3 h-3" />}
                    count={sharedNotes.length}
                    sectionId="shared"
                  />
                  <NotesList
                    notesList={sharedNotes}
                    emptyMessage="No shared notes yet"
                  />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {expandedSections['favorites'] && (
                <>
                  <SectionHeader
                    title="Favorite Notes"
                    icon={<FiHeart className="w-3 h-3 text-red-500 fill-current" />}
                    count={favoriteNotes.length}
                    sectionId="favorites"
                  />
                  <NotesList
                    notesList={favoriteNotes}
                    emptyMessage="No favorite notes yet"
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NoteSidebar;
