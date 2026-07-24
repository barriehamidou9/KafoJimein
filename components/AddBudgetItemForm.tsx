"use client";

// ==========================================
// React
// ==========================================

// Manage the form input values.
import { useState } from "react";

// ==========================================
// Types
// ==========================================

import type { Category } from "@/app/actions/categories";
import type { BudgetItem } from "@/app/actions/budgetItems";

// ==========================================
// Props
// ==========================================

// Server Action received from page.tsx (now via DashboardManager).
type AddBudgetItemFormProps = {
  addBudgetItem: (formData: FormData) => Promise<BudgetItem>;
  categories: Category[];
  // Reports the created item upward so the dashboard's shared state (and
  // anything derived from it — summary cards, budget overview) updates
  // immediately, without a page reload.
  onAdded?: (item: BudgetItem) => void;
};

export default function AddBudgetItemForm({
  addBudgetItem,
  categories,
  onAdded,
}: AddBudgetItemFormProps) {

  // ==========================================
  // Form State
  // Store the user's input while typing.
  // ==========================================

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show categories matching the selected transaction type.
  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  function handleTypeChange(nextType: string) {
    setType(nextType);
    setCategoryId("");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const newItem = await addBudgetItem(formData);

      onAdded?.(newItem);

      setTitle("");
      setAmount("");
      setType("expense");
      setCategoryId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Display the budget entry form.
  // ==========================================

    // ==========================================
  // User Interface
  // Display the transaction entry form.
  // ==========================================

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-5"
    >
      {/* ==========================================
          Transaction Title
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="title"
          className="text-sm font-medium text-slate-700"
        >
          Title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Costco run, July rent payment"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        />
      </div>

      {/* ==========================================
          Transaction Amount
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
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* ==========================================
          Transaction Type
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="type"
          className="text-sm font-medium text-slate-700"
        >
          Type
        </label>

        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => handleTypeChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="saving">Saving</option>
        </select>
      </div>

      {/* ==========================================
          Transaction Category
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
        >
          <option value="">No category</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
        Add transaction
      </button>
    </form>
  );
}