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

export type Budget = {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
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
// ==========================================

export async function upsertBudget(formData: FormData): Promise<void> {
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

  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: householdId,
      category_id: categoryId,
      amount,
    },
    { onConflict: "household_id,category_id" }
  );

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can set budgets.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/budgets");
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
