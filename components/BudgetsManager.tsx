"use client";

// ==========================================
// React
// Lift budgets state up here so the total can update live as each
// BudgetRow reports back a save or remove, without a page reload.
// ==========================================

import { useState } from "react";

// ==========================================
// Components
// ==========================================

import BudgetRow from "@/components/BudgetRow";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";
import type { Budget } from "@/app/actions/budgets";

type BudgetsManagerProps = {
  expenseCategories: Category[];
  initialBudgets: Budget[];
};

export default function BudgetsManager({
  expenseCategories,
  initialBudgets,
}: BudgetsManagerProps) {
  // ==========================================
  // State
  // Budgets as fetched on page load, updated in place whenever a
  // BudgetRow reports a successful save or remove.
  // ==========================================

  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  const budgetByCategoryId = new Map(
    budgets.map((budget) => [budget.category_id, budget])
  );

  // Recomputed on every render from current state, so it always
  // reflects the latest saves/removes.
  const totalBudgeted = budgets.reduce(
    (sum, budget) => sum + Number(budget.amount),
    0
  );

  // ==========================================
  // Handlers
  // Called by a BudgetRow after it successfully saves/removes its own
  // budget, so this total (and any other row) stays in sync.
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

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <>
      {/* Total across all budgeted expense categories. */}
      <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-700">
          Total monthly budget:{" "}
          <span className="font-semibold">${totalBudgeted.toFixed(2)}</span>
        </p>
      </div>

      <div className="space-y-3">
        {expenseCategories.map((category) => (
          <BudgetRow
            key={category.id}
            category={category}
            initialBudget={budgetByCategoryId.get(category.id) ?? null}
            onSaved={(budget) => handleSaved(category.id, budget)}
            onRemoved={() => handleRemoved(category.id)}
          />
        ))}
      </div>
    </>
  );
}
