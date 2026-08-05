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
import SectionHeader from "@/components/SectionHeader";

// Owns the reactive total + list of BudgetRow items.
import BudgetsManager from "@/components/BudgetsManager";

// Page-header icon — hand-drawn, same house style as the dashboard's
// icons (DashboardManager.tsx) and Nav's GearIcon: 24x24 viewBox,
// currentColor stroke so it inherits the tile's text-on-accent color.
function WalletIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h.01" />
    </svg>
  );
}

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

  const savingCategories = categories.filter(
    (category) => category.type === "saving"
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

          <div className="mt-3">
            <SectionHeader
              size="lg"
              icon={<WalletIcon />}
              title="Budgets"
              subtitle="Set a spending limit for each expense category."
            />
          </div>
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
            savingCategories={savingCategories}
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
