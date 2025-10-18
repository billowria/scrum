import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiFolder, FiUsers, FiCalendar, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp,
  FiSave, FiX, FiSearch, FiSettings, FiArrowLeft, FiBold, FiItalic, FiLink, FiImage,
  FiList, FiCode, FiEye, FiGrid, FiMoreVertical, FiClock, FiStar, FiFilter, FiRefreshCw,
  FiHome, FiBook, FiBookmark, FiFileText, FiMenu, FiCheck, FiAlertCircle, FiRotateCw,
  FiCornerUpLeft, FiCornerUpRight, FiCopy, FiArchive, FiTrendingUp
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../supabaseClient';
import { notifyProjectUpdate } from '../utils/notificationHelper';
import '../tiptap.css';

// Confluence-inspired color palette
const confluenceColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  }
};

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, y: -20 }
};

const sidebarVariants = {
  initial: { x: -300, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { x: -300, opacity: 0 }
};

// Inline Section Component
const InlineSection = ({ 
  section, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  isExpanded, 
  onToggle,
  onAddTopic,
  onReorder
}) => {
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description);
  const [isDragging, setIsDragging] = useState(false);

  const handleSave = () => {
    onSave({
      ...section,
      name,
      description
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
        isDragging ? 'shadow-lg border-blue-300' : ''
      }`}
      layout
      drag="y"
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
               onPointerDown={(e) => e.currentTarget.parentElement.parentElement.parentElement.dragStart()}>
            <FiRotateCw className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-xl font-semibold bg-transparent border-b-2 border-blue-500 outline-none focus:border-blue-600"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-gray-600 bg-transparent border-b border-gray-300 outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Section description..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <FiCheck className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="cursor-pointer" onClick={() => onToggle(section.id)}>
                <h3 className="text-xl font-semibold text-gray-900">{section.name}</h3>
                <p className="text-gray-600 mt-1">{section.description || 'No description'}</p>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddTopic(section.id)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add Topic"
              >
                <FiPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartEdit(section)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(section.id)}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggle(section.id)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Inline Topic Component
const InlineTopic = ({ 
  topic, 
  sectionId, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  isExpanded, 
  onToggle,
  onAddContent,
  onReorder
}) => {
  const [name, setName] = useState(topic.name);
  const [description, setDescription] = useState(topic.description);
  const [isDragging, setIsDragging] = useState(false);

  const handleSave = () => {
    onSave({
      ...topic,
      name,
      description
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div 
      className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${
        isDragging ? 'shadow-lg border-blue-300' : ''
      }`}
      layout
      drag="y"
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
               onPointerDown={(e) => e.currentTarget.parentElement.parentElement.parentElement.dragStart()}>
            <FiRotateCw className="w-4 h-4" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full font-semibold bg-transparent border-b-2 border-blue-500 outline-none focus:border-blue-600"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm text-gray-600 bg-transparent border-b border-gray-300 outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Topic description..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <FiCheck className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="cursor-pointer" onClick={() => onToggle(topic.id)}>
                <h5 className="font-semibold text-gray-900">{topic.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{topic.description || 'No description'}</p>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddContent(topic.id)}
                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                title="Add Content"
              >
                <FiPlus className="w-3 h-3" />
              </button>
              <button
                onClick={() => onStartEdit(topic)}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(topic.id, sectionId)}
                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onToggle(topic.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Inline Content Component
const InlineContent = ({ 
  content, 
  topicId, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel, 
  onDelete 
}) => {
  const [title, setTitle] = useState(content.title);
  const [contentText, setContentText] = useState(content.content);

  const handleSave = () => {
    onSave({
      ...content,
      title,
      content: contentText
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <motion.div 
      className="bg-white p-4 rounded-lg border border-gray-200"
      layout
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full font-semibold bg-transparent border-b-2 border-blue-500 outline-none focus:border-blue-600"
            autoFocus
          />
          <div className="min-h-[100px]">
            <RichTextEditor
              content={contentText}
              onChange={setContentText}
              placeholder="Start writing your content..."
              editable={true}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <FiCheck className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h6 className="font-semibold text-gray-900 text-sm">{content.title}</h6>
            <div className="mt-2 prose prose-sm max-w-none">
              <RichTextEditor
                content={content.content}
                onChange={() => {}}
                editable={false}
              />
            </div>
          </div>
          <div className="flex gap-1 ml-3">
            <button
              onClick={() => onStartEdit(content)}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <FiEdit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(content.id, topicId)}
              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Colorful Management Sidebar Component
const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onCreateProject,
  isMobile,
  isOpen,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    recent: true,
    tools: true,
    insights: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length
  };

  // Get recent projects for quick access
  const getRecentProjects = () => {
    if (!projects || projects.length === 0) return [];
    
    return projects
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);
  };

  const recentProjects = getRecentProjects();

  const sidebarSections = [
    {
      id: 'projects',
      title: 'All Projects',
      icon: FiFolder,
      count: projects.length,
      expanded: expandedSections.projects,
      onToggle: () => toggleSection('projects'),
      color: 'from-indigo-500 to-purple-600',
      items: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        icon: FiFolder,
        onClick: () => onProjectSelect(project),
        sectionsCount: Math.floor(Math.random() * 10) + 1, // Mock sections count
        topicsCount: Math.floor(Math.random() * 20) + 1, // Mock topics count
        lastUpdated: new Date(project.updated_at || project.created_at)
      }))
    },
    {
      id: 'recent',
      title: 'Recent Projects',
      icon: FiClock,
      count: recentProjects.length,
      expanded: expandedSections.recent,
      onToggle: () => toggleSection('recent'),
      color: 'from-amber-500 to-orange-600',
      items: recentProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        icon: FiClock,
        onClick: () => onProjectSelect(project),
        sectionsCount: Math.floor(Math.random() * 10) + 1,
        topicsCount: Math.floor(Math.random() * 20) + 1,
        lastUpdated: new Date(project.updated_at || project.created_at)
      }))
    }
  ];

  const managementTools = [
    {
      id: 'templates',
      name: 'Project Templates',
      description: 'Create projects from templates',
      icon: FiFileText,
      color: 'from-blue-500 to-cyan-600',
      count: 5 // Mock template count
    },
    {
      id: 'analytics',
      name: 'Project Analytics',
      description: 'View project performance metrics',
      icon: FiTrendingUp,
      color: 'from-green-500 to-emerald-600',
      count: null
    },
    {
      id: 'archive',
      name: 'Project Archive',
      description: 'Manage archived projects',
      icon: FiArchive,
      color: 'from-gray-500 to-slate-600',
      count: projectStats.archived
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100/20', text: 'text-green-300', border: 'border-green-400/30' };
      case 'completed':
        return { bg: 'bg-blue-100/20', text: 'text-blue-300', border: 'border-blue-400/30' };
      case 'archived':
        return { bg: 'bg-gray-100/20', text: 'text-gray-300', border: 'border-gray-400/30' };
      default:
        return { bg: 'bg-gray-100/20', text: 'text-gray-300', border: 'border-gray-400/30' };
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      
      <motion.aside
        className={`bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white h-full overflow-hidden flex flex-col shadow-2xl ${
          isMobile
            ? `fixed left-0 top-0 z-50 w-80 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-80 relative'
        }`}
        variants={isMobile ? {} : sidebarVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Sidebar Header with Gradient */}
        <div className="relative p-6 border-b border-indigo-800/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20 rounded-lg" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.3),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Project Manager
              </h2>
              <div className="flex items-center gap-2">
                {isMobile && (
                  <button
                    onClick={onClose}
                    className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
                <button className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <FiSettings className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Project Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg p-3 border border-indigo-500/30">
                <div className="text-2xl font-bold text-indigo-300">{projectStats.total}</div>
                <div className="text-xs text-indigo-400">Total</div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg p-3 border border-green-500/30">
                <div className="text-2xl font-bold text-green-300">{projectStats.active}</div>
                <div className="text-xs text-green-400">Active</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <button
              onClick={onCreateProject}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium shadow-lg shadow-indigo-500/25"
            >
              <FiPlus className="w-4 h-4" />
              Create New Project
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.id} className="space-y-2">
              <motion.button
                onClick={section.onToggle}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r ${section.color} bg-opacity-10 hover:bg-opacity-20 border border-opacity-20 border-white/10`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color}`}>
                    <section.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    {section.count}
                  </span>
                  <motion.div
                    animate={{ rotate: section.expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-4 h-4 text-white/70" />
                  </motion.div>
                </div>
              </motion.button>
              
              <AnimatePresence>
                {section.expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 pl-2 overflow-hidden"
                  >
                    {section.items.map((item) => (
                      <motion.button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                          selectedProject?.id === item.id
                            ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30'
                            : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent hover:border-slate-600/30'
                        }`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color} bg-opacity-80`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-slate-400 truncate">{item.description}</div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <FiBook className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">{item.sectionsCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiFileText className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">{item.topicsCount}</span>
                            </div>
                            <div className="flex-1 text-right">
                              <span className="text-xs text-slate-400">{formatDate(item.lastUpdated)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status).bg} ${getStatusColor(item.status).text} ${getStatusColor(item.status).border}`}>
                          {item.status}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          
          {/* Management Tools Section */}
          <div className="mt-6">
            <motion.button
              onClick={() => toggleSection('tools')}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-rose-500 to-pink-600 bg-opacity-10 hover:bg-opacity-20 border border-opacity-20 border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600">
                  <FiSettings className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Management Tools</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.tools ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-4 h-4 text-white/70" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.tools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2 pl-2 overflow-hidden"
                >
                  {managementTools.map((tool, index) => (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-700/50 border border-transparent hover:border-slate-600/30"
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${tool.color} bg-opacity-80`}>
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{tool.name}</div>
                        <div className="text-xs text-slate-400">{tool.description}</div>
                      </div>
                      {tool.count !== null && (
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          {tool.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Project Insights Section */}
          <div className="mt-6">
            <motion.button
              onClick={() => toggleSection('insights')}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 bg-opacity-10 hover:bg-opacity-20 border border-opacity-20 border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
                  <FiTrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Project Insights</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.insights ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-4 h-4 text-white/70" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.insights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Most Active Project</span>
                      <span className="text-sm font-medium text-white">Website Redesign</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Sections</span>
                      <span className="text-sm font-medium text-white">{projectStats.total * 5}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Topics</span>
                      <span className="text-sm font-medium text-white">{projectStats.total * 12}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Completion Rate</span>
                      <span className="text-sm font-medium text-white">68%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-indigo-800/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
              <FiSettings className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Workspace Settings</div>
              <div className="text-xs text-slate-400">Manage your projects</div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// Rich Text Editor Component
const RichTextEditor = ({ content, onChange, placeholder, editable = true }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap',
        placeholder: placeholder || 'Start typing...'
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      {editable && (
        <div className="flex items-center gap-1 p-2 border border-gray-200 rounded-t-lg bg-gray-50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Bold"
          >
            <FiBold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Italic"
          >
            <FiItalic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Heading 3"
          >
            H3
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Bullet List"
          >
            <FiList className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Ordered List"
          >
            <FiList className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Code Block"
          >
            <FiCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
            }`}
            title="Quote"
          >
            "
          </button>
        </div>
      )}
      <div className={`border border-t-0 border-gray-200 rounded-b-lg overflow-hidden ${
        !editable ? 'rounded-t-lg' : ''
      }`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// Main ProjectManagementPage Component
export default function ProjectManagementPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const autoSaveTimeoutRef = useRef(null);

  // Project form states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    id: null,
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [projectFormError, setProjectFormError] = useState('');
  const [projectFormLoading, setProjectFormLoading] = useState(false);

  // Sections and topics states
  const [sections, setSections] = useState([]);
  const [topics, setTopics] = useState({});
  const [contents, setContents] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});

  // Inline editing states
  const [editingSection, setEditingSection] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingContent, setEditingContent] = useState(null);

  // Add new item states
  const [addingSection, setAddingSection] = useState(false);
  const [addingTopic, setAddingTopic] = useState(null);
  const [addingContent, setAddingContent] = useState(null);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, team_id, manager_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCurrentUser(data);
        setUserRole(data.role);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError('Failed to load user data');
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments!inner(
            user_id,
            role_in_project
          ),
          created_by_user:users!projects_created_by_fkey(
            id,
            name
          )
        `)
        .eq('project_assignments.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Set selected project based on URL param or first project
      if (projectId) {
        const project = data?.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
        }
      } else if (data?.length > 0) {
        setSelectedProject(data[0]);
        navigate(`/project-management/${data[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load projects when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // Update URL when selected project changes
  useEffect(() => {
    if (selectedProject) {
      navigate(`/project-management/${selectedProject.id}`, { replace: true });
    }
  }, [selectedProject, navigate]);

  // Fetch sections for selected project
  const fetchSections = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('order');
      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  // Fetch topics for section
  const fetchTopics = async (sectionId) => {
    try {
      const { data, error } = await supabase
        .from('project_topics')
        .select('*')
        .eq('section_id', sectionId)
        .order('order');
      if (error) throw error;
      setTopics(prev => ({ ...prev, [sectionId]: data || [] }));
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  // Fetch content for topic
  const fetchContent = async (topicId) => {
    try {
      const { data, error } = await supabase
        .from('project_topic_content')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at');
      if (error) throw error;
      setContents(prev => ({ ...prev, [topicId]: data || [] }));
    } catch (err) {
      console.error('Error fetching content:', err);
    }
  };

  // Fetch sections when project selected
  useEffect(() => {
    if (selectedProject) {
      fetchSections(selectedProject.id);
      setActiveTab('overview');
    }
  }, [selectedProject]);

  // Auto-save functionality
  const triggerAutoSave = (callback) => {
    setAutoSaveStatus('saving');
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await callback();
        setAutoSaveStatus('saved');
      } catch (err) {
        setAutoSaveStatus('error');
        console.error('Auto-save failed:', err);
      }
    }, 1000);
  };

  // Create or update project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    setProjectFormLoading(true);
    setProjectFormError('');
    try {
      if (!projectForm.name) {
        setProjectFormError('Project name is required.');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        start_date: projectForm.start_date || null,
        end_date: projectForm.end_date || null,
        status: projectForm.status,
      };
      let isUpdate = !!projectForm.id;
      
      if (projectForm.id) {
        const { error } = await supabase.from('projects').update(projectData).eq('id', projectForm.id);
        if (error) throw error;
      } else {
        projectData.created_by = user.id;
        const { data, error } = await supabase.from('projects').insert(projectData).select();
        if (error) throw error;
        
        // Assign creator to the project
        if (data && data[0]) {
          await supabase.from('project_assignments').insert({
            project_id: data[0].id,
            user_id: user.id,
            role_in_project: 'manager'
          });
        }
      }
      
      setShowProjectModal(false);
      setProjectForm({ id: null, name: '', description: '', start_date: '', end_date: '', status: 'active' });
      fetchProjects();
    } catch (err) {
      setProjectFormError('Failed to save project.');
    } finally {
      setProjectFormLoading(false);
    }
  };

  // Create or update section
  const handleSaveSection = async (sectionData) => {
    try {
      if (sectionData.id) {
        const { error } = await supabase.from('project_sections').update(sectionData).eq('id', sectionData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_sections').insert(sectionData);
        if (error) throw error;
      }
      setEditingSection(null);
      setAddingSection(false);
      fetchSections(selectedProject.id);
    } catch (err) {
      console.error('Error saving section:', err);
    }
  };

  // Create or update topic
  const handleSaveTopic = async (topicData) => {
    try {
      if (topicData.id) {
        const { error } = await supabase.from('project_topics').update(topicData).eq('id', topicData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_topics').insert(topicData);
        if (error) throw error;
      }
      setEditingTopic(null);
      setAddingTopic(null);
      fetchTopics(topicData.section_id);
    } catch (err) {
      console.error('Error saving topic:', err);
    }
  };

  // Create or update content
  const handleSaveContent = async (contentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dataToSave = {
        topic_id: contentData.topic_id,
        title: contentData.title,
        content: contentData.content,
        created_by: user.id,
      };
      
      if (contentData.id) {
        dataToSave.updated_at = new Date().toISOString();
        const { error } = await supabase.from('project_topic_content').update(dataToSave).eq('id', contentData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_topic_content').insert(dataToSave);
        if (error) throw error;
      }
      setEditingContent(null);
      setAddingContent(null);
      fetchContent(contentData.topic_id);
    } catch (err) {
      console.error('Error saving content:', err);
    }
  };

  // Delete functions
  const handleDeleteSection = async (sectionId) => {
    try {
      const { error } = await supabase.from('project_sections').delete().eq('id', sectionId);
      if (error) throw error;
      fetchSections(selectedProject.id);
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  };

  const handleDeleteTopic = async (topicId, sectionId) => {
    try {
      const { error } = await supabase.from('project_topics').delete().eq('id', topicId);
      if (error) throw error;
      fetchTopics(sectionId);
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  const handleDeleteContent = async (contentId, topicId) => {
    try {
      const { error } = await supabase.from('project_topic_content').delete().eq('id', contentId);
      if (error) throw error;
      fetchContent(topicId);
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // Toggle expansion functions
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    if (!expandedSections[sectionId]) fetchTopics(sectionId);
  };

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
    if (!expandedTopics[topicId]) fetchContent(topicId);
  };

  // Edit functions
  const handleEditProject = (project) => {
    setProjectForm({
      id: project.id,
      name: project.name,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status
    });
    setShowProjectModal(true);
  };

  // Inline add section
  const handleAddSection = () => {
    setAddingSection(true);
    setEditingSection({
      id: null,
      name: '',
      description: '',
      project_id: selectedProject.id,
      order: sections.length
    });
  };

  // Inline add topic
  const handleAddTopic = (sectionId) => {
    setAddingTopic(sectionId);
    setEditingTopic({
      id: null,
      name: '',
      description: '',
      section_id: sectionId,
      order: topics[sectionId]?.length || 0
    });
  };

  // Inline add content
  const handleAddContent = (topicId) => {
    setAddingContent(topicId);
    setEditingContent({
      id: null,
      title: '',
      content: '',
      topic_id: topicId
    });
  };

  // Reorder functions
  const handleReorderSections = (newSections) => {
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));
    
    setSections(updatedSections);
    
    // Update in database
    updatedSections.forEach(async (section) => {
      try {
        await supabase
          .from('project_sections')
          .update({ order: section.order })
          .eq('id', section.id);
      } catch (err) {
        console.error('Error reordering sections:', err);
      }
    });
  };

  const handleReorderTopics = (sectionId, newTopics) => {
    const updatedTopics = newTopics.map((topic, index) => ({
      ...topic,
      order: index
    }));
    
    setTopics(prev => ({ ...prev, [sectionId]: updatedTopics }));
    
    // Update in database
    updatedTopics.forEach(async (topic) => {
      try {
        await supabase
          .from('project_topics')
          .update({ order: topic.order })
          .eq('id', topic.id);
      } catch (err) {
        console.error('Error reordering topics:', err);
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project management...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <motion.button
            onClick={fetchProjects}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout Container */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <ProjectSidebar
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          onCreateProject={() => {
            setProjectForm({ id: null, name: '', description: '', start_date: '', end_date: '', status: 'active' });
            setShowProjectModal(true);
          }}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <motion.header
            className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 lg:py-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiMenu className="w-5 h-5" />
                  </button>
                )}
                
                {/* Back Button */}
                <button
                  onClick={() => navigate('/projects')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {selectedProject ? selectedProject.name : 'Select a Project'}
                  </h1>
                  <p className="text-sm lg:text-base text-gray-600">
                    {selectedProject ? 'Manage your project content and structure' : 'Choose a project to start managing'}
                  </p>
                </div>
              </div>
              
              {/* Auto-save Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  {autoSaveStatus === 'saved' && (
                    <>
                      <FiCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Saved</span>
                    </>
                  )}
                  {autoSaveStatus === 'saving' && (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <FiAlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Error</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.header>

          {/* Project Content */}
          {selectedProject ? (
            <motion.main
              className="flex-1 overflow-y-auto"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Tab Navigation */}
              <div className="bg-white border-b border-gray-200 px-4 lg:px-8">
                <div className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: FiHome },
                    { id: 'sections', label: 'Sections', icon: FiBook },
                    { id: 'content', label: 'Content', icon: FiFileText },
                    { id: 'settings', label: 'Settings', icon: FiSettings }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 lg:p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Project Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.name}</h2>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              selectedProject.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedProject.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedProject.status}
                            </span>
                            {selectedProject.start_date && (
                              <span>Start: {new Date(selectedProject.start_date).toLocaleDateString()}</span>
                            )}
                            {selectedProject.end_date && (
                              <span>End: {new Date(selectedProject.end_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditProject(selectedProject)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="prose max-w-none">
                        {selectedProject.description ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedProject.description }} />
                        ) : (
                          <RichTextEditor
                            content=""
                            onChange={(html) => {
                              setSelectedProject(prev => ({ ...prev, description: html }));
                              triggerAutoSave(async () => {
                                await supabase.from('projects').update({ description: html }).eq('id', selectedProject.id);
                              });
                            }}
                            placeholder="Add a project description..."
                            editable={true}
                          />
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiBook className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{sections.length}</div>
                            <div className="text-sm text-gray-600">Sections</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiFileText className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {Object.values(topics).flat().length}
                            </div>
                            <div className="text-sm text-gray-600">Topics</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FiUsers className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {selectedProject.project_assignments?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Members</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sections Tab */}
                {activeTab === 'sections' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Project Sections</h2>
                      <button
                        onClick={handleAddSection}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Section
                      </button>
                    </div>

                    {sections.length === 0 && !addingSection ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiBook className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections yet</h3>
                        <p className="text-gray-600 mb-6">Create your first section to organize your project content.</p>
                        <button
                          onClick={handleAddSection}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                          Create Section
                        </button>
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={sections}
                        onReorder={handleReorderSections}
                        className="space-y-4"
                      >
                        {sections.map((section) => (
                          <Reorder.Item key={section.id} value={section}>
                            <InlineSection
                              section={section}
                              isEditing={editingSection?.id === section.id}
                              onStartEdit={() => setEditingSection(section)}
                              onSave={handleSaveSection}
                              onCancel={() => {
                                setEditingSection(null);
                                if (addingSection) setAddingSection(false);
                              }}
                              onDelete={handleDeleteSection}
                              isExpanded={expandedSections[section.id]}
                              onToggle={toggleSection}
                              onAddTopic={handleAddTopic}
                              onReorder={handleReorderSections}
                            />
                            
                            {/* Topics Section */}
                            <AnimatePresence>
                              {expandedSections[section.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-gray-200"
                                >
                                  <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-medium text-gray-700">Topics</h4>
                                      <button
                                        onClick={() => handleAddTopic(section.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                                      >
                                        <FiPlus className="w-3 h-3" />
                                        Add Topic
                                      </button>
                                    </div>
                                    
                                    {/* Add new topic inline */}
                                    {addingTopic === section.id && (
                                      <div className="mb-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                        <div className="space-y-3">
                                          <input
                                            type="text"
                                            placeholder="Topic name..."
                                            className="w-full font-semibold bg-transparent border-b-2 border-blue-500 outline-none focus:border-blue-600"
                                            autoFocus
                                            onChange={(e) => setEditingTopic(prev => ({ ...prev, name: e.target.value }))}
                                          />
                                          <textarea
                                            placeholder="Topic description..."
                                            className="w-full text-sm bg-transparent border-b border-gray-300 outline-none focus:border-blue-500 resize-none"
                                            rows={2}
                                            onChange={(e) => setEditingTopic(prev => ({ ...prev, description: e.target.value }))}
                                          />
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleSaveTopic(editingTopic)}
                                              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                              <FiCheck className="w-3 h-3" />
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingTopic(null);
                                                setEditingTopic(null);
                                              }}
                                              className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {topics[section.id]?.length === 0 && addingTopic !== section.id ? (
                                      <div className="text-center py-8 text-gray-500">
                                        <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No topics yet. Add your first topic to this section.</p>
                                      </div>
                                    ) : (
                                      <Reorder.Group
                                        axis="y"
                                        values={topics[section.id] || []}
                                        onReorder={(newTopics) => handleReorderTopics(section.id, newTopics)}
                                        className="space-y-3"
                                      >
                                        {(topics[section.id] || []).map((topic) => (
                                          <Reorder.Item key={topic.id} value={topic}>
                                            <InlineTopic
                                              topic={topic}
                                              sectionId={section.id}
                                              isEditing={editingTopic?.id === topic.id}
                                              onStartEdit={() => setEditingTopic(topic)}
                                              onSave={handleSaveTopic}
                                              onCancel={() => {
                                                setEditingTopic(null);
                                                if (addingTopic === section.id) setAddingTopic(null);
                                              }}
                                              onDelete={handleDeleteTopic}
                                              isExpanded={expandedTopics[topic.id]}
                                              onToggle={toggleTopic}
                                              onAddContent={handleAddContent}
                                              onReorder={(newTopics) => handleReorderTopics(section.id, newTopics)}
                                            />
                                            
                                            {/* Content Section */}
                                            <AnimatePresence>
                                              {expandedTopics[topic.id] && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  className="border-t border-gray-200 bg-gray-50"
                                                >
                                                  <div className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                      <h6 className="font-medium text-gray-700 text-sm">Content</h6>
                                                      <button
                                                        onClick={() => handleAddContent(topic.id)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors"
                                                      >
                                                        <FiPlus className="w-3 h-3" />
                                                        Add Content
                                                      </button>
                                                    </div>
                                                    
                                                    {/* Add new content inline */}
                                                    {addingContent === topic.id && (
                                                      <div className="mb-3 p-3 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                                                        <div className="space-y-2">
                                                          <input
                                                            type="text"
                                                            placeholder="Content title..."
                                                            className="w-full font-semibold bg-transparent border-b-2 border-indigo-500 outline-none focus:border-indigo-600"
                                                            autoFocus
                                                            onChange={(e) => setEditingContent(prev => ({ ...prev, title: e.target.value }))}
                                                          />
                                                          <div className="min-h-[80px]">
                                                            <RichTextEditor
                                                              content=""
                                                              onChange={(html) => setEditingContent(prev => ({ ...prev, content: html }))}
                                                              placeholder="Start writing your content..."
                                                              editable={true}
                                                            />
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <button
                                                              onClick={() => handleSaveContent(editingContent)}
                                                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                                            >
                                                              <FiCheck className="w-3 h-3" />
                                                              Save
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                setAddingContent(null);
                                                                setEditingContent(null);
                                                              }}
                                                              className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition-colors"
                                                            >
                                                              Cancel
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                    
                                                    {contents[topic.id]?.length === 0 && addingContent !== topic.id ? (
                                                      <div className="text-center py-6 text-gray-500">
                                                        <FiFileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                        <p className="text-sm">No content yet. Add your first content item.</p>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-2">
                                                        {(contents[topic.id] || []).map((content) => (
                                                          <InlineContent
                                                            key={content.id}
                                                            content={content}
                                                            topicId={topic.id}
                                                            isEditing={editingContent?.id === content.id}
                                                            onStartEdit={() => setEditingContent(content)}
                                                            onSave={handleSaveContent}
                                                            onCancel={() => {
                                                              setEditingContent(null);
                                                              if (addingContent === topic.id) setAddingContent(null);
                                                            }}
                                                            onDelete={handleDeleteContent}
                                                          />
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </Reorder.Item>
                                        ))}
                                      </Reorder.Group>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    )}
                  </motion.div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Content Editor</h2>
                      <RichTextEditor
                        content=""
                        onChange={(html) => {
                          triggerAutoSave(async () => {
                            // Save content logic here
                            console.log('Saving content:', html);
                          });
                        }}
                        placeholder="Start creating rich content..."
                        editable={true}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Project Settings</h2>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">General Settings</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Project Status</h4>
                                <p className="text-sm text-gray-600">Change the status of this project</p>
                              </div>
                              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-6 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Danger Zone</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-red-900">Delete Project</h4>
                                <p className="text-sm text-red-600">Permanently delete this project and all its content</p>
                              </div>
                              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                Delete Project
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.main>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiFolder className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Project Selected</h3>
                <p className="text-gray-600 mb-6">
                  Select a project from the sidebar to start managing its content.
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Open Projects
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">
                {projectForm.id ? 'Edit Project' : 'Create New Project'}
              </h2>
              <form onSubmit={handleSaveProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={projectForm.start_date}
                        onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={projectForm.end_date}
                        onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                {projectFormError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {projectFormError}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    onClick={() => setShowProjectModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={projectFormLoading}
                  >
                    {projectFormLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}