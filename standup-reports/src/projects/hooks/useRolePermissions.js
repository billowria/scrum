import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const useRolePermissions = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canEditProject, setCanEditProject] = useState(false);
  const [canManageSections, setCanManageSections] = useState(false);
  const [canManageTopics, setCanManageTopics] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      console.log('🔍 Fetching current user for role permissions...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('❌ No authenticated user found');
        setCurrentUser(null);
        setUserRole(null);
        setCanEditProject(false);
        setCanManageSections(false);
        setCanManageTopics(false);
        setLoading(false);
        return;
      }

      console.log('✅ Auth user found:', user.id, user.email);

      // Try multiple sources for role detection
      let detectedRole = null;
      let userFullData = null;

      // Method 1: User metadata (fastest)
      if (user.user_metadata?.role) {
        detectedRole = user.user_metadata.role;
        console.log('🔍 Method 1 - Found role in metadata:', detectedRole);
      }

      // Method 2: Direct users table query (most reliable)
      if (!detectedRole) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('❌ Error fetching user from users table:', error);
          } else if (data) {
            userFullData = data;
            detectedRole = data.role;
            console.log('🔍 Method 2 - Found role in users table:', detectedRole);
          }
        } catch (err) {
          console.error('❌ Exception querying users table:', err);
        }
      }

      // Method 3: Profile-based lookup (backup)
      if (!detectedRole) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData?.role) {
            detectedRole = profileData.role;
            console.log('🔍 Method 3 - Found role in profiles table:', detectedRole);
          }
        } catch (err) {
          console.log('ℹ️ Profile lookup failed (expected):', err.message);
        }
      }

      // Normalize role
      const normalizedRole = detectedRole?.toLowerCase()?.trim();
      const isAdmin = normalizedRole === 'admin';
      const isManager = normalizedRole === 'manager';
      const canManage = isAdmin || isManager;

      // Set user data
      if (userFullData) {
        setCurrentUser(userFullData);
      } else {
        setCurrentUser({
          id: user.id,
          email: user.email,
          role: detectedRole,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        });
      }

      setUserRole(detectedRole);
      setCanEditProject(canManage);
      setCanManageSections(canManage);
      setCanManageTopics(canManage);

      console.log('🎯 Role permissions set:', {
        role: detectedRole,
        normalizedRole,
        isAdmin,
        isManager,
        canEditProject: canManage,
        canManageSections: canManage,
        canManageTopics: canManage
      });

    } catch (err) {
      console.error('❌ Error in fetchCurrentUser:', err);
      setCurrentUser(null);
      setUserRole(null);
      setCanEditProject(false);
      setCanManageSections(false);
      setCanManageTopics(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const hasEditPermission = () => {
    return canEditProject;
  };

  const hasSectionPermission = () => {
    return canManageSections;
  };

  const hasTopicPermission = () => {
    return canManageTopics;
  };

  const refreshPermissions = () => {
    fetchCurrentUser();
  };

  return {
    currentUser,
    userRole,
    loading,
    canEditProject,
    canManageSections,
    canManageTopics,
    hasEditPermission,
    hasSectionPermission,
    hasTopicPermission,
    refreshPermissions
  };
};