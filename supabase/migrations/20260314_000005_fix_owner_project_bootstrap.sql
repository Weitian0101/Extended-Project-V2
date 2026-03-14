create or replace function public.is_project_owner(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.projects
        where projects.id = target_project_id
          and projects.owner_id = coalesce(target_user_id, auth.uid())
    );
$$;

grant execute on function public.is_project_owner(uuid, uuid) to authenticated;

drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members"
on public.projects
for select
to authenticated
using (
    public.is_project_owner(id)
    or public.is_project_member(id)
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
        and public.is_project_owner(project_id)
    )
    or public.has_project_permission(project_id, array['owner'])
);
