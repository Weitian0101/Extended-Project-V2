alter table public.projects
    add column if not exists success_metrics text not null default '',
    add column if not exists milestones text not null default '',
    add column if not exists team_roles text not null default '',
    add column if not exists working_norms text not null default '',
    add column if not exists key_links text not null default '',
    add column if not exists brief_version integer not null default 1;

create or replace function public.handle_updated_at_and_version()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    new.version = old.version + 1;
    return new;
end;
$$;

create table if not exists public.project_cards (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null default '',
    summary text not null default '',
    type text not null check (type in ('insight', 'idea', 'experiment', 'story', 'risk', 'dependency')),
    stage text check (stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story')),
    owner_id uuid references public.profiles (id) on delete set null,
    due_date date,
    linked_run_id uuid,
    linked_decision_id uuid,
    linked_task_id uuid,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'open-questions' check (status in ('open-questions', 'in-progress', 'ready-for-review', 'approved', 'parked')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_artifacts (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null default '',
    summary text not null default '',
    type text not null check (type in ('insight', 'concept', 'experiment', 'narrative', 'attachment')),
    stage text check (stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story')),
    owner_id uuid references public.profiles (id) on delete set null,
    pinned boolean not null default false,
    version_label text not null default 'v1',
    linked_run_id uuid,
    linked_card_id uuid,
    linked_decision_id uuid,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'draft' check (status in ('draft', 'ready', 'approved')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_sessions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null default '',
    agenda text not null default '',
    goal text not null default '',
    participants text not null default '',
    facilitator_id uuid references public.profiles (id) on delete set null,
    note_taker_id uuid references public.profiles (id) on delete set null,
    scheduled_at timestamptz,
    pre_read text not null default '',
    output_summary text not null default '',
    follow_ups text not null default '',
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'planned' check (status in ('planned', 'in-progress', 'completed', 'canceled')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_decisions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null default '',
    background text not null default '',
    options text not null default '',
    decision text not null default '',
    rationale text not null default '',
    impact text not null default '',
    owner_id uuid references public.profiles (id) on delete set null,
    decision_date date,
    review_date date,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'proposed' check (status in ('proposed', 'decided', 'revisit')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_threads (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    entity_type text not null check (entity_type in ('brief', 'card', 'artifact', 'decision', 'task', 'session', 'tool-run')),
    entity_id uuid not null,
    title text not null default '',
    body text not null default '',
    owner_id uuid references public.profiles (id) on delete set null,
    next_step text not null default '',
    mentions text[] not null default '{}',
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'open' check (status in ('open', 'resolved')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_tasks (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    title text not null default '',
    details text not null default '',
    owner_id uuid references public.profiles (id) on delete set null,
    due_date date,
    stage text check (stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story')),
    linked_entity_type text check (linked_entity_type in ('brief', 'card', 'artifact', 'decision', 'task', 'session', 'tool-run')),
    linked_entity_id uuid,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'open' check (status in ('open', 'in-progress', 'blocked', 'done')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_activity_events (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    action text not null check (action in ('created', 'updated', 'commented', 'resolved', 'scheduled', 'captured', 'approved', 'assigned')),
    entity_type text not null check (entity_type in ('brief', 'card', 'artifact', 'decision', 'task', 'session', 'tool-run')),
    entity_id uuid not null,
    actor_id uuid references public.profiles (id) on delete set null,
    actor_name text not null default '',
    message text not null default '',
    occurred_at timestamptz not null default timezone('utc', now()),
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'logged' check (status = 'logged'),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_presence (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    user_name text not null default '',
    surface text not null check (surface in ('hub', 'overview', 'explore', 'imagine', 'implement', 'tell-story')),
    object_type text check (object_type in ('brief', 'card', 'artifact', 'decision', 'task', 'session', 'tool-run')),
    object_id uuid,
    last_seen_at timestamptz not null default timezone('utc', now()),
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    status text not null default 'online' check (status in ('online', 'away', 'offline')),
    metadata jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (project_id, user_id)
);

drop trigger if exists project_cards_handle_updated_at on public.project_cards;
create trigger project_cards_handle_updated_at
before update on public.project_cards
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_artifacts_handle_updated_at on public.project_artifacts;
create trigger project_artifacts_handle_updated_at
before update on public.project_artifacts
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_sessions_handle_updated_at on public.project_sessions;
create trigger project_sessions_handle_updated_at
before update on public.project_sessions
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_decisions_handle_updated_at on public.project_decisions;
create trigger project_decisions_handle_updated_at
before update on public.project_decisions
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_threads_handle_updated_at on public.project_threads;
create trigger project_threads_handle_updated_at
before update on public.project_threads
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_tasks_handle_updated_at on public.project_tasks;
create trigger project_tasks_handle_updated_at
before update on public.project_tasks
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_activity_events_handle_updated_at on public.project_activity_events;
create trigger project_activity_events_handle_updated_at
before update on public.project_activity_events
for each row
execute function public.handle_updated_at_and_version();

drop trigger if exists project_presence_handle_updated_at on public.project_presence;
create trigger project_presence_handle_updated_at
before update on public.project_presence
for each row
execute function public.handle_updated_at_and_version();

alter table public.project_cards enable row level security;
alter table public.project_artifacts enable row level security;
alter table public.project_sessions enable row level security;
alter table public.project_decisions enable row level security;
alter table public.project_threads enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_activity_events enable row level security;
alter table public.project_presence enable row level security;

drop policy if exists "project_cards_select_members" on public.project_cards;
create policy "project_cards_select_members"
on public.project_cards
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_cards.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_cards_insert_editors" on public.project_cards;
create policy "project_cards_insert_editors"
on public.project_cards
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_cards.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_cards_update_editors" on public.project_cards;
create policy "project_cards_update_editors"
on public.project_cards
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_cards.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_cards.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_cards_delete_editors" on public.project_cards;
create policy "project_cards_delete_editors"
on public.project_cards
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_cards.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_artifacts_select_members" on public.project_artifacts;
create policy "project_artifacts_select_members"
on public.project_artifacts
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_artifacts.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_artifacts_insert_editors" on public.project_artifacts;
create policy "project_artifacts_insert_editors"
on public.project_artifacts
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_artifacts.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_artifacts_update_editors" on public.project_artifacts;
create policy "project_artifacts_update_editors"
on public.project_artifacts
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_artifacts.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_artifacts.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_artifacts_delete_editors" on public.project_artifacts;
create policy "project_artifacts_delete_editors"
on public.project_artifacts
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_artifacts.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_sessions_select_members" on public.project_sessions;
create policy "project_sessions_select_members"
on public.project_sessions
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_sessions.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_sessions_insert_editors" on public.project_sessions;
create policy "project_sessions_insert_editors"
on public.project_sessions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_sessions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_sessions_update_editors" on public.project_sessions;
create policy "project_sessions_update_editors"
on public.project_sessions
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_sessions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_sessions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_sessions_delete_editors" on public.project_sessions;
create policy "project_sessions_delete_editors"
on public.project_sessions
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_sessions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_decisions_select_members" on public.project_decisions;
create policy "project_decisions_select_members"
on public.project_decisions
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_decisions.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_decisions_insert_editors" on public.project_decisions;
create policy "project_decisions_insert_editors"
on public.project_decisions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_decisions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_decisions_update_editors" on public.project_decisions;
create policy "project_decisions_update_editors"
on public.project_decisions
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_decisions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_decisions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_decisions_delete_owners" on public.project_decisions;
create policy "project_decisions_delete_owners"
on public.project_decisions
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_decisions.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission = 'owner'
    )
);

drop policy if exists "project_threads_select_members" on public.project_threads;
create policy "project_threads_select_members"
on public.project_threads
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_threads.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_threads_insert_members" on public.project_threads;
create policy "project_threads_insert_members"
on public.project_threads
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_threads.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_threads_update_members" on public.project_threads;
create policy "project_threads_update_members"
on public.project_threads
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_threads.project_id
          and project_members.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_threads.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_threads_delete_members" on public.project_threads;
create policy "project_threads_delete_members"
on public.project_threads
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_threads.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_tasks_select_members" on public.project_tasks;
create policy "project_tasks_select_members"
on public.project_tasks
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_tasks.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_tasks_insert_editors" on public.project_tasks;
create policy "project_tasks_insert_editors"
on public.project_tasks
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_tasks.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_tasks_update_editors" on public.project_tasks;
create policy "project_tasks_update_editors"
on public.project_tasks
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_tasks.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_tasks.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_tasks_delete_editors" on public.project_tasks;
create policy "project_tasks_delete_editors"
on public.project_tasks
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_tasks.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_activity_events_select_members" on public.project_activity_events;
create policy "project_activity_events_select_members"
on public.project_activity_events
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_activity_events.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_activity_events_insert_members" on public.project_activity_events;
create policy "project_activity_events_insert_members"
on public.project_activity_events
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_activity_events.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_presence_select_members" on public.project_presence;
create policy "project_presence_select_members"
on public.project_presence
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = project_presence.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_presence_insert_self" on public.project_presence;
create policy "project_presence_insert_self"
on public.project_presence
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.project_members
        where project_members.project_id = project_presence.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_presence_update_self" on public.project_presence;
create policy "project_presence_update_self"
on public.project_presence
for update
to authenticated
using (
    user_id = auth.uid()
    and exists (
        select 1
        from public.project_members
        where project_members.project_id = project_presence.project_id
          and project_members.user_id = auth.uid()
    )
)
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.project_members
        where project_members.project_id = project_presence.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "project_presence_delete_self_or_owner" on public.project_presence;
create policy "project_presence_delete_self_or_owner"
on public.project_presence
for delete
to authenticated
using (
    user_id = auth.uid()
    or exists (
        select 1
        from public.project_members
        where project_members.project_id = project_presence.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission = 'owner'
    )
);
