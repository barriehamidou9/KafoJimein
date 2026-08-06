"use client";

// ==========================================
// React
// ==========================================

import { useMemo, useState } from "react";

// ==========================================
// Household config
// Month-boundary math already timezone-correct (see lib/household.ts,
// generalized for an arbitrary month in the previous piece of this
// feature) — reused here rather than any new/UTC date logic, so "which
// month is this transaction in" always agrees with the rest of the app.
// ==========================================

import {
  HOUSEHOLD_TIME_ZONE,
  getHouseholdToday,
  getMonthRange,
} from "@/lib/household";

// ==========================================
// Components
// ==========================================

import TransactionsManager from "@/components/TransactionsManager";
import DeletedItemsList from "@/components/DeletedItemsList";

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type Tab = "all" | "deleted";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deleted", label: "Recently deleted" },
];

type MonthOption = { year: number; month: number };

// Chevron icons for the month picker's prev/next arrows — same
// hand-drawn stroke style as every other icon in the app (24x24
// viewBox, currentColor, no fill).
function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// "August 2026" from a plain {year, month} pair (month 1-indexed,
// matching getHouseholdToday()'s convention). year/month here are
// already the household-correct calendar values (derived via
// HOUSEHOLD_TIME_ZONE below, same as getHouseholdToday()), so this just
// formats them against timeZone: "UTC" against a UTC-midnight instant —
// a neutral zone that can't re-shift an already-correct {year, month}
// into a different month when displayed.
function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// Every distinct household-local month with at least one active
// transaction, newest first — bucketed via Intl.DateTimeFormat +
// HOUSEHOLD_TIME_ZONE, the same way lib/household.ts derives "today",
// not a raw/UTC Date read, so a transaction near a month boundary lands
// in the same month here as it does everywhere else (budget overview,
// month summary, ...).
function deriveAvailableMonths(items: BudgetItem[]): MonthOption[] {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: HOUSEHOLD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  });

  const seen = new Map<string, MonthOption>();

  for (const item of items) {
    const parts = formatter.formatToParts(new Date(item.created_at));
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);

    seen.set(monthKey(year, month), { year, month });
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.year * 12 + b.month - (a.year * 12 + a.month)
  );
}

// Defaults to the current household-local month; if it has no
// transactions yet, falls back to the most recent month that does (the
// list is already newest-first), so the picker never lands on an empty
// view on load. If there are no transactions at all, the current month
// is the only sensible default — the empty state has nothing to fall
// back to anyway.
function getDefaultMonth(availableMonths: MonthOption[]): MonthOption {
  const today = getHouseholdToday(HOUSEHOLD_TIME_ZONE);

  const hasCurrentMonth = availableMonths.some(
    (option) => option.year === today.year && option.month === today.month
  );

  if (hasCurrentMonth || availableMonths.length === 0) {
    return { year: today.year, month: today.month };
  }

  return availableMonths[0];
}

type TransactionsTabsProps = {
  initialActiveItems: BudgetItem[];
  deletedItems: BudgetItem[];
  categories: Category[];
  householdMembers: HouseholdMember[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function TransactionsTabs({
  initialActiveItems,
  deletedItems,
  categories,
  householdMembers,
  currentUserId,
  isAdmin,
}: TransactionsTabsProps) {
  const [tab, setTab] = useState<Tab>("all");

  // Owns the active-items list the same way DashboardManager does, so
  // edits/deletes made here update in place without a page reload.
  const [activeItems, setActiveItems] = useState<BudgetItem[]>(
    initialActiveItems
  );

  // Recomputed whenever activeItems changes, so an edit or delete that
  // empties out a month (or, if a date field is ever added, moves a
  // transaction between months) keeps the picker's options in sync
  // automatically — no separate effect needed.
  const availableMonths = useMemo(
    () => deriveAvailableMonths(activeItems),
    [activeItems]
  );

  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(() =>
    getDefaultMonth(availableMonths)
  );

  // getMonthRange + the same half-open [start, end) comparison used by
  // computeBudgetOverview/computeMonthSummary/etc, so "which month a
  // transaction is in" here always agrees with the dashboard.
  const filteredItems = useMemo(() => {
    const { start, end } = getMonthRange(
      selectedMonth.year,
      selectedMonth.month,
      HOUSEHOLD_TIME_ZONE
    );

    return activeItems.filter((item) => {
      const createdAt = new Date(item.created_at);
      return createdAt >= start && createdAt < end;
    });
  }, [activeItems, selectedMonth]);

  const currentIndex = availableMonths.findIndex(
    (option) =>
      option.year === selectedMonth.year &&
      option.month === selectedMonth.month
  );

  // availableMonths is newest-first, so the older neighbor sits at the
  // next index and the newer one at the previous index — an
  // out-of-range index (including -1, when there are no transactions at
  // all and selectedMonth matches nothing) naturally reads as undefined
  // from a JS array, disabling both arrows with nothing left to page to.
  const olderMonth =
    currentIndex === -1 ? undefined : availableMonths[currentIndex + 1];
  const newerMonth =
    currentIndex === -1 ? undefined : availableMonths[currentIndex - 1];

  function handleUpdated(updated: BudgetItem) {
    setActiveItems((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  function handleDeleted(id: string) {
    setActiveItems((previous) => previous.filter((item) => item.id !== id));
  }

  return (
    <div>
      {/* Active-tab styling mirrors Nav.tsx's link pattern (color only,
          no underline/pill) rather than inventing a new tab style. */}
      <div className="mb-6 flex items-center gap-5 border-b border-border pb-3">
        {TABS.map((t) => {
          const isActive = tab === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                isActive
                  ? "text-[14px] text-primary"
                  : "text-[14px] text-secondary transition hover:text-primary"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Both panels stay mounted (hidden via CSS, not unmounted) rather
          than conditionally rendered — DeletedItemsList owns its own
          state seeded once from the deletedItems prop, so unmounting and
          remounting it on every tab switch would reset any restores/
          permanent-deletes made during this session back to that
          original snapshot. */}
      <div className={tab === "all" ? "" : "hidden"}>
        {/* Month picker — All tab only. Recently deleted is a rolling
            30-day window, not a calendar month, so it has no picker. */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-card px-4 py-3">
          <button
            type="button"
            onClick={() => olderMonth && setSelectedMonth(olderMonth)}
            disabled={!olderMonth}
            aria-label="Previous month"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary transition hover:bg-surface-track hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeftIcon />
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {formatMonthLabel(selectedMonth.year, selectedMonth.month)}
            </p>
            <p className="text-xs text-muted">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => newerMonth && setSelectedMonth(newerMonth)}
            disabled={!newerMonth}
            aria-label="Next month"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary transition hover:bg-surface-track hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <TransactionsManager
            items={filteredItems}
            categories={categories}
            householdMembers={householdMembers}
            currentUserId={currentUserId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </div>
      </div>

      <div className={tab === "deleted" ? "" : "hidden"}>
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <DeletedItemsList
            initialItems={deletedItems}
            categories={categories}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
