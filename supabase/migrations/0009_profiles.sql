-- A small per-user profile, currently just a display name. Backs the
-- "Paid by" display (see migration 0010's household_members_display
-- view) so household members can see a real name instead of a raw email.

create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id)
);

alter table public.profiles enable row level security;

-- Any household member (any role) can view profiles of members in their
-- own household(s).
create policy "Household members can view household profiles"
on public.profiles
for select
using (
  exists (
    select 1
    from public.household_members viewer
    join public.household_members target
      on viewer.household_id = target.household_id
    where viewer.user_id = auth.uid()
      and target.user_id = profiles.id
  )
);

-- A user can only update their own profile row.
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Not explicitly requested, but necessary: nothing creates a profiles row
-- automatically (no signup trigger), so without an insert policy no one
-- could ever set a display name for the first time. Scoped the same way
-- the update policy is — only your own row.
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);
