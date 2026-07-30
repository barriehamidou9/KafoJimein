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
    <div className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-primary">
            {category?.name ?? "Unknown category"}
          </p>

          <p className="text-sm text-secondary">
            Paid by {paidByMember?.displayName ?? "Unknown"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary">$</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isSubmitting}
            className="w-24 rounded-xl border border-border bg-surface-card px-3 py-2 text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-danger">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
        >
          Confirm
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-surface-track disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
