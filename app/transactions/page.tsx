import Link from "next/link";
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

import { getBudgetItems, getDeletedBudgetItems } from "@/app/actions/budgetItems";
import { getCategories } from "@/app/actions/categories";
import { getCurrentUserRole, getHouseholdMembers } from "@/app/actions/households";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";
import TransactionsTabs from "@/components/TransactionsTabs";

export default async function TransactionsPage() {
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

  // getBudgetItems() is the full, unsliced, newest-first history — the
  // dashboard's Recent-transactions card only ever sees a slice of the
  // same data, this page shows all of it.
  const [activeItems, deletedItems, categories, householdMembers, role] =
    await Promise.all([
      getBudgetItems(),
      getDeletedBudgetItems(),
      getCategories(),
      getHouseholdMembers(),
      getCurrentUserRole(),
    ]);

  const isAdmin = role === "admin";

  // ==========================================
  // User Interface
  // ==========================================

  return (
    <main className="min-h-screen bg-surface-page">
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
            Transactions
          </h2>

          <p className="mt-2 text-secondary">
            Your full transaction history.
          </p>
        </section>

        <TransactionsTabs
          initialActiveItems={activeItems}
          deletedItems={deletedItems}
          categories={categories}
          householdMembers={householdMembers}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
