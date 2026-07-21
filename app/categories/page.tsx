import Link from "next/link";
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Server Actions
// ==========================================

import { addCategory, deleteCategory, getCategories } from "@/app/actions/categories";

// ==========================================
// Components
// ==========================================

import LogoutButton from "@/components/LogoutButton";

const CATEGORY_TYPES = ["income", "expense", "saving"] as const;

export default async function CategoriesPage() {
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

  const categories = await getCategories();

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
            Categories
          </h2>

          <p className="mt-2 text-slate-500">
            Organize your income, expenses, and savings.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Add category */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Add category
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a new category to tag transactions.
              </p>
            </div>

            <form action={addCategory} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Example: Groceries"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="type"
                  className="text-sm font-medium text-slate-700"
                >
                  Type
                </label>

                <select
                  id="type"
                  name="type"
                  defaultValue="expense"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="saving">Saving</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                Add category
              </button>
            </form>
          </div>

          {/* Existing categories, grouped by type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Your categories
              </h3>

              <p className="mt-1 text-sm text-slate-500">Grouped by type.</p>
            </div>

            <div className="space-y-8">
              {CATEGORY_TYPES.map((type) => {
                const items = categories.filter(
                  (category) => category.type === type
                );

                return (
                  <div key={type}>
                    <h4 className="mb-3 text-sm font-semibold capitalize text-slate-500">
                      {type}
                    </h4>

                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No categories yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                          >
                            <p className="font-medium text-slate-900">
                              {category.name}
                            </p>

                            <form action={deleteCategory}>
                              <input
                                type="hidden"
                                name="id"
                                value={category.id}
                              />

                              <button
                                type="submit"
                                className="text-sm font-medium text-rose-600 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
