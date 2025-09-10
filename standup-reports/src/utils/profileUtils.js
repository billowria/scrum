import { supabase } from '../supabaseClient';

/**
 * Fetches a user's complete profile information
 * @param {string} userId - The ID of the user whose profile to fetch
 * @returns {Promise<Object>} - The user's profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Updates a user's profile information
 * @param {string} userId - The ID of the user whose profile to update
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} - The updated profile data
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // First, update the users table with basic info
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: profileData.name,
        email: profileData.email
      })
      .eq('id', userId);
      
    if (userError) throw userError;
    
    // Then, upsert the extended profile information
    const { data, error: profileError } = await supabase
      .rpc('upsert_user_profile', {
        p_user_id: userId,
        p_avatar_url: profileData.avatar_url,
        p_job_title: profileData.job_title,
        p_bio: profileData.bio,
        p_start_date: profileData.start_date,
        p_phone: profileData.phone,
        p_slack_handle: profileData.slack_handle,
        p_linkedin_url: profileData.linkedin_url
      });
      
    if (profileError) throw profileError;
    return data[0];
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Fetches all team members for a manager
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Array>} - Array of team members
 */
export const getTeamMembers = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('team_id', teamId)
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

/**
 * Updates a team member's profile (manager only)
 * @param {string} userId - The ID of the user whose profile to update
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} - The updated profile data
 */
export const updateTeamMemberProfile = async (userId, profileData) => {
  try {
    // For managers updating team members, we only update the profile table
    const { data, error } = await supabase
      .rpc('upsert_user_profile', {
        p_user_id: userId,
        p_avatar_url: profileData.avatar_url,
        p_job_title: profileData.job_title,
        p_bio: profileData.bio,
        p_start_date: profileData.start_date,
        p_phone: profileData.phone,
        p_slack_handle: profileData.slack_handle,
        p_linkedin_url: profileData.linkedin_url
      });
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating team member profile:', error);
    throw error;
  }
};

/**
 * Fetches the current user's profile
 * @returns {Promise<Object>} - The current user's profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    return await getUserProfile(user.id);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  getTeamMembers,
  updateTeamMemberProfile,
  getCurrentUserProfile
};