"use client";

// ==========================================
// React
// Manage edit-mode form fields, the delete
// confirmation step, and error/submitting state.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so we can read the
// result back into client state instead of relying on a page reload.
// ==========================================

import {
  deleteBudgetItem,
  updateBudgetItem,
  type BudgetItem,
} from "@/app/actions/budgetItems";

// ==========================================
// Household config
// ==========================================

import { formatHouseholdDateTime } from "@/lib/household";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";

type TransactionRowProps = {
  item: BudgetItem;
  categories: Category[];
  onUpdated?: (item: BudgetItem) => void;
  onDeleted?: () => void;
};

export default function TransactionRow({
  item,
  categories,
  onUpdated,
  onDeleted,
}: TransactionRowProps) {
  // ==========================================
  // State
  // ==========================================

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form fields, seeded from the current item each time edit mode
  // is entered (see handleStartEdit).
  const [title, setTitle] = useState(item.title);
  const [amount, setAmount] = useState(String(item.amount));
  const [type, setType] = useState(item.type);
  const [categoryId, setCategoryId] = useState(item.category_id ?? "");

  // Same filtering approach as AddBudgetItemForm: only show categories
  // matching the selected transaction type.
  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  function handleStartEdit() {
    setTitle(item.title);
    setAmount(String(item.amount));
    setType(item.type);
    setCategoryId(item.category_id ?? "");
    setError(null);
    setIsEditing(true);
  }

  function handleTypeChange(nextType: string) {
    setType(nextType);
    setCategoryId("");
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  // ==========================================
  // Handlers
  // ==========================================

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("title", title);
      formData.set("amount", amount);
      formData.set("type", type);
      formData.set("category_id", categoryId);

      const updated = await updateBudgetItem(formData);

      onUpdated?.(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("id", item.id);

      await deleteBudgetItem(formData);

      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsConfirmingDelete(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Edit mode
  // ==========================================

  if (isEditing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            required
          />

          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
            />

            <select
              value={type}
              onChange={(event) => handleTypeChange(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="saving">Saving</option>
            </select>

            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">No category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  // ==========================================
  // User Interface
  // View mode
  // ==========================================

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
      <div>
        <p className="font-medium text-slate-900">{item.title}</p>

        <p className="text-sm text-slate-500">
          <span className="capitalize">{item.type}</span>
          {" · "}
          {formatHouseholdDateTime(item.created_at)}
        </p>

        {error && (
          <p className="mt-1 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <p
          className={
            item.type === "income"
              ? "font-semibold text-emerald-600"
              : "font-semibold text-rose-600"
          }
        >
          {item.type === "income" ? "+" : "-"}$
          {Number(item.amount).toFixed(2)}
        </p>

        <div className="flex items-center gap-3">
          {isConfirmingDelete ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Are you sure?</span>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                No
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className="text-xs font-medium text-slate-500 hover:text-emerald-600"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
