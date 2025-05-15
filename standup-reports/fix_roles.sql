-- First, check existing roles that violate the constraint
SELECT DISTINCT role FROM public.users WHERE role IS NOT NULL AND role NOT IN ('member', 'manager');

-- Temporarily make the role column nullable
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;

-- Drop the existing check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update any invalid roles to 'member'
UPDATE public.users 
SET role = CASE 
    WHEN role = 'Member' THEN 'member'
    WHEN role = 'Admin' THEN 'manager'
    ELSE 'member'
END;

-- Add the check constraint back
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'manager'));

-- Make the role column NOT NULL again
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;

-- Now promote the specific user to manager
UPDATE public.users 
SET role = 'manager' 
WHERE id = '7d95c9fd-442b-493b-97e7-3f4a5e38246a';

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Verify the update
SELECT id, name, email, role, team_id 
FROM public.users;
