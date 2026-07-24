-- Soft delete for budget_items: add deleted_at. deleteBudgetItem now sets
-- this instead of removing the row; all read queries filter to
-- deleted_at is null so soft-deleted rows disappear from normal view.
--
-- No RLS change: the existing "Household members can manage budget items"
-- policy is `for all`, which already covers this UPDATE the same way it
-- covered the DELETE it replaces (any household member, no admin
-- restriction). Filtering is done application-side in each read query,
-- not via RLS, per how this was specified.

alter table public.budget_items
  add column if not exists deleted_at timestamptz;
