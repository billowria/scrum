import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export const useActivityLog = (projectId, companyId) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchActivities = useCallback(async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('project_activities')
                .select(`
          *,
          user:users(id, name, avatar_url)
        `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setActivities(data || []);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const logActivity = useCallback(async ({
        actionType,
        entityType,
        entityId,
        details = {},
        userId
    }) => {
        if (!userId || !companyId || !projectId) return;

        try {
            const { error } = await supabase
                .from('project_activities')
                .insert({
                    project_id: projectId,
                    company_id: companyId,
                    user_id: userId,
                    action_type: actionType,
                    entity_type: entityType,
                    entity_id: entityId,
                    details
                });

            if (error) throw error;

            // Optimistically update or refetch
            fetchActivities();
        } catch (err) {
            console.error('Error logging activity:', err);
        }
    }, [projectId, companyId, fetchActivities]);

    return {
        activities,
        loading,
        fetchActivities,
        logActivity
    };
};
