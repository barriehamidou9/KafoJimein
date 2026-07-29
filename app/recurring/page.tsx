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

import LogoutButton from "@/components/LogoutButton";
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
            Recurring expenses
          </h2>

          <p className="mt-2 text-slate-500">
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
