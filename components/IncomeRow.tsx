"use client";

// ==========================================
// React
// Manage local state for the amount input and
// the transient "Saved" confirmation.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so we can read the
// result back into client state instead of relying on a page reload.
// ==========================================

import {
  upsertHouseholdIncome,
  type HouseholdIncome,
} from "@/app/actions/householdIncome";

type IncomeRowProps = {
  userId: string;
  displayName: string;
  initialAmount: number | null;
  // RLS already blocks a non-admin's write; this just avoids showing
  // controls that would fail, same reasoning as BudgetRow.
  isAdmin: boolean;
  onSaved?: (userId: string, entry: HouseholdIncome) => void;
};

type RowStatus = "idle" | "saved";

export default function IncomeRow({
  userId,
  displayName,
  initialAmount,
  isAdmin,
  onSaved,
}: IncomeRowProps) {
  // ==========================================
  // State
  // ==========================================

  const [amount, setAmount] = useState(
    initialAmount !== null ? String(initialAmount) : ""
  );
  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [status, setStatus] = useState<RowStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function flashStatus() {
    setStatus("saved");
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
      formData.set("user_id", userId);
      formData.set("amount", amount);

      const saved = await upsertHouseholdIncome(formData);

      setCurrentAmount(saved.amount);
      setAmount(String(saved.amount));
      flashStatus();
      onSaved?.(userId, saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Read-only for non-admins: no input, no Save — just the current
  // amount (or a placeholder if none is set).
  // ==========================================

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
        <p className="font-medium text-slate-900">{displayName}</p>

        <p className="text-slate-500">
          {currentAmount !== null ? (
            <span className="font-semibold text-slate-900">
              ${currentAmount.toFixed(2)}
            </span>
          ) : (
            "No income set"
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
      <p className="font-medium text-slate-900">{displayName}</p>

      <div className="flex items-center gap-3">
        {status === "saved" && (
          <span className="text-sm font-medium text-emerald-600">Saved</span>
        )}

        {error && (
          <span className="text-sm font-medium text-rose-600">{error}</span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-slate-500">$</span>

          <input
            type="number"
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
      </div>
    </form>
  );
}
