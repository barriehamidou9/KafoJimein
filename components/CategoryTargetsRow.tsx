"use client";

// ==========================================
// React
// Manage the two target inputs and a transient "Saved" confirmation,
// same pattern as BudgetRow.tsx.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so the saved row can
// update local state without a page reload — Delete stays a plain
// <form action={deleteCategory}> below, same as every other category row.
// ==========================================

import {
  deleteCategory,
  updateCategoryTargets,
  type Category,
} from "@/app/actions/categories";

type CategoryTargetsRowProps = {
  category: Category;
  // RLS already blocks a non-admin's write; this just avoids showing
  // controls that would fail, same convention as BudgetRow/IncomeRow.
  isAdmin: boolean;
};

export default function CategoryTargetsRow({
  category,
  isAdmin,
}: CategoryTargetsRowProps) {
  // ==========================================
  // State
  // ==========================================

  const [targetAmount, setTargetAmount] = useState(
    category.target_amount !== null ? String(category.target_amount) : ""
  );
  const [monthlyTarget, setMonthlyTarget] = useState(
    category.monthly_target !== null ? String(category.monthly_target) : ""
  );
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // Handlers
  // ==========================================

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("id", category.id);
      formData.set("target_amount", targetAmount);
      formData.set("monthly_target", monthlyTarget);

      const updated = await updateCategoryTargets(formData);

      setTargetAmount(
        updated.target_amount !== null ? String(updated.target_amount) : ""
      );
      setMonthlyTarget(
        updated.monthly_target !== null ? String(updated.monthly_target) : ""
      );

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Read-only for non-admins: current targets, no inputs.
  // ==========================================

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <p className="font-medium text-primary">{category.name}</p>

        <p className="text-sm text-secondary">
          {category.target_amount !== null
            ? `Target $${Number(category.target_amount).toFixed(2)}`
            : "No target set"}
        </p>
      </div>
    );
  }

  // ==========================================
  // User Interface
  // Editable for admins. Delete stays its own standalone <form> — nested
  // forms aren't valid HTML, so it sits beside the Save form, not inside it.
  // ==========================================

  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-primary">{category.name}</p>

        <div className="flex items-center gap-3">
          {showSaved && (
            <span className="text-sm font-medium text-accent-deep">
              Saved
            </span>
          )}

          {error && (
            <span className="text-sm font-medium text-danger">{error}</span>
          )}

          <form action={deleteCategory}>
            <input type="hidden" name="id" value={category.id} />

            <button
              type="submit"
              className="text-sm font-medium text-danger hover:text-danger"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
        className="mt-3 flex flex-wrap items-end gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-secondary">Target</label>

          <div className="flex items-center gap-2">
            <span className="text-secondary">$</span>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="No target"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className="w-28 rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-secondary">Monthly target</label>

          <div className="flex items-center gap-2">
            <span className="text-secondary">$</span>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="No target"
              value={monthlyTarget}
              onChange={(event) => setMonthlyTarget(event.target.value)}
              className="w-28 rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
        >
          Save
        </button>
      </form>
    </div>
  );
}
