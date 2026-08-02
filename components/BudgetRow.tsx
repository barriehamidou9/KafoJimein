"use client";

// ==========================================
// React
// Manage local state for the amount input, the
// current budget row, and the transient status message.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so we can read the
// result back into client state instead of relying on a page reload.
// ==========================================

import { deleteBudget, upsertBudget, type Budget } from "@/app/actions/budgets";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";

type BudgetRowProps = {
  category: Category;
  initialBudget: Budget | null;
  // RLS already blocks a non-admin's write; this just avoids showing
  // controls that would fail, per the UI-level role-awareness this
  // component is part of.
  isAdmin: boolean;
  // Let a parent (e.g. BudgetsManager) keep a live total in sync without
  // this row needing to know anything about how that total is computed.
  onSaved?: (budget: Budget) => void;
  onRemoved?: () => void;
};

// Which transient confirmation (if any) is currently showing for this row.
type RowStatus = "idle" | "saved" | "removed";

export default function BudgetRow({
  category,
  initialBudget,
  isAdmin,
  onSaved,
  onRemoved,
}: BudgetRowProps) {
  // ==========================================
  // State
  // ==========================================

  // The amount input's value, prefilled from the existing budget if any.
  const [amount, setAmount] = useState(
    initialBudget ? String(initialBudget.amount) : ""
  );

  // The budget row currently saved for this category, if any. Drives
  // whether the Remove button is shown.
  const [budget, setBudget] = useState<Budget | null>(initialBudget);

  // "saved" / "removed" fade out on their own after ~2 seconds.
  const [status, setStatus] = useState<RowStatus>("idle");

  // A clear message if the server action throws (e.g. RLS rejection).
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show a status message, then clear it after ~2 seconds.
  function flashStatus(next: RowStatus) {
    setStatus(next);
    setTimeout(() => setStatus("idle"), 2000);
  }

  // ==========================================
  // Handlers
  // ==========================================

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("category_id", category.id);
      formData.set("amount", amount);

      const saved = await upsertBudget(formData);

      // Update local state from the saved row (e.g. now has an id, so
      // Remove becomes available) without reloading the page.
      setBudget(saved);
      setAmount(String(saved.amount));
      flashStatus("saved");
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove() {
    if (!budget) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("id", budget.id);

      await deleteBudget(formData);

      setBudget(null);
      setAmount("");
      flashStatus("removed");
      onRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Read-only for non-admins: no input, no Save/Remove — just the
  // current amount (or a placeholder if none is set).
  // ==========================================

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
        <p className="font-medium text-primary">{category.name}</p>

        <p className="text-secondary">
          {budget ? (
            <span className="font-semibold text-primary">
              ${Number(budget.amount).toFixed(2)}
            </span>
          ) : (
            "No budget set"
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
    >
      {/* Mobile: label + $ input share the first line. Desktop: this
          wrapper dissolves (sm:contents) so label and the input rejoin
          the form's own flex row exactly as before — mr-auto on the
          label reproduces the old justify-between "label far left, rest
          clustered right" look without relying on there being exactly
          two flex children. */}
      <div className="flex items-center gap-3 sm:contents">
        <p className="font-medium text-primary sm:mr-auto">
          {category.name}
        </p>

        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          <span className="text-secondary">$</span>

          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20 sm:w-32"
          />
        </div>
      </div>

      {/* Mobile: Save + Remove share a second line, each big enough to
          tap comfortably. Desktop: unchanged size/shape, back to sitting
          inline with the input group above. */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        {/* Transient "Saved" / "Removed" confirmation. */}
        {status === "saved" && (
          <span className="text-sm font-medium text-accent-deep">Saved</span>
        )}
        {status === "removed" && (
          <span className="text-sm font-medium text-secondary">Removed</span>
        )}

        {/* Clear error message if the action was rejected (e.g. non-admin). */}
        {error && (
          <span className="text-sm font-medium text-danger">{error}</span>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50 sm:min-h-0 sm:flex-none"
        >
          Save
        </button>

        {/* Only shown once this category actually has a budget set. */}
        {budget && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isSubmitting}
            className="min-h-11 flex-1 rounded-xl border border-danger/30 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10 focus:outline-none focus:ring-4 focus:ring-danger/20 disabled:opacity-50 sm:min-h-0 sm:flex-none"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
