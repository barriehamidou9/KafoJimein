"use client";

// ==========================================
// React
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// ==========================================

import {
  upsertRecurringExpense,
  type RecurringExpense,
} from "@/app/actions/recurringExpenses";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type AddRecurringExpenseFormProps = {
  categories: Category[];
  householdMembers: HouseholdMember[];
  // Whoever is currently logged in — the default "Paid by" selection.
  currentUserId: string;
  onAdded?: (expense: RecurringExpense) => void;
};

export default function AddRecurringExpenseForm({
  categories,
  householdMembers,
  currentUserId,
  onAdded,
}: AddRecurringExpenseFormProps) {
  // ==========================================
  // Form State
  // ==========================================

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const newExpense = await upsertRecurringExpense(formData);

      onAdded?.(newExpense);

      setAmount("");
      setCategoryId(categories[0]?.id ?? "");
      setPaidBy(currentUserId);
      setDayOfMonth("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {/* ==========================================
          Amount
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="amount"
          className="text-sm font-medium text-slate-700"
        >
          Amount
        </label>

        <input
          id="amount"
          name="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          min="0"
          step="0.01"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        />
      </div>

      {/* ==========================================
          Category
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="category_id"
          className="text-sm font-medium text-slate-700"
        >
          Category
        </label>

        <select
          id="category_id"
          name="category_id"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* ==========================================
          Paid By
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="paid_by"
          className="text-sm font-medium text-slate-700"
        >
          Paid by
        </label>

        <select
          id="paid_by"
          name="paid_by"
          value={paidBy}
          onChange={(event) => setPaidBy(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        >
          {householdMembers.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* ==========================================
          Day of Month
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="day_of_month"
          className="text-sm font-medium text-slate-700"
        >
          Day of month due
        </label>

        <input
          id="day_of_month"
          name="day_of_month"
          type="number"
          placeholder="1-28"
          value={dayOfMonth}
          onChange={(event) => setDayOfMonth(event.target.value)}
          min="1"
          max="28"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        />
      </div>

      {/* ==========================================
          Error
      ========================================== */}

      {error && (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      )}

      {/* ==========================================
          Submit Button
      ========================================== */}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50"
      >
        Add recurring expense
      </button>
    </form>
  );
}
