alter table public.projects
add column if not exists brief_metadata jsonb not null default '{}'::jsonb;
