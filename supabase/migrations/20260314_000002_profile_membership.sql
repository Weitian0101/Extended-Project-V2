alter table public.profiles
add column if not exists subscription_tier text;

alter table public.profiles
add column if not exists billing_cycle text;

alter table public.profiles
add column if not exists subscription_status text;

alter table public.profiles
add column if not exists renewal_date timestamptz;

alter table public.profiles
add column if not exists payment_method_label text;

update public.profiles
set
    subscription_tier = coalesce(subscription_tier, 'business'),
    billing_cycle = coalesce(billing_cycle, 'monthly'),
    subscription_status = coalesce(subscription_status, 'active'),
    payment_method_label = coalesce(payment_method_label, 'Visa ending in 4242')
where
    subscription_tier is null
    or billing_cycle is null
    or subscription_status is null
    or payment_method_label is null;

alter table public.profiles
alter column subscription_tier set default 'business';

alter table public.profiles
alter column billing_cycle set default 'monthly';

alter table public.profiles
alter column subscription_status set default 'active';

alter table public.profiles
alter column payment_method_label set default 'Visa ending in 4242';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_subscription_tier_check'
    ) then
        alter table public.profiles
        add constraint profiles_subscription_tier_check
        check (subscription_tier in ('free', 'plus', 'ultra', 'business'));
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_billing_cycle_check'
    ) then
        alter table public.profiles
        add constraint profiles_billing_cycle_check
        check (billing_cycle in ('monthly', 'yearly'));
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_subscription_status_check'
    ) then
        alter table public.profiles
        add constraint profiles_subscription_status_check
        check (subscription_status in ('inactive', 'trial', 'active', 'past_due', 'canceled'));
    end if;
end $$;
