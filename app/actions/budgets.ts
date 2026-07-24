"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/households";
import { isRlsRejection } from "@/lib/supabase/errors";

// ==========================================
// Server Actions
// Reused by getBudgetOverview() instead of re-deriving categories/items.
// ==========================================

import { getCategories } from "@/app/actions/categories";
import { getBudgetItems } from "@/app/actions/budgetItems";

// ==========================================
// Shared aggregation logic (also used client-side by DashboardManager, so
// both the initial server-rendered value and later client recomputes
// agree exactly).
// ==========================================

import { computeBudgetOverview } from "@/lib/budgetOverview";

// ==========================================
// Next.js utilities
// ==========================================

import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export type Budget = {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type BudgetOverviewItem = {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
};

// ==========================================
// List budgets for the caller's household.
// RLS already scopes rows to households the caller belongs to.
// ==========================================

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase.from("budgets").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Server Action
// Create or update the budget for a category (one per category).
// Returns the saved row so the caller (a client component) can update its
// local state — e.g. learn the new budget's id — without a page reload.
// ==========================================

export async function upsertBudget(formData: FormData): Promise<Budget> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const categoryId = formData.get("category_id") as string;
  const amount = Number(formData.get("amount"));

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        household_id: householdId,
        category_id: categoryId,
        amount,
      },
      { onConflict: "household_id,category_id" }
    )
    .select()
    .single();

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can set budgets.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/budgets");

  return data;
}

// ==========================================
// Server Action
// Delete a budget.
// ==========================================

export async function deleteBudget(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const id = formData.get("id") as string;

  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can delete budgets.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/budgets");
}

// ==========================================
// Budget vs. actual spending for the current calendar month, for every
// expense category that has a budget set. Reuses getBudgets(),
// getCategories(), and getBudgetItems() rather than re-deriving household
// data or duplicating the aggregation logic — the same computeBudgetOverview()
// is also called client-side (DashboardManager) so both agree exactly.
// ==========================================

export async function getBudgetOverview(): Promise<BudgetOverviewItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const [categories, budgets, items] = await Promise.all([
    getCategories(),
    getBudgets(),
    getBudgetItems(),
  ]);

  return computeBudgetOverview(items, budgets, categories);
}
