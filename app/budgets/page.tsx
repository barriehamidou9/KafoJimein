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
import { getBudgets } from "@/app/actions/budgets";
import { getCurrentUserRole, getHouseholdMembers } from "@/app/actions/households";
import { getHouseholdIncome } from "@/app/actions/householdIncome";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";

// Owns the reactive total + list of BudgetRow items.
import BudgetsManager from "@/components/BudgetsManager";

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

  const [categories, budgets, role, householdMembers, income] =
    await Promise.all([
      getCategories(),
      getBudgets(),
      getCurrentUserRole(),
      getHouseholdMembers(),
      getHouseholdIncome(),
    ]);

  const isAdmin = role === "admin";

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <main className="min-h-screen bg-surface-page">
      {/* Navigation */}
      <Nav />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page heading */}
        <section className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-accent-deep hover:text-accent"
          >
            &larr; Back to dashboard
          </Link>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Budgets
          </h2>

          <p className="mt-2 text-secondary">
            Set a spending limit for each expense category.
          </p>
        </section>

        {/* Budgets per expense category */}
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          {!isAdmin && (
            <p className="mb-4 text-sm text-secondary">
              Only household admins can manage budgets.
            </p>
          )}

          <BudgetsManager
            expenseCategories={expenseCategories}
            initialBudgets={budgets}
            householdMembers={householdMembers}
            initialIncome={income}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </main>
  );
}
