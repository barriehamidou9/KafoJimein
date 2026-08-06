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
// The caller's household's own name (e.g. "My Household"), for the
// dashboard's small preamble line. "Household members can view their
// household" (0003) already scopes this to households the caller
// actually belongs to.
// ==========================================

export async function getHouseholdName(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const { data, error } = await supabase
    .from("households")
    .select("name")
    .eq("id", householdId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.name;
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

// ==========================================
// The caller's household's current savings_reminder_day (see migration
// 0021), for prefilling the settings page control. Same scoping as
// getHouseholdName.
// ==========================================

export async function getSavingsReminderDay(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const { data, error } = await supabase
    .from("households")
    .select("savings_reminder_day")
    .eq("id", householdId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.savings_reminder_day;
}

// ==========================================
// Server Action
// Set the caller's household's savings_reminder_day (see migration 0021).
// Validated here rather than left to the DB check constraint, so a bad
// value fails with a clear message instead of a raw Postgres error. Any
// member can change it — "Household members can update their household"
// (0003) already allows this, no admin check needed.
// ==========================================

export async function updateSavingsReminderDay(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const rawDay = formData.get("savings_reminder_day") as string;
  const day = Number(rawDay);

  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new Error("Savings reminder day must be a whole number between 1 and 28.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const { error } = await supabase
    .from("households")
    .update({ savings_reminder_day: day })
    .eq("id", householdId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/settings");
}
