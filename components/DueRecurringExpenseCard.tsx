"use client";

// ==========================================
// React
// Manage the editable amount and submitting/error state.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// ==========================================

import {
  confirmRecurringExpense,
  skipRecurringExpense,
  type RecurringExpense,
} from "@/app/actions/recurringExpenses";

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type DueRecurringExpenseCardProps = {
  expense: RecurringExpense;
  categories: Category[];
  householdMembers: HouseholdMember[];
  onConfirmed: (transaction: BudgetItem) => void;
  onSkipped: () => void;
};

export default function DueRecurringExpenseCard({
  expense,
  categories,
  householdMembers,
  onConfirmed,
  onSkipped,
}: DueRecurringExpenseCardProps) {
  // ==========================================
  // State
  // ==========================================

  // Prefilled from the template's stored amount, editable before
  // confirming — a different value here becomes the new standing amount.
  const [amount, setAmount] = useState(String(expense.amount));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = categories.find((c) => c.id === expense.category_id);
  const paidByMember = householdMembers.find(
    (member) => member.userId === expense.paid_by
  );

  // ==========================================
  // Handlers
  // ==========================================

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      const transaction = await confirmRecurringExpense(
        expense.id,
        Number(amount)
      );

      onConfirmed(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setIsSubmitting(true);

    try {
      await skipRecurringExpense(expense.id);

      onSkipped();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">
            {category?.name ?? "Unknown category"}
          </p>

          <p className="text-sm text-slate-500">
            Paid by {paidByMember?.displayName ?? "Unknown"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">$</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isSubmitting}
            className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50"
        >
          Confirm
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
