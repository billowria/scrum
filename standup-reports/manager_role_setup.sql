-- Drop existing role check constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add role column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Add check constraint for valid roles
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('member', 'manager'));

-- Update RLS policies for users table to allow managers to update team assignments
CREATE POLICY "Managers can update team assignments" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'manager'
  ));

-- Update leave_plans table to include approval workflow
ALTER TABLE public.leave_plans ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id);
ALTER TABLE public.leave_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create policy to allow managers to approve/reject leave requests
CREATE POLICY "Managers can update leave request status" 
  ON public.leave_plans 
  FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'manager'
  ));

-- Create view for managers to see team members and their assignments
CREATE OR REPLACE VIEW public.team_members_view AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.team_id,
  t.name as team_name
FROM 
  public.users u
LEFT JOIN 
  public.teams t ON u.team_id = t.id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.team_members_view TO authenticated;

-- Create function to promote a user to manager role
CREATE OR REPLACE FUNCTION public.promote_to_manager(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET role = 'manager'
  WHERE id = user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign a team to a user
CREATE OR REPLACE FUNCTION public.assign_team_to_user(user_id UUID, team_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET team_id = team_id
  WHERE id = user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to approve or reject a leave request
CREATE OR REPLACE FUNCTION public.update_leave_request_status(leave_id UUID, new_status TEXT, manager_id UUID)
RETURNS VOID AS $$
BEGIN
  IF new_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: must be approved, rejected, or pending';
  END IF;
  
  UPDATE public.leave_plans
  SET 
    status = new_status,
    approved_by = CASE WHEN new_status = 'approved' THEN manager_id ELSE NULL END,
    approved_at = CASE WHEN new_status = 'approved' THEN NOW() ELSE NULL END
  WHERE id = leave_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to notify users when their leave request status changes
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    -- In a real application, you would implement notification logic here
    -- For example, sending an email or creating a notification record
    
    -- For now, we'll just log the change
    INSERT INTO public.audit_log (action, table_name, record_id, user_id, details)
    VALUES (
      'leave_status_change',
      'leave_plans',
      NEW.id,
      NEW.user_id,
      json_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create the trigger
DROP TRIGGER IF EXISTS leave_status_change_trigger ON public.leave_plans;
CREATE TRIGGER leave_status_change_trigger
AFTER UPDATE ON public.leave_plans
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_leave_status_change();

-- Add an example manager (replace with actual user ID)
-- UPDATE public.users SET role = 'manager' WHERE id = '00000000-0000-0000-0000-000000000000';

-- IMPORTANT: Run this command to make a specific user a manager
-- Replace the UUID with the actual user ID you want to promote
-- SELECT public.promote_to_manager('00000000-0000-0000-0000-000000000000');
