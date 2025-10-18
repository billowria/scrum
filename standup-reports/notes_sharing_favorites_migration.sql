-- Notes Enhancement Script for Sharing and Favorites
-- Run this script to add sharing capabilities and favorites functionality

-- Add new columns to the notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS share_permission TEXT DEFAULT 'read' CHECK (share_permission IN ('read', 'edit'));

-- Create performance indexes for new features
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_is_shared ON notes(is_shared);
CREATE INDEX IF NOT EXISTS idx_notes_shared_with ON notes USING GIN(shared_with);
CREATE INDEX IF NOT EXISTS idx_notes_shared_by ON notes(shared_by);
CREATE INDEX IF NOT EXISTS idx_notes_shared_at ON notes(shared_at DESC);

-- Create a separate table for detailed share tracking (optional but recommended)
CREATE TABLE IF NOT EXISTS note_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_with UUID NOT NULL REFERENCES users(id),
    permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'edit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(note_id, shared_with)
);

-- Indexes for note_shares table
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with ON note_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_by ON note_shares(shared_by);

-- Drop existing RLS policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Create comprehensive RLS policies for notes table
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view notes shared with them" ON notes
    FOR SELECT USING (
        is_shared = true AND 
        auth.uid() = ANY(shared_with)
    );

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared notes with edit permission" ON notes
    FOR UPDATE USING (
        is_shared = true AND 
        auth.uid() = ANY(shared_with) AND
        share_permission = 'edit'
    );

CREATE POLICY "Users can update sharing info for own notes" ON notes
    FOR UPDATE USING (
        auth.uid() = user_id AND
        (
            is_shared IS DISTINCT FROM false OR
            shared_with IS DISTINCT FROM '{}' OR
            share_permission IS DISTINCT FROM 'read'
        )
    );

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for note_shares table
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares of their notes" ON note_shares
    FOR SELECT USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their notes" ON note_shares
    FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update shares they created" ON note_shares
    FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created" ON note_shares
    FOR DELETE USING (auth.uid() = shared_by);

-- Create a function to handle note sharing (optional helper)
CREATE OR REPLACE FUNCTION share_note_with_user(
    p_note_id UUID,
    p_shared_with UUID,
    p_permission TEXT DEFAULT 'read',
    p_shared_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_note_owner UUID;
BEGIN
    -- Get the note owner
    SELECT user_id INTO v_note_owner 
    FROM notes 
    WHERE id = p_note_id;
    
    -- Check if user is the note owner
    IF v_note_owner != p_shared_by THEN
        RAISE EXCEPTION 'Only note owner can share notes';
        RETURN FALSE;
    END IF;
    
    -- Update the notes table
    UPDATE notes SET
        is_shared = true,
        shared_with = array_append(
            COALESCE(shared_with, '{}'), 
            p_shared_with
        ),
        shared_by = p_shared_by,
        shared_at = NOW(),
        share_permission = p_permission
    WHERE id = p_note_id;
    
    -- Add to detailed tracking table
    INSERT INTO note_shares (note_id, shared_by, shared_with, permission)
    VALUES (p_note_id, p_shared_by, p_shared_with, p_permission)
    ON CONFLICT (note_id, shared_with) 
    DO UPDATE SET 
        permission = p_permission,
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error sharing note: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to toggle favorites
CREATE OR REPLACE FUNCTION toggle_note_favorite(
    p_note_id UUID,
    p_is_favorite BOOLEAN DEFAULT true,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user owns the note or has access to it
    IF NOT EXISTS (
        SELECT 1 FROM notes 
        WHERE id = p_note_id 
        AND (user_id = p_user_id OR (is_shared = true AND p_user_id = ANY(shared_with)))
    ) THEN
        RAISE EXCEPTION 'User does not have access to this note';
        RETURN FALSE;
    END IF;
    
    -- Only note owners can mark as favorite (or we can extend this to shared users)
    UPDATE notes 
    SET is_favorite = p_is_favorite 
    WHERE id = p_note_id AND user_id = p_user_id;
    
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error toggling favorite: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for shared notes (helpful for queries)
CREATE OR REPLACE VIEW shared_notes AS
SELECT 
    n.*,
    u.name as shared_by_name,
    u.email as shared_by_email,
    CASE 
        WHEN n.share_permission = 'edit' THEN 'Can Edit'
        ELSE 'Read Only'
    END as permission_level
FROM notes n
LEFT JOIN users u ON n.shared_by = u.id
WHERE n.is_shared = true;

-- Create a view for favorite notes
CREATE OR REPLACE VIEW favorite_notes AS
SELECT 
    n.*,
    CASE 
        WHEN n.is_shared = true THEN 'Shared Favorite'
        ELSE 'Personal Favorite'
    END as favorite_type
FROM notes n
WHERE n.is_favorite = true;

-- Grant permissions
GRANT ALL ON note_shares TO authenticated;
GRANT SELECT ON shared_notes TO authenticated;
GRANT SELECT ON favorite_notes TO authenticated;
GRANT EXECUTE ON FUNCTION share_note_with_user TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_note_favorite TO authenticated;

-- Create helpful comments
COMMENT ON COLUMN notes.is_favorite IS 'Indicates if the note is marked as favorite by the owner';
COMMENT ON COLUMN notes.is_shared IS 'Indicates if the note is shared with other users';
COMMENT ON COLUMN notes.shared_with IS 'Array of user IDs who have access to this shared note';
COMMENT ON COLUMN notes.shared_by IS 'User ID of who shared this note';
COMMENT ON COLUMN notes.shared_at IS 'Timestamp when the note was shared';
COMMENT ON COLUMN notes.share_permission IS 'Default permission level for shared users: read or edit';

COMMENT ON TABLE note_shares IS 'Detailed tracking of note sharing with individual permissions';
COMMENT ON VIEW shared_notes IS 'View of all shared notes with sender information';
COMMENT ON VIEW favorite_notes IS 'View of all favorite notes with type classification';

-- Sample query helpers (for reference)
-- Get all personal notes for a user:
-- SELECT * FROM notes WHERE user_id = auth.uid() AND is_shared = false;

-- Get all notes shared with a user:
-- SELECT * FROM notes WHERE is_shared = true AND auth.uid() = ANY(shared_with);

-- Get all favorite notes for a user:
-- SELECT * FROM notes WHERE is_favorite = true AND user_id = auth.uid();

-- Get shared notes with edit permission:
-- SELECT * FROM notes WHERE is_shared = true AND auth.uid() = ANY(shared_with) AND share_permission = 'edit';
