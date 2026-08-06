-- Add a per-household setting for which day of the month the passive
-- savings reminder card (see the dashboard) should start nudging the
-- user. Defaults to 25 so existing households keep today's behavior
-- until someone changes it. Bounded 1-28, same convention as
-- recurring_expenses.day_of_month (migration 0013): every month has at
-- least 28 days, so any value in that range is valid year-round.
--
-- No new RLS policy needed: "Household members can update their
-- household" (migration 0003) already lets any member (any role)
-- update arbitrary columns on their household's row, including this
-- one.

alter table public.households
  add column savings_reminder_day int not null default 25;

alter table public.households
  add constraint households_savings_reminder_day_check
  check (savings_reminder_day between 1 and 28);
