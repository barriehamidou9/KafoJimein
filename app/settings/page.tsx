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

import LogoutButton from "@/components/LogoutButton";
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
            Settings
          </h2>

          <p className="mt-2 text-slate-500">
            Set how your name appears to other household members, e.g. in
            &quot;Paid by&quot;.
          </p>
        </section>

        {/* Display name */}
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Display name
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Shown to your household instead of your email.
            </p>
          </div>

          <DisplayNameEditor initialDisplayName={profile.displayName} />
        </section>
      </div>
    </main>
  );
}
