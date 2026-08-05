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
import SectionHeader from "@/components/SectionHeader";

// Page-header icon — hand-drawn, same house style as the dashboard's
// icons (DashboardManager.tsx) and Nav's GearIcon: 24x24 viewBox,
// currentColor stroke so it inherits the tile's text-on-accent color.
function RepeatIcon() {
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
      <path d="M17 2.1 21 6l-4 3.9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 21.9 3 18l4-3.9" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

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

          <div className="mt-3">
            <SectionHeader
              size="lg"
              icon={<RepeatIcon />}
              title="Recurring expenses"
              subtitle="Standing monthly expenses like rent and subscriptions."
            />
          </div>
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
