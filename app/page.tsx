// ==========================================
// Next.js utilities
// ==========================================

// Redirect users to another page.
import { redirect } from "next/navigation";

// Link to other pages (e.g. categories).
import Link from "next/link";

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

// For the "Paid by" dropdown.
import { getHouseholdMembers } from "@/app/actions/households";

// For the "Due this month" section.
import { getDueRecurringExpenses } from "@/app/actions/recurringExpenses";

// ==========================================
// Components
// ==========================================

// Allows the user to securely log out.
import LogoutButton from "../components/LogoutButton";

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

  const [items, categories, budgets, householdMembers, dueExpenses] =
    await Promise.all([
      getBudgetItems(),
      getCategories(),
      getBudgets(),
      getHouseholdMembers(),
      getDueRecurringExpenses(),
    ]);

  // ==========================================
  // User Interface
  // Render the dashboard.
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ==========================================
          Navigation
      ========================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              KafoJimein
            </h1>

            <p className="text-sm text-slate-500">
              Family finance
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/budgets"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              Budgets
            </Link>

            <Link
              href="/categories"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              Categories
            </Link>

            <Link
              href="/recurring"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              Recurring
            </Link>

            <Link
              href="/deleted"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              Deleted
            </Link>

            <Link
              href="/settings"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              Settings
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ==========================================
          Dashboard
      ========================================== */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page heading */}
        <section className="mb-8">
          <p className="text-sm font-medium text-emerald-600">
            Dashboard
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Your family finances
          </h2>

          <p className="mt-2 text-slate-500">
            Track income, expenses, and your current balance.
          </p>
        </section>

        <DashboardManager
          initialItems={items}
          categories={categories}
          budgets={budgets}
          householdMembers={householdMembers}
          currentUserId={user.id}
          initialDueExpenses={dueExpenses}
          addBudgetItem={addBudgetItem}
        />
      </div>
    </main>
  );
}
