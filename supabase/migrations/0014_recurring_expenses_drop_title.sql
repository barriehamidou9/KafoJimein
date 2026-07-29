-- Drop recurring_expenses.title: redundant with category_id (a template
-- is already identified by its category, e.g. "Rent"), and there's no
-- meaningful existing data in this column since the feature just shipped.

alter table public.recurring_expenses
  drop column if exists title;
