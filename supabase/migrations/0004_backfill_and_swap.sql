-- Backfill existing single-user data into a household, then swap
-- categories/budget_items RLS from owner-based to household-based.
--
-- This migration changes behavior (unlike 0003, which only added structure).
-- Review carefully before running against the live database.

-- 1-3. Create the household, link the existing user as admin, and backfill
-- household_id on all existing categories/budget_items rows. Done in a
-- single DO block so the household id and user id are captured once and
-- reused consistently, rather than re-derived per statement.
do $$
declare
  v_household_id uuid;
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'barriehamidou9@gmail.com';

  if v_user_id is null then
    raise exception 'No auth.users row found for barriehamidou9@gmail.com';
  end if;

  insert into public.households (name)
  values ('My Household')
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_user_id, 'admin');

  update public.categories
  set household_id = v_household_id
  where household_id is null;

  update public.budget_items
  set household_id = v_household_id
  where household_id is null;
end $$;

-- 4. Now that every row has a household_id, require it going forward.
alter table public.categories
  alter column household_id set not null;

alter table public.budget_items
  alter column household_id set not null;

-- 5. Drop the old owner-based policies.
drop policy if exists "Users can manage their own categories" on public.categories;
drop policy if exists "Users can manage their own budget items" on public.budget_items;

-- 6. Any household member (any role) can select/insert/update/delete
-- their household's transactions. Unlike categories, there is no
-- admin-only restriction here.
create policy "Household members can manage budget items"
on public.budget_items
for all
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
