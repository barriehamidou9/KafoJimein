-- Household income: one standing amount per (household, person).

create table if not exists public.household_income (
  id uuid not null default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12,2) not null,
  updated_at timestamptz not null default now(),
  constraint household_income_pkey primary key (id),
  constraint household_income_amount_check check (amount >= 0),
  constraint household_income_household_id_user_id_key unique (household_id, user_id)
);

alter table public.household_income enable row level security;

-- Trigger: keep updated_at current on every UPDATE, same pattern as budgets.
create or replace function public.set_household_income_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger household_income_set_updated_at
before update on public.household_income
for each row
execute function public.set_household_income_updated_at();

-- Any household member (any role) can view household income.
create policy "Household members can view household income"
on public.household_income
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = household_income.household_id
      and household_members.user_id = auth.uid()
  )
);

-- Only admins can create, edit, or delete household income entries.
create policy "Household admins can manage household income"
on public.household_income
for all
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = household_income.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = household_income.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
);
