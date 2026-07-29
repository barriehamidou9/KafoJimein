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
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
        <p className="font-medium text-slate-900">{category.name}</p>

        <p className="text-slate-500">
          {budget ? (
            <span className="font-semibold text-slate-900">
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
      className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
    >
      <p className="font-medium text-slate-900">{category.name}</p>

      <div className="flex items-center gap-3">
        {/* Transient "Saved" / "Removed" confirmation. */}
        {status === "saved" && (
          <span className="text-sm font-medium text-emerald-600">Saved</span>
        )}
        {status === "removed" && (
          <span className="text-sm font-medium text-slate-500">Removed</span>
        )}

        {/* Clear error message if the action was rejected (e.g. non-admin). */}
        {error && (
          <span className="text-sm font-medium text-rose-600">{error}</span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-slate-500">$</span>

          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50"
        >
          Save
        </button>

        {/* Only shown once this category actually has a budget set. */}
        {budget && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isSubmitting}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
