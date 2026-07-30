"use client";

// ==========================================
// React
// Owns the recurring expenses list as shared state, so add/edit/delete
// update the list immediately, without a page reload.
// ==========================================

import { useState } from "react";

// ==========================================
// Components
// ==========================================

import AddRecurringExpenseForm from "@/components/AddRecurringExpenseForm";
import RecurringExpenseRow from "@/components/RecurringExpenseRow";

// ==========================================
// Types
// ==========================================

import type { RecurringExpense } from "@/app/actions/recurringExpenses";
import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type RecurringExpensesManagerProps = {
  initialExpenses: RecurringExpense[];
  expenseCategories: Category[];
  householdMembers: HouseholdMember[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function RecurringExpensesManager({
  initialExpenses,
  expenseCategories,
  householdMembers,
  currentUserId,
  isAdmin,
}: RecurringExpensesManagerProps) {
  // ==========================================
  // State
  // Recurring expenses as fetched on page load, updated in place
  // whenever the add form or a RecurringExpenseRow reports a change.
  // ==========================================

  const [expenses, setExpenses] = useState<RecurringExpense[]>(
    initialExpenses
  );

  // ==========================================
  // Handlers
  // ==========================================

  function handleAdded(expense: RecurringExpense) {
    setExpenses((previous) => [...previous, expense]);
  }

  function handleUpdated(updated: RecurringExpense) {
    setExpenses((previous) =>
      previous.map((expense) =>
        expense.id === updated.id ? updated : expense
      )
    );
  }

  function handleDeleted(id: string) {
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
  }

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <div
      className={
        isAdmin ? "grid gap-8 lg:grid-cols-[380px_1fr]" : "grid gap-8"
      }
    >
      {/* Add recurring expense — admins only */}
      {isAdmin && (
        <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Add recurring expense
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Create a new standing monthly expense.
            </p>
          </div>

          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted">
              No expense categories yet. Add one on the Categories page
              first.
            </p>
          ) : (
            <AddRecurringExpenseForm
              categories={expenseCategories}
              householdMembers={householdMembers}
              currentUserId={currentUserId}
              onAdded={handleAdded}
            />
          )}
        </div>
      )}

      {/* Existing recurring expenses */}
      <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary">
            Recurring expenses
          </h3>

          <p className="mt-1 text-sm text-secondary">
            Your household&apos;s standing monthly expenses.
          </p>
        </div>

        {!isAdmin && (
          <p className="mb-4 text-sm text-secondary">
            Only household admins can manage recurring expenses.
          </p>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-muted">No recurring expenses yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <RecurringExpenseRow
                key={expense.id}
                expense={expense}
                categories={expenseCategories}
                householdMembers={householdMembers}
                isAdmin={isAdmin}
                onUpdated={handleUpdated}
                onDeleted={() => handleDeleted(expense.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
