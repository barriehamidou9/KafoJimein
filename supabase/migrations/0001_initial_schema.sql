-- Initial schema: budget_items table + RLS policy.
-- Written to match the live schema confirmed via information_schema.columns
-- and pg_constraint:
--   id          uuid                     not null default gen_random_uuid()
--   user_id     uuid                     not null
--   title       text                     not null
--   amount      numeric                  not null default 0
--   type        text                     not null
--   created_at  timestamptz              not null default now()
--
-- Constraints (confirmed via pg_constraint):
--   budget_items_pkey: primary key (id)
--   budget_items_type_check: type in ('income', 'expense', 'saving')
--   budget_items_user_id_fkey: user_id references auth.users(id) on delete cascade

create table if not exists public.budget_items (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  type text not null,
  created_at timestamptz not null default now(),
  constraint budget_items_pkey primary key (id),
  constraint budget_items_type_check check (type = any (array['income'::text, 'expense'::text, 'saving'::text]))
);

alter table public.budget_items enable row level security;

create policy "Users can manage their own budget items"
on public.budget_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
