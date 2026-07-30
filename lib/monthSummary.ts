import { HOUSEHOLD_TIME_ZONE, getCurrentMonthRange } from "@/lib/household";

// Type-only imports: safe even though budgetItems.ts/householdIncome.ts
// have "use server" at the top — erased at compile time.
import type { BudgetItem } from "@/app/actions/budgetItems";
import type { HouseholdIncome } from "@/app/actions/householdIncome";

export type MonthSummary = {
  income: number;
  spent: number;
  savings: number;
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
// spent and savings are both transaction-based: expense/saving
// transactions within the current calendar month, reusing the same
// getCurrentMonthRange() as computeBudgetOverview rather than
// re-deriving the household-timezone month boundary a third time.
//
// left subtracts both — money moved to a savings goal this month isn't
// free to spend, so it reduces "left" the same as an expense does, even
// though the hero's own sub-line only ever displays spent/income.
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
  let savings = 0;

  for (const item of items) {
    // Defense in depth: getBudgetItems() already filters this out, but
    // this function's correctness matters for real financial totals, so
    // it shouldn't silently trust that every caller pre-filtered — same
    // reasoning as computeBudgetOverview.
    if (item.deleted_at) {
      continue;
    }

    const createdAt = new Date(item.created_at);

    if (createdAt < start || createdAt >= end) {
      continue;
    }

    if (item.type === "expense") {
      spent += Number(item.amount);
    } else if (item.type === "saving") {
      savings += Number(item.amount);
    }
  }

  const left = income - spent - savings;

  return { income, spent, savings, left };
}
