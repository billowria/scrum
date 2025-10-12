# Simple Team Chat System - Implementation Plan

## Overview
A clean, responsive chat system for team communication with beautiful UI - no file attachments, focused on text messaging.

## Features Scope

### ✅ Included
- Real-time text messaging
- Team-based chat rooms (one per team)
- Direct messages (1-on-1)
- Online/offline status
- Typing indicators
- Unread message counts
- Message history with pagination
- @mentions with notifications
- Emoji support (basic)
- Message editing & deletion
- Search messages
- Beautiful, responsive UI
- Mobile-friendly

### ❌ Excluded (Keeping it Simple)
- File attachments/uploads
- Voice/Video calls
- Message reactions
- Threading/replies
- Rich text formatting (just plain text with links)
- Channel creation (auto-created per team)
- Read receipts

---

## Database Schema

### Tables Required

```sql
-- Chat Conversations Table (simplified for teams and DMs)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'team')),
    name TEXT,
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(conversation_id, user_id)
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Online Status
CREATE TABLE IF NOT EXISTS user_online_status (
    user_id UUID PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX idx_chat_conversations_team ON chat_conversations(team_id);
CREATE INDEX idx_chat_messages_search ON chat_messages USING gin(to_tsvector('english', content));
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their conversations"
ON chat_conversations FOR SELECT
USING (
    id IN (
        SELECT conversation_id FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can view their messages"
ON chat_messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    conversation_id IN (
        SELECT conversation_id FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their messages"
ON chat_messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Everyone can view online status"
ON user_online_status FOR SELECT
USING (true);

CREATE POLICY "Users can update their own status"
ON user_online_status FOR ALL
USING (user_id = auth.uid());
```

---

## Frontend Structure

```
src/
├── pages/
│   └── ChatPage.jsx                    # Main chat page
│
├── components/
│   └── chat/
│       ├── ChatLayout.jsx              # Main layout container
│       ├── ChatSidebar.jsx             # Conversations list sidebar
│       ├── ConversationItem.jsx        # Conversation list item
│       ├── ChatWindow.jsx              # Main chat window
│       ├── ChatHeader.jsx              # Chat header with user info
│       ├── MessageList.jsx             # Scrollable message list
│       ├── Message.jsx                 # Individual message bubble
│       ├── MessageInput.jsx            # Input box with send button
│       ├── TypingIndicator.jsx         # "User is typing..."
│       ├── OnlineIndicator.jsx         # Green/gray dot for status
│       ├── EmptyState.jsx              # No conversation selected
│       ├── SearchMessages.jsx          # Search input
│       └── UserListModal.jsx           # Select user for DM
│
├── hooks/
│   ├── useChat.js                      # Main chat hook
│   ├── useChatMessages.js              # Message management
│   ├── useConversations.js             # Conversation list
│   ├── useTypingIndicator.js           # Typing status
│   └── useOnlineStatus.js              # User presence
│
├── services/
│   └── chatService.js                  # Chat API & real-time
│
└── utils/
    └── chatUtils.js                    # Helpers (linkify, mentions, etc.)
```

---

## UI Design Concept

### Color Scheme (matching your existing design system)
```javascript
// Using your existing Tailwind config colors
{
  primary: 'indigo-600',      // Main accent
  secondary: 'purple-600',    // Secondary accent
  background: 'gray-50',      // Page background
  sidebar: 'white',           // Sidebar background
  chatBg: 'gray-100',         // Chat window background
  myMessage: 'indigo-600',    // My message bubbles
  theirMessage: 'white',      // Others' message bubbles
  online: 'green-500',        // Online status
  offline: 'gray-400'         // Offline status
}
```

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│  Navbar (existing)                                     │
├──────────────┬─────────────────────────────────────────┤
│              │  Chat Header                            │
│  Sidebar     │  [@User or #Team Name]      [Search] X │
│              ├─────────────────────────────────────────┤
│  [Search]    │                                         │
│              │  Messages                               │
│  Team Chats  │  ┌─────────────────────┐               │
│  • #Team A   │  │ Their message       │               │
│  • #Team B   │  └─────────────────────┘               │
│              │              ┌─────────────────────┐   │
│  Direct Msgs │              │    My message       │   │
│  • Alice 🟢  │              └─────────────────────┘   │
│  • Bob       │                                         │
│  • Carol 🟢  │  [User is typing...]                   │
│              ├─────────────────────────────────────────┤
│  [+ New DM]  │  [Type a message...] [😊] [Send]      │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Setup
**File:** `chat_system_migration.sql`

### Step 2: Service Layer
**File:** `src/services/chatService.js`

```javascript
// Key functions:
- getConversations()
- getOrCreateDirectConversation(userId)
- getTeamConversation(teamId)
- getMessages(conversationId, limit, offset)
- sendMessage(conversationId, content)
- updateMessage(messageId, content)
- deleteMessage(messageId)
- markAsRead(conversationId)
- searchMessages(query)
- subscribeToConversation(conversationId, callback)
- subscribeToTyping(conversationId, callback)
- updateTypingStatus(conversationId, isTyping)
- updateOnlineStatus(isOnline)
```

### Step 3: Core Components

#### ChatLayout.jsx
```jsx
// Two-column layout
// Left: Sidebar with conversations
// Right: Active chat window
// Responsive: Stack on mobile
```

#### MessageList.jsx
```jsx
// Virtual scrolling for performance
// Load more on scroll up
// Auto-scroll to bottom on new message
// Date separators
// Smooth animations
```

#### Message.jsx
```jsx
// Bubble design
// Different styles for own vs others
// Show user avatar (from user_profiles)
// Timestamp on hover
// Edit/delete menu for own messages
// Linkify URLs
// Highlight @mentions
```

#### MessageInput.jsx
```jsx
// Textarea with auto-resize
// Emoji picker button
// @mention autocomplete
// Send on Enter (Shift+Enter for newline)
// Character count (optional)
```

### Step 4: Real-time Features

```javascript
// Subscribe to new messages
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe();

// Typing indicators using Presence
supabase
  .channel(`typing:${conversationId}`)
  .on('presence', { event: 'sync' }, handleTypingSync)
  .track({ user_id: currentUserId, typing: true })
  .subscribe();

// Online status
supabase
  .channel('online-users')
  .on('presence', { event: 'sync' }, handleOnlineSync)
  .subscribe();
```

---

## Dependencies to Install

```bash
npm install emoji-mart linkify-react react-window
```

```json
{
  "emoji-mart": "^5.5.2",           // Emoji picker
  "linkify-react": "^4.1.3",        // Auto-linkify URLs
  "react-window": "^1.8.10"         // Virtual scrolling
}
```

---

## Key Features Implementation

### 1. Auto-create Team Conversations

```javascript
// When a user logs in, ensure they have access to their team chat
const ensureTeamConversation = async (teamId) => {
  const { data: existing } = await supabase
    .from('chat_conversations')
    .select('id')
    .eq('type', 'team')
    .eq('team_id', teamId)
    .single();
    
  if (!existing) {
    // Create team conversation
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .insert({
        type: 'team',
        name: teamName,
        team_id: teamId
      })
      .select()
      .single();
      
    // Add all team members as participants
    const teamMembers = await getTeamMembers(teamId);
    await supabase
      .from('chat_participants')
      .insert(
        teamMembers.map(m => ({
          conversation_id: conversation.id,
          user_id: m.id
        }))
      );
  }
};
```

### 2. Unread Count

```javascript
const getUnreadCount = async (conversationId) => {
  const { data: participant } = await supabase
    .from('chat_participants')
    .select('last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
    .single();
    
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .gt('created_at', participant.last_read_at || '1970-01-01');
    
  return count;
};
```

### 3. @Mentions with Autocomplete

```javascript
// Detect @ in MessageInput
// Show dropdown with team members
// Insert @username
// Store mention in message content
// Send notification to mentioned user
```

### 4. Message Search

```javascript
const searchMessages = async (query) => {
  const { data } = await supabase
    .from('chat_messages')
    .select(`
      *,
      conversation:chat_conversations(*),
      user:users(name, avatar_url)
    `)
    .textSearch('content', query)
    .order('created_at', { ascending: false })
    .limit(50);
    
  return data;
};
```

---

## Responsive Design Breakpoints

```javascript
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px

// Mobile: Show only sidebar OR chat (toggle)
// Tablet/Desktop: Show both side-by-side
```

### Mobile Navigation

```jsx
// Add back button in chat header on mobile
// Show sidebar by default
// When conversation selected, show chat (hide sidebar)
// Back button returns to sidebar
```

---

## Performance Optimizations

1. **Message Pagination:** Load 50 messages at a time
2. **Virtual Scrolling:** Use react-window for 1000+ messages
3. **Debounced Typing:** Update typing status every 500ms
4. **Optimistic Updates:** Show message immediately, confirm later
5. **Cached Conversations:** Store in React state
6. **Throttled Scroll:** Load more messages on scroll (throttled)

---

## Animation & Polish

### Framer Motion Animations

```jsx
// Message entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {message}
</motion.div>

// Sidebar item hover
<motion.div
  whileHover={{ x: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
  transition={{ duration: 0.2 }}
>
  {conversation}
</motion.div>

// Typing indicator bounce
<motion.span
  animate={{ y: [0, -3, 0] }}
  transition={{ repeat: Infinity, duration: 0.6 }}
>
  •
</motion.span>
```

---

## Timeline

### Week 1: Backend & Foundation
- ✅ Database schema
- ✅ RLS policies
- ✅ chatService.js
- ✅ Basic components structure

### Week 2: Core UI
- ✅ ChatLayout
- ✅ ChatSidebar
- ✅ MessageList
- ✅ MessageInput
- ✅ Real-time messaging working

### Week 3: Features & Polish
- ✅ Typing indicators
- ✅ Online status
- ✅ @Mentions
- ✅ Search
- ✅ Unread counts
- ✅ Message edit/delete

### Week 4: Responsive & Testing
- ✅ Mobile responsiveness
- ✅ Animations
- ✅ Testing
- ✅ Bug fixes
- ✅ Documentation

**Total: 4 weeks**

---

## Success Metrics

- ✅ Messages delivered in < 100ms
- ✅ UI loads in < 500ms
- ✅ Works smoothly on mobile
- ✅ 90%+ user satisfaction
- ✅ No critical bugs

---

## Next Steps

1. **Review this plan** - Confirm it meets your needs
2. **Create database migration** - Set up tables
3. **Build service layer** - chatService.js
4. **Create UI components** - Start with layout
5. **Implement real-time** - WebSocket connections
6. **Add features** - Typing, online status, etc.
7. **Polish UI** - Animations, responsive design
8. **Test & deploy** - QA and rollout

---

Ready to start building? Let's begin! 🚀
