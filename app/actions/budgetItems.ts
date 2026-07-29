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
  paid_by: string | null;
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

  // Defaults to whoever is logged in if the form didn't specify a payer.
  const rawPaidBy = formData.get("paid_by") as string;
  const paid_by = rawPaidBy ? rawPaidBy : user.id;

  const { data, error } = await supabase
    .from("budget_items")
    .insert({
      user_id: user.id,
      household_id: householdId,
      title,
      amount,
      type,
      category_id,
      paid_by,
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
// Update an existing transaction's title/amount/type/category/paid_by.
// This is a real UPDATE on the existing row (by id), not an insert — the
// row's id, user_id, household_id, and created_at are untouched.
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
  const paid_by = formData.get("paid_by") as string;

  const { data, error } = await supabase
    .from("budget_items")
    .update({ title, amount, type, category_id, paid_by })
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

// ==========================================
// List transactions soft-deleted within the last 30 days, most recently
// deleted first. RLS scopes rows to the caller's household the same way
// getBudgetItems() does.
// ==========================================

export async function getDeletedBudgetItems(): Promise<BudgetItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  // A rolling 30-day window, not a calendar boundary — a plain UTC instant
  // is unambiguous here, unlike "current month" (see lib/household.ts),
  // so no timezone handling is needed.
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .not("deleted_at", "is", null)
    .gte("deleted_at", thirtyDaysAgo)
    .order("deleted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Server Action
// Restore a soft-deleted transaction (sets deleted_at back to null).
// Household membership (any role) is enforced by RLS, matching delete
// permissions. The deleted_at is not null guard mirrors the is null guard
// updateBudgetItem uses — restoring a row that isn't currently deleted
// isn't a valid call, so it fails outright rather than silently no-op'ing.
// ==========================================

export async function restoreBudgetItem(id: string): Promise<BudgetItem> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("budget_items")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/deleted");
  revalidatePath("/");

  return data;
}
