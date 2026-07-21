-- Categories feature: categories table + RLS policy + budget_items.category_id link.

create table if not exists public.categories (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  color text not null default '#6366f1',
  icon text,
  created_at timestamptz not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_type_check check (type = any (array['income'::text, 'expense'::text, 'saving'::text])),
  constraint categories_user_id_name_type_key unique (user_id, name, type)
);

alter table public.categories enable row level security;

create policy "Users can manage their own categories"
on public.categories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.budget_items
  add column if not exists category_id uuid references public.categories (id) on delete set null;
