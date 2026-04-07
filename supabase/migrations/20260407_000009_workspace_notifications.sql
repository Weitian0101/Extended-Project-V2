create table if not exists public.workspace_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    project_id uuid,
    project_name text not null default '',
    type text not null check (type in ('project-dissolved')),
    title text not null default '',
    message text not null default '',
    read_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_notifications_user_created_at_idx
on public.workspace_notifications (user_id, created_at desc);

alter table public.workspace_notifications enable row level security;

drop policy if exists "workspace_notifications_select_self" on public.workspace_notifications;
create policy "workspace_notifications_select_self"
on public.workspace_notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "workspace_notifications_insert_owner" on public.workspace_notifications;
create policy "workspace_notifications_insert_owner"
on public.workspace_notifications
for insert
to authenticated
with check (
    auth.uid() = user_id
    or (
        project_id is not null
        and public.has_project_permission(project_id, array['owner'])
    )
);

drop policy if exists "workspace_notifications_update_self" on public.workspace_notifications;
create policy "workspace_notifications_update_self"
on public.workspace_notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.get_workspace_notifications()
returns table (
    id uuid,
    type text,
    title text,
    message text,
    project_id uuid,
    project_name text,
    invite_id uuid,
    read_at timestamptz,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_profile public.profiles%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    select *
    into current_profile
    from public.profiles
    where id = auth.uid()
    limit 1;

    if current_profile.id is null then
        raise exception 'Profile not found.';
    end if;

    return query
    select *
    from (
        select
            workspace_notifications.id,
            workspace_notifications.type,
            workspace_notifications.title,
            workspace_notifications.message,
            workspace_notifications.project_id,
            workspace_notifications.project_name,
            null::uuid as invite_id,
            workspace_notifications.read_at,
            workspace_notifications.created_at
        from public.workspace_notifications
        where workspace_notifications.user_id = auth.uid()

        union all

        select
            project_invites.id,
            'project-invite'::text,
            'Project invite'::text,
            format(
                'You were invited to "%s" with %s access.',
                projects.name,
                case project_invites.permission
                    when 'edit' then 'Can Edit'
                    when 'view' then 'Can View'
                    else 'Owner'
                end
            ),
            project_invites.project_id,
            projects.name,
            project_invites.id,
            null::timestamptz,
            project_invites.created_at
        from public.project_invites
        inner join public.projects on projects.id = project_invites.project_id
        where project_invites.status = 'pending'
          and lower(project_invites.email) = lower(current_profile.email)
    ) as notifications
    order by notifications.created_at desc;
end;
$$;

grant execute on function public.get_workspace_notifications() to authenticated;
