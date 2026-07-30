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
import { getCurrentUserRole } from "@/app/actions/households";

// ==========================================
// Components
// ==========================================

import Nav from "@/components/Nav";

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

  const [categories, role] = await Promise.all([
    getCategories(),
    getCurrentUserRole(),
  ]);

  const isAdmin = role === "admin";

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
            Categories
          </h2>

          <p className="mt-2 text-secondary">
            Organize your income, expenses, and savings.
          </p>
        </section>

        <section
          className={
            isAdmin ? "grid gap-8 lg:grid-cols-[380px_1fr]" : "grid gap-8"
          }
        >
          {/* Add category — admins only */}
          {isAdmin && (
            <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary">
                  Add category
                </h3>

                <p className="mt-1 text-sm text-secondary">
                  Create a new category to tag transactions.
                </p>
              </div>

              <form action={addCategory} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-secondary"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Example: Groceries"
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="type"
                    className="text-sm font-medium text-secondary"
                  >
                    Type
                  </label>

                  <select
                    id="type"
                    name="type"
                    defaultValue="expense"
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="saving">Saving</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-1 rounded-xl bg-accent px-4 py-3 font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20"
                >
                  Add category
                </button>
              </form>
            </div>
          )}

          {/* Existing categories, grouped by type */}
          <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary">
                Your categories
              </h3>

              <p className="mt-1 text-sm text-secondary">Grouped by type.</p>
            </div>

            {!isAdmin && (
              <p className="mb-4 text-sm text-secondary">
                Only household admins can manage categories.
              </p>
            )}

            <div className="space-y-8">
              {CATEGORY_TYPES.map((type) => {
                const items = categories.filter(
                  (category) => category.type === type
                );

                return (
                  <div key={type}>
                    <h4 className="mb-3 text-sm font-semibold capitalize text-secondary">
                      {type}
                    </h4>

                    {items.length === 0 ? (
                      <p className="text-sm text-muted">
                        No categories yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                          >
                            <p className="font-medium text-primary">
                              {category.name}
                            </p>

                            {isAdmin && (
                              <form action={deleteCategory}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={category.id}
                                />

                                <button
                                  type="submit"
                                  className="text-sm font-medium text-danger hover:text-danger"
                                >
                                  Delete
                                </button>
                              </form>
                            )}
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
