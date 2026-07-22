import Link from "next/link";
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

import { getCategories } from "@/app/actions/categories";
import { getBudgets, upsertBudget } from "@/app/actions/budgets";

// ==========================================
// Components
// ==========================================

import LogoutButton from "@/components/LogoutButton";

export default async function BudgetsPage() {
  // ==========================================
  // Authentication
  // ==========================================

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20sign%20in%20to%20continue.");
  }

  const [categories, budgets] = await Promise.all([
    getCategories(),
    getBudgets(),
  ]);

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const budgetByCategoryId = new Map(
    budgets.map((budget) => [budget.category_id, budget])
  );

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">KafoJimein</h1>
            <p className="text-sm text-slate-500">Family finance</p>
          </div>

          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page heading */}
        <section className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            &larr; Back to dashboard
          </Link>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Budgets
          </h2>

          <p className="mt-2 text-slate-500">
            Set a spending limit for each expense category.
          </p>
        </section>

        {/* Budgets per expense category */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-slate-400">
              No expense categories yet.{" "}
              <Link
                href="/categories"
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                Add one
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {expenseCategories.map((category) => {
                const budget = budgetByCategoryId.get(category.id);

                return (
                  <form
                    key={category.id}
                    action={upsertBudget}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <input
                      type="hidden"
                      name="category_id"
                      value={category.id}
                    />

                    <p className="font-medium text-slate-900">
                      {category.name}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">$</span>

                      <input
                        type="number"
                        name="amount"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        defaultValue={budget ? budget.amount : ""}
                        className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
