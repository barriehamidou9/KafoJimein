"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/households";

// ==========================================
// Next.js utilities
// ==========================================

import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export type BudgetItem = {
  id: string;
  user_id: string;
  household_id: string;
  title: string;
  amount: number;
  type: string;
  category_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

// ==========================================
// List transactions for the caller's household, most recent first.
// Excludes soft-deleted rows (deleted_at is not null).
// ==========================================

export async function getBudgetItems(): Promise<BudgetItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Server Action
// Create a new transaction. Returns the created row so the caller (a
// client component) can prepend it to local state without a page reload.
// ==========================================

export async function addBudgetItem(formData: FormData): Promise<BudgetItem> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const title = formData.get("title") as string;
  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as string;
  const rawCategoryId = formData.get("category_id") as string;
  const category_id = rawCategoryId ? rawCategoryId : null;

  const { data, error } = await supabase
    .from("budget_items")
    .insert({
      user_id: user.id,
      household_id: householdId,
      title,
      amount,
      type,
      category_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");

  return data;
}

// ==========================================
// Server Action
// Update an existing transaction's title/amount/type/category. This is a
// real UPDATE on the existing row (by id), not an insert — the row's id,
// user_id, household_id, and created_at are untouched.
//
// Household membership (any role) is enforced by RLS on budget_items —
// there's no admin restriction on this table, unlike categories/budgets,
// so nothing extra needs checking here.
// ==========================================

export async function updateBudgetItem(
  formData: FormData
): Promise<BudgetItem> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as string;
  const rawCategoryId = formData.get("category_id") as string;
  const category_id = rawCategoryId ? rawCategoryId : null;

  const { data, error } = await supabase
    .from("budget_items")
    .update({ title, amount, type, category_id })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");

  return data;
}

// ==========================================
// Server Action
// Soft-delete a transaction: sets deleted_at instead of removing the row.
// Same household-membership scoping (any role) as updateBudgetItem above —
// this is an UPDATE, covered by the same RLS policy that used to cover
// the hard DELETE it replaces.
// ==========================================

export async function deleteBudgetItem(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("budget_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}
