"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/households";
import { isRlsRejection } from "@/lib/supabase/errors";

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

// ==========================================
// Server Action
// Permanently (hard) delete a single already-soft-deleted transaction.
// Irreversible, no undo.
//
// The .eq("deleted_at is not null") + admin-role check is enforced by
// the "Household admins can permanently delete already-deleted budget
// items" RLS policy (migration 0019) — that's the real security
// boundary, not this function. A non-admin, or an attempt to target a
// still-live row, is rejected by the database itself: the DELETE simply
// matches zero rows rather than throwing, so no separate check is done
// here beyond surfacing an RLS rejection if one occurs.
// ==========================================

export async function permanentlyDeleteBudgetItem(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase.from("budget_items").delete().eq("id", id);

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error(
        "Only household admins can permanently delete transactions."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/deleted");
}

// ==========================================
// Server Action
// Permanently (hard) delete every soft-deleted transaction in the
// caller's household — not just the ones currently shown on the Deleted
// page (that list is limited to the last 30 days; this clears all of
// them, regardless of age). Irreversible, no undo.
//
// Same RLS policy as permanentlyDeleteBudgetItem enforces admin-only +
// deleted_at is not null + household scoping — the .not(...) filter here
// is belt-and-suspenders, not the actual security boundary.
// ==========================================

export async function clearAllDeletedBudgetItems(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .not("deleted_at", "is", null);

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error(
        "Only household admins can permanently delete transactions."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/deleted");
}
