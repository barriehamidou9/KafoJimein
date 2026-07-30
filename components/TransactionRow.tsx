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
import type { HouseholdMember } from "@/app/actions/households";

type TransactionRowProps = {
  item: BudgetItem;
  categories: Category[];
  householdMembers: HouseholdMember[];
  // Whoever is currently logged in — fallback "Paid by" selection for the
  // rare case a row has no paid_by set yet (e.g. inserted before this was
  // wired in).
  currentUserId: string;
  onUpdated?: (item: BudgetItem) => void;
  onDeleted?: () => void;
};

export default function TransactionRow({
  item,
  categories,
  householdMembers,
  currentUserId,
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
  const [paidBy, setPaidBy] = useState(item.paid_by ?? currentUserId);

  // Same filtering approach as AddBudgetItemForm: only show categories
  // matching the selected transaction type.
  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  // Who paid, for the view-mode "Paid by" line.
  const paidByMember = householdMembers.find(
    (member) => member.userId === item.paid_by
  );

  function handleStartEdit() {
    setTitle(item.title);
    setAmount(String(item.amount));
    setType(item.type);
    setCategoryId(item.category_id ?? "");
    setPaidBy(item.paid_by ?? currentUserId);
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
      formData.set("paid_by", paidBy);

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

  // Shared by every edit-mode input/select, same token treatment as
  // AddBudgetItemForm's fieldClass.
  const fieldClass =
    "h-[38px] rounded-lg border-[0.5px] border-border bg-surface-card px-3 text-sm text-primary outline-none transition focus:border-accent";

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
        className="py-3"
      >
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className={`${fieldClass} w-full`}
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
              className={`${fieldClass} w-28`}
              required
            />

            <select
              value={type}
              onChange={(event) => handleTypeChange(event.target.value)}
              className={fieldClass}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="saving">Saving</option>
            </select>

            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={fieldClass}
            >
              <option value="">No category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
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

          {error && (
            <p className="text-sm font-medium text-danger">{error}</p>
          )}

          <div className="flex gap-2">
            {/* Not accent-filled: "Add transaction" is the only filled
                button on the page. */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg border-[0.5px] border-border bg-surface-card px-4 py-2 text-sm font-semibold text-primary transition hover:border-accent disabled:opacity-50"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-primary disabled:opacity-50"
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

  // Three distinct treatments: income is money in (positive, green),
  // expense is money gone (negative, red), saving is money moved to a
  // goal — still leaves checking (leading minus), but in its own color
  // so it isn't mistaken for either.
  const amountColorClass =
    item.type === "expense"
      ? "text-danger"
      : item.type === "saving"
        ? "text-saving"
        : "text-accent-deep";
  const showMinus = item.type === "expense" || item.type === "saving";

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[15px] text-primary">{item.title}</p>

        <p className="mt-0.5 text-xs text-muted">
          {formatHouseholdDateTime(item.created_at)}
          {paidByMember && <> · Paid by {paidByMember.displayName}</>}
        </p>

        {error && (
          <p className="mt-1 text-sm font-medium text-danger">{error}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className={`text-sm tabular-nums ${amountColorClass}`}>
          {showMinus ? "-" : "+"}${Number(item.amount).toFixed(2)}
        </p>

        <div className="flex items-center gap-3">
          {isConfirmingDelete ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted">Are you sure?</span>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="font-semibold text-danger hover:text-danger disabled:opacity-50"
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="font-medium text-muted hover:text-primary disabled:opacity-50"
              >
                No
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className="text-xs text-muted transition hover:text-primary"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-muted transition hover:text-primary"
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
