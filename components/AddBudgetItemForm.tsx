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
import type { HouseholdMember } from "@/app/actions/households";

// ==========================================
// Props
// ==========================================

// Server Action received from page.tsx (now via DashboardManager).
type AddBudgetItemFormProps = {
  addBudgetItem: (formData: FormData) => Promise<BudgetItem>;
  categories: Category[];
  householdMembers: HouseholdMember[];
  // Whoever is currently logged in — the default "Paid by" selection.
  currentUserId: string;
  // Reports the created item upward so the dashboard's shared state (and
  // anything derived from it — summary cards, budget overview) updates
  // immediately, without a page reload.
  onAdded?: (item: BudgetItem) => void;
};

export default function AddBudgetItemForm({
  addBudgetItem,
  categories,
  householdMembers,
  currentUserId,
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
  const [paidBy, setPaidBy] = useState(currentUserId);
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
      setPaidBy(currentUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Display the transaction entry form.
  // ==========================================

  // Shared by every field below, so the five inputs/selects stay visually
  // identical without repeating the same string five times.
  const fieldClass =
    "h-[38px] w-full rounded-lg border-[0.5px] border-border bg-surface-card px-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent";

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {/* ==========================================
          Transaction Title (full width)
      ========================================== */}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm text-secondary">
          Title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Costco run, July rent payment"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </div>

      {/* ==========================================
          Amount + Type
      ========================================== */}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm text-secondary">
            Amount
          </label>

          <input
            id="amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm text-secondary">
            Type
          </label>

          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
            className={fieldClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="saving">Saving</option>
          </select>
        </div>
      </div>

      {/* ==========================================
          Category + Paid by
      ========================================== */}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-sm text-secondary">
            Category
          </label>

          <select
            id="category_id"
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={fieldClass}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="paid_by" className="text-sm text-secondary">
            Paid by
          </label>

          <select
            id="paid_by"
            name="paid_by"
            value={paidBy}
            onChange={(event) => setPaidBy(event.target.value)}
            className={fieldClass}
          >
            {householdMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ==========================================
          Error
      ========================================== */}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {/* ==========================================
          Submit Button — the one accent-filled button on the page.
      ========================================== */}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 h-[38px] rounded-lg bg-accent text-sm font-semibold text-on-accent transition hover:bg-accent-deep disabled:opacity-50"
      >
        Add transaction
      </button>
    </form>
  );
}