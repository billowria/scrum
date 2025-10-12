import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatService from '../services/chatService';
import { validateMessage } from '../utils/chatUtils';

/**
 * Custom hook for managing chat messages
 * @param {string} conversationId - Current conversation ID
 * @returns {Object} Messages state and methods
 */
export const useChatMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const subscriptionRef = useRef(null);

  /**
   * Fetch messages for conversation
   */
  const fetchMessages = useCallback(async (limit = 50, offset = 0) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getMessages(conversationId, limit, offset);
      
      if (offset === 0) {
        setMessages(data);
      } else {
        setMessages(prev => [...data, ...prev]);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(async (content) => {
    if (!conversationId) return null;

    // Validate message
    const validation = validateMessage(content);
    if (!validation.valid) {
      setError(validation.error);
      return null;
    }

    try {
      setSending(true);
      setError(null);
      
      // Optimistic update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content,
        user_id: 'current',
        created_at: new Date().toISOString(),
        sending: true
      };
      setMessages(prev => [...prev, tempMessage]);

      const newMessage = await chatService.sendMessage(conversationId, content);
      
      // Replace temp message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? newMessage : msg
      ));

      // Mark conversation as read
      await chatService.markAsRead(conversationId);

      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.sending));
      return null;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  /**
   * Edit a message
   */
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const updatedMessage = await chatService.updateMessage(messageId, newContent);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      return updatedMessage;
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Load more (older) messages
   */
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchMessages(50, messages.length);
  }, [hasMore, loading, messages.length, fetchMessages]);

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      await chatService.markAsRead(conversationId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId, fetchMessages]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message) => {
      setMessages(prev => {
        // Don't add if already exists (avoid duplicates)
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleMessageUpdate = (message) => {
      if (message.deleted) {
        setMessages(prev => prev.filter(m => m.id !== message.id));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? message : m
        ));
      }
    };

    subscriptionRef.current = chatService.subscribeToMessages(
      conversationId,
      handleNewMessage,
      handleMessageUpdate
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [conversationId]);

  // Mark as read when viewing conversation
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, messages.length, markAsRead]);

  // Auto-refresh messages every 30 seconds (intelligent background refresh)
  useEffect(() => {
    if (!conversationId) return;

    const autoRefreshInterval = setInterval(() => {
      // Intelligent silent refresh - merges new messages without disrupting scroll
      chatService.getMessages(conversationId, 50, 0)
        .then(newData => {
          setMessages(prevMessages => {
            // Create a map of existing message IDs for fast lookup
            const existingIds = new Set(prevMessages.map(m => m.id));
            
            // Find truly new messages (not in current list)
            const newMessages = newData.filter(msg => !existingIds.has(msg.id));
            
            // If there are new messages, append them
            if (newMessages.length > 0) {
              return [...prevMessages, ...newMessages];
            }
            
            // If no new messages, keep existing state (avoid re-render)
            return prevMessages;
          });
        })
        .catch(err => {
          // Silent error - don't disrupt user experience
          console.error('Auto-refresh error:', err);
        });
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [conversationId]);

  return {
    messages,
    loading,
    sending,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    markAsRead,
    refreshMessages: fetchMessages
  };
};

export default useChatMessages;
