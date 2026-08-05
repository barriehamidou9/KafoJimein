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
import SectionHeader from "@/components/SectionHeader";
import TransactionsTabs from "@/components/TransactionsTabs";

// Page-header icon — hand-drawn, same house style as the dashboard's
// icons (DashboardManager.tsx) and Nav's GearIcon: 24x24 viewBox,
// currentColor stroke so it inherits the tile's text-on-accent color.
function ListIcon() {
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

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

          <div className="mt-3">
            <SectionHeader
              size="lg"
              icon={<ListIcon />}
              title="Transactions"
              subtitle="Your full transaction history."
            />
          </div>
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
