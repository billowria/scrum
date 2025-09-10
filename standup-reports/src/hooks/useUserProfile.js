import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  getUserProfile, 
  updateUserProfile, 
  getTeamMembers, 
  updateTeamMemberProfile,
  getCurrentUserProfile
} from '../utils/profileUtils';

/**
 * Custom hook for managing user profiles
 * @param {string} userId - Optional user ID to fetch a specific user's profile
 * @returns {Object} - Profile data and management functions
 */
export const useUserProfile = (userId = null) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else {
      fetchCurrentUserProfile();
    }
  }, [userId]);

  const fetchProfile = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const profileData = await getUserProfile(id);
      setProfile(profileData);
      
      // Check if this is the current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnProfile(user?.id === id);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const profileData = await getCurrentUserProfile();
      setProfile(profileData);
      setIsOwnProfile(true);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching current user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!profile) return;
    
    setSaving(true);
    setError(null);
    
    try {
      let updatedProfile;
      
      if (isOwnProfile) {
        // Update own profile
        updatedProfile = await updateUserProfile(profile.id, profileData);
      } else {
        // Update team member's profile (manager only)
        updatedProfile = await updateTeamMemberProfile(profile.id, profileData);
      }
      
      setProfile(prev => ({ ...prev, ...updatedProfile }));
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      console.error('Error updating profile:', err);
      throw err;
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
    refreshProfile: () => userId ? fetchProfile(userId) : fetchCurrentUserProfile()
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
      const members = await getTeamMembers(id);
      setTeamMembers(members);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMember = async (userId, profileData) => {
    try {
      const updatedProfile = await updateTeamMemberProfile(userId, profileData);
      
      // Update the member in the local state
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === userId ? { ...member, ...updatedProfile } : member
        )
      );
      
      return updatedProfile;
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

export default {
  useUserProfile,
  useTeamProfiles
};