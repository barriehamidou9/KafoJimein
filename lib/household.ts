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

// The UTC instant for midnight on the 1st of the month `monthOffset`
// months from now, as measured in `timeZone`'s local calendar (0 = this
// month, 1 = next month, etc).
export function startOfMonthUtc(monthOffset: number, timeZone: string): Date {
  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(nowParts.find((part) => part.type === "year")?.value);
  const month =
    Number(nowParts.find((part) => part.type === "month")?.value) - 1;

  // Treat the desired wall-clock date as if it were UTC, then correct by
  // the zone's real offset. Refined twice so this stays correct even if a
  // DST transition lands between "now" and the 1st of the target month.
  const naiveUtc = Date.UTC(year, month + monthOffset, 1, 0, 0, 0);
  const offset1 = getTimeZoneOffsetMs(new Date(naiveUtc), timeZone);
  const offset2 = getTimeZoneOffsetMs(new Date(naiveUtc - offset1), timeZone);

  return new Date(naiveUtc - offset2);
}
