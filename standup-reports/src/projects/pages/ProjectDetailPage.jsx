import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FiFolder, FiUsers, FiCalendar, FiArrowLeft, FiBookOpen, FiFileText,
  FiClock, FiUser, FiChevronDown, FiHome,
  FiRefreshCw, FiLayers, FiAlertCircle, FiSettings, FiEdit2, FiSave,
  FiX, FiPlus, FiEye, FiEdit3
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import ContentLoader from '../../components/ContentLoader';
import Avatar, { AvatarGroup } from '../../components/shared/Avatar';
import LoadingSkeleton, { SkeletonCard } from '../../components/shared/LoadingSkeleton';

// Import new project components and hooks
import { useRolePermissions } from '../hooks/useRolePermissions';
import { useProjectManagement } from '../hooks/useProjectManagement';
import RichTextEditor from '../components/RichTextEditor';
import InlineSectionEditor from '../components/InlineSectionEditor';
import { getStatusConfig, formatDate, validateProjectForm } from '../utils/projectHelpers';

// Import design system
import { colors, animations, shadows, breakpoints, typography } from '../../config/designSystem';

// ============================================
// CONFLUENCE-INSPIRED DESIGN SYSTEM
// ============================================

// Professional color palette for Confluence-like UI
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

// ============================================
// PROJECT HEADER COMPONENT
// ============================================

const ProjectHeader = ({
  project,
  projectForm,
  setProjectForm,
  projectFormErrors,
  setProjectFormErrors,
  onProjectDescriptionChange,
  onRefresh,
  loading,
  teamMembers = [],
  editMode,
  canEditProject,
  currentUser
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500',
          label: 'Active'
        };
      case 'completed':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          label: 'Completed'
        };
      case 'archived':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          label: 'Archived'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          label: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(project?.status);
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.header
      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 lg:p-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FiFolder className="w-8 h-8" />
          </div>
          <div className="flex-1">
            {editMode ? (
              <div className="space-y-4">
                {/* Project Name Input */}
                <div>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`text-2xl lg:text-3xl font-bold bg-transparent border-b-2 outline-none transition-colors ${
                      projectFormErrors.name ? 'border-red-400' : 'border-white/60 focus:border-white'
                    } text-white placeholder-white/60 w-full`}
                    placeholder="Project name..."
                  />
                  {projectFormErrors.name && (
                    <p className="text-red-200 text-sm mt-1">{projectFormErrors.name}</p>
                  )}
                </div>

                {/* Project Description Editor */}
                <div>
                  <RichTextEditor
                    content={projectForm.description}
                    onChange={onProjectDescriptionChange}
                    placeholder="Project description..."
                    editable={true}
                    showToolbar={false}
                    minHeight="60px"
                    className="text-blue-100 prose prose-invert max-w-none"
                  />
                  {projectFormErrors.description && (
                    <p className="text-red-200 text-sm mt-1">{projectFormErrors.description}</p>
                  )}
                </div>

                {/* Project Dates and Status */}
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-xs text-blue-200 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="px-3 py-1 bg-white/20 border border-white/30 rounded text-white placeholder-white/60 focus:outline-none focus:border-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-200 mb-1">End Date</label>
                    <input
                      type="date"
                      value={projectForm.end_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="px-3 py-1 bg-white/20 border border-white/30 rounded text-white placeholder-white/60 focus:outline-none focus:border-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-200 mb-1">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-1 bg-white/20 border border-white/30 rounded text-white focus:outline-none focus:border-white/60"
                    >
                      <option value="active" className="text-gray-900">Active</option>
                      <option value="completed" className="text-gray-900">Completed</option>
                      <option value="archived" className="text-gray-900">Archived</option>
                      <option value="on_hold" className="text-gray-900">On Hold</option>
                    </select>
                  </div>
                </div>

                {/* Error Message */}
                {projectFormErrors.general && (
                  <p className="text-red-200 text-sm">{projectFormErrors.general}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold">{project?.name}</h1>
                  {statusConfig && (
                    <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                      <div className={`w-2 h-2 ${statusConfig.dot} rounded-full`} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-base">
                  {project?.description ? (
                    <span dangerouslySetInnerHTML={{ __html: project.description }} />
                  ) : (
                    <span className="text-blue-200 italic">No description provided</span>
                  )}
                </p>
                <div className="flex items-center gap-6 mt-3 text-sm text-blue-100">
                  <span className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    {formatDate(project?.start_date)} - {formatDate(project?.end_date)}
                  </span>
                  <span className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    {teamMembers.length} members
                  </span>
                  {project?.created_by_user && (
                    <span className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      Created by {project.created_by_user.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Edit mode indicator - controlled from ProjectCard */}
          {editMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-white font-medium">Edit Mode</span>
            </div>
          )}

          {/* Refresh Button */}
          <motion.button
            onClick={onRefresh}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh project"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Auto-save status removed - controlled from ProjectCard */}
        </div>
      </div>
    </motion.header>
  );
};

// ============================================
// BREADCRUMB COMPONENT
// ============================================

const Breadcrumb = ({ projectName }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link to="/projects" className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
            <FiHome className="w-4 h-4" />
            Projects
          </Link>
        </li>
        <li className="text-gray-400">/</li>
        <li className="text-gray-900 font-medium">{projectName}</li>
      </ol>
    </nav>
  );
};

// ============================================
// PROJECT SECTIONS SIDEBAR
// ============================================

const ProjectSectionsSidebar = ({
  sections,
  sectionsLoading,
  expandedSections,
  onToggleSection,
  selectedTopic,
  onSelectTopic,
  isMobile,
  isOpen,
  onClose
}) => {
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
        className={`bg-white border-r border-gray-200 h-full overflow-hidden flex flex-col ${
          isMobile
            ? `fixed left-0 top-0 z-50 w-80 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-80 relative'
        }`}
        variants={isMobile ? {} : sidebarVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FiLayers className="text-blue-600" />
              Project Sections
            </h2>
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sectionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8">
              <FiBookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sections available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onToggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiBookOpen className="text-blue-600 w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{section.name}</h4>
                        {section.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">{section.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {section.project_topics?.length || 0}
                      </span>
                      <FiChevronDown 
                        className={`w-4 h-4 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSections[section.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="p-4 space-y-2">
                          {section.project_topics?.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No topics available</p>
                          ) : (
                            section.project_topics?.map((topic) => (
                              <button
                                key={topic.id}
                                onClick={() => onSelectTopic(topic)}
                                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                  selectedTopic?.id === topic.id
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FiFileText className="w-4 h-4" />
                                  <div className="flex-1">
                                    <div className="font-medium">{topic.name}</div>
                                    {topic.description && (
                                      <div className="text-sm opacity-80 line-clamp-1">{topic.description}</div>
                                    )}
                                    {topic.project_topic_content && topic.project_topic_content.length > 0 && (
                                      <div className="text-xs text-green-600 mt-1">
                                        ✓ Has content
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

// ============================================
// MAIN PROJECT DETAIL PAGE COMPONENT
// ============================================

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read editMode from URL parameters
  const urlEditMode = searchParams.get('editMode') === 'true';

  // State declarations - must come before effects that use them
  const [project, setProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicContent, setTopicContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    description: ''
  });

  // Use custom hooks for role permissions and project management
  const {
    currentUser,
    userRole,
    loading: roleLoading,
    canEditProject,
    canManageSections,
    canManageTopics,
    refreshPermissions
  } = useRolePermissions();

  const projectManagement = useProjectManagement(projectId, currentUser);

  // Update editMode when URL parameter changes
  useEffect(() => {
    setEditMode(urlEditMode);
  }, [urlEditMode]);

  // Setup project form when project data is available and in edit mode
  useEffect(() => {
    if (urlEditMode && project) {
      setProjectForm({
        name: project.name || '',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'active'
      });
    }
  }, [urlEditMode, project]);

  // Additional state not included in the initial declarations
  const [topicContentLoading, setTopicContentLoading] = useState(false);

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

  // Fetch project details
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_user:users!projects_created_by_fkey(
            id,
            name
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
      
      // Fetch team members
      try {
        const { data: members, error: membersError } = await supabase
          .from('project_assignments')
          .select(`
            user_id,
            role_in_project,
            users(
              id,
              name,
              avatar_url,
              email
            )
          `)
          .eq('project_id', projectId);
        
        if (!membersError && members) {
          setTeamMembers(members.map(m => m.users).filter(Boolean));
        }
      } catch (err) {
        console.error('Error fetching team members:', err);
        setTeamMembers([]);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections for project
  const fetchSections = async () => {
    setSectionsLoading(true);
    setSections([]);
    setExpandedSections({});
    setSelectedTopic(null);
    setTopicContent([]);
    
    try {
      const { data, error } = await supabase
        .from('project_sections')
        .select(`
          *,
          project_topics(
            *,
            project_topic_content(
              id,
              title,
              content,
              created_at,
              updated_at,
              created_by(name)
            )
          )
        `)
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      setSections(data || []);

      // Auto-expand first section
      if (data && data.length > 0) {
        setExpandedSections({ [data[0].id]: true });
        // Auto-select first topic of the first section if available
        if (data[0].project_topics?.length > 0) {
          fetchTopicContent(data[0].project_topics[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setSectionsLoading(false);
    }
  };

  // Fetch topic content - Get all content for the topic
  const fetchTopicContent = async (topic) => {
    setTopicContentLoading(true);
    setSelectedTopic(topic);
    try {
      const { data, error } = await supabase
        .from('project_topic_content')
        .select(`
          *,
          created_by(id, name)
        `)
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopicContent(data || []);
    } catch (err) {
      console.error('Error fetching topic content:', err);
      setTopicContent([]);
    } finally {
      setTopicContentLoading(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Note: Edit mode is now controlled from ProjectCard via URL parameters

  const handleSaveProject = async () => {
    const validation = validateProjectForm(projectForm);

    if (!validation.isValid) {
      setProjectFormErrors(validation.errors);
      return;
    }

    try {
      await projectManagement.updateProject(projectForm);
      setProject(prev => ({ ...prev, ...projectForm }));
      setProjectFormErrors({});
    } catch (error) {
      console.error('Error saving project:', error);
      setProjectFormErrors({ general: 'Failed to save project. Please try again.' });
    }
  };

  const handleCancelEditProject = () => {
    setProjectFormErrors({});
    setProjectForm({
      name: project?.name || '',
      description: project?.description || '',
      start_date: project?.start_date || '',
      end_date: project?.end_date || '',
      status: project?.status || 'active'
    });
  };

  const handleAddSection = async () => {
    if (!newSection.name.trim()) {
      alert('Section name is required');
      return;
    }

    try {
      const sectionData = await projectManagement.createSection({
        name: newSection.name.trim(),
        description: newSection.description.trim()
      });

      setSections(prev => [...prev, sectionData]);
      setNewSection({ name: '', description: '' });
      setAddingSection(false);

      // Auto-expand the new section
      setExpandedSections(prev => ({
        ...prev,
        [sectionData.id]: true
      }));
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section. Please try again.');
    }
  };

  const handleUpdateSection = async (sectionData) => {
    try {
      await projectManagement.updateSection(sectionData.id, sectionData);
      setSections(prev => prev.map(section =>
        section.id === sectionData.id ? { ...section, ...sectionData } : section
      ));
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await projectManagement.deleteSection(sectionId);
      setSections(prev => prev.filter(section => section.id !== sectionId));

      // Remove from expanded sections
      setExpandedSections(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[sectionId];
        return newExpanded;
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  };

  const handleAddTopic = async (topicData) => {
    try {
      const topic = await projectManagement.createTopic(topicData);

      // Update the section with the new topic
      setSections(prev => prev.map(section =>
        section.id === topicData.section_id
          ? {
              ...section,
              project_topics: [...(section.project_topics || []), topic]
            }
          : section
      ));
    } catch (error) {
      console.error('Error adding topic:', error);
      throw error;
    }
  };

  // Auto-save project description changes
  const handleProjectDescriptionChange = (content) => {
    setProjectForm(prev => ({ ...prev, description: content }));

    if (editMode) {
      projectManagement.triggerAutoSave(() =>
        projectManagement.updateProject({ description: content })
      );
    }
  };

  // Additional handler functions for UI interactions
  const onRefresh = () => {
    fetchProject();
    fetchSections();
  };

  const onClose = () => {
    // Close modals or panels
    setAddingSection(false);
    setEditingSection(null);
  };

  const onToggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const onSelectTopic = (topic) => {
    setSelectedTopic(topic);
    // Fetch topic content if needed
    // This would typically load the content for the selected topic
  };

  // Load project data when component mounts
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchSections();
    }
  }, [projectId]);

  // Loading state
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
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
          <h3 className="text-2xl font-bold text-red-800 mb-3">Project Not Found</h3>
          <p className="text-red-600 mb-6">{error || 'The requested project could not be found.'}</p>
          <motion.button
            onClick={() => navigate('/projects')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Projects
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        projectFormErrors={projectFormErrors}
        setProjectFormErrors={setProjectFormErrors}
        onProjectDescriptionChange={handleProjectDescriptionChange}
        onRefresh={() => {
          fetchProject();
          fetchSections();
        }}
        loading={loading}
        teamMembers={teamMembers}
        editMode={editMode}
        canEditProject={canEditProject}
        currentUser={currentUser}
      />

      {/* Breadcrumb */}
      <Breadcrumb projectName={project.name} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sections Sidebar with Management */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FiLayers className="text-blue-600" />
                Project Sections
              </h2>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Add Section Button */}
            {canManageSections && (
              <div className="mb-4">
                {!addingSection ? (
                  <button
                    onClick={() => setAddingSection(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Section
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newSection.name}
                        onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Section name..."
                        autoFocus
                      />
                      <RichTextEditor
                        content={newSection.description}
                        onChange={(content) => setNewSection(prev => ({ ...prev, description: content }))}
                        placeholder="Section description (optional)..."
                        editable={true}
                        showToolbar={false}
                        minHeight="60px"
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddSection}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingSection(false);
                            setNewSection({ name: '', description: '' });
                          }}
                          className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Edit Mode controlled from ProjectCard - removed from here */}
          </div>

          {/* Sections List */}
          <div className="flex-1 overflow-y-auto p-4">
            {sectionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-8">
                <FiBookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No sections available</p>
                {canManageSections && (
                  <button
                    onClick={() => setAddingSection(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Create First Section
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <InlineSectionEditor
                    key={section.id}
                    section={section}
                    isEditing={editingSection === section.id}
                    onStartEdit={(section) => setEditingSection(section.id)}
                    onSave={handleUpdateSection}
                    onCancel={() => setEditingSection(null)}
                    onDelete={handleDeleteSection}
                    onAddTopic={handleAddTopic}
                    isExpanded={expandedSections[section.id]}
                    onToggle={toggleSection}
                    topics={section.project_topics || []}
                    currentUser={currentUser}
                    canEdit={canManageSections}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Original ProjectSectionsSidebar - commented out for now */}
        {/*
        <ProjectSectionsSidebar
          sections={sections}
          sectionsLoading={sectionsLoading}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          selectedTopic={selectedTopic}
          onSelectTopic={fetchTopicContent}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedTopic ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedTopic.name}</h3>
                  {selectedTopic.description && (
                    <p className="text-gray-600">{selectedTopic.description}</p>
                  )}
                </div>

                {topicContentLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                        <LoadingSkeleton variant="title" width="40%" className="mb-4" />
                        <LoadingSkeleton variant="text" count={3} />
                      </div>
                    ))}
                  </div>
                ) : topicContent && topicContent.length > 0 ? (
                  <div className="space-y-6">
                    {topicContent.map((content, index) => (
                      <motion.div
                        key={content.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="mb-4">
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiUser className="w-4 h-4" />
                              {content.created_by?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              {new Date(content.created_at).toLocaleDateString()}
                            </span>
                            {content.updated_at !== content.created_at && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <FiFileText className="w-4 h-4" />
                                Updated {new Date(content.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="prose prose-lg max-w-none">
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {content.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Available</h3>
                    <p className="text-gray-600">This topic doesn't have any content yet.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <motion.div
                  className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FiBookOpen className="w-10 h-10 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Topic</h3>
                <p className="text-gray-600">Choose a topic from the sidebar to view its content.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <FiBookOpen className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}