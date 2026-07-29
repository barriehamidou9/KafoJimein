-- RPC functions for confirming/skipping a due recurring expense.
--
-- Both need SECURITY DEFINER: per spec, any household member (not just
-- admins) can confirm or skip a due expense — logging a transaction is
-- different from managing the template itself. But recurring_expenses'
-- own RLS ("Household admins can manage recurring expenses", 0013)
-- restricts ALL writes, including UPDATE, to admins. Rather than
-- loosening that policy — which would also let regular members edit
-- category_id/amount/day_of_month via the admin-only template UI — these
-- functions run with elevated privileges and do their own membership
-- check internally (not a role check), narrowly scoped to just the
-- confirm/skip write. Same reasoning as household_income's
-- enforce_household_income_member (0012) and recurring_expenses' own
-- paid_by check (0013).
--
-- Both take year/month as parameters rather than computing "now" in SQL,
-- so the household-timezone "what period is this" calculation stays in
-- exactly one place (lib/household.ts on the app side) instead of a
-- second, potentially-drifting implementation in Postgres.

create or replace function public.confirm_recurring_expense(
  p_recurring_expense_id uuid,
  p_amount numeric,
  p_year int,
  p_month int
)
returns public.budget_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense public.recurring_expenses%rowtype;
  v_category_name text;
  v_is_member boolean;
  v_new_item public.budget_items%rowtype;
begin
  select * into v_expense
  from public.recurring_expenses
  where id = p_recurring_expense_id;

  if v_expense.id is null then
    raise exception 'Recurring expense % not found', p_recurring_expense_id;
  end if;

  select exists (
    select 1
    from public.household_members
    where household_id = v_expense.household_id
      and user_id = auth.uid()
  ) into v_is_member;

  if not v_is_member then
    raise exception 'You must be a member of this household to confirm this expense';
  end if;

  select name into v_category_name
  from public.categories
  where id = v_expense.category_id;

  -- title = the category's name, per spec (budget_items.title is not
  -- null, so there's no "leave it blank" option here).
  insert into public.budget_items (
    user_id, household_id, title, amount, type, category_id, paid_by
  )
  values (
    auth.uid(),
    v_expense.household_id,
    coalesce(v_category_name, 'Expense'),
    p_amount,
    'expense',
    v_expense.category_id,
    v_expense.paid_by
  )
  returning * into v_new_item;

  -- The confirmed amount becomes the new standing amount for future
  -- months, per spec.
  update public.recurring_expenses
  set amount = p_amount,
      last_confirmed_year = p_year,
      last_confirmed_month = p_month
  where id = p_recurring_expense_id;

  return v_new_item;
end;
$$;

grant execute on function public.confirm_recurring_expense(uuid, numeric, int, int) to authenticated;

create or replace function public.skip_recurring_expense(
  p_recurring_expense_id uuid,
  p_year int,
  p_month int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_is_member boolean;
begin
  select household_id into v_household_id
  from public.recurring_expenses
  where id = p_recurring_expense_id;

  if v_household_id is null then
    raise exception 'Recurring expense % not found', p_recurring_expense_id;
  end if;

  select exists (
    select 1
    from public.household_members
    where household_id = v_household_id
      and user_id = auth.uid()
  ) into v_is_member;

  if not v_is_member then
    raise exception 'You must be a member of this household to skip this expense';
  end if;

  update public.recurring_expenses
  set last_confirmed_year = p_year,
      last_confirmed_month = p_month
  where id = p_recurring_expense_id;
end;
$$;

grant execute on function public.skip_recurring_expense(uuid, int, int) to authenticated;
