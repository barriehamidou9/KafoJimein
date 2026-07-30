import { HOUSEHOLD_TIME_ZONE, getCurrentMonthRange } from "@/lib/household";

// Type-only imports: safe even though budgetItems.ts/households.ts have
// "use server" at the top — erased at compile time.
import type { BudgetItem } from "@/app/actions/budgetItems";
import type { HouseholdMember } from "@/app/actions/households";

export type PaidByBreakdownItem = {
  userId: string;
  displayName: string;
  totalPaid: number;
};

// Pure aggregation: current-month expense + saving spend, grouped by who
// paid — read-only transparency. Does not feed into budgets, the hero,
// or any other per-person accounting; it's a separate view of the same
// transactions.
//
// Mapped from householdMembers, not from the totals themselves, so a
// member who paid for nothing this month still appears at $0 rather than
// silently vanishing — same convention as computeSavingsOverview.
export function computePaidByBreakdown(
  items: BudgetItem[],
  householdMembers: HouseholdMember[]
): PaidByBreakdownItem[] {
  const { start, end } = getCurrentMonthRange(HOUSEHOLD_TIME_ZONE);

  const totalByUserId = new Map<string, number>();

  for (const item of items) {
    // Defense in depth: getBudgetItems() already filters this out, but
    // this function's correctness matters for real financial totals, so
    // it shouldn't silently trust that every caller pre-filtered — same
    // reasoning as computeBudgetOverview/computeMonthSummary.
    if (item.deleted_at) {
      continue;
    }

    if (item.type !== "expense" && item.type !== "saving") {
      continue;
    }

    if (!item.paid_by) {
      continue;
    }

    const createdAt = new Date(item.created_at);

    if (createdAt < start || createdAt >= end) {
      continue;
    }

    const previous = totalByUserId.get(item.paid_by) ?? 0;
    totalByUserId.set(item.paid_by, previous + Number(item.amount));
  }

  return householdMembers.map((member) => ({
    userId: member.userId,
    displayName: member.displayName,
    totalPaid: totalByUserId.get(member.userId) ?? 0,
  }));
}
