"use client";

// ==========================================
// Components
// Purely presentational: the item list lives in the parent
// (DashboardManager), which also owns Summary cards and Budget overview —
// all three need to react to the same edits/deletes, so state can't live
// here alone anymore.
// ==========================================

import TransactionRow from "@/components/TransactionRow";

// ==========================================
// Types
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";
import type { Category } from "@/app/actions/categories";

type TransactionsManagerProps = {
  items: BudgetItem[];
  categories: Category[];
  onUpdated: (item: BudgetItem) => void;
  onDeleted: (id: string) => void;
};

export default function TransactionsManager({
  items,
  categories,
  onUpdated,
  onDeleted,
}: TransactionsManagerProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No transactions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TransactionRow
          key={item.id}
          item={item}
          categories={categories}
          onUpdated={onUpdated}
          onDeleted={() => onDeleted(item.id)}
        />
      ))}
    </div>
  );
}
