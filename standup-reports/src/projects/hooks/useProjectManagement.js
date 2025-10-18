import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { notifyProjectUpdate } from '../../utils/notificationHelper';

export const useProjectManagement = (projectId, currentUser) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const autoSaveTimeoutRef = useRef(null);

  // Auto-save with debouncing
  const triggerAutoSave = useCallback((saveFunction) => {
    setAutoSaveStatus('saving');

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveFunction();
        setAutoSaveStatus('saved');
        console.log('✅ Auto-save completed');
      } catch (err) {
        setAutoSaveStatus('error');
        console.error('❌ Auto-save failed:', err);
      }
    }, 1000); // 1 second debounce
  }, []);

  // Project management functions
  const updateProject = useCallback(async (projectData) => {
    if (!projectId || !currentUser) {
      throw new Error('Project ID and current user are required');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('projects')
        .update({
          ...projectData,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id
        })
        .eq('id', projectId);

      if (error) throw error;

      // Notify about the update
      await notifyProjectUpdate(projectId, 'project_updated', {
        updatedBy: currentUser.name,
        projectData
      });

      console.log('✅ Project updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating project:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, currentUser]);

  // Section management functions
  const createSection = useCallback(async (sectionData) => {
    if (!projectId || !currentUser) {
      throw new Error('Project ID and current user are required');
    }

    try {
      setLoading(true);
      setError(null);

      // Get the highest order index for this project
      const { data: existingSections } = await supabase
        .from('project_sections')
        .select('order_index')
        .eq('project_id', projectId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSections?.[0]?.order_index + 1 || 0;

      const { data, error } = await supabase
        .from('project_sections')
        .insert({
          ...sectionData,
          project_id: projectId,
          order_index: nextOrderIndex,
          created_by: currentUser.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Section created successfully');
      return data;
    } catch (err) {
      console.error('❌ Error creating section:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, currentUser]);

  const updateSection = useCallback(async (sectionId, sectionData) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('project_sections')
        .update({
          ...sectionData,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id
        })
        .eq('id', sectionId);

      if (error) throw error;

      console.log('✅ Section updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating section:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteSection = useCallback(async (sectionId) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Delete section and all related data (cascade delete)
      const { error } = await supabase
        .from('project_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      console.log('✅ Section deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Error deleting section:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Topic management functions
  const createTopic = useCallback(async (topicData) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Get the highest order index for this section
      const { data: existingTopics } = await supabase
        .from('project_topics')
        .select('order_index')
        .eq('section_id', topicData.section_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingTopics?.[0]?.order_index + 1 || 0;

      const { data, error } = await supabase
        .from('project_topics')
        .insert({
          ...topicData,
          order_index: nextOrderIndex,
          created_by: currentUser.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Topic created successfully');
      return data;
    } catch (err) {
      console.error('❌ Error creating topic:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateTopic = useCallback(async (topicId, topicData) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('project_topics')
        .update({
          ...topicData,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id
        })
        .eq('id', topicId);

      if (error) throw error;

      console.log('✅ Topic updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating topic:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteTopic = useCallback(async (topicId) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Delete topic and all related content (cascade delete)
      const { error } = await supabase
        .from('project_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      console.log('✅ Topic deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Error deleting topic:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Content management functions
  const createContent = useCallback(async (contentData) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('project_topic_content')
        .insert({
          ...contentData,
          created_by: currentUser.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Content created successfully');
      return data;
    } catch (err) {
      console.error('❌ Error creating content:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateContent = useCallback(async (contentId, contentData) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('project_topic_content')
        .update({
          ...contentData,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id
        })
        .eq('id', contentId);

      if (error) throw error;

      console.log('✅ Content updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating content:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteContent = useCallback(async (contentId) => {
    if (!currentUser) {
      throw new Error('Current user is required');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('project_topic_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      console.log('✅ Content deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Error deleting content:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);

  return {
    loading,
    error,
    autoSaveStatus,
    triggerAutoSave,
    updateProject,
    createSection,
    updateSection,
    deleteSection,
    createTopic,
    updateTopic,
    deleteTopic,
    createContent,
    updateContent,
    deleteContent,
    cleanup
  };
};