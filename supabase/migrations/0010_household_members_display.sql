-- Replace household_member_emails (0008) with a view that returns a
-- display name — profiles.display_name if the user set one, falling back
-- to their email otherwise. Depends on public.profiles (0009), so this
-- must run after it, which is also why this isn't just an edit to 0008:
-- that migration predates profiles existing.
--
-- Same access-control shape as 0008: a plain view (security_invoker =
-- false, the default), so it runs with the view owner's privileges and
-- can read auth.users despite the `authenticated` role normally not being
-- able to — safety comes entirely from the WHERE clause scoping to the
-- caller's own household(s) via auth.uid(), not from RLS on the view.

drop view if exists public.household_member_emails;

create or replace view public.household_members_display
with (security_invoker = false)
as
select
  hm.household_id,
  hm.user_id,
  coalesce(p.display_name, au.email) as display_name
from public.household_members hm
join auth.users au on au.id = hm.user_id
left join public.profiles p on p.id = hm.user_id
where hm.household_id in (
  select household_id
  from public.household_members
  where user_id = auth.uid()
);

grant select on public.household_members_display to authenticated;
