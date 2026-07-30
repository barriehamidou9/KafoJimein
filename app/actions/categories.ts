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

export type Category = {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string | null;
  is_fixed: boolean;
  created_at: string;
};

// ==========================================
// List categories for the logged-in user.
// ==========================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Server Action
// Create a new category.
// ==========================================

export async function addCategory(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    household_id: householdId,
    name,
    type,
  });

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can create categories.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/categories");
}

// ==========================================
// Server Action
// Delete a category.
// ==========================================

export async function deleteCategory(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const id = formData.get("id") as string;

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/categories");
}
