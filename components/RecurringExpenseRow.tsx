"use client";

// ==========================================
// React
// Manage edit-mode form fields and error/submitting state.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so we can read the
// result back into client state instead of relying on a page reload.
// ==========================================

import {
  deleteRecurringExpense,
  upsertRecurringExpense,
  type RecurringExpense,
} from "@/app/actions/recurringExpenses";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type RecurringExpenseRowProps = {
  expense: RecurringExpense;
  categories: Category[];
  householdMembers: HouseholdMember[];
  // RLS already blocks a non-admin's write; this just avoids showing
  // controls that would fail, same reasoning as BudgetRow/IncomeRow.
  isAdmin: boolean;
  onUpdated?: (expense: RecurringExpense) => void;
  onDeleted?: () => void;
};

export default function RecurringExpenseRow({
  expense,
  categories,
  householdMembers,
  isAdmin,
  onUpdated,
  onDeleted,
}: RecurringExpenseRowProps) {
  // ==========================================
  // State
  // ==========================================

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form fields, seeded from the current expense each time edit
  // mode is entered (see handleStartEdit).
  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [paidBy, setPaidBy] = useState(expense.paid_by);
  const [dayOfMonth, setDayOfMonth] = useState(String(expense.day_of_month));

  const category = categories.find((c) => c.id === expense.category_id);
  const paidByMember = householdMembers.find(
    (member) => member.userId === expense.paid_by
  );

  function handleStartEdit() {
    setAmount(String(expense.amount));
    setCategoryId(expense.category_id);
    setPaidBy(expense.paid_by);
    setDayOfMonth(String(expense.day_of_month));
    setError(null);
    setIsEditing(true);
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
      formData.set("id", expense.id);
      formData.set("amount", amount);
      formData.set("category_id", categoryId);
      formData.set("paid_by", paidBy);
      formData.set("day_of_month", dayOfMonth);

      const updated = await upsertRecurringExpense(formData);

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
      await deleteRecurringExpense(expense.id);

      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Read-only for non-admins: no controls at all.
  // ==========================================

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
        <div>
          <p className="font-medium text-slate-900">
            {category?.name ?? "Unknown category"}
          </p>

          <p className="text-sm text-slate-500">
            Paid by {paidByMember?.displayName ?? "Unknown"}
            {" · "}
            Due on day {expense.day_of_month}
          </p>
        </div>

        <p className="font-semibold text-slate-900">
          ${Number(expense.amount).toFixed(2)}
        </p>
      </div>
    );
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
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={paidBy}
              onChange={(event) => setPaidBy(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {householdMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              max="28"
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
              placeholder="Day"
              className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
            />
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
  // View mode (admin)
  // ==========================================

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
      <div>
        <p className="font-medium text-slate-900">
          {category?.name ?? "Unknown category"}
        </p>

        <p className="text-sm text-slate-500">
          Paid by {paidByMember?.displayName ?? "Unknown"}
          {" · "}
          Due on day {expense.day_of_month}
        </p>

        {error && (
          <p className="mt-1 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="font-semibold text-slate-900">
          ${Number(expense.amount).toFixed(2)}
        </p>

        <button
          type="button"
          onClick={handleStartEdit}
          className="text-xs font-medium text-slate-500 hover:text-emerald-600"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
