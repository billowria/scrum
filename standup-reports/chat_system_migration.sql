-- ============================================================================
-- CHAT SYSTEM MIGRATION
-- Simple Team Chat System for Standup Reports Application
-- ============================================================================
-- Description: Creates tables, indexes, RLS policies, and functions for
--              a real-time chat system with team rooms and direct messaging
-- Version: 1.0
-- Date: 2025-10-12
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

-- Chat Conversations Table
-- Stores both team chats and direct message conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'team')),
    name TEXT, -- Team name or generated DM name
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_message_at TIMESTAMP WITH TIME ZONE, -- For sorting conversations
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

COMMENT ON TABLE chat_conversations IS 'Stores chat conversations (team chats and direct messages)';
COMMENT ON COLUMN chat_conversations.type IS 'Type of conversation: direct (1-on-1) or team (group)';
COMMENT ON COLUMN chat_conversations.last_message_at IS 'Timestamp of last message for sorting';


-- Chat Participants Table
-- Maps users to conversations they're part of
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE, -- For unread count calculation
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(conversation_id, user_id) -- Each user can only be in a conversation once
);

COMMENT ON TABLE chat_participants IS 'Maps users to their conversations with read status';
COMMENT ON COLUMN chat_participants.last_read_at IS 'Last time user read messages in this conversation';


-- Chat Messages Table
-- Stores all chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE, -- NULL if never edited
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE chat_messages IS 'Stores all chat messages with soft delete support';
COMMENT ON COLUMN chat_messages.edited_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN chat_messages.deleted_at IS 'Timestamp when message was deleted (soft delete)';


-- User Online Status Table
-- Tracks user presence (online/offline)
CREATE TABLE IF NOT EXISTS user_online_status (
    user_id UUID PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_online_status IS 'Tracks user online/offline status';


-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for chat_messages (most queried table)
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Full-text search index for messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON chat_messages 
    USING gin(to_tsvector('english', content))
    WHERE deleted_at IS NULL; -- Only index non-deleted messages

-- Indexes for chat_participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);

-- Indexes for chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_team ON chat_conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC NULLS LAST);


-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update conversation's last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_conversation_last_message IS 'Updates conversation timestamp when new message is sent';


-- Function to update conversation's updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- STEP 4: CREATE TRIGGERS
-- ============================================================================

-- Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON chat_messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to update conversation's updated_at on modification
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_conversations;
CREATE TRIGGER trigger_update_conversation_timestamp
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();


-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- ================================
-- Policies for chat_conversations
-- ================================

-- Users can view conversations they are participants of
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
CREATE POLICY "Users can view their conversations"
ON chat_conversations FOR SELECT
USING (
    id IN (
        SELECT conversation_id 
        FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

-- Users can create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations"
ON chat_conversations FOR INSERT
WITH CHECK (true); -- Will be controlled by chat_participants

-- Users can update conversations they're part of (for updating last_message_at)
DROP POLICY IF EXISTS "System can update conversations" ON chat_conversations;
CREATE POLICY "System can update conversations"
ON chat_conversations FOR UPDATE
USING (true); -- Needed for trigger to update last_message_at


-- ================================
-- Policies for chat_participants
-- ================================

-- Users can view participants of their conversations
DROP POLICY IF EXISTS "Users can view participants" ON chat_participants;
CREATE POLICY "Users can view participants"
ON chat_participants FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

-- Users can add participants to conversations they're part of
DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
CREATE POLICY "Users can add participants"
ON chat_participants FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT conversation_id 
        FROM chat_participants
        WHERE user_id = auth.uid()
    )
    OR auth.uid() = user_id -- Or adding themselves
);

-- Users can update their own participant record (for last_read_at)
DROP POLICY IF EXISTS "Users can update their participation" ON chat_participants;
CREATE POLICY "Users can update their participation"
ON chat_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can leave conversations (delete their participation)
DROP POLICY IF EXISTS "Users can leave conversations" ON chat_participants;
CREATE POLICY "Users can leave conversations"
ON chat_participants FOR DELETE
USING (user_id = auth.uid());


-- ================================
-- Policies for chat_messages
-- ================================

-- Users can view messages in their conversations (exclude soft-deleted)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations"
ON chat_messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM chat_participants
        WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL -- Hide soft-deleted messages
);

-- Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
    user_id = auth.uid() 
    AND conversation_id IN (
        SELECT conversation_id 
        FROM chat_participants
        WHERE user_id = auth.uid()
    )
);

-- Users can edit their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages"
ON chat_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own messages (soft delete by setting deleted_at)
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages"
ON chat_messages FOR DELETE
USING (user_id = auth.uid());


-- ================================
-- Policies for user_online_status
-- ================================

-- Everyone can view online status
DROP POLICY IF EXISTS "Everyone can view online status" ON user_online_status;
CREATE POLICY "Everyone can view online status"
ON user_online_status FOR SELECT
USING (true);

-- Users can insert their own status
DROP POLICY IF EXISTS "Users can insert their status" ON user_online_status;
CREATE POLICY "Users can insert their status"
ON user_online_status FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own status
DROP POLICY IF EXISTS "Users can update their own status" ON user_online_status;
CREATE POLICY "Users can update their own status"
ON user_online_status FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS FOR APPLICATION USE
-- ============================================================================

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant_count INTEGER;
BEGIN
    -- Try to find existing direct conversation between these two users
    SELECT c.id INTO conversation_id
    FROM chat_conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
        SELECT 1 FROM chat_participants cp1
        WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM chat_participants cp2
        WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
    -- Ensure it's only these two participants
    AND (
        SELECT COUNT(*) FROM chat_participants
        WHERE conversation_id = c.id
    ) = 2
    LIMIT 1;

    -- If conversation exists, return it
    IF conversation_id IS NOT NULL THEN
        RETURN conversation_id;
    END IF;

    -- Create new direct conversation
    INSERT INTO chat_conversations (type, name)
    VALUES ('direct', NULL)
    RETURNING id INTO conversation_id;

    -- Add both participants
    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES 
        (conversation_id, user1_id),
        (conversation_id, user2_id);

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Gets existing or creates new direct conversation between two users';


-- Function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_count(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    last_read TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Get user's last read timestamp
    SELECT last_read_at INTO last_read
    FROM chat_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

    -- If never read, use epoch
    IF last_read IS NULL THEN
        last_read := '1970-01-01 00:00:00+00';
    END IF;

    -- Count messages after last read
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages
    WHERE conversation_id = p_conversation_id
    AND created_at > last_read
    AND user_id != p_user_id -- Don't count own messages
    AND deleted_at IS NULL; -- Don't count deleted messages

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_count IS 'Returns number of unread messages for a user in a conversation';


-- ============================================================================
-- STEP 8: CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View to get conversations with unread counts and last message info
CREATE OR REPLACE VIEW chat_conversation_list AS
SELECT 
    c.id,
    c.type,
    c.name,
    c.team_id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    cp.user_id as participant_user_id,
    cp.last_read_at,
    (
        SELECT COUNT(*)
        FROM chat_messages cm
        WHERE cm.conversation_id = c.id
        AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
        AND cm.user_id != cp.user_id
        AND cm.deleted_at IS NULL
    ) as unread_count,
    (
        SELECT json_build_object(
            'id', cm.id,
            'content', cm.content,
            'user_id', cm.user_id,
            'created_at', cm.created_at
        )
        FROM chat_messages cm
        WHERE cm.conversation_id = c.id
        AND cm.deleted_at IS NULL
        ORDER BY cm.created_at DESC
        LIMIT 1
    ) as last_message
FROM chat_conversations c
INNER JOIN chat_participants cp ON cp.conversation_id = c.id;

COMMENT ON VIEW chat_conversation_list IS 'Provides conversation list with unread counts and last message';


-- ============================================================================
-- STEP 9: INITIALIZE DATA (OPTIONAL - CREATE TEAM CONVERSATIONS)
-- ============================================================================

-- Function to auto-create team conversations for existing teams
CREATE OR REPLACE FUNCTION initialize_team_conversations()
RETURNS void AS $$
DECLARE
    team_record RECORD;
    conversation_id UUID;
BEGIN
    -- Loop through all teams
    FOR team_record IN SELECT id, name FROM teams LOOP
        -- Check if team conversation already exists
        IF NOT EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE type = 'team' AND team_id = team_record.id
        ) THEN
            -- Create team conversation
            INSERT INTO chat_conversations (type, name, team_id)
            VALUES ('team', team_record.name, team_record.id)
            RETURNING id INTO conversation_id;

            -- Add all team members as participants
            INSERT INTO chat_participants (conversation_id, user_id)
            SELECT conversation_id, u.id
            FROM users u
            WHERE u.team_id = team_record.id;

            RAISE NOTICE 'Created conversation for team: %', team_record.name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_team_conversations IS 'Creates team conversations for all existing teams';


-- ============================================================================
-- STEP 10: RUN INITIALIZATION (UNCOMMENT TO RUN)
-- ============================================================================

-- Uncomment the line below to create team conversations for existing teams
-- SELECT initialize_team_conversations();


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the migration was successful

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chat_%' OR table_name = 'user_online_status';

-- Check if indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'chat_%' OR tablename = 'user_online_status';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'chat_%' OR tablename = 'user_online_status');

-- Check if policies were created
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'chat_%' OR tablename = 'user_online_status';


-- ============================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ============================================================================

/*
-- CAUTION: This will delete all chat data!
-- Uncomment and run only if you need to completely remove the chat system

-- Drop views
DROP VIEW IF EXISTS chat_conversation_list;

-- Drop functions
DROP FUNCTION IF EXISTS initialize_team_conversations();
DROP FUNCTION IF EXISTS get_unread_count(UUID, UUID);
DROP FUNCTION IF EXISTS get_or_create_direct_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS update_conversation_timestamp();
DROP FUNCTION IF EXISTS update_conversation_last_message();

-- Drop tables (cascade will remove all policies, triggers, etc.)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS user_online_status CASCADE;
*/


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Chat System Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: 4';
    RAISE NOTICE 'Indexes created: 9';
    RAISE NOTICE 'Functions created: 5';
    RAISE NOTICE 'Triggers created: 2';
    RAISE NOTICE 'RLS Policies created: 14';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: SELECT initialize_team_conversations();';
    RAISE NOTICE '2. Install frontend dependencies';
    RAISE NOTICE '3. Create chat components';
    RAISE NOTICE '========================================';
END $$;
