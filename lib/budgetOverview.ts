import { HOUSEHOLD_TIME_ZONE, startOfMonthUtc } from "@/lib/household";

// Type-only imports: safe even though budgets.ts/budgetItems.ts have
// "use server" at the top — type imports are erased at compile time, so
// this never pulls in the server-action machinery.
import type { Budget, BudgetOverviewItem } from "@/app/actions/budgets";
import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";

// Pure aggregation: given the full set of transactions, budgets, and
// categories already in memory, compute budget-vs-actual for the current
// calendar month. Used both server-side (getBudgetOverview, for the
// initial page load) and client-side (DashboardManager, recomputing live
// as transactions are added/edited/deleted) so both paths always agree.
export function computeBudgetOverview(
  items: BudgetItem[],
  budgets: Budget[],
  categories: Category[]
): BudgetOverviewItem[] {
  if (budgets.length === 0) {
    return [];
  }

  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );
  const budgetedCategoryIds = new Set(
    budgets.map((budget) => budget.category_id)
  );

  const monthStart = startOfMonthUtc(0, HOUSEHOLD_TIME_ZONE);
  const monthEnd = startOfMonthUtc(1, HOUSEHOLD_TIME_ZONE);

  const spentByCategoryId = new Map<string, number>();

  for (const item of items) {
    // Defense in depth: getBudgetItems() already filters this out, but
    // this function's correctness matters for real financial totals, so
    // it shouldn't silently trust that every caller pre-filtered.
    if (item.deleted_at) {
      continue;
    }

    if (item.type !== "expense") {
      continue;
    }

    if (!item.category_id || !budgetedCategoryIds.has(item.category_id)) {
      continue;
    }

    const createdAt = new Date(item.created_at);

    if (createdAt < monthStart || createdAt >= monthEnd) {
      continue;
    }

    const previous = spentByCategoryId.get(item.category_id) ?? 0;
    spentByCategoryId.set(item.category_id, previous + Number(item.amount));
  }

  return budgets
    .map((budget) => {
      const category = categoryById.get(budget.category_id);

      // Shouldn't happen (categories cascade-delete their budgets), but
      // guards against relying on a category that no longer exists.
      if (!category) {
        return null;
      }

      return {
        categoryId: budget.category_id,
        categoryName: category.name,
        budgetAmount: Number(budget.amount),
        spentAmount: spentByCategoryId.get(budget.category_id) ?? 0,
      };
    })
    .filter((item): item is BudgetOverviewItem => item !== null);
}
