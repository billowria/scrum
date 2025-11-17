import { useState, useEffect, useCallback } from 'react';
import * as chatService from '../services/chatService';

/**
 * Custom hook for managing teams
 * @returns {Object} Teams state and methods
 */
export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all teams
   */
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getTeams();
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search teams by name or description
   */
  const searchTeams = useCallback((query) => {
    if (!query || query.trim() === '') {
      return teams;
    }

    const lowerQuery = query.toLowerCase();
    return teams.filter(team =>
      team.name?.toLowerCase().includes(lowerQuery) ||
      team.description?.toLowerCase().includes(lowerQuery)
    );
  }, [teams]);

  /**
   * Get team by ID
   */
  const getTeamById = useCallback((teamId) => {
    return teams.find(team => team.id === teamId);
  }, [teams]);

  /**
   * Get team members by team ID
   */
  const getTeamMembers = useCallback(async (teamId) => {
    try {
      const data = await chatService.getTeamMembers(teamId);
      return data || [];
    } catch (err) {
      console.error('Error fetching team members:', err);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    searchTeams,
    getTeamById,
    getTeamMembers
  };
};

export default useTeams;