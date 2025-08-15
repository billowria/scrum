-- Add approval workflow for timesheets

-- 1) Add optional submission_id to timesheets (if not exists)
alter table if exists public.timesheets
  add column if not exists submission_id uuid references public.timesheet_submissions(id) on delete set null;

-- 2) Create timesheet_submissions table
create table if not exists public.timesheet_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_timesheet_submissions_user on public.timesheet_submissions(user_id);
create index if not exists idx_timesheet_submissions_period on public.timesheet_submissions(start_date, end_date);

alter table public.timesheet_submissions enable row level security;

create policy if not exists "Users can view own timesheet submissions" on public.timesheet_submissions
  for select using (auth.uid() = user_id);

create policy if not exists "Users can insert own timesheet submissions" on public.timesheet_submissions
  for insert with check (auth.uid() = user_id);

create policy if not exists "Users can update own pending timesheet submissions" on public.timesheet_submissions
  for update using (auth.uid() = user_id and status = 'pending');

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timesheet_submissions_updated_at on public.timesheet_submissions;
create trigger set_timesheet_submissions_updated_at
before update on public.timesheet_submissions
for each row execute function public.set_updated_at();
