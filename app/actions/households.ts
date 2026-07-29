"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Types
// ==========================================

export type HouseholdRole = "admin" | "member";

export type HouseholdMember = {
  userId: string;
  displayName: string;
};

// ==========================================
// The current user's role in their household. There's no UI yet for
// belonging to more than one household, so this takes the first
// membership — same assumption getHouseholdId() makes.
// ==========================================

export async function getCurrentUserRole(): Promise<HouseholdRole> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("You are not a member of any household yet.");
  }

  return data.role as HouseholdRole;
}

// ==========================================
// List the caller's household members as { userId, displayName }, for
// things like a "Paid by" dropdown. Reads from the
// household_members_display view (see migration 0010), which already
// falls back to email when a member hasn't set a display name, and
// already scopes rows to the caller's own household — no extra
// filtering needed here.
// ==========================================

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("household_members_display")
    .select("user_id, display_name")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
  }));
}
