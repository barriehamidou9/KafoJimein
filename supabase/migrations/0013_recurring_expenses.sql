-- Recurring expense templates: a standing monthly expense (rent,
-- subscriptions, etc.) with a day of the month it's due, and a marker
-- for the last month/year it was confirmed as paid.

create table if not exists public.recurring_expenses (
  id uuid not null default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,
  paid_by uuid not null references auth.users (id) on delete cascade,
  day_of_month int not null,
  last_confirmed_year int,
  last_confirmed_month int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_expenses_pkey primary key (id),
  constraint recurring_expenses_amount_check check (amount >= 0),
  constraint recurring_expenses_day_of_month_check check (day_of_month between 1 and 28)
);

alter table public.recurring_expenses enable row level security;

-- Trigger: keep updated_at current on every UPDATE, same pattern as budgets.
create or replace function public.set_recurring_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recurring_expenses_set_updated_at
before update on public.recurring_expenses
for each row
execute function public.set_recurring_expenses_updated_at();

-- Trigger: category_id must be an expense category in the same
-- household_id. No SECURITY DEFINER needed here — whoever is allowed to
-- write a recurring_expenses row is, by this table's own RLS, already an
-- admin member of household_id, and categories' own RLS already lets any
-- member of that same household see its categories. So the caller's
-- ordinary privileges are sufficient for this lookup, unlike the
-- paid_by check below.
create or replace function public.enforce_recurring_expense_category_is_expense()
returns trigger
language plpgsql
as $$
declare
  v_category_type text;
  v_category_household_id uuid;
begin
  select type, household_id
  into v_category_type, v_category_household_id
  from public.categories
  where id = new.category_id;

  if v_category_type is distinct from 'expense' then
    raise exception
      'recurring_expenses.category_id must reference a category with type = ''expense'' (got %)',
      v_category_type;
  end if;

  if v_category_household_id is distinct from new.household_id then
    raise exception
      'recurring_expenses.category_id must reference a category in the same household (recurring_expenses household_id = %, category household_id = %)',
      new.household_id, v_category_household_id;
  end if;

  return new;
end;
$$;

create trigger recurring_expenses_category_must_be_expense
before insert or update on public.recurring_expenses
for each row
execute function public.enforce_recurring_expense_category_is_expense();

-- Trigger: paid_by must be a member of household_id. Kept as its own
-- SECURITY DEFINER function rather than folded into the category check
-- above, so only the one check that actually needs elevated privileges
-- gets them (least privilege) — same lesson as household_income's
-- enforce_household_income_member (migration 0012): a plain
-- invoker-rights check here would run as the admin performing the
-- write, and household_members' own SELECT policy ("Users can view
-- their own household membership") only lets that caller see their own
-- row — so it could never confirm a *different* member's row exists,
-- and would incorrectly reject every valid paid_by except the caller's
-- own id. SECURITY DEFINER runs this with the function owner's
-- privileges instead, bypassing RLS for this one check. search_path is
-- pinned to prevent search_path hijacking, standard practice for any
-- SECURITY DEFINER function.
create or replace function public.enforce_recurring_expense_paid_by_member()
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
      and household_members.user_id = new.paid_by
  ) into v_is_member;

  if not v_is_member then
    raise exception
      'recurring_expenses.paid_by must be a member of recurring_expenses.household_id (paid_by = %, household_id = %)',
      new.paid_by, new.household_id;
  end if;

  return new;
end;
$$;

create trigger recurring_expenses_paid_by_must_be_member
before insert or update on public.recurring_expenses
for each row
execute function public.enforce_recurring_expense_paid_by_member();

-- Any household member (any role) can view recurring expenses.
create policy "Household members can view recurring expenses"
on public.recurring_expenses
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = recurring_expenses.household_id
      and household_members.user_id = auth.uid()
  )
);

-- Only admins can create, edit, or delete recurring expenses.
create policy "Household admins can manage recurring expenses"
on public.recurring_expenses
for all
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = recurring_expenses.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = recurring_expenses.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
);
