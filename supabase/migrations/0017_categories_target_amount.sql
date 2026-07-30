-- Add categories.target_amount: an optional savings goal, only meaningful
-- for saving-type categories (Emergency Funds, Guinea Project, ...).
-- Nullable since most categories never use it, and even saving
-- categories may not have a target set yet.

alter table public.categories
  add column if not exists target_amount numeric(12,2);

alter table public.categories
  add constraint categories_target_amount_check
  check (target_amount is null or target_amount >= 0);

-- No RLS change needed: "Household admins can manage categories" (0003)
-- is a `for all` policy with no column-level grants, so it already
-- covers target_amount the same as every other column on this table.
