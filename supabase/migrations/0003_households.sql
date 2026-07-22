-- Household-shared data, step 1: structure + roles.
-- No backfill, no NOT NULL constraints on the new household_id columns yet,
-- and budget_items' RLS policy is untouched. Those come in a later, separate
-- migration once household_id backfill has happened.

create table if not exists public.households (
  id uuid not null default gen_random_uuid(),
  name text not null default 'My Household',
  created_at timestamptz not null default now(),
  constraint households_pkey primary key (id)
);

alter table public.households enable row level security;

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  constraint household_members_pkey primary key (household_id, user_id),
  constraint household_members_role_check check (role in ('admin', 'member'))
);

alter table public.household_members enable row level security;

-- Users can see their own membership rows (including their role).
create policy "Users can view their own household membership"
on public.household_members
for select
using (auth.uid() = user_id);

-- Users can remove themselves from a household (leave).
create policy "Users can leave a household"
on public.household_members
for delete
using (auth.uid() = user_id);

-- No INSERT or UPDATE policy for regular users yet: members are added and
-- roles are changed via direct SQL (superuser/service role) until an invite
-- flow exists. In particular, this prevents a member from updating their own
-- row to escalate role from 'member' to 'admin'.

-- Any authenticated user can create a household.
create policy "Authenticated users can create households"
on public.households
for insert
with check (auth.uid() is not null);

-- Only members (any role) can view or update a household.
create policy "Household members can view their household"
on public.households
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
  )
);

create policy "Household members can update their household"
on public.households
for update
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
  )
);

alter table public.categories
  add column if not exists household_id uuid references public.households (id) on delete cascade;

alter table public.budget_items
  add column if not exists household_id uuid references public.households (id) on delete cascade;

-- Any household member (any role) can view categories.
create policy "Household members can view categories"
on public.categories
for select
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = categories.household_id
      and household_members.user_id = auth.uid()
  )
);

-- Only admins can create, edit, or delete categories.
create policy "Household admins can manage categories"
on public.categories
for all
using (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = categories.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members
    where household_members.household_id = categories.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
  )
);

-- budget_items policy is intentionally left untouched for this migration.
