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
  // Purely local dismissal — no server call, so the item reappears on
  // the next page load (nothing about last_confirmed is stamped). Kept
  // distinct from onSkipped, which does persist.
  onNotYet: () => void;
  onSkipped: () => void;
};

export default function DueRecurringExpenseCard({
  expense,
  categories,
  householdMembers,
  onConfirmed,
  onNotYet,
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="min-h-11 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
        >
          Confirm
        </button>

        {/* No async, no server call — this is a plain local dismissal,
            not tied to isSubmitting's request lifecycle. Still disabled
            while a Confirm/Skip request is in flight so this card can't
            unmount out from under that request's eventual callback.
            border-primary/30 (not border-border) so it reads clearly as
            a button against the card's own bg-warn/10 tint — no
            "border-strong" token exists in this design system, so this
            is the closest available bolder-but-neutral option. */}
        <button
          type="button"
          onClick={onNotYet}
          disabled={isSubmitting}
          className="min-h-11 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-surface-track disabled:opacity-50"
        >
          Not yet
        </button>

        {/* Deliberately the quietest of the three — a lasting choice
            (persists via skipRecurringExpense, won't return until next
            month), so it shouldn't be as easy to tap as "Not yet". Now a
            real button shape (hairline border, same rounded/padding as
            its siblings) instead of bare text, so it's unmistakably
            tappable even though it stays the quietest visually. */}
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-medium text-secondary transition hover:bg-surface-track disabled:opacity-50"
        >
          Skip this month
        </button>
      </div>
    </div>
  );
}
