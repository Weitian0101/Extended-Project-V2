create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    full_name text not null,
    title text,
    phone text,
    location text,
    workspace_name text,
    company text,
    billing_email text,
    account_role text default 'Workspace member',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    last_sign_in_at timestamptz
);

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    summary text not null default '',
    accent text not null default 'from-sky-500 to-cyan-300',
    current_stage text not null default 'overview' check (current_stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story')),
    background text not null default '',
    objectives text not null default '',
    assumptions text not null default '',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_members (
    project_id uuid not null references public.projects (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'Team Member',
    permission text not null check (permission in ('owner', 'edit', 'view')),
    status text not null default 'online' check (status in ('online', 'away', 'offline')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (project_id, user_id)
);

create table if not exists public.project_invites (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    email text not null,
    role text not null default 'Team Member',
    permission text not null check (permission in ('owner', 'edit', 'view')),
    token text not null unique default gen_random_uuid()::text,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
    invited_by uuid references public.profiles (id) on delete set null,
    accepted_by uuid references public.profiles (id) on delete set null,
    accepted_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists project_invites_pending_email_idx
on public.project_invites (project_id, lower(email))
where status = 'pending';

create table if not exists public.tool_runs (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    method_card_id text not null,
    method_card_title text not null,
    stage text not null check (stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story')),
    current_step_index integer not null default 0,
    data jsonb not null default '{}'::jsonb,
    answers jsonb not null default '{}'::jsonb,
    ai_responses jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists profiles_handle_updated_at on public.profiles;
create trigger profiles_handle_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists projects_handle_updated_at on public.projects;
create trigger projects_handle_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

drop trigger if exists project_members_handle_updated_at on public.project_members;
create trigger project_members_handle_updated_at
before update on public.project_members
for each row
execute function public.handle_updated_at();

drop trigger if exists project_invites_handle_updated_at on public.project_invites;
create trigger project_invites_handle_updated_at
before update on public.project_invites
for each row
execute function public.handle_updated_at();

drop trigger if exists tool_runs_handle_updated_at on public.tool_runs;
create trigger tool_runs_handle_updated_at
before update on public.tool_runs
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        email,
        full_name,
        title,
        workspace_name,
        billing_email,
        account_role
    )
    values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
        'Innovation collaborator',
        'Innovation Sandbox Workspace',
        coalesce(new.email, ''),
        'Workspace member'
    )
    on conflict (id) do update
    set
        email = excluded.email,
        full_name = excluded.full_name,
        billing_email = excluded.billing_email,
        updated_at = timezone('utc', now());

    return new;
end;
$$;

create or replace function public.get_project_invite(invite_token text)
returns table (
    id uuid,
    project_id uuid,
    project_name text,
    email text,
    permission text,
    status text,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        project_invites.id,
        project_invites.project_id,
        projects.name,
        project_invites.email,
        project_invites.permission,
        project_invites.status,
        project_invites.created_at
    from public.project_invites
    inner join public.projects on projects.id = project_invites.project_id
    where project_invites.token = invite_token
    limit 1;
end;
$$;

create or replace function public.accept_project_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    invite_row public.project_invites%rowtype;
    profile_row public.profiles%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    select *
    into invite_row
    from public.project_invites
    where token = invite_token
      and status = 'pending'
    limit 1
    for update;

    if invite_row.id is null then
        raise exception 'Invite not found or already used.';
    end if;

    select *
    into profile_row
    from public.profiles
    where id = auth.uid()
    limit 1;

    if profile_row.id is null then
        raise exception 'Profile not found.';
    end if;

    if lower(profile_row.email) <> lower(invite_row.email) then
        raise exception 'This invite belongs to another email address.';
    end if;

    insert into public.project_members (
        project_id,
        user_id,
        role,
        permission,
        status
    )
    values (
        invite_row.project_id,
        profile_row.id,
        coalesce(profile_row.title, invite_row.role, 'Team Member'),
        invite_row.permission,
        'online'
    )
    on conflict (project_id, user_id) do update
    set
        role = excluded.role,
        permission = excluded.permission,
        status = 'online',
        updated_at = timezone('utc', now());

    update public.project_invites
    set
        status = 'accepted',
        accepted_by = profile_row.id,
        accepted_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where id = invite_row.id;

    return invite_row.project_id;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.tool_runs enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members"
on public.projects
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = projects.id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "projects_insert_owner" on public.projects;
create policy "projects_insert_owner"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "projects_update_editors" on public.projects;
create policy "projects_update_editors"
on public.projects
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = projects.id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = projects.id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner"
on public.projects
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = projects.id
          and project_members.user_id = auth.uid()
          and project_members.permission = 'owner'
    )
);

drop policy if exists "project_members_select_members" on public.project_members;
create policy "project_members_select_members"
on public.project_members
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_members.project_id
          and current_membership.user_id = auth.uid()
    )
);

drop policy if exists "project_members_insert_owner_or_self" on public.project_members;
create policy "project_members_insert_owner_or_self"
on public.project_members
for insert
to authenticated
with check (
    (
        user_id = auth.uid()
        and permission = 'owner'
        and exists (
            select 1
            from public.projects
            where projects.id = project_members.project_id
              and projects.owner_id = auth.uid()
        )
    )
    or exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_members.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission = 'owner'
    )
);

drop policy if exists "project_members_update_owner" on public.project_members;
create policy "project_members_update_owner"
on public.project_members
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_members.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission = 'owner'
    )
)
with check (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_members.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission = 'owner'
    )
);

drop policy if exists "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_members.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission = 'owner'
    )
);

drop policy if exists "project_invites_select_members" on public.project_invites;
create policy "project_invites_select_members"
on public.project_invites
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_invites.project_id
          and current_membership.user_id = auth.uid()
    )
);

drop policy if exists "project_invites_insert_editors" on public.project_invites;
create policy "project_invites_insert_editors"
on public.project_invites
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_invites.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_invites_update_editors" on public.project_invites;
create policy "project_invites_update_editors"
on public.project_invites
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_invites.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_invites.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission in ('owner', 'edit')
    )
);

drop policy if exists "project_invites_delete_editors" on public.project_invites;
create policy "project_invites_delete_editors"
on public.project_invites
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members as current_membership
        where current_membership.project_id = project_invites.project_id
          and current_membership.user_id = auth.uid()
          and current_membership.permission in ('owner', 'edit')
    )
);

drop policy if exists "tool_runs_select_members" on public.tool_runs;
create policy "tool_runs_select_members"
on public.tool_runs
for select
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = tool_runs.project_id
          and project_members.user_id = auth.uid()
    )
);

drop policy if exists "tool_runs_insert_editors" on public.tool_runs;
create policy "tool_runs_insert_editors"
on public.tool_runs
for insert
to authenticated
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = tool_runs.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

grant execute on function public.get_project_invite(text) to anon, authenticated;
grant execute on function public.accept_project_invite(text) to authenticated;

drop policy if exists "tool_runs_update_editors" on public.tool_runs;
create policy "tool_runs_update_editors"
on public.tool_runs
for update
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = tool_runs.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
)
with check (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = tool_runs.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);

drop policy if exists "tool_runs_delete_editors" on public.tool_runs;
create policy "tool_runs_delete_editors"
on public.tool_runs
for delete
to authenticated
using (
    exists (
        select 1
        from public.project_members
        where project_members.project_id = tool_runs.project_id
          and project_members.user_id = auth.uid()
          and project_members.permission in ('owner', 'edit')
    )
);
