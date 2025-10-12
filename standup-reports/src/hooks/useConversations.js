import { useState, useEffect, useCallback } from 'react';
import * as chatService from '../services/chatService';
import { sortConversations } from '../utils/chatUtils';

/**
 * Custom hook for managing conversations
 * @returns {Object} Conversations state and methods
 */
export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all conversations (with loading state)
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      setConversations(sortConversations(data));
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Silent refresh - updates data without triggering loading state
   * Perfect for auto-refresh to avoid UI flicker
   * Intelligently merges updates to minimize re-renders
   */
  const silentRefresh = useCallback(async () => {
    try {
      const newData = await chatService.getConversations();
      
      setConversations(prevConversations => {
        // If no previous conversations, just set the new data
        if (prevConversations.length === 0) {
          return sortConversations(newData);
        }

        // Create maps for fast lookup
        const prevMap = new Map(prevConversations.map(c => [c.id, c]));
        const newMap = new Map(newData.map(c => [c.id, c]));

        // Check if any conversation actually changed
        let hasChanges = false;
        
        // Check for new conversations
        if (newData.length !== prevConversations.length) {
          hasChanges = true;
        } else {
          // Check if any existing conversation changed
          for (const newConv of newData) {
            const prevConv = prevMap.get(newConv.id);
            if (!prevConv || 
                prevConv.unread_count !== newConv.unread_count ||
                prevConv.last_message_at !== newConv.last_message_at ||
                JSON.stringify(prevConv.last_message) !== JSON.stringify(newConv.last_message)) {
              hasChanges = true;
              break;
            }
          }
        }

        // Only update if there are actual changes (prevents unnecessary re-renders)
        if (hasChanges) {
          return sortConversations(newData);
        }
        
        return prevConversations;
      });
    } catch (err) {
      // Silent error - don't disrupt user experience
      console.error('Silent refresh error:', err);
    }
  }, []);

  /**
   * Create or get direct conversation
   */
  const startDirectConversation = useCallback(async (userId) => {
    try {
      const conversation = await chatService.getOrCreateDirectConversation(userId);
      await fetchConversations(); // Refresh list
      return conversation;
    } catch (err) {
      console.error('Error starting direct conversation:', err);
      throw err;
    }
  }, [fetchConversations]);

  /**
   * Get conversation by ID
   */
  const getConversationById = useCallback((conversationId) => {
    return conversations.find(c => c.id === conversationId);
  }, [conversations]);

  /**
   * Get total unread count across all conversations
   */
  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  }, [conversations]);

  /**
   * Update a conversation in the list
   */
  const updateConversation = useCallback((conversationId, updates) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      );
      return sortConversations(updated);
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    const channel = chatService.subscribeToConversations(() => {
      // Refresh conversations on any change (silent to avoid flicker)
      silentRefresh();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [silentRefresh]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    silentRefresh,
    startDirectConversation,
    getConversationById,
    getTotalUnreadCount,
    updateConversation
  };
};

export default useConversations;
