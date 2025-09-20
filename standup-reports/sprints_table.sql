-- Create sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for sprints table
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Policy for viewing sprints
CREATE POLICY "Users can view sprints" ON public.sprints
    FOR SELECT USING (true);

-- Policy for inserting sprints (managers only)
CREATE POLICY "Managers can create sprints" ON public.sprints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('manager', 'admin')
        )
    );

-- Policy for updating sprints (managers only)
CREATE POLICY "Managers can update sprints" ON public.sprints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('manager', 'admin')
        )
    );

-- Policy for deleting sprints (managers only)
CREATE POLICY "Managers can delete sprints" ON public.sprints
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('manager', 'admin')
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS sprints_project_id_idx ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS sprints_created_by_idx ON public.sprints(created_by);