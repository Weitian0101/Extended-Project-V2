create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create or replace function public.get_email_registration_status(candidate_email text)
returns jsonb
language sql
security definer
set search_path = public, auth
as $$
    with normalized_email as (
        select lower(trim(candidate_email)) as value
    )
    select jsonb_build_object(
        'exists',
        exists (
            select 1
            from auth.users
            cross join normalized_email
            where normalized_email.value <> ''
              and lower(coalesce(auth.users.email, '')) = normalized_email.value
        ),
        'confirmed',
        exists (
            select 1
            from auth.users
            cross join normalized_email
            where normalized_email.value <> ''
              and lower(coalesce(auth.users.email, '')) = normalized_email.value
              and auth.users.email_confirmed_at is not null
        )
    );
$$;

revoke all on function public.get_email_registration_status(text) from public;
grant execute on function public.get_email_registration_status(text) to anon, authenticated;

update public.projects
set current_stage = 'tell-story'
where current_stage = 'test';

update public.tool_runs
set stage = 'tell-story'
where stage = 'test';

alter table public.projects
drop constraint if exists projects_current_stage_check;

alter table public.projects
add constraint projects_current_stage_check
check (current_stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story'));

alter table public.tool_runs
drop constraint if exists tool_runs_stage_check;

alter table public.tool_runs
add constraint tool_runs_stage_check
check (stage in ('overview', 'explore', 'imagine', 'implement', 'tell-story'));
