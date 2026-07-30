import { HOUSEHOLD_TIME_ZONE, getCurrentMonthRange } from "@/lib/household";

// Type-only imports: safe even though budgetItems.ts/householdIncome.ts
// have "use server" at the top — erased at compile time.
import type { BudgetItem } from "@/app/actions/budgetItems";
import type { HouseholdIncome } from "@/app/actions/householdIncome";

export type MonthSummary = {
  income: number;
  spent: number;
  left: number;
};

// Pure aggregation for the dashboard's hero card: the household's
// configured income vs. spending for the current calendar month.
//
// income is NOT derived from transactions — it's the household's
// standing configured income (household_income table, one row per
// member), a fixed monthly figure with no date filter and no deleted_at
// column to guard (that table doesn't have one).
//
// spent is still transaction-based: expense transactions within the
// current calendar month, reusing the same getCurrentMonthRange() as
// computeBudgetOverview rather than re-deriving the household-timezone
// month boundary a third time.
export function computeMonthSummary(
  items: BudgetItem[],
  householdIncome: HouseholdIncome[]
): MonthSummary {
  const income = householdIncome.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0
  );

  const { start, end } = getCurrentMonthRange(HOUSEHOLD_TIME_ZONE);

  let spent = 0;

  for (const item of items) {
    // Defense in depth: getBudgetItems() already filters this out, but
    // this function's correctness matters for real financial totals, so
    // it shouldn't silently trust that every caller pre-filtered — same
    // reasoning as computeBudgetOverview.
    if (item.deleted_at) {
      continue;
    }

    if (item.type !== "expense") {
      continue;
    }

    const createdAt = new Date(item.created_at);

    if (createdAt < start || createdAt >= end) {
      continue;
    }

    spent += Number(item.amount);
  }

  const left = income - spent;

  return { income, spent, left };
}
