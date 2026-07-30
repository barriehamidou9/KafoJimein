-- Split "Household members can manage budget items" (0004) into
-- per-command policies. That policy was `for all`, meaning it covered
-- DELETE too with no restriction — any household member could already
-- hard-delete ANY row (including live, non-deleted ones) via a direct
-- API call; the app simply never issued one. Postgres RLS policies are
-- OR'd together, so adding a stricter DELETE policy alongside the old
-- permissive one would NOT have closed that gap — it has to be replaced.
--
-- SELECT/INSERT/UPDATE below are unchanged in behavior from the original
-- policy (any household member). DELETE is new: household-admin only,
-- and only on rows already soft-deleted (deleted_at is not null) — a
-- live row can never be hard-deleted, permanently-delete can only ever
-- follow a soft-delete.

drop policy if exists "Household members can manage budget items" on public.budget_items;

create policy "Household members can view budget items"
on public.budget_items
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budget_items.household_id
      and household_members.user_id = auth.uid()
  )
);

create policy "Household members can insert budget items"
on public.budget_items
for insert
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budget_items.household_id
      and household_members.user_id = auth.uid()
  )
);

create policy "Household members can update budget items"
on public.budget_items
for update
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budget_items.household_id
      and household_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budget_items.household_id
      and household_members.user_id = auth.uid()
  )
);

-- The actual enforcement point for permanent delete. The app UI hides
-- the "Delete permanently"/"Clear all" controls for non-admins as a
-- convenience, but this policy is what actually blocks a direct API
-- call from a non-admin, or from targeting a still-live row.
create policy "Household admins can permanently delete already-deleted budget items"
on public.budget_items
for delete
using (
  deleted_at is not null
  and exists (
    select 1
    from public.household_members
    where household_members.household_id = budget_items.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
);
