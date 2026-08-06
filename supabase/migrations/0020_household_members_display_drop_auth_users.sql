-- Fix Supabase's "Exposed Auth Users" linter warning on
-- household_members_display (see migration 0010): the view joined
-- auth.users purely to read au.email as a fallback display name, which
-- is what the linter flags regardless of the view's own household-
-- scoping WHERE clause. Drop that join entirely and fall back to a
-- generic, non-sensitive 'Member' string instead of the email.
--
-- Everything else is unchanged: same three columns, same
-- household-scoping WHERE via auth.uid(), same grant to authenticated,
-- same security_invoker = false (still fine now that the view no
-- longer touches auth.users at all — nothing left for invoker vs.
-- definer rights to matter for).

create or replace view public.household_members_display
with (security_invoker = false)
as
select
  hm.household_id,
  hm.user_id,
  coalesce(p.display_name, 'Member') as display_name
from public.household_members hm
left join public.profiles p on p.id = hm.user_id
where hm.household_id in (
  select household_id
  from public.household_members
  where user_id = auth.uid()
);

grant select on public.household_members_display to authenticated;
