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
import { getCurrentUserRole, getHouseholdMembers } from "@/app/actions/households";
import { getRecurringExpenses } from "@/app/actions/recurringExpenses";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";
import RecurringExpensesManager from "@/components/RecurringExpensesManager";

export default async function RecurringPage() {
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

  const [categories, role, householdMembers, expenses] = await Promise.all([
    getCategories(),
    getCurrentUserRole(),
    getHouseholdMembers(),
    getRecurringExpenses(),
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
            Recurring expenses
          </h2>

          <p className="mt-2 text-secondary">
            Standing monthly expenses like rent and subscriptions.
          </p>
        </section>

        <RecurringExpensesManager
          initialExpenses={expenses}
          expenseCategories={expenseCategories}
          householdMembers={householdMembers}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
