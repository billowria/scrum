-- Add manager_id column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id);

-- Create an index on manager_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON public.users(manager_id);

-- Create a function to assign a manager to a user
CREATE OR REPLACE FUNCTION public.assign_manager(user_id UUID, manager_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify the manager exists and has manager role
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = manager_id AND role = 'manager') THEN
    RAISE EXCEPTION 'Invalid manager ID or user is not a manager';
  END IF;
  
  -- Update the user's manager_id
  UPDATE public.users
  SET manager_id = manager_id
  WHERE id = user_id;
  
  -- Add an audit log entry
  INSERT INTO public.audit_log (action, table_name, record_id, user_id, details)
  VALUES (
    'assign_manager',
    'users',
    user_id,
    manager_id,
    json_build_object('manager_id', manager_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to remove a manager from a user
CREATE OR REPLACE FUNCTION public.remove_manager(user_id UUID)
RETURNS VOID AS $$
DECLARE
  old_manager_id UUID;
BEGIN
  -- Get the current manager_id before removing it
  SELECT manager_id INTO old_manager_id FROM public.users WHERE id = user_id;
  
  -- Update the user's manager_id to null
  UPDATE public.users
  SET manager_id = NULL
  WHERE id = user_id;
  
  -- Add an audit log entry
  INSERT INTO public.audit_log (action, table_name, record_id, user_id, details)
  VALUES (
    'remove_manager',
    'users',
    user_id,
    old_manager_id,
    json_build_object('old_manager_id', old_manager_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
