"use client";

// ==========================================
// React
// Owns the transactions list as shared state, so Summary cards, Budget
// overview, and Recent transactions all update immediately together when
// a transaction is added, edited, or deleted — none of them re-fetch on
// their own.
// ==========================================

import { useState } from "react";

// ==========================================
// Shared aggregation logic
// The same function getBudgetOverview() uses server-side for the initial
// render, so the client recompute always agrees with it.
// ==========================================

import { computeBudgetOverview } from "@/lib/budgetOverview";

// ==========================================
// Components
// ==========================================

import SummaryCard from "@/components/SummaryCard";
import AddBudgetItemForm from "@/components/AddBudgetItemForm";
import TransactionsManager from "@/components/TransactionsManager";
import DueRecurringExpenseCard from "@/components/DueRecurringExpenseCard";

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";
import type { Budget } from "@/app/actions/budgets";
import type { HouseholdMember } from "@/app/actions/households";
import type { RecurringExpense } from "@/app/actions/recurringExpenses";

type DashboardManagerProps = {
  initialItems: BudgetItem[];
  categories: Category[];
  budgets: Budget[];
  householdMembers: HouseholdMember[];
  currentUserId: string;
  initialDueExpenses: RecurringExpense[];
  addBudgetItem: (formData: FormData) => Promise<BudgetItem>;
};

export default function DashboardManager({
  initialItems,
  categories,
  budgets,
  householdMembers,
  currentUserId,
  initialDueExpenses,
  addBudgetItem,
}: DashboardManagerProps) {
  // ==========================================
  // State
  // Transactions as fetched on page load, updated in place whenever the
  // add form, or a TransactionRow, reports a successful change.
  // ==========================================

  const [items, setItems] = useState<BudgetItem[]>(initialItems);

  // Due recurring expenses, removed from this list once confirmed or
  // skipped — nothing re-fetches this, so once handled it's just gone
  // from view for the rest of the session (correct, since it won't be
  // due again until next period).
  const [dueExpenses, setDueExpenses] =
    useState<RecurringExpense[]>(initialDueExpenses);

  // Recomputed from current state on every render, so it's always current
  // — not a separate fetch that can drift out of sync with `items`.
  const budgetOverview = computeBudgetOverview(items, budgets, categories);

  // ==========================================
  // Handlers
  // ==========================================

  function handleAdded(newItem: BudgetItem) {
    setItems((previous) => [newItem, ...previous]);
  }

  function handleUpdated(updated: BudgetItem) {
    setItems((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  function handleDeleted(id: string) {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  function handleExpenseConfirmed(expenseId: string, transaction: BudgetItem) {
    setDueExpenses((previous) =>
      previous.filter((expense) => expense.id !== expenseId)
    );
    // Same shared state the manual Add transaction form feeds into, so
    // Recent transactions/Budget overview/Summary cards update the same way.
    handleAdded(transaction);
  }

  function handleExpenseSkipped(expenseId: string) {
    setDueExpenses((previous) =>
      previous.filter((expense) => expense.id !== expenseId)
    );
  }

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <>
      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <SummaryCard
            key={item.id}
            title={item.title}
            amount={item.amount}
            type={item.type}
          />
        ))}
      </section>

      {/* Budget overview: budget vs. actual spending this month. */}
      {budgetOverview.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Budget overview
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Spending so far this month against each budgeted category.
            </p>
          </div>

          <div className="space-y-4">
            {budgetOverview.map((item) => {
              // No budget set is filtered out upstream (computeBudgetOverview
              // only returns categories that have one), so budgetAmount is
              // always the denominator here except for the zero-budget edge
              // case guarded below.
              const percentage =
                item.budgetAmount > 0
                  ? (item.spentAmount / item.budgetAmount) * 100
                  : item.spentAmount > 0
                    ? 100
                    : 0;

              const isOverBudget = percentage > 100;
              const isNearLimit = percentage >= 80 && percentage <= 100;

              // Track uses a lighter step of the same color as the fill, so
              // the bar's state reads even across its unfilled portion.
              const trackColor = isOverBudget
                ? "bg-rose-100"
                : isNearLimit
                  ? "bg-amber-100"
                  : "bg-emerald-100";

              const fillColor = isOverBudget
                ? "bg-rose-500"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-emerald-500";

              return (
                <div key={item.categoryId}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium text-slate-900">
                      {item.categoryName}
                    </p>

                    <p className="text-sm text-slate-500">
                      ${item.spentAmount.toFixed(2)} / $
                      {item.budgetAmount.toFixed(2)}
                    </p>
                  </div>

                  <div
                    className={`h-2 w-full overflow-hidden rounded-full ${trackColor}`}
                  >
                    <div
                      className={`h-full rounded-full ${fillColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Never rely on the red bar alone to say "over budget". */}
                  {isOverBudget && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      Over budget
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Due this month: recurring expenses whose day has arrived and
          haven't been confirmed/skipped yet this period. */}
      {dueExpenses.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Due this month
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Confirm or skip each recurring expense that&apos;s come due.
            </p>
          </div>

          <div className="space-y-3">
            {dueExpenses.map((expense) => (
              <DueRecurringExpenseCard
                key={expense.id}
                expense={expense}
                categories={categories}
                householdMembers={householdMembers}
                onConfirmed={(transaction) =>
                  handleExpenseConfirmed(expense.id, transaction)
                }
                onSkipped={() => handleExpenseSkipped(expense.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main dashboard content */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Add transaction */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Add transaction
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add new income or expenses.
            </p>
          </div>

          <AddBudgetItemForm
            addBudgetItem={addBudgetItem}
            categories={categories}
            householdMembers={householdMembers}
            currentUserId={currentUserId}
            onAdded={handleAdded}
          />
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent transactions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your latest financial activity.
            </p>
          </div>

          <TransactionsManager
            items={items}
            categories={categories}
            householdMembers={householdMembers}
            currentUserId={currentUserId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </div>
      </section>
    </>
  );
}
