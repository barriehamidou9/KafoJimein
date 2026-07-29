-- Enforce that household_income.user_id is actually a member of
-- household_income.household_id on that same row. RLS only checks that
-- the *caller* is an admin of household_id — it says nothing about
-- whether the target user_id being set is a real member of that
-- household, so without this, an admin's write could otherwise attach
-- an income row to an unrelated user_id. In practice the UI only ever
-- offers real household members as options, but that's an app-level
-- guarantee, not a database one — this closes that gap at the DB level,
-- same shape as budgets' enforce_budget_category_is_expense trigger.
--
-- security definer: a plain (invoker-rights) trigger function runs as
-- whoever performed the triggering statement — here, the admin doing the
-- upsert. household_members' own SELECT policy ("Users can view their
-- own household membership") only lets that caller see their *own* row,
-- so a plain exists() check here can only ever confirm the admin's own
-- membership, not the target user_id's — it would incorrectly reject
-- every real member other than the caller. Marking this SECURITY DEFINER
-- makes it run with the function owner's privileges instead, bypassing
-- RLS for this one check, the same way household_members_display's
-- security_invoker = false lets that view read auth.users. search_path
-- is pinned to prevent search_path hijacking, standard practice for any
-- SECURITY DEFINER function.

create or replace function public.enforce_household_income_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_member boolean;
begin
  select exists (
    select 1
    from public.household_members
    where household_members.household_id = new.household_id
      and household_members.user_id = new.user_id
  ) into v_is_member;

  if not v_is_member then
    raise exception
      'household_income.user_id must be a member of household_income.household_id (user_id = %, household_id = %)',
      new.user_id, new.household_id;
  end if;

  return new;
end;
$$;

create trigger household_income_user_must_be_member
before insert or update on public.household_income
for each row
execute function public.enforce_household_income_member();
