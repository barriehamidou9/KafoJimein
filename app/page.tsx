// ==========================================
// Next.js utilities
// ==========================================

// Redirect users to another page.
import { redirect } from "next/navigation";

// ==========================================
// Supabase
// ==========================================

// Server-side Supabase client.
import { createClient } from "@/lib/supabase/server";

// ==========================================
// Components
// ==========================================

// Displays a summary card for each budget item.
import SummaryCard from "@/components/SummaryCard";

// Allows the user to securely log out.
import LogoutButton from "../components/LogoutButton";

// Allow the user to add a budget.
import AddBudgetItemForm from "@/components/AddBudgetItemForm";

// refresh page when budget is enter

import { revalidatePath } from "next/cache";

export default async function Home() {

  // ==========================================
  // Connect to Supabase
  // ==========================================

  const supabase = await createClient();

  // ==========================================
  // Authentication
  // Get the currently logged-in user.
  // If no user exists, redirect to the login page.
  // ==========================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20sign%20in%20to%20continue.");
  }
  
  // ==========================================
// Server Action
// Save a new budget item.
// ==========================================

async function addBudgetItem(
  formData: FormData
): Promise<{ success: boolean }> {
  "use server";

  console.log("Server Action started");
  console.log(Object.fromEntries(formData));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const title = formData.get("title") as string;
  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as string;

  const { error } = await supabase.from("budget_items").insert({
    user_id: user.id,
    title,
    amount,
    type,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");

  return { success: true};
}

  // ==========================================
// Database Query
// ==========================================

const { data: budgetItems, error } = await supabase
  .from("budget_items")
  .select("*")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Error loading budget items:", error);
}

const items = budgetItems ?? [];

  // ==========================================
  // Prepare Data for the UI
  // Convert database records into the format
  // expected by the SummaryCard component.
  // ==========================================

  const cards =
    budgetItems?.map((item) => ({
      title: item.title ?? "Unknown",
      amount: Number(item.amount ?? 0),
    })) ?? [];

  

  // ==========================================
  // User Interface
  // Render the dashboard.
  // ==========================================

  return (
  <main className="min-h-screen bg-slate-50">
    {/* ==========================================
        Navigation
    ========================================== */}
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            KafoJimein
          </h1>

          <p className="text-sm text-slate-500">
            Family finance
          </p>
        </div>

        <LogoutButton />
      </div>
    </header>

    {/* ==========================================
        Dashboard
    ========================================== */}
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Page heading */}
      <section className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          Dashboard
        </p>

        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Your family finances
        </h2>

        <p className="mt-2 text-slate-500">
          Track income, expenses, and your current balance.
        </p>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <SummaryCard
            key={item.id}
            title={item.title}
            amount={item.amount}
            type={item.type}
          />
        ))}
      </section>

      {/* Main dashboard content */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Add transaction */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Add transaction
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add new income or expenses.
            </p>
          </div>

          <AddBudgetItemForm addBudgetItem={addBudgetItem} />
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent transactions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your latest financial activity.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {item.title}
                  </p>

                  <p className="text-sm capitalize text-slate-500">
                    {item.type}
                  </p>
                </div>

                <p
                  className={
                    item.type === "income"
                      ? "font-semibold text-emerald-600"
                      : "font-semibold text-rose-600"
                  }
                >
                  {item.type === "income" ? "+" : "-"}$
                  {Number(item.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </main>
);
}