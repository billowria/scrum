-- Add project linkage to tasks
alter table if exists public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_tasks_project on public.tasks(project_id);
