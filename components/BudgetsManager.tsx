"use client";

// ==========================================
// React
// Lift budgets state up here so the total can update live as each
// BudgetRow reports back a save or remove, without a page reload.
// ==========================================

import { useState } from "react";

// ==========================================
// Next.js utilities
// ==========================================

import Link from "next/link";

// ==========================================
// Components
// ==========================================

import BudgetRow from "@/components/BudgetRow";
import IncomeRow from "@/components/IncomeRow";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";
import type { Budget } from "@/app/actions/budgets";
import type { HouseholdMember } from "@/app/actions/households";
import type { HouseholdIncome, HouseholdIncomeEntry } from "@/app/actions/householdIncome";

type BudgetsManagerProps = {
  expenseCategories: Category[];
  initialBudgets: Budget[];
  householdMembers: HouseholdMember[];
  initialIncome: HouseholdIncomeEntry[];
  isAdmin: boolean;
};

export default function BudgetsManager({
  expenseCategories,
  initialBudgets,
  householdMembers,
  initialIncome,
  isAdmin,
}: BudgetsManagerProps) {
  // ==========================================
  // State
  // Budgets as fetched on page load, updated in place whenever a
  // BudgetRow reports a successful save or remove.
  // ==========================================

  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  // Income entries as fetched on page load, updated in place whenever an
  // IncomeRow reports a successful save. Kept as the raw rows (no
  // display name attached) — display names are always looked up fresh
  // from householdMembers below, rather than trusting a name baked into
  // an entry that could go stale if someone updates their name mid-session.
  const [income, setIncome] = useState<HouseholdIncome[]>(initialIncome);

  const budgetByCategoryId = new Map(
    budgets.map((budget) => [budget.category_id, budget])
  );

  const incomeByUserId = new Map(
    income.map((entry) => [entry.user_id, entry])
  );

  // Recomputed on every render from current state, so it always
  // reflects the latest saves/removes.
  const totalBudgeted = budgets.reduce(
    (sum, budget) => sum + Number(budget.amount),
    0
  );

  const totalIncome = income.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0
  );

  // Whether to compare the budget total against income at all — per the
  // spec, no income entries yet means just show the budgeted total, not
  // a comparison against $0.
  const hasIncome = income.length > 0;
  const percentageOfIncome = totalIncome > 0 ? (totalBudgeted / totalIncome) * 100 : 0;
  const unallocated = totalIncome - totalBudgeted;

  // ==========================================
  // Handlers
  // Called by a BudgetRow/IncomeRow after it successfully saves/removes
  // its own row, so these totals (and any other row) stay in sync.
  // ==========================================

  function handleSaved(categoryId: string, budget: Budget) {
    setBudgets((previous) => [
      ...previous.filter((existing) => existing.category_id !== categoryId),
      budget,
    ]);
  }

  function handleRemoved(categoryId: string) {
    setBudgets((previous) =>
      previous.filter((existing) => existing.category_id !== categoryId)
    );
  }

  function handleIncomeSaved(userId: string, entry: HouseholdIncome) {
    setIncome((previous) => [
      ...previous.filter((existing) => existing.user_id !== userId),
      entry,
    ]);
  }

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <>
      {/* Income */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900">Income</h3>

        <p className="mt-1 text-sm text-slate-500">
          Each household member&apos;s income.
        </p>

        {!isAdmin && (
          <p className="mt-4 text-sm text-slate-500">
            Only household admins can manage income.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {householdMembers.map((member) => (
            <IncomeRow
              key={member.userId}
              userId={member.userId}
              displayName={member.displayName}
              initialAmount={incomeByUserId.get(member.userId)?.amount ?? null}
              isAdmin={isAdmin}
              onSaved={handleIncomeSaved}
            />
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700">
            Total household income:{" "}
            <span className="font-semibold">${totalIncome.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Budgets per expense category */}
      {expenseCategories.length === 0 ? (
        <p className="text-sm text-slate-400">
          No expense categories yet.{" "}
          <Link
            href="/categories"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            Add one
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Total across all budgeted expense categories, compared
              against income when any has been set. */}
          <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700">
              {hasIncome ? (
                <>
                  Budgeted:{" "}
                  <span className="font-semibold">
                    ${totalBudgeted.toFixed(2)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    ${totalIncome.toFixed(2)}
                  </span>{" "}
                  income ({Math.round(percentageOfIncome)}%) — $
                  {unallocated.toFixed(2)} unallocated.
                </>
              ) : (
                <>
                  Total monthly budget:{" "}
                  <span className="font-semibold">
                    ${totalBudgeted.toFixed(2)}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            {expenseCategories.map((category) => (
              <BudgetRow
                key={category.id}
                category={category}
                initialBudget={budgetByCategoryId.get(category.id) ?? null}
                isAdmin={isAdmin}
                onSaved={(budget) => handleSaved(category.id, budget)}
                onRemoved={() => handleRemoved(category.id)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
