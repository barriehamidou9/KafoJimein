import Link from "next/link";
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

import { getDeletedBudgetItems } from "@/app/actions/budgetItems";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";
import DeletedItemsList from "@/components/DeletedItemsList";

export default async function DeletedPage() {
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

  const items = await getDeletedBudgetItems();

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
            Recently deleted
          </h2>

          <p className="mt-2 text-secondary">
            Transactions deleted in the last 30 days. Restore one to bring
            it back.
          </p>
        </section>

        {/* Deleted transactions */}
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <DeletedItemsList initialItems={items} />
        </section>
      </div>
    </main>
  );
}
