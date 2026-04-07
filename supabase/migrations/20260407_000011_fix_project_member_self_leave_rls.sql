drop policy if exists "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.has_project_permission(project_id, array['owner'])
);
