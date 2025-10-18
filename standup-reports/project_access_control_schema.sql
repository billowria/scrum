-- Migration: Project Access Control Schema
-- Extends project_assignments and creates new tables for granular permissions and access requests

-- 1. Extend project_assignments table to support granular permissions
ALTER TABLE project_assignments 
ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'Viewer' CHECK (permission_level IN ('Viewer', 'Editor', 'Manager', 'Admin')),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update updated_at trigger for project_assignments
CREATE OR REPLACE FUNCTION update_project_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_assignments_updated_at_trigger ON project_assignments;
CREATE TRIGGER update_project_assignments_updated_at_trigger
    BEFORE UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_assignments_updated_at();

-- 2. Create project_permissions table to define permission types
CREATE TABLE IF NOT EXISTS project_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permission types
INSERT INTO project_permissions (name, description) VALUES
    ('read', 'Can view project content and details'),
    ('write', 'Can create and edit project content'),
    ('delete', 'Can delete project content'),
    ('manage_access', 'Can manage user access to the project'),
    ('invite_users', 'Can invite new users to the project')
ON CONFLICT (name) DO NOTHING;

-- 3. Create project_role_permissions table to define permissions for each role
CREATE TABLE IF NOT EXISTS project_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('Viewer', 'Editor', 'Manager', 'Admin')),
    permission_id UUID NOT NULL REFERENCES project_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (role, permission_id)
);

-- Insert default role permissions
INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Viewer', 
    (SELECT id FROM project_permissions WHERE name = 'read')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Editor', 
    (SELECT id FROM project_permissions WHERE name = 'read')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Editor', 
    (SELECT id FROM project_permissions WHERE name = 'write')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Manager', 
    (SELECT id FROM project_permissions WHERE name = 'read')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Manager', 
    (SELECT id FROM project_permissions WHERE name = 'write')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Manager', 
    (SELECT id FROM project_permissions WHERE name = 'delete')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Manager', 
    (SELECT id FROM project_permissions WHERE name = 'invite_users')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Admin', 
    (SELECT id FROM project_permissions WHERE name = 'read')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Admin', 
    (SELECT id FROM project_permissions WHERE name = 'write')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Admin', 
    (SELECT id FROM project_permissions WHERE name = 'delete')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Admin', 
    (SELECT id FROM project_permissions WHERE name = 'manage_access')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO project_role_permissions (role, permission_id) 
SELECT 
    'Admin', 
    (SELECT id FROM project_permissions WHERE name = 'invite_users')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 4. Create project_access_requests table for access request workflows
CREATE TABLE IF NOT EXISTS project_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('Viewer', 'Editor', 'Manager', 'Admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_message TEXT,
    response_message TEXT,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, user_id, status) -- Prevent duplicate pending requests
);

-- Update updated_at trigger for project_access_requests
CREATE OR REPLACE FUNCTION update_project_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_access_requests_updated_at_trigger ON project_access_requests;
CREATE TRIGGER update_project_access_requests_updated_at_trigger
    BEFORE UPDATE ON project_access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_project_access_requests_updated_at();

-- 5. Create project_access_audit table for audit trail
CREATE TABLE IF NOT EXISTS project_access_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('assigned', 'role_changed', 'removed', 'access_requested', 'access_approved', 'access_rejected')),
    old_role TEXT,
    new_role TEXT,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_permission_level ON project_assignments(permission_level);

CREATE INDEX IF NOT EXISTS idx_project_access_requests_project_id ON project_access_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_access_requests_user_id ON project_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_project_access_requests_status ON project_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_project_access_audit_project_id ON project_access_audit(project_id);
CREATE INDEX IF NOT EXISTS idx_project_access_audit_user_id ON project_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_project_access_audit_action ON project_access_audit(action);
CREATE INDEX IF NOT EXISTS idx_project_access_audit_created_at ON project_access_audit(created_at);

-- 7. Enable RLS on all new tables
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access_audit ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for project_permissions
CREATE POLICY "Anyone can view project permissions" ON project_permissions
    FOR SELECT USING (true);

-- 9. RLS Policies for project_role_permissions
CREATE POLICY "Anyone can view role permissions" ON project_role_permissions
    FOR SELECT USING (true);

-- 10. RLS Policies for project_access_requests
CREATE POLICY "Users can view their own access requests" ON project_access_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project members can view access requests for their projects" ON project_access_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments 
            WHERE project_assignments.project_id = project_access_requests.project_id 
            AND project_assignments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create access requests for themselves" ON project_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project managers and admins can update access requests" ON project_access_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM project_assignments 
            WHERE project_assignments.project_id = project_access_requests.project_id 
            AND project_assignments.user_id = auth.uid()
            AND project_assignments.permission_level IN ('Manager', 'Admin')
        )
    );

-- 11. RLS Policies for project_access_audit
CREATE POLICY "Users can view audit entries for their projects" ON project_access_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments 
            WHERE project_assignments.project_id = project_access_audit.project_id 
            AND project_assignments.user_id = auth.uid()
        )
    );

-- 12. Function to check user permissions for a project
CREATE OR REPLACE FUNCTION has_project_permission(
    project_uuid UUID,
    user_uuid UUID,
    permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Get the user's role in the project
    SELECT permission_level INTO user_role
    FROM project_assignments
    WHERE project_assignments.project_id = project_uuid
    AND project_assignments.user_id = user_uuid;
    
    -- If user is not assigned to the project, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the role has the requested permission
    SELECT EXISTS (
        SELECT 1 FROM project_role_permissions prp
        JOIN project_permissions pp ON prp.permission_id = pp.id
        WHERE prp.role = user_role
        AND pp.name = permission_name
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function to log access changes to audit table
CREATE OR REPLACE FUNCTION log_project_access_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log role changes
    IF TG_OP = 'UPDATE' AND OLD.permission_level IS DISTINCT FROM NEW.permission_level THEN
        INSERT INTO project_access_audit (project_id, user_id, action, old_role, new_role, performed_by)
        VALUES (NEW.project_id, NEW.user_id, 'role_changed', OLD.permission_level, NEW.permission_level, auth.uid());
    END IF;
    
    -- Log new assignments
    IF TG_OP = 'INSERT' THEN
        INSERT INTO project_access_audit (project_id, user_id, action, new_role, performed_by)
        VALUES (NEW.project_id, NEW.user_id, 'assigned', NEW.permission_level, auth.uid());
    END IF;
    
    -- Log removals (handled by a separate trigger on delete)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO project_access_audit (project_id, user_id, action, old_role, performed_by)
        VALUES (OLD.project_id, OLD.user_id, 'removed', OLD.permission_level, auth.uid());
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Create triggers for audit logging
DROP TRIGGER IF EXISTS project_assignments_audit_trigger ON project_assignments;
CREATE TRIGGER project_assignments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_assignments
    FOR EACH ROW EXECUTE FUNCTION log_project_access_change();

-- 15. Function to handle access request approval
CREATE OR REPLACE FUNCTION approve_project_access_request(
    request_id UUID,
    reviewer_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    existing_assignment RECORD;
BEGIN
    -- Get the access request
    SELECT * INTO request_record
    FROM project_access_requests
    WHERE id = request_id;
    
    -- Check if request exists and is pending
    IF NOT FOUND OR request_record.status != 'pending' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if reviewer has permission to approve
    IF NOT has_project_permission(request_record.project_id, reviewer_uuid, 'manage_access') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already has an assignment
    SELECT * INTO existing_assignment
    FROM project_assignments
    WHERE project_assignments.project_id = request_record.project_id
    AND project_assignments.user_id = request_record.user_id;
    
    -- Update or create assignment
    IF FOUND THEN
        UPDATE project_assignments
        SET permission_level = request_record.requested_role,
            assigned_by = reviewer_uuid
        WHERE id = existing_assignment.id;
    ELSE
        INSERT INTO project_assignments (project_id, user_id, permission_level, assigned_by)
        VALUES (request_record.project_id, request_record.user_id, request_record.requested_role, reviewer_uuid);
    END IF;
    
    -- Update the request status
    UPDATE project_access_requests
    SET status = 'approved',
        reviewed_by = reviewer_uuid,
        reviewed_at = NOW()
    WHERE id = request_id;
    
    -- Log the approval
    INSERT INTO project_access_audit (project_id, user_id, action, new_role, performed_by)
    VALUES (request_record.project_id, request_record.user_id, 'access_approved', request_record.requested_role, reviewer_uuid);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Function to handle access request rejection
CREATE OR REPLACE FUNCTION reject_project_access_request(
    request_id UUID,
    reviewer_uuid UUID,
    rejection_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the access request
    SELECT * INTO request_record
    FROM project_access_requests
    WHERE id = request_id;
    
    -- Check if request exists and is pending
    IF NOT FOUND OR request_record.status != 'pending' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if reviewer has permission to reject
    IF NOT has_project_permission(request_record.project_id, reviewer_uuid, 'manage_access') THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request status
    UPDATE project_access_requests
    SET status = 'rejected',
        reviewed_by = reviewer_uuid,
        reviewed_at = NOW(),
        response_message = rejection_message
    WHERE id = request_id;
    
    -- Log the rejection
    INSERT INTO project_access_audit (project_id, user_id, action, performed_by)
    VALUES (request_record.project_id, request_record.user_id, 'access_rejected', reviewer_uuid);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to get user permissions for a project
CREATE OR REPLACE FUNCTION get_user_project_permissions(
    project_uuid UUID,
    user_uuid UUID
)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT pp.name
    FROM project_assignments pa
    JOIN project_role_permissions prp ON pa.permission_level = prp.role
    JOIN project_permissions pp ON prp.permission_id = pp.id
    WHERE pa.project_id = project_uuid
    AND pa.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;