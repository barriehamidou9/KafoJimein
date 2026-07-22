import { createClient } from "@/lib/supabase/server";

// Categories/budget_items/budgets are scoped to the caller's household.
// There's no UI yet for belonging to more than one household, so this takes
// the first membership.
export async function getHouseholdId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("You are not a member of any household yet.");
  }

  return data.household_id;
}
