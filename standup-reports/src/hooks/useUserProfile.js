import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserProfile = (userId = null) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user ID if not provided
      let targetUserId = userId;
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!targetUserId) {
        if (!currentUser) throw new Error('No authenticated user');
        targetUserId = currentUser.id;
      }

      setIsOwnProfile(currentUser?.id === targetUserId);

      // 2. Fetch user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, team_id')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // 3. Fetch extended profile info
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      // 4. Merge data (excluding profile.id to avoid collision with user.id)
      const { id: profileRecordId, user_id, ...profileFields } = profileData || {};

      setProfile({
        ...userData, // This has the correct users.id
        ...profileFields, // Profile fields without the id collision
        // Ensure avatar_url is taken from user_profiles if it exists, else users
        avatar_url: profileData?.avatar_url || userData.avatar_url
      });

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);

      // Handle "No authenticated user" error specifically
      if (err.message === 'No authenticated user' || err.message.includes('Auth session missing')) {
        console.warn('Authentication lost, signing out...');
        // Force sign out to trigger onAuthStateChange in App.jsx
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setSaving(true);
    setError(null);

    try {
      if (!profile) return;

      // Separate updates for 'users' table and 'user_profiles' table
      const userUpdates = {};
      const profileUpdates = {};

      if ('name' in updates) userUpdates.name = updates.name;
      // email is usually not editable directly without verification, but if needed:
      // if ('email' in updates) userUpdates.email = updates.email;

      // Fields for user_profiles
      const profileFields = [
        'job_title', 'bio', 'start_date', 'phone',
        'slack_handle', 'linkedin_url', 'avatar_url'
      ];

      profileFields.forEach(field => {
        if (field in updates) profileUpdates[field] = updates[field];
      });

      // 1. Update users table if needed
      if (Object.keys(userUpdates).length > 0) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', profile.id);
        if (userUpdateError) throw userUpdateError;
      }

      // 2. Upsert user_profiles table
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: profile.id,
            ...profileUpdates,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (profileUpdateError) throw profileUpdateError;
      }

      // Refresh profile data
      await fetchProfile();
      return true;

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    isOwnProfile,
    updateProfile,
    refreshProfile: fetchProfile
  };
};

/**
 * Custom hook for managers to manage team profiles
 * @param {string} teamId - The ID of the team to manage
 * @returns {Object} - Team members data and management functions
 */
export const useTeamProfiles = (teamId) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teamId) {
      fetchTeamMembers(teamId);
    }
  }, [teamId]);

  const fetchTeamMembers = async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch team members from user_info view or users table
      const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('team_id', id)
        .order('name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMember = async (userId, profileData) => {
    try {
      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Refresh team members
      await fetchTeamMembers(teamId);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating team member:', err);
      throw err;
    }
  };

  return {
    teamMembers,
    loading,
    error,
    updateTeamMember,
    refreshTeamMembers: () => fetchTeamMembers(teamId)
  };
};

export default useUserProfile;