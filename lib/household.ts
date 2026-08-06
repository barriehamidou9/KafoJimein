// Hardcoded until households can set their own timezone (single household,
// single location, for now). Shared by month-boundary math and any
// date/time shown to the household in the UI.
export const HOUSEHOLD_TIME_ZONE = "America/Toronto";

// Formats an ISO timestamp for display in the household's timezone, e.g.
// "Jul 24, 2:10 PM" — never the server's local time or raw UTC.
export function formatHouseholdDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: HOUSEHOLD_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
}

// "July 2026" — the household's current calendar month in its own
// timezone, for small date labels (e.g. the dashboard's preamble line).
export function getHouseholdMonthLabel(timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(new Date());
}

// ==========================================
// Timezone math.
// "Current month" must mean the household's local calendar month, not the
// server process's own timezone (which defaults to UTC on Vercel) or the
// browser's own local timezone — these use Intl's `timeZone` option, which
// is independent of both, so server (getBudgetOverview) and client
// (DashboardManager) always agree on the same boundary. No "use server"
// here: these are plain pure functions, safe to import from client code.
// ==========================================

// The offset (ms) of `timeZone` from UTC at the instant `date` represents.
// Positive = ahead of UTC, negative = behind.
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  // Re-interpreting timeZone's wall-clock reading for `date` as if it were
  // itself a UTC timestamp gives a number we can diff against the real
  // instant to recover the offset.
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  return asIfUtc - date.getTime();
}

// The UTC instant for midnight on the 1st of an explicit household-local
// month (year, month), the arbitrary-month primitive both
// startOfMonthUtc and getMonthRange build on. month is 1-indexed (1 =
// January), matching getHouseholdToday()'s convention below.
export function startOfGivenMonthUtc(
  year: number,
  month: number,
  timeZone: string
): Date {
  // Treat the desired wall-clock date as if it were UTC, then correct by
  // the zone's real offset. Refined twice so this stays correct even if a
  // DST transition lands between "now" and the 1st of the target month.
  // month - 1: Date.UTC takes a 0-indexed month, and (like Date.UTC
  // itself) happily accepts values outside 1-12 and normalizes across
  // the year boundary, which is what lets startOfMonthUtc below pass in
  // today's month + an arbitrary offset unchanged.
  const naiveUtc = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const offset1 = getTimeZoneOffsetMs(new Date(naiveUtc), timeZone);
  const offset2 = getTimeZoneOffsetMs(new Date(naiveUtc - offset1), timeZone);

  return new Date(naiveUtc - offset2);
}

// The UTC instant for midnight on the 1st of the month `monthOffset`
// months from now, as measured in `timeZone`'s local calendar (0 = this
// month, 1 = next month, etc). A thin wrapper over startOfGivenMonthUtc,
// anchored to today's household-local {year, month} — algebraically
// identical to this function's original standalone implementation, since
// getHouseholdToday().month is startOfGivenMonthUtc's month-1 plus 1.
export function startOfMonthUtc(monthOffset: number, timeZone: string): Date {
  const today = getHouseholdToday(timeZone);

  return startOfGivenMonthUtc(today.year, today.month + monthOffset, timeZone);
}

// The [start, end) of an arbitrary household-local calendar month, as
// UTC instants — the arbitrary-month equivalent of getCurrentMonthRange
// below, for a month picker or any other caller that isn't asking about
// "now".
export function getMonthRange(
  year: number,
  month: number,
  timeZone: string
): {
  start: Date;
  end: Date;
} {
  return {
    start: startOfGivenMonthUtc(year, month, timeZone),
    end: startOfGivenMonthUtc(year, month + 1, timeZone),
  };
}

// The current calendar month's [start, end) as UTC instants, in the
// household's timezone — the one place this boundary is computed, so
// every caller (budget overview, month summary, ...) agrees exactly. A
// thin wrapper: today's {year, month} via getHouseholdToday(), fed into
// getMonthRange() — produces the exact same instants as before, since
// that's exactly what the old startOfMonthUtc(0, ...)/(1, ...) calls
// resolved to.
export function getCurrentMonthRange(timeZone: string): {
  start: Date;
  end: Date;
} {
  const today = getHouseholdToday(timeZone);

  return getMonthRange(today.year, today.month, timeZone);
}

// Today's date as the household's local calendar sees it right now —
// year and month 1-indexed (month: 1 = January), matching the plain
// integer convention recurring_expenses.last_confirmed_year/month use
// (these aren't JS Date objects, so there's no reason to carry over
// Date.getMonth()'s 0-indexing here).
export function getHouseholdToday(timeZone: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}
