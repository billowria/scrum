-- Migration: Projects Feature
-- Creates projects, project_assignments, project_sections, project_topics, and project_topic_content tables

-- 1. Projects Table
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 2. Project Assignments Table
create table if not exists project_assignments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role_in_project text,
  assigned_at timestamp with time zone default now(),
  unique (project_id, user_id)
);

-- 3. Project Sections Table
create table if not exists project_sections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  order int default 0,
  created_at timestamp with time zone default now()
);

-- 4. Project Topics Table
create table if not exists project_topics (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references project_sections(id) on delete cascade,
  name text not null,
  description text,
  order int default 0,
  created_at timestamp with time zone default now()
);

-- 5. Project Topic Content Table
create table if not exists project_topic_content (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references project_topics(id) on delete cascade,
  title text not null,
  content text,
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);