-- Budgets: one standing amount per (household, category), expense categories only.
-- Depends on households/household_members/categories from 0003 and 0004.

create table if not exists public.budgets (
  id uuid not null default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_pkey primary key (id),
  constraint budgets_amount_check check (amount >= 0),
  constraint budgets_household_id_category_id_key unique (household_id, category_id)
);

alter table public.budgets enable row level security;

-- Trigger: a budget's category must (1) be an expense category, and
-- (2) belong to the same household as the budget row. Note: this only
-- validates at the time the budget is inserted/updated — it does not
-- re-check existing budgets if a category's type or household_id is
-- changed afterward. Known limitation, not addressed here.
create or replace function public.enforce_budget_category_is_expense()
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
      'budgets.category_id must reference a category with type = ''expense'' (got %)',
      v_category_type;
  end if;

  if v_category_household_id is distinct from new.household_id then
    raise exception
      'budgets.category_id must reference a category in the same household (budget household_id = %, category household_id = %)',
      new.household_id, v_category_household_id;
  end if;

  return new;
end;
$$;

create trigger budgets_category_must_be_expense
before insert or update on public.budgets
for each row
execute function public.enforce_budget_category_is_expense();

-- Trigger: keep updated_at current on every UPDATE.
create or replace function public.set_budgets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger budgets_set_updated_at
before update on public.budgets
for each row
execute function public.set_budgets_updated_at();

-- Any household member (any role) can view budgets.
create policy "Household members can view budgets"
on public.budgets
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budgets.household_id
      and household_members.user_id = auth.uid()
  )
);

-- Only admins can create, edit, or delete budgets.
create policy "Household admins can manage budgets"
on public.budgets
for all
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budgets.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = budgets.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
);
