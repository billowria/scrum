import { supabase } from '../supabaseClient';

/**
 * Chat Service
 * Handles all chat-related API calls and real-time subscriptions
 */

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Get all conversations for the current user
 * @returns {Promise<Array>} Array of conversations with metadata
 */
export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_conversation_list')
      .select('*')
      .eq('participant_user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // Group by conversation ID and enhance with participant data
    const conversationsMap = new Map();
    
    for (const row of data || []) {
      if (!conversationsMap.has(row.id)) {
        conversationsMap.set(row.id, {
          id: row.id,
          type: row.type,
          name: row.name,
          team_id: row.team_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_message_at: row.last_message_at,
          unread_count: row.unread_count,
          last_message: row.last_message,
          participants: []
        });
      }
    }

    // Fetch participant details for each conversation
    const conversations = Array.from(conversationsMap.values());
    for (const conversation of conversations) {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('conversation_id', conversation.id);

      conversation.participants = participants?.map(p => p.users) || [];
      
      // For direct messages, set name to other user's name
      if (conversation.type === 'direct' && conversation.participants.length === 2) {
        const otherUser = conversation.participants.find(p => p.id !== user.id);
        conversation.name = otherUser?.name || 'Unknown User';
        conversation.otherUser = otherUser;
      }
    }

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Get or create a direct conversation with another user
 * @param {string} otherUserId - ID of the other user
 * @returns {Promise<Object>} Conversation object
 */
export const getOrCreateDirectConversation = async (otherUserId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call database function to get or create conversation
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      user1_id: user.id,
      user2_id: otherUserId
    });

    if (error) throw error;

    // Fetch the full conversation details
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        participants:chat_participants(
          user_id,
          users:user_id (
            id,
            name,
            email,
            avatar_url
          )
        )
      `)
      .eq('id', data)
      .single();

    if (convError) throw convError;

    return conversation;
  } catch (error) {
    console.error('Error getting/creating direct conversation:', error);
    throw error;
  }
};

/**
 * Get team conversation by team ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Conversation object
 */
export const getTeamConversation = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        participants:chat_participants(
          user_id,
          users:user_id (
            id,
            name,
            email,
            avatar_url
          )
        )
      `)
      .eq('type', 'team')
      .eq('team_id', teamId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching team conversation:', error);
    throw error;
  }
};

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Get messages for a conversation with pagination
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of messages
 */
export const getMessages = async (conversationId, limit = 50, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Return in chronological order (oldest first)
    return data?.reverse() || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a new message
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async (conversationId, content) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Edit a message
 * @param {string} messageId - Message ID
 * @param {string} newContent - New message content
 * @returns {Promise<Object>} Updated message
 */
export const updateMessage = async (messageId, newContent) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Mark conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('chat_participants')
      .update({
        last_read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
};

/**
 * Search messages
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching messages
 */
export const searchMessages = async (query) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        ),
        conversation:chat_conversations (
          id,
          type,
          name,
          team_id
        )
      `)
      .textSearch('content', query)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Function} onNewMessage - Callback for new messages
 * @param {Function} onMessageUpdate - Callback for message updates
 * @returns {Object} Subscription object
 */
export const subscribeToMessages = (conversationId, onNewMessage, onMessageUpdate) => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        // First, try to get user data from the users table with a single query
        let userData = null;
        if (payload.new.user_id) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', payload.new.user_id)
              .single();
            
            if (!error && data) {
              userData = data;
            }
          } catch (error) {
            console.warn('Could not fetch user data:', error);
          }
        }

        // Create the complete message object with user data
        const message = {
          ...payload.new,
          user: userData || {
            id: payload.new.user_id,
            name: 'Unknown User',
            email: null,
            avatar_url: null
          }
        };

        if (onNewMessage) {
          onNewMessage(message);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        if (payload.new.deleted_at) {
          // Message was deleted
          if (onMessageUpdate) {
            onMessageUpdate({ ...payload.new, deleted: true });
          }
        } else {
          // Message was edited
          // Get user data for edited message
          let userData = null;
          if (payload.new.user_id) {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
              
              if (!error && data) {
                userData = data;
              }
            } catch (error) {
              console.warn('Could not fetch user data for edited message:', error);
            }
          }

          const message = {
            ...payload.new,
            user: userData || {
              id: payload.new.user_id,
              name: 'Unknown User',
              email: null,
              avatar_url: null
            }
          };

          if (onMessageUpdate) {
            onMessageUpdate(message);
          }
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to conversation updates
 * @param {Function} callback - Callback for conversation updates
 * @returns {Object} Subscription object
 */
export const subscribeToConversations = (callback) => {
  const channel = supabase
    .channel('conversations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_conversations'
      },
      callback
    )
    .subscribe();

  return channel;
};

// ============================================================================
// TYPING INDICATORS
// ============================================================================

/**
 * Update typing status
 * @param {string} conversationId - Conversation ID
 * @param {boolean} isTyping - Whether user is typing
 * @returns {Object} Presence channel
 */
export const updateTypingStatus = async (conversationId, isTyping) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Use a consistent channel name
    const channelName = `typing:${conversationId}`;
    
    // Try to find an existing channel
    let channel = supabase.getChannels().find(ch => 
      ch.topic === `realtime:${channelName}` || ch.topic === channelName
    );
    
    // If no existing channel, create a new one
    if (!channel) {
      channel = supabase.channel(channelName);
      
      // Subscribe to the channel and wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Channel subscription timeout'));
        }, 10000);
        
        // Subscribe and resolve when connected
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    }

    // Wait a bit to ensure subscription is fully established
    await new Promise(resolve => setTimeout(resolve, 100));

    if (isTyping) {
      await channel.track({
        user_id: user.id,
        typing: true,
        timestamp: Date.now()
      });
    } else {
      await channel.untrack();
    }

    return channel;
  } catch (error) {
    console.error('Error updating typing status:', error);
    return null;
  }
};

/**
 * Subscribe to typing indicators
 * @param {string} conversationId - Conversation ID
 * @param {Function} callback - Callback with typing users
 * @returns {Object} Subscription object
 */
export const subscribeToTyping = (conversationId, callback) => {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUsers = [];

      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          if (presence.typing) {
            typingUsers.push(presence.user_id);
          }
        });
      });

      callback(typingUsers);
    })
    .subscribe();

  return channel;
};

// ============================================================================
// ONLINE STATUS
// ============================================================================

/**
 * Update user's online status
 * @param {boolean} isOnline - Whether user is online
 * @returns {Promise<void>}
 */
export const updateOnlineStatus = async (isOnline) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_online_status')
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

/**
 * Get online status for users
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Object>} Map of userId to online status
 */
export const getOnlineStatus = async (userIds) => {
  try {
    const { data, error } = await supabase
      .from('user_online_status')
      .select('*')
      .in('user_id', userIds);

    if (error) throw error;

    const statusMap = {};
    data?.forEach(status => {
      statusMap[status.user_id] = status.is_online;
    });

    return statusMap;
  } catch (error) {
    console.error('Error fetching online status:', error);
    return {};
  }
};

/**
 * Subscribe to online status changes
 * @param {Function} callback - Callback with online status updates
 * @returns {Object} Subscription object
 */
export const subscribeToOnlineStatus = (callback) => {
  const channel = supabase
    .channel('online-status-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_online_status'
      },
      callback
    )
    .subscribe();

  return channel;
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users (for starting new DMs)
 * @returns {Promise<Array>} Array of users
 */
export const getUsers = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, team_id')
      .neq('id', user.id) // Exclude current user
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get team members
 * @param {string} teamId - Team ID
 * @returns {Promise<Array>} Array of team members
 */
export const getTeamMembers = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
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
 * Create a group conversation
 * @param {Object} groupData - Group creation data
 * @returns {Promise<Object>} Created conversation data
 */
export const createGroupConversation = async (groupData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_name: groupData.name,
      p_description: groupData.description || null,
      p_privacy: groupData.privacy || 'private',
      p_created_by: user.id,
      p_participant_ids: groupData.members?.map(member => member.id) || []
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
};

/**
 * Add participants to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Array} userIds - Array of user IDs to add
 * @returns {Promise<number>} Number of users added
 */
export const addParticipantsToConversation = async (conversationId, userIds) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('add_users_to_conversation', {
      p_conversation_id: conversationId,
      p_user_ids: userIds,
      p_added_by: user.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding participants to conversation:', error);
    throw error;
  }
};

/**
 * Remove user from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<boolean>} Whether the removal was successful
 */
export const removeUserFromConversation = async (conversationId, userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('remove_user_from_conversation', {
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_removed_by: user.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing user from conversation:', error);
    throw error;
  }
};

/**
 * Get conversation participants
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of participants
 */
export const getConversationParticipants = async (conversationId) => {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        role,
        joined_at,
        created_at,
        updated_at
      `)
      .eq('conversation_id', conversationId)
      .order('joined_at');

    if (error) throw error;

    // Get user details for each participant
    if (data && data.length > 0) {
      const userIds = data.map(p => p.user_id);
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (userError) throw userError;

      return data.map(participant => ({
        ...participant,
        user: users.find(u => u.id === participant.user_id)
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching conversation participants:', error);
    throw error;
  }
};

/**
 * Get all teams
 * @returns {Promise<Array>} Array of teams with member counts
 */
export const getTeams = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, try to get teams from a teams table if it exists
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, description, created_at')
      .order('name');

    if (teamsError) {
      console.warn('Teams table not found, falling back to user team data:', teamsError.message);

      // Fallback: Get unique teams from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('team_id')
        .not('team_id', 'is', null)
        .not('team_id', 'eq', '');

      if (usersError) throw usersError;

      // Count members per team
      const teamCounts = {};
      usersData?.forEach(user => {
        if (user.team_id) {
          teamCounts[user.team_id] = (teamCounts[user.team_id] || 0) + 1;
        }
      });

      // Convert to team format
      return Object.entries(teamCounts).map(([teamId, memberCount]) => ({
        id: teamId,
        name: teamId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `${memberCount} members`,
        member_count: memberCount,
        created_at: new Date().toISOString()
      }));
    }

    // If teams table exists, get member counts
    const teamsWithCounts = await Promise.all(
      (teamsData || []).map(async (team) => {
        const { count, error: countError } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', team.id);

        return {
          ...team,
          member_count: countError ? 0 : count || 0
        };
      })
    );

    return teamsWithCounts;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export default {
  // Conversations
  getConversations,
  getOrCreateDirectConversation,
  getTeamConversation,
  
  // Messages
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
  searchMessages,
  
  // Real-time
  subscribeToMessages,
  subscribeToConversations,
  subscribeToTyping,
  subscribeToOnlineStatus,
  updateTypingStatus,
  updateOnlineStatus,
  getOnlineStatus,
  
  // Users & Teams
  getUsers,
  getTeamMembers,
  getTeams
};
