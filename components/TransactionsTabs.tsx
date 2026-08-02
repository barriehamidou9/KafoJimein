"use client";

// ==========================================
// React
// ==========================================

import { useState } from "react";

// ==========================================
// Components
// ==========================================

import TransactionsManager from "@/components/TransactionsManager";
import DeletedItemsList from "@/components/DeletedItemsList";

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";
import type { HouseholdMember } from "@/app/actions/households";

type Tab = "all" | "deleted";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deleted", label: "Recently deleted" },
];

type TransactionsTabsProps = {
  initialActiveItems: BudgetItem[];
  deletedItems: BudgetItem[];
  categories: Category[];
  householdMembers: HouseholdMember[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function TransactionsTabs({
  initialActiveItems,
  deletedItems,
  categories,
  householdMembers,
  currentUserId,
  isAdmin,
}: TransactionsTabsProps) {
  const [tab, setTab] = useState<Tab>("all");

  // Owns the active-items list the same way DashboardManager does, so
  // edits/deletes made here update in place without a page reload.
  const [activeItems, setActiveItems] = useState<BudgetItem[]>(
    initialActiveItems
  );

  function handleUpdated(updated: BudgetItem) {
    setActiveItems((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  function handleDeleted(id: string) {
    setActiveItems((previous) => previous.filter((item) => item.id !== id));
  }

  return (
    <div>
      {/* Active-tab styling mirrors Nav.tsx's link pattern (color only,
          no underline/pill) rather than inventing a new tab style. */}
      <div className="mb-6 flex items-center gap-5 border-b border-border pb-3">
        {TABS.map((t) => {
          const isActive = tab === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                isActive
                  ? "text-[14px] text-primary"
                  : "text-[14px] text-secondary transition hover:text-primary"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Both panels stay mounted (hidden via CSS, not unmounted) rather
          than conditionally rendered — DeletedItemsList owns its own
          state seeded once from the deletedItems prop, so unmounting and
          remounting it on every tab switch would reset any restores/
          permanent-deletes made during this session back to that
          original snapshot. */}
      <div className={tab === "all" ? "" : "hidden"}>
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <TransactionsManager
            items={activeItems}
            categories={categories}
            householdMembers={householdMembers}
            currentUserId={currentUserId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </div>
      </div>

      <div className={tab === "deleted" ? "" : "hidden"}>
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <DeletedItemsList
            initialItems={deletedItems}
            categories={categories}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
