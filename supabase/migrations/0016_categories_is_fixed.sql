-- Add categories.is_fixed: whether a category represents a fixed expense
-- (rent, insurance, ...) vs. a variable one (groceries, ...). Backfilled
-- from recurring_expenses rather than hardcoded category names, so it
-- stays correct as templates are added/removed later.

alter table public.categories
  add column if not exists is_fixed boolean not null default false;

update public.categories
set is_fixed = true
where exists (
  select 1
  from public.recurring_expenses
  where recurring_expenses.category_id = categories.id
);

-- No RLS change needed: "Household admins can manage categories" (0003)
-- is a `for all` policy with no column-level grants, so it already
-- covers is_fixed the same as every other column on this table.
