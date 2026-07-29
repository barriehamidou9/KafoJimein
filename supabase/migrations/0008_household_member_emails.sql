-- Expose household members' emails (from auth.users, which the app's
-- normal authenticated client can't query directly — only the `public`
-- schema is exposed via PostgREST) so the app can populate things like a
-- "Paid by" dropdown.
--
-- This is a plain view, not a SECURITY DEFINER function: Postgres views
-- execute with the view owner's privileges by default (security_invoker
-- = false), so this can read auth.users even though the `authenticated`
-- role normally can't. Safety comes entirely from the view's own WHERE
-- clause, which restricts rows to the caller's own household(s) via
-- auth.uid() — not from a separate RLS policy on the view (views don't
-- support RLS policies the way tables do).

create or replace view public.household_member_emails
with (security_invoker = false)
as
select
  hm.household_id,
  hm.user_id,
  au.email
from public.household_members hm
join auth.users au on au.id = hm.user_id
where hm.household_id in (
  select household_id
  from public.household_members
  where user_id = auth.uid()
);

grant select on public.household_member_emails to authenticated;
