drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members"
on public.projects
for select
to authenticated
using (
    owner_id = auth.uid()
    or public.is_project_member(id)
);
