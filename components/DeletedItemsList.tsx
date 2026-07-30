"use client";

// ==========================================
// React
// Owns the deleted-items list as local state so a restored or
// permanently-deleted item disappears immediately, no reload.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) since these take a
// plain id (or nothing), not FormData.
// ==========================================

import {
  restoreBudgetItem,
  permanentlyDeleteBudgetItem,
  clearAllDeletedBudgetItems,
  type BudgetItem,
} from "@/app/actions/budgetItems";

// ==========================================
// Household config
// ==========================================

import { formatHouseholdDateTime } from "@/lib/household";

type DeletedItemsListProps = {
  initialItems: BudgetItem[];
  // RLS (migration 0019) is the real enforcement for permanent delete —
  // this only hides the controls for non-admins, same convention as
  // every other role-aware page.
  isAdmin: boolean;
};

export default function DeletedItemsList({
  initialItems,
  isAdmin,
}: DeletedItemsListProps) {
  // ==========================================
  // State
  // ==========================================

  const [items, setItems] = useState<BudgetItem[]>(initialItems);

  // Which row is currently being restored, so only that row's button
  // disables while the request is in flight.
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Which row (if any) hit an error, and what it said. Shared between
  // restore and permanent-delete since only one can be in flight for a
  // given row at a time.
  const [errorId, setErrorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-row "Delete permanently" confirmation step, same pattern as
  // TransactionRow's delete confirmation.
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState<
    string | null
  >(null);

  // "Clear all" confirmation step, separate from any single row.
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [clearAllError, setClearAllError] = useState<string | null>(null);

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

  async function handlePermanentlyDelete(id: string) {
    setError(null);
    setErrorId(null);
    setPermanentlyDeletingId(id);

    try {
      await permanentlyDeleteBudgetItem(id);

      setItems((previous) => previous.filter((item) => item.id !== id));
      setConfirmingDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setErrorId(id);
    } finally {
      setPermanentlyDeletingId(null);
    }
  }

  async function handleClearAll() {
    setClearAllError(null);
    setIsClearingAll(true);

    try {
      await clearAllDeletedBudgetItems();

      setItems([]);
      setIsConfirmingClearAll(false);
    } catch (err) {
      setClearAllError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsClearingAll(false);
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
    <div>
      {/* "Clear all" — admin-only. Note: this permanently deletes every
          soft-deleted row in the household, not just the ones listed
          below (which is limited to the last 30 days). */}
      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          {clearAllError && (
            <span className="text-sm font-medium text-danger">
              {clearAllError}
            </span>
          )}

          {isConfirmingClearAll ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-secondary">
                Permanently delete all {items.length} deleted transactions?
                This cannot be undone.
              </span>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="font-semibold text-danger hover:text-danger disabled:opacity-50"
              >
                Yes, delete all
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                disabled={isClearingAll}
                className="font-medium text-muted hover:text-primary disabled:opacity-50"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingClearAll(true)}
              className="text-sm font-medium text-danger hover:text-danger"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div>
              <p className="font-medium text-primary">{item.title}</p>

              <p className="text-sm text-secondary">
                <span className="capitalize">{item.type}</span>
                {" · "}
                Deleted{" "}
                {item.deleted_at
                  ? formatHouseholdDateTime(item.deleted_at)
                  : ""}
              </p>

              {errorId === item.id && error && (
                <p className="mt-1 text-sm font-medium text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

              {isAdmin &&
                (confirmingDeleteId === item.id ? (
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-secondary">
                      Permanently delete this transaction? This cannot be
                      undone.
                    </span>

                    <button
                      type="button"
                      onClick={() => handlePermanentlyDelete(item.id)}
                      disabled={permanentlyDeletingId === item.id}
                      className="font-semibold text-danger hover:text-danger disabled:opacity-50"
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      disabled={permanentlyDeletingId === item.id}
                      className="font-medium text-muted hover:text-primary disabled:opacity-50"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(item.id)}
                    className="text-xs font-medium text-danger hover:text-danger"
                  >
                    Delete permanently
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
