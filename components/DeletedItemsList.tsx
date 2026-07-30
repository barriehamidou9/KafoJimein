"use client";

// ==========================================
// React
// Owns the deleted-items list as local state so a
// restored item disappears immediately, no reload.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) since restoreBudgetItem
// takes a plain id, not FormData.
// ==========================================

import { restoreBudgetItem, type BudgetItem } from "@/app/actions/budgetItems";

// ==========================================
// Household config
// ==========================================

import { formatHouseholdDateTime } from "@/lib/household";

type DeletedItemsListProps = {
  initialItems: BudgetItem[];
};

export default function DeletedItemsList({
  initialItems,
}: DeletedItemsListProps) {
  // ==========================================
  // State
  // ==========================================

  const [items, setItems] = useState<BudgetItem[]>(initialItems);

  // Which row is currently being restored, so only that row's button
  // disables while the request is in flight.
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Which row (if any) hit an error, and what it said.
  const [errorId, setErrorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Handlers
  // ==========================================

  async function handleRestore(id: string) {
    setError(null);
    setErrorId(null);
    setRestoringId(id);

    try {
      await restoreBudgetItem(id);

      setItems((previous) => previous.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setErrorId(id);
    } finally {
      setRestoringId(null);
    }
  }

  // ==========================================
  // User Interface
  // ==========================================

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        No recently deleted transactions.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
        >
          <div>
            <p className="font-medium text-primary">{item.title}</p>

            <p className="text-sm text-secondary">
              <span className="capitalize">{item.type}</span>
              {" · "}
              Deleted{" "}
              {item.deleted_at ? formatHouseholdDateTime(item.deleted_at) : ""}
            </p>

            {errorId === item.id && error && (
              <p className="mt-1 text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p
              className={
                item.type === "income"
                  ? "font-semibold text-accent-deep"
                  : "font-semibold text-danger"
              }
            >
              {item.type === "income" ? "+" : "-"}$
              {Number(item.amount).toFixed(2)}
            </p>

            <button
              type="button"
              onClick={() => handleRestore(item.id)}
              disabled={restoringId === item.id}
              className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
