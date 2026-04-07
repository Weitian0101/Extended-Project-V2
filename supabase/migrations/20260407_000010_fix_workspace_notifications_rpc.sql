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

    select profile_record.*
    into current_profile
    from public.profiles as profile_record
    where profile_record.id = auth.uid()
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
