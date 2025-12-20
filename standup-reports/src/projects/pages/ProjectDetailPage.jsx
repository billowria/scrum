import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { useProjectManagement } from '../hooks/useProjectManagement';
import { useActivityLog } from '../hooks/useActivityLog';

// Components
import ProjectSidebar from '../components/ProjectSidebar';
import ProjectHero from '../components/ProjectHero';
import TopicView from '../components/TopicView';
import ProjectActivityFeed from '../components/ProjectActivityFeed';
import CreateModal from '../components/CreateModal';
import ProjectHeader from '../components/ProjectHeader';
import ProjectsListSidebar from '../../components/projects/ProjectsListSidebar';

export default function ProjectDetailPage({ projectId: propProjectId, onBack }) {
    const { projectId: paramProjectId } = useParams();
    const projectId = propProjectId || paramProjectId;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editMode = searchParams.get('editMode') === 'true';

    // State
    const [project, setProject] = useState(null);
    const [allProjects, setAllProjects] = useState([]); // For projects navigation sidebar
    const [sections, setSections] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedContent, setSelectedContent] = useState(null);
    const [topicContent, setTopicContent] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showAddContent, setShowAddContent] = useState(false);

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectsListOpen, setProjectsListOpen] = useState(false); // Projects navigation sidebar
    const [projectsListCollapsed, setProjectsListCollapsed] = useState(false);
    const [activityFeedOpen, setActivityFeedOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null });
    const [modalInput, setModalInput] = useState('');
    const [modalDescription, setModalDescription] = useState('');

    // Loading & Error States
    const [loading, setLoading] = useState(true);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [contentLoading, setContentLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hooks
    const { currentCompany } = useCompany();
    const { currentUser, canEditProject, canManageSections, canManageTopics } = useRolePermissions();
    const projectManagement = useProjectManagement(projectId, currentUser);
    const { activities, loading: activitiesLoading, fetchActivities, logActivity } = useActivityLog(projectId, currentCompany?.id);

    // Handle Responsive
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Data Fetching
    const fetchProject = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select(`*, created_by_user:users!projects_created_by_fkey(id, name)`)
                .eq('id', projectId)
                .single();

            if (error) throw error;
            setProject(data);

            // Fetch Team
            const { data: members } = await supabase
                .from('project_assignments')
                .select(`users(id, name, avatar_url, email)`)
                .eq('project_id', projectId);

            if (members) {
                setTeamMembers(members.map(m => m.users).filter(Boolean));
            }
        } catch (err) {
            console.error('Error fetching project:', err);
            setError('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all projects for navigation sidebar
    const fetchAllProjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('project_assignments')
                .select(`
                    is_favorite,
                    projects (
                        id,
                        name,
                        status
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            const projectsList = data
                ?.map(item => ({
                    ...item.projects,
                    is_favorite: item.is_favorite
                }))
                .filter(Boolean) || [];

            setAllProjects(projectsList);
        } catch (err) {
            console.error('Error fetching projects list:', err);
        }
    };

    const fetchSections = async () => {
        try {
            setSectionsLoading(true);
            const { data, error } = await supabase
                .from('project_sections')
                .select(`*, project_topics(*, project_topic_content(id))`)
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setSections(data || []);
        } catch (err) {
            console.error('Error fetching sections:', err);
        } finally {
            setSectionsLoading(false);
        }
    };

    const fetchTopicContent = async (topic) => {
        try {
            setContentLoading(true);
            setSelectedTopic(topic);
            setSelectedContent(null); // Clear selected content when viewing topic overview
            const { data, error } = await supabase
                .from('project_topic_content')
                .select(`*, created_by(id, name)`)
                .eq('topic_id', topic.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTopicContent(data || []);
        } catch (err) {
            console.error('Error fetching topic content:', err);
        } finally {
            setContentLoading(false);
        }
    };

    const handleSelectContent = async (content, topic) => {
        try {
            setContentLoading(true);
            setSelectedTopic(topic);
            setSelectedContent(content);

            // Fetch full content details
            const { data, error } = await supabase
                .from('project_topic_content')
                .select(`*, created_by(id, name)`)
                .eq('id', content.id)
                .single();

            if (error) throw error;
            setSelectedContent(data);
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setContentLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        if (projectId) {
            fetchProject();
            fetchSections();
            fetchActivities();
        }
        fetchAllProjects(); // Always fetch projects list for navigation
    }, [projectId]);

    // Actions
    const handleUpdateProject = async (updates) => {
        try {
            await projectManagement.updateProject(updates);
            setProject(prev => ({ ...prev, ...updates }));

            // Log Activity
            if (updates.status) {
                logActivity({
                    actionType: 'updated_status',
                    entityType: 'project',
                    entityId: projectId,
                    details: { status: updates.status },
                    userId: currentUser?.id
                });
            }
        } catch (err) {
            console.error('Failed to update project:', err);
            alert('Failed to update project');
        }
    };

    const openModal = (type, data = null, initialValue = '', initialDescription = '') => {
        setModalConfig({ isOpen: true, type, data });
        setModalInput(initialValue);
        setModalDescription(initialDescription);
    };

    const closeModal = () => {
        setModalConfig({ isOpen: false, type: null, data: null });
        setModalInput('');
        setModalDescription('');
    };

    const handleModalSubmit = async () => {
        if (!modalInput.trim()) return;

        try {
            if (modalConfig.type === 'ADD_SECTION') {
                const newSection = await projectManagement.createSection({ name: modalInput });
                setSections(prev => [...prev, newSection]);
                logActivity({
                    actionType: 'created_section',
                    entityType: 'section',
                    entityId: newSection.id,
                    details: { name: modalInput },
                    userId: currentUser?.id
                });
            } else if (modalConfig.type === 'ADD_TOPIC') {
                const sectionId = modalConfig.data;
                const newTopic = await projectManagement.createTopic({
                    name: modalInput,
                    section_id: sectionId,
                    description: modalDescription || null
                });
                setSections(prev => prev.map(s =>
                    s.id === sectionId
                        ? { ...s, project_topics: [...(s.project_topics || []), newTopic] }
                        : s
                ));
                logActivity({
                    actionType: 'created_topic',
                    entityType: 'topic',
                    entityId: newTopic.id,
                    details: { name: modalInput },
                    userId: currentUser?.id
                });
            } else if (modalConfig.type === 'RENAME_SECTION') {
                const section = modalConfig.data;
                await projectManagement.updateSection(section.id, { name: modalInput });
                setSections(prev => prev.map(s => s.id === section.id ? { ...s, name: modalInput } : s));
            } else if (modalConfig.type === 'RENAME_TOPIC') {
                const topic = modalConfig.data;
                // Assuming updateTopic exists in projectManagement, if not we'll need to add it or use supabase directly
                const { error } = await supabase
                    .from('project_topics')
                    .update({ name: modalInput, description: modalDescription || null })
                    .eq('id', topic.id);
                if (error) throw error;

                setSections(prev => prev.map(s => ({
                    ...s,
                    project_topics: s.project_topics?.map(t => t.id === topic.id ? { ...t, name: modalInput, description: modalDescription } : t)
                })));
                if (selectedTopic?.id === topic.id) setSelectedTopic(prev => ({ ...prev, name: modalInput, description: modalDescription }));
            }
            closeModal();
        } catch (err) {
            console.error(err);
            alert('Failed to save changes');
        }
    };

    const handleDeleteSection = async (section) => {
        if (!window.confirm(`Are you sure you want to delete section "${section.name}"?`)) return;
        try {
            await projectManagement.deleteSection(section.id);
            setSections(prev => prev.filter(s => s.id !== section.id));
            if (selectedTopic?.section_id === section.id) setSelectedTopic(null);
        } catch (err) {
            alert('Failed to delete section');
        }
    };

    const handleDeleteTopic = async (topic) => {
        if (!window.confirm(`Are you sure you want to delete topic "${topic.name}"?`)) return;
        try {
            const { error } = await supabase.from('project_topics').delete().eq('id', topic.id);
            if (error) throw error;

            setSections(prev => prev.map(s => ({
                ...s,
                project_topics: s.project_topics?.filter(t => t.id !== topic.id)
            })));
            if (selectedTopic?.id === topic.id) setSelectedTopic(null);
        } catch (err) {
            alert('Failed to delete topic');
        }
    };

    const handleAddContent = async (title, content) => {
        if (!selectedTopic || !currentUser) return;
        try {
            const { data, error } = await supabase
                .from('project_topic_content')
                .insert({
                    topic_id: selectedTopic.id,
                    title,
                    content,
                    created_by: currentUser.id,
                    company_id: currentCompany?.id
                })
                .select(`*, created_by(id, name)`)
                .single();

            if (error) throw error;
            setTopicContent(prev => [data, ...prev]);

            logActivity({
                actionType: 'added_content',
                entityType: 'content',
                entityId: data.id,
                details: { topicName: selectedTopic.name },
                userId: currentUser?.id
            });

            // Update topic count in sidebar
            fetchSections();
        } catch (err) {
            console.error('Error adding content:', err);
            alert('Failed to add content');
        }
    };

    const handleAddContentToTopic = async (topicId) => {
        if (!topicId || !currentUser) return;

        // Find the topic by ID to select it
        for (const section of sections) {
            const topic = section.project_topics?.find(t => t.id === topicId);
            if (topic) {
                // Select the topic to show its content
                setSelectedTopic(topic);

                // Fetch or ensure the topic's content is loaded
                fetchTopicContent(topic);

                // Set the state to show add content UI
                setShowAddContent(true);
                setSelectedContent(null);

                break;
            }
        }
    };

    const handleUpdateContent = async (contentId, updates) => {
        try {
            const { error } = await supabase
                .from('project_topic_content')
                .update(updates)
                .eq('id', contentId);

            if (error) throw error;

            setTopicContent(prev => prev.map(c => c.id === contentId ? { ...c, ...updates } : c));

            logActivity({
                actionType: 'updated_content',
                entityType: 'content',
                entityId: contentId,
                details: { topicName: selectedTopic.name },
                userId: currentUser?.id
            });
        } catch (err) {
            console.error('Error updating content:', err);
            alert('Failed to update content');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
                    <button onClick={onBack || (() => navigate('/projects'))} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    // Check if rendered inline (from ProjectsPage) - don't show projects list sidebar in that case
    const isInline = !!propProjectId;

    return (
        <div className={`flex ${isInline ? 'h-full' : 'h-screen'} bg-white dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-white`}>
            {/* Projects Navigation Sidebar - only show when not inline */}
            {!isInline && (
                <ProjectsListSidebar
                    projects={allProjects}
                    activeProjectId={projectId}
                    onProjectSelect={(proj) => navigate(`/projects/${proj.id}`)}
                    isOpen={projectsListOpen}
                    onClose={() => setProjectsListOpen(false)}
                    isMobile={isMobile}
                    sidebarCollapsed={projectsListCollapsed}
                    onToggleSidebarCollapse={() => setProjectsListCollapsed(!projectsListCollapsed)}
                />
            )}

            {/* Project Sections Sidebar */}
            <ProjectSidebar
                projectName={project?.name}
                sections={sections}
                selectedTopic={selectedTopic}
                selectedContent={selectedContent}
                onSelectTopic={fetchTopicContent}
                onSelectContent={handleSelectContent}
                onAddSection={() => openModal('ADD_SECTION')}
                onAddTopic={(sectionId) => openModal('ADD_TOPIC', sectionId)}
                onAddContent={handleAddContentToTopic}
                onRenameSection={(section) => openModal('RENAME_SECTION', section, section.name)}
                onDeleteSection={handleDeleteSection}
                onRenameTopic={(topic) => openModal('RENAME_TOPIC', topic, topic.name, topic.description || '')}
                onDeleteTopic={handleDeleteTopic}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                className={isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : ''}
                editMode={editMode}
                isMobile={isMobile}
            />

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative">
                {/* Global Sticky Header */}
                <ProjectHeader
                    projectName={project.name}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleActivity={() => setActivityFeedOpen(true)}
                    sidebarOpen={sidebarOpen}
                    isMobile={isMobile}
                    currentUser={currentUser}
                    editMode={editMode}
                    onBack={onBack}
                />

                <div className="flex-1 overflow-y-auto scroll-smooth">
                    <AnimatePresence mode="wait">
                        {selectedTopic ? (
                            <motion.div
                                key="topic-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <TopicView
                                    topic={selectedTopic}
                                    content={topicContent}
                                    selectedContent={selectedContent}
                                    loading={contentLoading}
                                    onAddContent={handleAddContent}
                                    onUpdateContent={handleUpdateContent}
                                    currentUser={currentUser}
                                    canEdit={canManageTopics && editMode}
                                    showAddContent={showAddContent}
                                    setShowAddContent={setShowAddContent}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="project-overview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProjectHero
                                    project={project}
                                    onUpdate={handleUpdateProject}
                                    teamMembers={teamMembers}
                                    editMode={editMode}
                                />

                                {/* Empty State / Call to Action */}
                                {sections.length === 0 && (
                                    <div className="max-w-md mx-auto mt-12 text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <FiBookOpen className="w-16 h-16 text-indigo-200 dark:text-indigo-900 mx-auto mb-6" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start Building Your Project</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-8">Create sections and topics to organize your documentation.</p>
                                        {editMode && (
                                            <button
                                                onClick={() => openModal('ADD_SECTION')}
                                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium hover:scale-105 active:scale-95"
                                            >
                                                Create First Section
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Activity Feed Drawer */}
            <ProjectActivityFeed
                isOpen={activityFeedOpen}
                onClose={() => setActivityFeedOpen(false)}
                activities={activities}
                loading={activitiesLoading}
            />

            {/* Create Modal */}
            <CreateModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={
                    modalConfig.type === 'ADD_SECTION' ? 'Create New Section' :
                        modalConfig.type === 'ADD_TOPIC' ? 'Create New Topic' :
                            modalConfig.type === 'RENAME_SECTION' ? 'Rename Section' :
                                'Rename Topic'
                }
            >
                <div className={`space-y-4 ${isMobile ? 'px-1' : ''}`}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={modalInput}
                            onChange={(e) => setModalInput(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder={modalConfig.type === 'ADD_SECTION' ? "e.g., Documentation" : "e.g., Getting Started"}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleModalSubmit()}
                        />
                    </div>

                    {/* Description field for topics only */}
                    {(modalConfig.type === 'ADD_TOPIC' || modalConfig.type === 'RENAME_TOPIC') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={modalDescription}
                                onChange={(e) => setModalDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                placeholder="Brief description of this topic..."
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleModalSubmit}
                            disabled={!modalInput.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
                        >
                            {modalConfig.type?.startsWith('RENAME') ? 'Save' : 'Create'}
                        </button>
                    </div>
                </div>
            </CreateModal>
        </div>
    );
}
