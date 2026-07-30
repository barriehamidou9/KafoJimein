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
import { computeMonthSummary } from "@/lib/monthSummary";

// ==========================================
// Components
// ==========================================

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
import type { HouseholdIncome } from "@/app/actions/householdIncome";

// A small check icon for the "Settled this month" header — calm, no
// status color, matching the hand-drawn icon style used in Nav.tsx.
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

type DashboardManagerProps = {
  initialItems: BudgetItem[];
  categories: Category[];
  budgets: Budget[];
  householdMembers: HouseholdMember[];
  currentUserId: string;
  initialDueExpenses: RecurringExpense[];
  // The household's configured income (household_income table). Not
  // reactive state — nothing on the dashboard edits it, only the
  // Budgets page's Income section does, same as budgets/categories.
  householdIncome: HouseholdIncome[];
  addBudgetItem: (formData: FormData) => Promise<BudgetItem>;
};

export default function DashboardManager({
  initialItems,
  categories,
  budgets,
  householdMembers,
  currentUserId,
  initialDueExpenses,
  householdIncome,
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

  // Income-based, not budget-based — the hero card's own metric,
  // separate from budgetOverview above (which still drives the
  // per-category Budget overview section further down).
  const monthSummary = computeMonthSummary(items, householdIncome);

  // Used only to decide the hero card's status pill.
  const anyCategoryOverBudget = budgetOverview.some(
    (item) => item.spentAmount > item.budgetAmount
  );

  // Same split feeds "Settled this month" and "Tracked spending" below —
  // one source, so both agree rather than each re-deriving is_fixed.
  const fixedItems = budgetOverview.filter((item) => item.isFixed);
  const variableItems = budgetOverview.filter((item) => !item.isFixed);

  // Hero card derived display values.
  const { income, spent, left } = monthSummary;
  const isOverIncome = spent > income;
  const isLeftNegative = left < 0;

  // Same edge-case shape as the Budget overview bars: avoid dividing by
  // zero income, but still read as "fully spent" if there's spending
  // against no income at all.
  const percentOfIncome =
    income > 0 ? (spent / income) * 100 : spent > 0 ? 100 : 0;
  const isNearIncome = percentOfIncome >= 80 && percentOfIncome <= 100;

  const heroFillColor = isOverIncome
    ? "bg-danger"
    : isNearIncome
      ? "bg-warn"
      : "bg-accent";

  const heroStatus = isOverIncome
    ? { label: "Over budget", className: "border-danger text-danger" }
    : anyCategoryOverBudget
      ? { label: "Watch a category", className: "border-warn text-warn" }
      : { label: "On track", className: "border-accent-deep text-accent-deep" };

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
      {/* Hero: how much is actually left this month — income-based, not
          budget-based. Per-category budgets still drive Budget overview
          further down; they aren't this card's denominator. */}
      <div className="rounded-xl border-[0.5px] border-border bg-surface-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-secondary">Left this month</p>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${heroStatus.className}`}
          >
            {heroStatus.label}
          </span>
        </div>

        <p
          className={`mt-2 font-serif text-[52px] leading-none tabular-nums ${
            isLeftNegative ? "text-danger" : "text-primary"
          }`}
        >
          {isLeftNegative ? "-" : ""}${Math.abs(left).toFixed(2)}
        </p>

        <p className="mt-2 text-sm tabular-nums text-secondary">
          ${spent.toFixed(2)} spent of ${income.toFixed(2)} income
        </p>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-track">
          <div
            className={`h-full rounded-full ${heroFillColor}`}
            style={{ width: `${Math.min(percentOfIncome, 100)}%` }}
          />
        </div>
      </div>

      {/* Settled this month: fixed bills (is_fixed = true). Plain list,
          no bars or status colors — these are paid, so the section should
          read calm rather than tracked. */}
      {fixedItems.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-secondary">
              <CheckIcon />
            </span>

            <h3 className="text-lg font-semibold text-primary">
              Settled this month
            </h3>
          </div>

          <div className="space-y-3">
            {fixedItems.map((item) => (
              <div
                key={item.categoryId}
                className="flex items-center justify-between"
              >
                <p className="text-sm text-primary">{item.categoryName}</p>

                <p className="text-sm tabular-nums text-secondary">
                  ${item.spentAmount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tracked spending: variable categories (is_fixed = false), budget
          vs. actual spending this month. */}
      {variableItems.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-surface-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Tracked spending
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Spending so far this month against each budgeted category.
            </p>
          </div>

          <div className="space-y-4">
            {variableItems.map((item) => {
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

              const fillColor = isOverBudget
                ? "bg-danger"
                : isNearLimit
                  ? "bg-warn"
                  : "bg-accent";

              return (
                <div key={item.categoryId}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium text-primary">
                      {item.categoryName}
                    </p>

                    <p className="text-sm text-secondary">
                      ${item.spentAmount.toFixed(2)} / $
                      {item.budgetAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-track">
                    <div
                      className={`h-full rounded-full ${fillColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Never rely on the red bar alone to say "over budget". */}
                  {isOverBudget && (
                    <p className="mt-1 text-xs font-semibold text-danger">
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
        <section className="mt-8 rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Due this month
            </h3>

            <p className="mt-1 text-sm text-secondary">
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
        <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Add transaction
            </h3>

            <p className="mt-1 text-sm text-secondary">
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
        <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Recent transactions
            </h3>

            <p className="mt-1 text-sm text-secondary">
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
