-- Timesheets manager policies and helper RPCs
-- Safe to run multiple times; uses IF NOT EXISTS where possible

-- 0) Helper: ensure set_updated_at() exists
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1) Helper RPC: get_managed_team_ids(manager_id_param uuid)
-- Returns team_ids a manager is responsible for. Adjust logic if your schema differs.
create or replace function public.get_managed_team_ids(manager_id_param uuid)
returns table(team_id uuid)
language sql
stable
as $$
  -- Derive managed team_ids from users table (no teams.manager_id required)
  -- 1) The manager's own team_id (if any)
  -- 2) Any team_id of users who have manager_id = manager_id_param
  (
    select distinct u.team_id
    from public.users u
    where u.id = manager_id_param and u.team_id is not null
  )
  union
  (
    select distinct u2.team_id
    from public.users u2
    where u2.manager_id = manager_id_param and u2.team_id is not null
  )
$$;

-- 2) RLS for timesheets: allow managers to view team members' timesheets
alter table if exists public.timesheets enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'timesheets' and policyname = 'Managers can view team timesheets'
  ) then
    create policy "Managers can view team timesheets" on public.timesheets
      for select using (
        exists (
          select 1
          from public.users u
          where u.id = timesheets.user_id
            and u.team_id in (
              select team_id from public.get_managed_team_ids(auth.uid())
            )
        )
      );
  end if;
end $$;

-- 3) RLS for timesheet_submissions: allow managers to view and approve team submissions
alter table if exists public.timesheet_submissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'timesheet_submissions' and policyname = 'Managers can view team submissions'
  ) then
    create policy "Managers can view team submissions" on public.timesheet_submissions
      for select using (
        exists (
          select 1
          from public.users u
          where u.id = timesheet_submissions.user_id
            and u.team_id in (
              select team_id from public.get_managed_team_ids(auth.uid())
            )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'timesheet_submissions' and policyname = 'Managers can update pending team submissions'
  ) then
    create policy "Managers can update pending team submissions" on public.timesheet_submissions
      for update using (
        timesheet_submissions.status = 'pending'
        and exists (
          select 1 from public.users u
          where u.id = timesheet_submissions.user_id
            and u.team_id in (
              select team_id from public.get_managed_team_ids(auth.uid())
            )
        )
      );
  end if;
end $$;

-- 4) Optional: triggers (idempotent) already provided elsewhere but ensure exists
drop trigger if exists set_timesheets_updated_at on public.timesheets;
create trigger set_timesheets_updated_at
before update on public.timesheets
for each row execute function public.set_updated_at();

drop trigger if exists set_timesheet_submissions_updated_at on public.timesheet_submissions;
create trigger set_timesheet_submissions_updated_at
before update on public.timesheet_submissions
for each row execute function public.set_updated_at();


