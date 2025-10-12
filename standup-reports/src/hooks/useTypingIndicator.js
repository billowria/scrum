import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatService from '../services/chatService';

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
    channelRef.current = chatService.subscribeToTyping(conversationId, (userIds) => {
      setTypingUsers(userIds);
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
