create or replace function public.is_project_member(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.project_members
        where project_members.project_id = target_project_id
          and project_members.user_id = coalesce(target_user_id, auth.uid())
    );
$$;

create or replace function public.has_project_permission(
    target_project_id uuid,
    allowed_permissions text[],
    target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.project_members
        where project_members.project_id = target_project_id
          and project_members.user_id = coalesce(target_user_id, auth.uid())
          and project_members.permission = any(allowed_permissions)
    );
$$;

grant execute on function public.is_project_member(uuid, uuid) to authenticated;
grant execute on function public.has_project_permission(uuid, text[], uuid) to authenticated;

drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members"
on public.projects
for select
to authenticated
using (public.is_project_member(id));

drop policy if exists "projects_update_editors" on public.projects;
create policy "projects_update_editors"
on public.projects
for update
to authenticated
using (public.has_project_permission(id, array['owner', 'edit']))
with check (public.has_project_permission(id, array['owner', 'edit']));

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner"
on public.projects
for delete
to authenticated
using (public.has_project_permission(id, array['owner']));

drop policy if exists "project_members_select_members" on public.project_members;
create policy "project_members_select_members"
on public.project_members
for select
to authenticated
using (public.is_project_member(project_id));

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
    or public.has_project_permission(project_id, array['owner'])
);

drop policy if exists "project_members_update_owner" on public.project_members;
create policy "project_members_update_owner"
on public.project_members
for update
to authenticated
using (public.has_project_permission(project_id, array['owner']))
with check (public.has_project_permission(project_id, array['owner']));

drop policy if exists "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (public.has_project_permission(project_id, array['owner']));

drop policy if exists "project_invites_select_members" on public.project_invites;
create policy "project_invites_select_members"
on public.project_invites
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "project_invites_insert_editors" on public.project_invites;
create policy "project_invites_insert_editors"
on public.project_invites
for insert
to authenticated
with check (public.has_project_permission(project_id, array['owner', 'edit']));

drop policy if exists "project_invites_update_editors" on public.project_invites;
create policy "project_invites_update_editors"
on public.project_invites
for update
to authenticated
using (public.has_project_permission(project_id, array['owner', 'edit']))
with check (public.has_project_permission(project_id, array['owner', 'edit']));

drop policy if exists "project_invites_delete_editors" on public.project_invites;
create policy "project_invites_delete_editors"
on public.project_invites
for delete
to authenticated
using (public.has_project_permission(project_id, array['owner', 'edit']));

drop policy if exists "tool_runs_select_members" on public.tool_runs;
create policy "tool_runs_select_members"
on public.tool_runs
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "tool_runs_insert_editors" on public.tool_runs;
create policy "tool_runs_insert_editors"
on public.tool_runs
for insert
to authenticated
with check (public.has_project_permission(project_id, array['owner', 'edit']));

drop policy if exists "tool_runs_update_editors" on public.tool_runs;
create policy "tool_runs_update_editors"
on public.tool_runs
for update
to authenticated
using (public.has_project_permission(project_id, array['owner', 'edit']))
with check (public.has_project_permission(project_id, array['owner', 'edit']));

drop policy if exists "tool_runs_delete_editors" on public.tool_runs;
create policy "tool_runs_delete_editors"
on public.tool_runs
for delete
to authenticated
using (public.has_project_permission(project_id, array['owner', 'edit']));
