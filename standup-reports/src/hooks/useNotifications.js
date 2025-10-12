import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notificationService';
import { supabase } from '../supabaseClient';

export function useNotifications({ 
  filters = {}, 
  realTime = false, 
  pageSize = 20,
  autoMarkAsRead = false 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const wsRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  // Load initial notifications
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have current user context (id, role, team)
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) {
        setNotifications([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id, role, team_id')
        .eq('id', authUser.id)
        .single();

      if (userErr || !userRow) {
        setNotifications([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      // Map UI filters to service filters
      const apiFilters = {};
      if (filters && filters.category && filters.category !== 'all') {
        apiFilters.categories = [filters.category];
      }
      if (filters && filters.priority && filters.priority !== 'all') {
        apiFilters.priority = filters.priority;
      }
      if (filters && filters.status === 'unread') {
        apiFilters.unreadOnly = true;
      }

      const result = await notificationService.getNotifications({
        ...apiFilters,
        userId: userRow.id,
        role: userRow.role,
        teamId: userRow.team_id,
        page: pageNum,
        limit: pageSize
      });
      
      // Apply client-side status filter for 'read' if requested
      let newItems = result.notifications;
      if (filters && filters.status === 'read') {
        newItems = newItems.filter(n => !!n.read);
      } else if (filters && filters.status === 'unread') {
        newItems = newItems.filter(n => !n.read);
      }

      if (append) {
        setNotifications(prev => [...prev, ...newItems]);
      } else {
        setNotifications(newItems);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
      
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);
  
  // Load more notifications for infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadNotifications(page + 1, true);
  }, [hasMore, loading, page, loadNotifications]);
  
  // Refresh notifications
  const refresh = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await loadNotifications(1, false);
  }, [loadNotifications]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      return true;
    } catch (err) {
      console.error('Failed to mark as read:', err);
      throw err;
    }
  }, []);
  
  // Archive notification
  const archiveNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      return true;
    } catch (err) {
      console.error('Failed to archive notification:', err);
      throw err;
    }
  }, []);
  
  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      return true;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, []);
  
  // Bookmark notification
  const bookmarkNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.bookmarkNotification(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isBookmarked: result.isBookmarked }
            : notification
        )
      );
      
      return result;
    } catch (err) {
      console.error('Failed to bookmark notification:', err);
      throw err;
    }
  }, []);
  
  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!realTime || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      // Connect to WebSocket endpoint (Vite uses import.meta.env)
      const baseWs = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
        ? import.meta.env.VITE_WS_URL
        : (window.__WS_URL__ || '');

      const normalized = typeof baseWs === 'string' ? baseWs.trim() : '';
      if (!/^wss?:\/\//.test(normalized)) {
        console.warn('Realtime notifications disabled: invalid or missing VITE_WS_URL');
        return;
      }

      const wsUrl = `${String(normalized).replace(/\/$/, '')}/ws/notifications`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for notifications');
        retryCount.current = 0;
        
        // Send subscription message with user ID and filters
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          filters: filters,
          userId: localStorage.getItem('userId') // Assuming user ID is stored
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_notification':
              // Add new notification to the beginning of the list
              setNotifications(prev => [data.notification, ...prev]);
              
              // Auto-mark as read if enabled
              if (autoMarkAsRead) {
                setTimeout(() => {
                  markAsRead(data.notification.id);
                }, 2000);
              }
              break;
              
            case 'notification_updated':
              // Update existing notification
              setNotifications(prev => 
                prev.map(notification => 
                  notification.id === data.notification.id 
                    ? { ...notification, ...data.notification }
                    : notification
                )
              );
              break;
              
            case 'notification_deleted':
              // Remove deleted notification
              setNotifications(prev => 
                prev.filter(notification => notification.id !== data.notificationId)
              );
              break;
              
            case 'bulk_update':
              // Handle bulk updates
              if (data.operation === 'mark_read') {
                setNotifications(prev => 
                  prev.map(notification => 
                    data.notificationIds.includes(notification.id)
                      ? { ...notification, read: true }
                      : notification
                  )
                );
              }
              break;
              
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code);
        
        // Retry connection if not intentionally closed
        if (event.code !== 1000 && retryCount.current < maxRetries) {
          retryCount.current++;
          retryTimeoutRef.current = setTimeout(() => {
            console.log(`Retrying WebSocket connection (${retryCount.current}/${maxRetries})`);
            connectWebSocket();
          }, Math.pow(2, retryCount.current) * 1000); // Exponential backoff
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [realTime, filters, autoMarkAsRead, markAsRead]);
  
  // Close WebSocket connection
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000); // Normal closure
      wsRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);
  
  // Load notifications on mount and filter changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  
  // Handle real-time connection
  useEffect(() => {
    if (realTime) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [realTime, connectWebSocket, disconnectWebSocket]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);
  
  // Derived state
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;
  
  return {
    // Data
    notifications,
    loading,
    error,
    hasMore,
    unreadCount,
    totalCount,
    
    // Actions
    loadMore,
    refresh,
    markAsRead,
    archiveNotification,
    deleteNotification,
    bookmarkNotification,
    
    // WebSocket status
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    
    // Utilities
    retry: () => {
      retryCount.current = 0;
      connectWebSocket();
    }
  };
}