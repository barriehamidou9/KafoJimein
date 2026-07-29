"use server";

// ==========================================
// Supabase
// ==========================================

import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/households";
import { isRlsRejection } from "@/lib/supabase/errors";

// ==========================================
// Household config
// ==========================================

import { HOUSEHOLD_TIME_ZONE, getHouseholdToday } from "@/lib/household";

// ==========================================
// Types
// Only the return shape of confirmRecurringExpense — type-only import,
// doesn't pull in budgetItems.ts's own server actions.
// ==========================================

import type { BudgetItem } from "@/app/actions/budgetItems";

// ==========================================
// Next.js utilities
// ==========================================

import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export type RecurringExpense = {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  paid_by: string;
  day_of_month: number;
  last_confirmed_year: number | null;
  last_confirmed_month: number | null;
  created_at: string;
  updated_at: string;
};

// ==========================================
// List recurring expense templates for the caller's household.
// RLS already scopes rows to households the caller belongs to.
// ==========================================

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .order("day_of_month", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Server Action
// Create or update a recurring expense template. There's no natural
// unique constraint to hang a Postgres upsert off (a household can have
// several templates in the same category), so this branches manually:
// an "id" field present in formData means update that row, absent means
// insert a new one. Admin-only, enforced by RLS — same clear-error
// pattern used for budgets/categories/income.
// ==========================================

export async function upsertRecurringExpense(
  formData: FormData
): Promise<RecurringExpense> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const householdId = await getHouseholdId(supabase, user.id);

  const rawId = formData.get("id") as string;
  const category_id = formData.get("category_id") as string;
  const amount = Number(formData.get("amount"));
  const paid_by = formData.get("paid_by") as string;
  const day_of_month = Number(formData.get("day_of_month"));

  const payload = {
    household_id: householdId,
    category_id,
    amount,
    paid_by,
    day_of_month,
  };

  const { data, error } = rawId
    ? await supabase
        .from("recurring_expenses")
        .update(payload)
        .eq("id", rawId)
        .select()
        .single()
    : await supabase
        .from("recurring_expenses")
        .insert(payload)
        .select()
        .single();

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can manage recurring expenses.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/recurring");

  return data;
}

// ==========================================
// Server Action
// Delete a recurring expense template. Admin-only, enforced by RLS.
// ==========================================

export async function deleteRecurringExpense(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);

  if (error) {
    if (isRlsRejection(error)) {
      throw new Error("Only household admins can manage recurring expenses.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/recurring");
}

// ==========================================
// Recurring expenses that are "due" right now: last_confirmed_year/month
// isn't the current household-timezone period (never confirmed counts as
// not-this-period), AND today's household-timezone day-of-month has
// reached or passed the template's day_of_month. Filters in JS over
// getRecurringExpenses() rather than a separate query — same approach
// computeBudgetOverview takes, reasonable for a household's small amount
// of data.
// ==========================================

export async function getDueRecurringExpenses(): Promise<RecurringExpense[]> {
  const expenses = await getRecurringExpenses();

  const { year, month, day } = getHouseholdToday(HOUSEHOLD_TIME_ZONE);

  return expenses.filter((expense) => {
    const alreadyConfirmedThisPeriod =
      expense.last_confirmed_year === year &&
      expense.last_confirmed_month === month;

    if (alreadyConfirmedThisPeriod) {
      return false;
    }

    return day >= expense.day_of_month;
  });
}

// ==========================================
// Server Action
// Confirm a due recurring expense: creates the actual transaction, rolls
// the template's amount forward to whatever was confirmed (which may
// differ from the stored amount if edited), and stamps
// last_confirmed_year/month to the current period. Any household member
// can call this (see migration 0015's confirm_recurring_expense — a
// SECURITY DEFINER function, since recurring_expenses' own RLS would
// otherwise restrict this write to admins).
// ==========================================

export async function confirmRecurringExpense(
  id: string,
  amount: number
): Promise<BudgetItem> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { year, month } = getHouseholdToday(HOUSEHOLD_TIME_ZONE);

  const { data, error } = await supabase.rpc("confirm_recurring_expense", {
    p_recurring_expense_id: id,
    p_amount: amount,
    p_year: year,
    p_month: month,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/recurring");

  return data as BudgetItem;
}

// ==========================================
// Server Action
// Skip a due recurring expense for this period, without creating a
// transaction — just stamps last_confirmed_year/month forward. Same
// any-member scoping as confirmRecurringExpense, via migration 0015's
// skip_recurring_expense.
// ==========================================

export async function skipRecurringExpense(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { year, month } = getHouseholdToday(HOUSEHOLD_TIME_ZONE);

  const { error } = await supabase.rpc("skip_recurring_expense", {
    p_recurring_expense_id: id,
    p_year: year,
    p_month: month,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/recurring");
}
