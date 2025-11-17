import { useState, useEffect, useCallback } from 'react';
import * as chatService from '../services/chatService';

/**
 * Custom hook for managing users
 * @returns {Object} Users state and methods
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all users (except current user)
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search users by name or email
   */
  const searchUsers = useCallback((query) => {
    if (!query || query.trim() === '') {
      return users;
    }

    const lowerQuery = query.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
    );
  }, [users]);

  /**
   * Get users by team ID
   */
  const getUsersByTeam = useCallback(async (teamId) => {
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
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    searchUsers,
    getUsersByTeam
  };
};

export default useUsers;