"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/households";
import { isRlsRejection } from "@/lib/supabase/errors";

// ==========================================
// Server Actions
// Reused to join display names into getHouseholdIncome()'s result.
// ==========================================

import { getHouseholdMembers } from "@/app/actions/households";

// ==========================================
// Next.js utilities
// ==========================================

import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export type HouseholdIncome = {
  id: string;
  household_id: string;
  user_id: string;
  amount: number;
  updated_at: string;
};

export type HouseholdIncomeEntry = HouseholdIncome & {
  displayName: string;
};

// ==========================================
// List household income entries, joined with each person's display name
// via household_members_display (getHouseholdMembers()). Only returns
// rows that actually exist — a member with no income set yet won't
// appear here; callers reconcile against the full household_members
// roster themselves, the same way the budgets page does against expense
// categories.
// ==========================================

export async function getHouseholdIncome(): Promise<HouseholdIncomeEntry[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const [{ data, error }, members] = await Promise.all([
    supabase.from("household_income").select("*"),
    getHouseholdMembers(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const displayNameByUserId = new Map(
    members.map((member) => [member.userId, member.displayName])
  );

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    displayName: displayNameByUserId.get(row.user_id) ?? "Unknown",
  }));
}

// ==========================================
// Server Action
// Create or update a household member's income (one per person, one per
// household). Admin-only, enforced by RLS — same clear-error-message
// pattern used for budgets/categories.
// ==========================================

export async function upsertHouseholdIncome(
  formData: FormData
): Promise<HouseholdIncome> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const targetUserId = formData.get("user_id") as string;
  const amount = Number(formData.get("amount"));

  const { data, error } = await supabase
    .from("household_income")
    .upsert(
      {
        household_id: householdId,
        user_id: targetUserId,
        amount,
      },
      { onConflict: "household_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can set household income.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/budgets");

  return data;
}
