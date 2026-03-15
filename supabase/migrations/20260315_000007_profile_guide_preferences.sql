alter table public.profiles
add column if not exists guide_preferences jsonb not null default '{}'::jsonb;
