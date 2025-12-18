import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiPlus,
  FiMenu,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import RichTextEditor from './RichTextEditor';
import { validateSectionForm } from '../utils/projectHelpers';

const InlineSectionEditor = ({
  section,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  onAddTopic,
  isExpanded,
  onToggle,
  topics = [],
  currentUser,
  canEdit = false,
  isDragging = false,
  onSelectTopic,
  selectedTopic
}) => {
  const [formData, setFormData] = useState({
    name: section?.name || '',
    description: section?.description || ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (section) {
      setFormData({
        name: section.name || '',
        description: section.description || ''
      });
    }
  }, [section]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    const validation = validateSectionForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...section,
        ...formData
      });
    } catch (error) {
      console.error('Error saving section:', error);
      setErrors({ general: 'Failed to save section. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: section?.name || '',
      description: section?.description || ''
    });
    setErrors({});
    onCancel?.();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this section and all its topics? This action cannot be undone.')) {
      try {
        await onDelete(section.id);
      } catch (error) {
        console.error('Error deleting section:', error);
        alert('Failed to delete section. Please try again.');
      }
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.name.trim()) {
      alert('Topic name is required');
      return;
    }

    try {
      await onAddTopic({
        name: newTopic.name.trim(),
        description: newTopic.description.trim(),
        section_id: section.id
      });

      setNewTopic({ name: '', description: '' });
      setShowTopicForm(false);
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Failed to add topic. Please try again.');
    }
  };

  return (
    <motion.div
      className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm ${isDragging ? 'shadow-lg rotate-1 scale-105' : 'hover:shadow-md'
        } transition-all duration-200`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <FiMenu className="w-5 h-5" />
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggle(section.id)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {isExpanded ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
        </button>

        {/* Section Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full text-lg font-semibold bg-transparent border-b-2 outline-none transition-colors text-gray-900 dark:text-white ${errors.name ? 'border-red-500' : 'border-blue-500 focus:border-blue-600'
                  }`}
                placeholder="Section name..."
                autoFocus
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}

              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange('description', content)}
                placeholder="Section description (optional)..."
                editable={true}
                showToolbar={false}
                minHeight="60px"
                className="text-sm"
              />

              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}

              {errors.general && (
                <p className="text-red-500 text-sm">{errors.general}</p>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{section.name}</h3>
              {section.description && (
                <div
                  className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.description }}
                />
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit-actions"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    <FiSave className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="view-actions"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <button
                    onClick={() => onStartEdit(section)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Topic Count Badge */}
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>
      </div>

      {/* Topics List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 dark:border-slate-800"
          >
            <div className="p-4 space-y-2 bg-gray-50 dark:bg-slate-800/50">
              {topics.length === 0 && !showTopicForm ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="mb-3">No topics yet in this section</p>
                  {canEdit && (
                    <button
                      onClick={() => setShowTopicForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add First Topic
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Add Topic Form */}
                  {canEdit && showTopicForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newTopic.name}
                          onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Topic name..."
                          autoFocus
                        />
                        <RichTextEditor
                          content={newTopic.description}
                          onChange={(content) => setNewTopic(prev => ({ ...prev, description: content }))}
                          placeholder="Topic description (optional)..."
                          editable={true}
                          showToolbar={false}
                          minHeight="60px"
                          className="text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleAddTopic}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Add Topic
                          </button>
                          <button
                            onClick={() => {
                              setShowTopicForm(false);
                              setNewTopic({ name: '', description: '' });
                            }}
                            className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Topics List */}
                  <div className="space-y-2">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => onSelectTopic && onSelectTopic(topic)}
                        className={`p-3 border rounded-lg transition-colors cursor-pointer ${selectedTopic?.id === topic.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedTopic?.id === topic.id ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                            <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${selectedTopic?.id === topic.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                              }`}>{topic.name}</h4>
                            {topic.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{topic.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {topic.project_topic_content && topic.project_topic_content.length > 0 && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                ✓ {topic.project_topic_content.length} {topic.project_topic_content.length === 1 ? 'item' : 'items'}
                              </span>
                            )}
                            <FiChevronRight className={`w-4 h-4 ${selectedTopic?.id === topic.id ? 'text-blue-500' : 'text-gray-400'
                              }`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Topic Button */}
                  {canEdit && !showTopicForm && topics.length > 0 && (
                    <button
                      onClick={() => setShowTopicForm(true)}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Topic
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InlineSectionEditor;