// ==========================================
// Next.js utilities
// ==========================================

// Redirect users to another page.
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

// Server-side Supabase client.
import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

// List categories for the category dropdown.
import { getCategories } from "@/app/actions/categories";

// List budgets and transactions — DashboardManager derives the Budget
// overview client-side from these instead of a separate fetch, so it
// stays in sync as transactions are added/edited/deleted.
import { getBudgets } from "@/app/actions/budgets";
import { addBudgetItem, getBudgetItems } from "@/app/actions/budgetItems";

// For the hero card's income figure.
import { getHouseholdIncome } from "@/app/actions/householdIncome";

// For the "Paid by" dropdown, and the household's own name for the
// preamble line.
import { getHouseholdMembers, getHouseholdName } from "@/app/actions/households";

// For the "Due this month" section.
import { getDueRecurringExpenses } from "@/app/actions/recurringExpenses";

// ==========================================
// Household config
// ==========================================

import { HOUSEHOLD_TIME_ZONE, getHouseholdMonthLabel } from "@/lib/household";

// ==========================================
// Components
// ==========================================

// Shared top nav: brand, route links, settings, logout.
import Nav from "@/components/Nav";

// Owns all the reactive dashboard state: summary cards, budget overview,
// add form, and the recent transactions list.
import DashboardManager from "@/components/DashboardManager";

export default async function Home() {
  // ==========================================
  // Connect to Supabase
  // ==========================================

  const supabase = await createClient();

  // ==========================================
  // Authentication
  // Get the currently logged-in user.
  // If no user exists, redirect to the login page.
  // ==========================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20sign%20in%20to%20continue.");
  }

  // ==========================================
  // Data
  // Fetched once here; DashboardManager owns it as live client state from
  // this point on.
  // ==========================================

  const [
    items,
    categories,
    budgets,
    householdMembers,
    dueExpenses,
    householdIncome,
    householdName,
  ] = await Promise.all([
    getBudgetItems(),
    getCategories(),
    getBudgets(),
    getHouseholdMembers(),
    getDueRecurringExpenses(),
    getHouseholdIncome(),
    getHouseholdName(),
  ]);

  const monthLabel = getHouseholdMonthLabel(HOUSEHOLD_TIME_ZONE);

  // ==========================================
  // User Interface
  // Render the dashboard.
  // ==========================================

  return (
    <main className="min-h-screen bg-surface-page">
      <Nav />

      {/* ==========================================
          Dashboard
      ========================================== */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Preamble: a single small line replaces the old heading block. */}
        <p className="mb-6 text-xs text-muted">
          {monthLabel} · {householdName} household
        </p>

        <DashboardManager
          initialItems={items}
          categories={categories}
          budgets={budgets}
          householdMembers={householdMembers}
          currentUserId={user.id}
          initialDueExpenses={dueExpenses}
          householdIncome={householdIncome}
          addBudgetItem={addBudgetItem}
        />
      </div>
    </main>
  );
}
