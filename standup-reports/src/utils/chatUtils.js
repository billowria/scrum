import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Chat Utility Functions
 */

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format message timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  } catch (error) {
    return '';
  }
};

/**
 * Format conversation last message time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  } catch (error) {
    return '';
  }
};

/**
 * Get relative time (e.g., "2 minutes ago")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return '';
  }
};

/**
 * Check if should show date separator
 * @param {string} currentMessageDate - Current message date
 * @param {string} previousMessageDate - Previous message date
 * @returns {boolean} True if should show separator
 */
export const shouldShowDateSeparator = (currentMessageDate, previousMessageDate) => {
  if (!previousMessageDate) return true;
  
  const current = typeof currentMessageDate === 'string' ? parseISO(currentMessageDate) : currentMessageDate;
  const previous = typeof previousMessageDate === 'string' ? parseISO(previousMessageDate) : previousMessageDate;
  
  return format(current, 'yyyy-MM-dd') !== format(previous, 'yyyy-MM-dd');
};

/**
 * Format date separator
 * @param {string} date - ISO date string
 * @returns {string} Formatted date
 */
export const formatDateSeparator = (date) => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(d)) {
      return 'Today';
    } else if (isYesterday(d)) {
      return 'Yesterday';
    } else {
      return format(d, 'MMMM d, yyyy');
    }
  } catch (error) {
    return '';
  }
};

// ============================================================================
// MESSAGE PARSING
// ============================================================================

/**
 * Parse mentions from message content
 * @param {string} content - Message content
 * @returns {Array<string>} Array of mentioned user IDs
 */
export const parseMentions = (content) => {
  if (!content) return [];
  
  const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // Extract user ID
  }
  
  return mentions;
};

/**
 * Format message with mentions as clickable elements
 * @param {string} content - Message content
 * @param {Array} users - Array of user objects
 * @returns {string} HTML string with formatted mentions
 */
export const formatMentions = (content, users = []) => {
  if (!content) return '';
  
  const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  
  return content.replace(mentionRegex, (match, name, userId) => {
    const user = users.find(u => u.id === userId);
    const displayName = user?.name || name;
    return `<span class="mention" data-user-id="${userId}">@${displayName}</span>`;
  });
};

/**
 * Convert plain @username to mention format
 * @param {string} content - Message content
 * @param {Array} users - Array of user objects to search
 * @returns {string} Content with formatted mentions
 */
export const convertToMentionFormat = (content, users = []) => {
  if (!content) return '';
  
  let result = content;
  
  users.forEach(user => {
    const regex = new RegExp(`@${user.name}\\b`, 'gi');
    result = result.replace(regex, `@[${user.name}](${user.id})`);
  });
  
  return result;
};

// ============================================================================
// URL DETECTION & LINKIFY
// ============================================================================

/**
 * Check if text contains URLs
 * @param {string} text - Text to check
 * @returns {boolean} True if contains URLs
 */
export const containsUrl = (text) => {
  if (!text) return false;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
};

/**
 * Extract URLs from text
 * @param {string} text - Text to parse
 * @returns {Array<string>} Array of URLs
 */
export const extractUrls = (text) => {
  if (!text) return [];
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// ============================================================================
// EMOJI HELPERS
// ============================================================================

/**
 * Check if string is only emoji
 * @param {string} text - Text to check
 * @returns {boolean} True if only emoji
 */
export const isOnlyEmoji = (text) => {
  if (!text) return false;
  
  const emojiRegex = /^(\p{Emoji}|\s)+$/u;
  return emojiRegex.test(text.trim());
};

/**
 * Count emojis in string
 * @param {string} text - Text to analyze
 * @returns {number} Number of emojis
 */
export const countEmojis = (text) => {
  if (!text) return 0;
  
  const emojiRegex = /\p{Emoji}/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
};

// ============================================================================
// MESSAGE GROUPING
// ============================================================================

/**
 * Check if messages should be grouped (same user, within 2 minutes)
 * @param {Object} currentMessage - Current message
 * @param {Object} previousMessage - Previous message
 * @returns {boolean} True if should be grouped
 */
export const shouldGroupMessages = (currentMessage, previousMessage) => {
  if (!currentMessage || !previousMessage) return false;
  if (currentMessage.user_id !== previousMessage.user_id) return false;
  
  const currentTime = new Date(currentMessage.created_at).getTime();
  const previousTime = new Date(previousMessage.created_at).getTime();
  const timeDiff = currentTime - previousTime;
  
  // Group if within 2 minutes (120000 ms)
  return timeDiff < 120000;
};

// ============================================================================
// USER AVATARS
// ============================================================================

/**
 * Get initials from name
 * @param {string} name - User name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get avatar color based on user ID
 * @param {string} userId - User ID
 * @returns {string} Tailwind color class
 */
export const getAvatarColor = (userId) => {
  if (!userId) return 'bg-gray-500';
  
  const colors = [
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-orange-500'
  ];
  
  // Use user ID to consistently select a color
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// ============================================================================
// MESSAGE CONTENT HELPERS
// ============================================================================

/**
 * Truncate message for preview
 * @param {string} content - Message content
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content
 */
export const truncateMessage = (content, maxLength = 50) => {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  
  return content.substring(0, maxLength).trim() + '...';
};

/**
 * Strip mentions from content for preview
 * @param {string} content - Message content
 * @returns {string} Content without mention formatting
 */
export const stripMentionFormat = (content) => {
  if (!content) return '';
  
  const mentionRegex = /@\[([^\]]+)\]\([a-f0-9-]+\)/g;
  return content.replace(mentionRegex, '@$1');
};

/**
 * Get message preview text
 * @param {Object} message - Message object
 * @returns {string} Preview text
 */
export const getMessagePreview = (message) => {
  if (!message) return '';
  
  let content = message.content || '';
  
  // Strip mention formatting
  content = stripMentionFormat(content);
  
  // Truncate
  return truncateMessage(content, 60);
};

// ============================================================================
// CONVERSATION HELPERS
// ============================================================================

/**
 * Get conversation display name
 * @param {Object} conversation - Conversation object
 * @param {Object} currentUser - Current user object
 * @returns {string} Display name
 */
export const getConversationName = (conversation, currentUser) => {
  if (!conversation) return '';
  
  if (conversation.type === 'team') {
    return conversation.name || 'Team Chat';
  }
  
  // Direct message - show other user's name
  if (conversation.type === 'direct') {
    const otherUser = conversation.participants?.find(p => p.id !== currentUser?.id);
    return otherUser?.name || 'Direct Message';
  }
  
  return conversation.name || 'Conversation';
};

/**
 * Get conversation icon/prefix
 * @param {Object} conversation - Conversation object
 * @returns {string} Icon symbol
 */
export const getConversationIcon = (conversation) => {
  if (!conversation) return '';
  
  if (conversation.type === 'team') {
    return '#'; // Hash for team channels
  }
  
  return '@'; // @ for direct messages
};

/**
 * Sort conversations by last message time
 * @param {Array} conversations - Array of conversations
 * @returns {Array} Sorted conversations
 */
export const sortConversations = (conversations) => {
  if (!conversations) return [];
  
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime; // Most recent first
  });
};

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/**
 * Highlight search term in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to highlight
 * @returns {string} HTML with highlighted terms
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate message content
 * @param {string} content - Message content
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateMessage = (content) => {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 5000) {
    return { valid: false, error: 'Message is too long (max 5000 characters)' };
  }
  
  return { valid: true, error: null };
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Check if user should be notified of message
 * @param {Object} message - Message object
 * @param {Object} currentUser - Current user object
 * @returns {boolean} True if should notify
 */
export const shouldNotify = (message, currentUser) => {
  if (!message || !currentUser) return false;
  
  // Don't notify for own messages
  if (message.user_id === currentUser.id) return false;
  
  // Check if mentioned
  const mentions = parseMentions(message.content);
  if (mentions.includes(currentUser.id)) return true;
  
  // Check if @everyone or @channel
  if (message.content.includes('@everyone') || message.content.includes('@channel')) {
    return true;
  }
  
  return false;
};

/**
 * Get notification title for message
 * @param {Object} message - Message object
 * @param {Object} conversation - Conversation object
 * @returns {string} Notification title
 */
export const getNotificationTitle = (message, conversation) => {
  if (!message || !conversation) return 'New Message';
  
  const userName = message.user?.name || 'Someone';
  
  if (conversation.type === 'direct') {
    return userName;
  }
  
  return `${userName} in ${conversation.name}`;
};

/**
 * Get notification body for message
 * @param {Object} message - Message object
 * @returns {string} Notification body
 */
export const getNotificationBody = (message) => {
  if (!message) return '';
  
  let content = message.content || '';
  content = stripMentionFormat(content);
  return truncateMessage(content, 100);
};

// ============================================================================
// TYPING INDICATOR HELPERS
// ============================================================================

/**
 * Format typing indicator text
 * @param {Array} typingUsers - Array of typing user objects
 * @param {Object} currentUser - Current user object
 * @returns {string} Formatted typing text
 */
export const formatTypingIndicator = (typingUsers, currentUser) => {
  if (!typingUsers || typingUsers.length === 0) return '';
  
  // Filter out current user
  const others = typingUsers.filter(u => u.id !== currentUser?.id);
  
  if (others.length === 0) return '';
  if (others.length === 1) return `${others[0].name} is typing...`;
  if (others.length === 2) return `${others[0].name} and ${others[1].name} are typing...`;
  return `${others[0].name} and ${others.length - 1} others are typing...`;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Date & Time
  formatMessageTime,
  formatConversationTime,
  getRelativeTime,
  shouldShowDateSeparator,
  formatDateSeparator,
  
  // Message Parsing
  parseMentions,
  formatMentions,
  convertToMentionFormat,
  
  // URLs
  containsUrl,
  extractUrls,
  
  // Emoji
  isOnlyEmoji,
  countEmojis,
  
  // Message Grouping
  shouldGroupMessages,
  
  // Avatars
  getInitials,
  getAvatarColor,
  
  // Message Content
  truncateMessage,
  stripMentionFormat,
  getMessagePreview,
  
  // Conversations
  getConversationName,
  getConversationIcon,
  sortConversations,
  
  // Search
  highlightSearchTerm,
  
  // Validation
  validateMessage,
  
  // Notifications
  shouldNotify,
  getNotificationTitle,
  getNotificationBody,
  
  // Typing
  formatTypingIndicator
};
