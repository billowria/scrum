-- Timesheets table for logging daily work hours
create table if not exists public.timesheets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  hours numeric(5,2) not null check (hours >= 0 and hours <= 24),
  notes text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (user_id, date, project_id, notes)
);

-- Helpful indexes
create index if not exists idx_timesheets_user_date on public.timesheets(user_id, date);
create index if not exists idx_timesheets_project on public.timesheets(project_id);

-- RLS
alter table public.timesheets enable row level security;

-- View own
create policy if not exists "Users can view own timesheets" on public.timesheets
  for select using (auth.uid() = user_id);

-- Insert own
create policy if not exists "Users can insert own timesheets" on public.timesheets
  for insert with check (auth.uid() = user_id);

-- Update own
create policy if not exists "Users can update own timesheets" on public.timesheets
  for update using (auth.uid() = user_id);

-- Delete own
create policy if not exists "Users can delete own timesheets" on public.timesheets
  for delete using (auth.uid() = user_id);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timesheets_updated_at on public.timesheets;
create trigger set_timesheets_updated_at
before update on public.timesheets
for each row execute function public.set_updated_at();
