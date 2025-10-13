import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatService from '../services/chatService';
import { supabase } from '../supabaseClient';

export const useTypingIndicator = (conversationId) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  const startTyping = useCallback(async () => {
    if (!conversationId) return;
    await chatService.updateTypingStatus(conversationId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 3000);
  }, [conversationId]);

  const stopTyping = useCallback(async () => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    await chatService.updateTypingStatus(conversationId, false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    
    // Fetch user names for typing users
    const fetchTypingUserNames = async (userIds) => {
      if (userIds.length === 0) {
        setTypingUsers([]);
        return;
      }
      
      try {
        // Fetch user details for all typing users
        const { data, error } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds);
          
        if (error) {
          console.error('Error fetching typing user names:', error);
          // Fallback to just user IDs
          setTypingUsers(userIds.map(id => ({ id, name: null })));
        } else {
          setTypingUsers(data || []);
        }
      } catch (error) {
        console.error('Error in fetchTypingUserNames:', error);
        // Fallback to just user IDs
        setTypingUsers(userIds.map(id => ({ id, name: null })));
      }
    };
    
    channelRef.current = chatService.subscribeToTyping(conversationId, (userIds) => {
      fetchTypingUserNames(userIds);
    });
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      stopTyping();
    };
  }, [conversationId, stopTyping]);

  return { typingUsers, startTyping, stopTyping };
};

export default useTypingIndicator;
