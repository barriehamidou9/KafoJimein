-- Track who actually paid for a transaction, separate from who logged it
-- (user_id). Nullable, not backfilled to NOT NULL — this isn't wired into
-- the UI yet, so future inserts may leave it unset until it is.

alter table public.budget_items
  add column if not exists paid_by uuid references auth.users (id) on delete set null;

-- Backfill existing rows: default to "whoever logged it paid it".
update public.budget_items
set paid_by = user_id
where paid_by is null;
