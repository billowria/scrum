-- ============================================================================
-- FIX: Ambiguous column reference in get_or_create_direct_conversation
-- ============================================================================
-- Issue: The function has ambiguous reference to "conversation_id" 
--        in the COUNT subquery on line 336
-- Fix: Qualify the column name with table alias
-- ============================================================================

-- Drop and recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;  -- Renamed to avoid ambiguity
    participant_count INTEGER;
BEGIN
    -- Try to find existing direct conversation between these two users
    SELECT c.id INTO v_conversation_id
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
    -- Ensure it's only these two participants (fixed: fully qualify conversation_id)
    AND (
        SELECT COUNT(*) FROM chat_participants cp3
        WHERE cp3.conversation_id = c.id
    ) = 2
    LIMIT 1;

    -- If conversation exists, return it
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- Create new direct conversation
    INSERT INTO chat_conversations (type, name)
    VALUES ('direct', NULL)
    RETURNING id INTO v_conversation_id;

    -- Add both participants
    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES 
        (v_conversation_id, user1_id),
        (v_conversation_id, user2_id);

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Gets existing or creates new direct conversation between two users (fixed ambiguous column reference)';

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 'Function updated successfully!' as status;
