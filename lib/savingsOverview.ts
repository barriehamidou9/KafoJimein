import { HOUSEHOLD_TIME_ZONE, getCurrentMonthRange } from "@/lib/household";

// Type-only imports: safe even though budgetItems.ts/categories.ts have
// "use server" at the top — erased at compile time.
import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";

export type SavingsOverviewItem = {
  categoryId: string;
  name: string;
  targetAmount: number | null;
  monthlyTarget: number | null;
  totalSaved: number;
  savedThisMonth: number;
};

// Pure aggregation for the dashboard's savings section. Unlike every
// other dashboard number, totalSaved is cumulative (all-time) — savings
// goals don't reset every month like spending does. savedThisMonth is
// the one monthly figure here, tracked alongside the all-time total so
// "progress toward the goal" and "on pace this month" can both be shown.
export function computeSavingsOverview(
  items: BudgetItem[],
  categories: Category[]
): SavingsOverviewItem[] {
  const savingCategories = categories.filter(
    (category) => category.type === "saving"
  );

  // Only used for savedThisMonth — totalSaved is deliberately not bounded
  // by this range. Reused rather than re-derived, same as
  // computeBudgetOverview/computeMonthSummary.
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange(
    HOUSEHOLD_TIME_ZONE
  );

  const totalSavedByCategoryId = new Map<string, number>();
  const savedThisMonthByCategoryId = new Map<string, number>();

  for (const item of items) {
    // Defense in depth: getBudgetItems() already filters this out, but
    // this function's correctness matters for real financial totals, so
    // it shouldn't silently trust that every caller pre-filtered — same
    // reasoning as computeBudgetOverview/computeMonthSummary.
    if (item.deleted_at) {
      continue;
    }

    if (item.type !== "saving") {
      continue;
    }

    if (!item.category_id) {
      continue;
    }

    const previousTotal = totalSavedByCategoryId.get(item.category_id) ?? 0;
    totalSavedByCategoryId.set(
      item.category_id,
      previousTotal + Number(item.amount)
    );

    const createdAt = new Date(item.created_at);

    if (createdAt >= monthStart && createdAt < monthEnd) {
      const previousThisMonth =
        savedThisMonthByCategoryId.get(item.category_id) ?? 0;
      savedThisMonthByCategoryId.set(
        item.category_id,
        previousThisMonth + Number(item.amount)
      );
    }
  }

  // Mapped from savingCategories, not from the transactions map, so a
  // saving category with zero transactions still appears (totalSaved 0)
  // instead of silently vanishing.
  return savingCategories.map((category) => ({
    categoryId: category.id,
    name: category.name,
    targetAmount: category.target_amount,
    monthlyTarget: category.monthly_target,
    totalSaved: totalSavedByCategoryId.get(category.id) ?? 0,
    savedThisMonth: savedThisMonthByCategoryId.get(category.id) ?? 0,
  }));
}
