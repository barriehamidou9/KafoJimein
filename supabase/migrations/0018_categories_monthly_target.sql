-- Add categories.monthly_target: the planned monthly contribution toward
-- a saving category's target_amount (0017) — e.g. target_amount $20,000
-- with monthly_target $1,000/month. Nullable for the same reason as
-- target_amount: only saving-type categories use it, and even they may
-- not have one set yet.

alter table public.categories
  add column if not exists monthly_target numeric(12,2);

alter table public.categories
  add constraint categories_monthly_target_check
  check (monthly_target is null or monthly_target >= 0);

-- No RLS change needed: "Household admins can manage categories" (0003)
-- is a `for all` policy with no column-level grants, so it already
-- covers monthly_target the same as every other column on this table.
