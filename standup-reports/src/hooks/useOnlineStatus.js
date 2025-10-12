import { useState, useEffect, useCallback } from 'react';
import * as chatService from '../services/chatService';

/**
 * Custom hook for managing user online status
 * @param {Array<string>} userIds - Array of user IDs to track
 * @returns {Object} Online status state
 */
export const useOnlineStatus = (userIds = []) => {
  const [onlineStatus, setOnlineStatus] = useState({});

  /**
   * Fetch online status for users
   */
  const fetchOnlineStatus = useCallback(async () => {
    if (!userIds || userIds.length === 0) return;

    try {
      const statusMap = await chatService.getOnlineStatus(userIds);
      setOnlineStatus(statusMap);
    } catch (err) {
      console.error('Error fetching online status:', err);
    }
  }, [userIds]);

  /**
   * Update current user's online status
   */
  const setOnline = useCallback(async (isOnline) => {
    try {
      await chatService.updateOnlineStatus(isOnline);
    } catch (err) {
      console.error('Error updating online status:', err);
    }
  }, []);

  /**
   * Check if a user is online
   */
  const isUserOnline = useCallback((userId) => {
    return onlineStatus[userId] === true;
  }, [onlineStatus]);

  // Fetch initial status
  useEffect(() => {
    fetchOnlineStatus();
  }, [fetchOnlineStatus]);

  // Subscribe to status changes
  useEffect(() => {
    const channel = chatService.subscribeToOnlineStatus((payload) => {
      const userId = payload.new?.user_id || payload.old?.user_id;
      const isOnline = payload.new?.is_online || false;

      if (userId && userIds.includes(userId)) {
        setOnlineStatus(prev => ({
          ...prev,
          [userId]: isOnline
        }));
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [userIds]);

  // Set user online when component mounts, offline when unmounts
  useEffect(() => {
    setOnline(true);

    return () => {
      setOnline(false);
    };
  }, [setOnline]);

  return {
    onlineStatus,
    isUserOnline,
    setOnline,
    refresh: fetchOnlineStatus
  };
};

export default useOnlineStatus;
