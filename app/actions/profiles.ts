"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Next.js utilities
// ==========================================

import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export type Profile = {
  displayName: string | null;
};

// ==========================================
// The caller's own profile. No row exists until they've saved a display
// name at least once, so this returns null rather than throwing in that
// case.
// ==========================================

export async function getMyProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { displayName: data?.display_name ?? null };
}

// ==========================================
// Server Action
// Set (or clear) the caller's own display name. An empty submission is
// stored as null, not an empty string, so household_members_display's
// coalesce() falls back to email as intended rather than showing a blank.
// ==========================================

export async function updateMyDisplayName(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const rawDisplayName = formData.get("display_name") as string;
  const display_name = rawDisplayName.trim() ? rawDisplayName.trim() : null;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
  revalidatePath("/");
}
