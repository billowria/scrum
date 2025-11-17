-- Migration: Add Group Chat Support
-- This migration adds support for group conversations in the chat system

-- Step 1: Update chat_conversations table to support group type
-- Drop the existing type constraint first
ALTER TABLE chat_conversations DROP CONSTRAINT chat_conversations_type_check;

-- Add group-specific fields
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update the type constraint to include 'group'
ALTER TABLE chat_conversations
ADD CONSTRAINT chat_conversations_type_check
CHECK (type IN ('direct', 'team', 'group'));

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_privacy ON chat_conversations(privacy) WHERE privacy IS NOT NULL;

-- Step 4: Create or replace the create_group_conversation function
CREATE OR REPLACE FUNCTION create_group_conversation(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_privacy TEXT DEFAULT 'private',
  p_created_by UUID,
  p_participant_ids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Insert the new group conversation
  INSERT INTO chat_conversations (
    type,
    name,
    description,
    privacy,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    'group',
    p_name,
    p_description,
    p_privacy,
    p_created_by,
    v_current_time,
    v_current_time
  )
  RETURNING id INTO v_conversation_id;

  -- Add the creator to participants if not already included
  IF NOT (p_created_by = ANY(p_participant_ids OR ARRAY[p_created_by])) THEN
    INSERT INTO conversation_participants (
      conversation_id,
      user_id,
      role,
      joined_at,
      created_at,
      updated_at
    ) VALUES (
      v_conversation_id,
      p_created_by,
      'admin',
      v_current_time,
      v_current_time,
      v_current_time
    );
  END IF;

  -- Add other participants if provided
  IF p_participant_ids IS NOT NULL AND CARDINALITY(p_participant_ids) > 0 THEN
    INSERT INTO conversation_participants (
      conversation_id,
      user_id,
      role,
      joined_at,
      created_at,
      updated_at
    )
    SELECT
      v_conversation_id,
      user_id,
      CASE WHEN user_id = p_created_by THEN 'admin' ELSE 'member' END,
      v_current_time,
      v_current_time,
      v_current_time
    FROM unnest(p_participant_ids) AS user_id
    WHERE user_id != p_created_by
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to add users to an existing conversation
CREATE OR REPLACE FUNCTION add_users_to_conversation(
  p_conversation_id UUID,
  p_user_ids UUID[],
  p_added_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_added_count INTEGER := 0;
  v_current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Check if conversation exists and user has permission
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_added_by
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Add new participants
  INSERT INTO conversation_participants (
    conversation_id,
    user_id,
    role,
    joined_at,
    created_at,
    updated_at
  )
  SELECT
    p_conversation_id,
    user_id,
    'member',
    v_current_time,
    v_current_time,
    v_current_time
  FROM unnest(p_user_ids) AS user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = user_id
  )
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  GET DIAGNOSTICS ROW_COUNT INTO v_added_count;

  RETURN v_added_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to remove user from conversation
CREATE OR REPLACE FUNCTION remove_user_from_conversation(
  p_conversation_id UUID,
  p_user_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Check if user has permission (admin/owner) or is removing themselves
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_removed_by
    AND role IN ('admin', 'owner')
  ) AND p_user_id != p_removed_by
  THEN
    -- User is not admin and not removing themselves
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Remove the user from the conversation
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  -- Update the conversation timestamp
  UPDATE chat_conversations
  SET updated_at = v_current_time
  WHERE id = p_conversation_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add RLS policies for group conversations
-- Only authenticated users can create groups
ALTER POLICY "Users can insert conversations" ON chat_conversations
  USING (
    auth.uid() IS NOT NULL AND
    type = 'group' AND
    created_by = auth.uid()
  );

-- Only participants can read group conversations
ALTER POLICY "Users can view conversations they participate in" ON chat_conversations
  USING (
    type = 'group' AND
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = id
      UNION
      SELECT created_by FROM chat_conversations
      WHERE id = conversation_id AND created_by IS NOT NULL
    )
  );

-- Only admins or owners can update group conversations
ALTER POLICY "Users can update conversations they participate in" ON chat_conversations
  USING (
    type = 'group' AND
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = id AND role IN ('admin', 'owner')
    )
  );

-- Only owners can delete group conversations
ALTER POLICY "Users can delete conversations they participate in" ON chat_conversations
  USING (
    type = 'group' AND
    created_by = auth.uid()
  );

-- Step 8: Add RLS policies for conversation participants
ALTER POLICY "Users can view conversation participants" ON conversation_participants
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      UNION
      SELECT created_by FROM chat_conversations cc
      WHERE cc.id = conversation_participants.conversation_id
      AND cc.type = 'group'
      AND cc.created_by IS NOT NULL
    )
  );

ALTER POLICY "Users can insert conversation participants" ON conversation_participants
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
      AND role IN ('admin', 'owner')
      UNION
      SELECT created_by FROM chat_conversations
      WHERE id = conversation_participants.conversation_id
      AND type = 'group'
      AND created_by = auth.uid()
    )
  );

-- Only admins/owners can update participant roles
ALTER POLICY "Users can update conversation participants" ON conversation_participants
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
      AND role IN ('admin', 'owner')
    )
  );

-- Only admins/owners can remove participants (except themselves)
ALTER POLICY "Users can delete conversation participants" ON conversation_participants
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
      AND role IN ('admin', 'owner')
    )
    OR (conversation_participants.user_id = auth.uid())
  );

COMMIT;