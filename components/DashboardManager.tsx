"use client";

// ==========================================
// React
// Owns the transactions list as shared state, so Summary cards, Budget
// overview, and Recent transactions all update immediately together when
// a transaction is added, edited, or deleted — none of them re-fetch on
// their own.
// ==========================================

import { useState } from "react";
import Link from "next/link";

// ==========================================
// Shared aggregation logic
// The same function getBudgetOverview() uses server-side for the initial
// render, so the client recompute always agrees with it.
// ==========================================

import { computeBudgetOverview } from "@/lib/budgetOverview";
import { computeMonthSummary } from "@/lib/monthSummary";
import { computeSavingsOverview } from "@/lib/savingsOverview";
import { computePaidByBreakdown } from "@/lib/paidByBreakdown";

// ==========================================
// Components
// ==========================================

import AddBudgetItemForm from "@/components/AddBudgetItemForm";
import TransactionsManager from "@/components/TransactionsManager";
import DueRecurringExpenseCard from "@/components/DueRecurringExpenseCard";
import SavingCard from "@/components/SavingCard";
import SectionHeader from "@/components/SectionHeader";

// ==========================================
// Section header icons
// Hand-drawn, same style as Nav.tsx's GearIcon (24x24 viewBox, stroke
// currentColor, round caps/joins) — no icon library. Sized for the
// ~18px slot inside SectionHeader's accent tile; currentColor picks up
// the tile's own text-white.
// ==========================================

function BasketIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9h14l-1.4 9.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 9z" />
      <path d="M8.5 9V7.5a3.5 3.5 0 0 1 7 0V9" />
      <line x1="5" y1="12.5" x2="19" y2="12.5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";
import type { Budget } from "@/app/actions/budgets";
import type { HouseholdMember } from "@/app/actions/households";
import type { RecurringExpense } from "@/app/actions/recurringExpenses";
import type { HouseholdIncome } from "@/app/actions/householdIncome";

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

  // Feeds "Tracked spending" below — the is_fixed split itself still
  // lives in computeBudgetOverview; this just picks out the variable half
  // ("Settled this month", the fixed half's old display, is gone).
  const variableItems = budgetOverview.filter((item) => !item.isFixed);

  // Saving totals are cumulative (all-time), unlike everything else on
  // the dashboard — see lib/savingsOverview.ts.
  const savingsOverview = computeSavingsOverview(items, categories);

  // Read-only transparency line under the hero — see lib/paidByBreakdown.ts.
  const paidByBreakdown = computePaidByBreakdown(items, householdMembers);

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

  // Purely local dismissal, no server action involved — the item will
  // reappear next page load since nothing about last_confirmed_year/
  // month was ever touched. Distinct from handleExpenseSkipped below,
  // which does persist via skipRecurringExpense.
  function handleExpenseNotYet(expenseId: string) {
    setDueExpenses((previous) =>
      previous.filter((expense) => expense.id !== expenseId)
    );
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
          budget-based. Per-category budgets still drive Tracked spending
          further down; they aren't this card's denominator. Same
          rounded-2xl/border/bg-surface-card as every other dashboard
          card now; kept p-6 (not p-5) since the 80px hero number is
          meaningfully bigger than any other card's content and reads
          cramped with the tighter padding. */}
      <div className="rounded-2xl border border-border bg-surface-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-secondary">Left this month</p>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${heroStatus.className}`}
          >
            {heroStatus.label}
          </span>
        </div>

        <p
          className={`mt-2 font-serif text-[80px] leading-none tabular-nums ${
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

      {/* Who paid this month: read-only transparency, not its own card —
          quiet enough to sit directly under the hero. */}
      {paidByBreakdown.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Who paid this month —{" "}
          {paidByBreakdown
            .map((entry) => `${entry.displayName} $${entry.totalPaid.toFixed(2)}`)
            .join(" · ")}
        </p>
      )}

      {/* Tracked spending + Saving, side by side on desktop, stacked on
          narrow screens. */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Tracked spending: variable categories (is_fixed = false),
            budget vs. actual spending this month. */}
        {variableItems.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface-card p-5">
            <SectionHeader icon={<BasketIcon />} title="Tracked spending" />

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

        {/* Saving: cumulative (all-time) progress toward each saving
            category's goal — its own blue world, not the red/green used
            for expenses and income. */}
        {savingsOverview.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface-card p-5">
            <SectionHeader icon={<TargetIcon />} title="Saving" />

            <div className="grid gap-4 sm:grid-cols-2">
              {savingsOverview.map((saving) => (
                <SavingCard key={saving.categoryId} saving={saving} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Due this month: recurring expenses whose day has arrived and
          haven't been confirmed/skipped yet this period. */}
      {dueExpenses.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-surface-card p-5">
          <SectionHeader
            icon={<CalendarIcon />}
            title="Due this month"
            subtitle="Confirm or skip each recurring expense that's come due."
          />

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
                onNotYet={() => handleExpenseNotYet(expense.id)}
                onSkipped={() => handleExpenseSkipped(expense.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add transaction + Recent transactions, side by side on desktop
          (narrower/wider, not equal), stacked on narrow screens. */}
      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[380px_1fr]">
        {/* Add transaction */}
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <SectionHeader icon={<PlusIcon />} title="Add transaction" />

          <AddBudgetItemForm
            addBudgetItem={addBudgetItem}
            categories={categories}
            householdMembers={householdMembers}
            currentUserId={currentUserId}
            onAdded={handleAdded}
          />
        </div>

        {/* Recent transactions — capped at 6; the full history lives at
            /transactions. Only items (the TransactionsManager prop) is
            sliced — the underlying items state stays full-size, since
            budgetOverview/monthSummary/savingsOverview/paidByBreakdown
            above all need the complete array. */}
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={<ReceiptIcon />}
              title="Recent transactions"
            />

            {items.length > 6 && (
              <Link
                href="/transactions"
                className="text-sm font-medium text-accent-deep hover:text-accent"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          <TransactionsManager
            items={items.slice(0, 6)}
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
