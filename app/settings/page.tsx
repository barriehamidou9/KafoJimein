import Link from "next/link";
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

import { getMyProfile } from "@/app/actions/profiles";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";
import DisplayNameEditor from "@/components/DisplayNameEditor";

export default async function SettingsPage() {
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

  const profile = await getMyProfile();

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
            Settings
          </h2>

          <p className="mt-2 text-secondary">
            Set how your name appears to other household members, e.g. in
            &quot;Paid by&quot;.
          </p>
        </section>

        {/* Display name */}
        <section className="max-w-md rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">
              Display name
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Shown to your household instead of your email.
            </p>
          </div>

          <DisplayNameEditor initialDisplayName={profile.displayName} />
        </section>
      </div>
    </main>
  );
}
