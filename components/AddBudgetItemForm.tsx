"use client";

// ==========================================
// React
// ==========================================

// Manage the form input values.
import { useState } from "react";

// ==========================================
// Props
// ==========================================

// Server Action received from page.tsx.
type AddBudgetItemFormProps = {
  addBudgetItem: (
    formData: FormData
  ) => Promise<{ success: boolean }>;
};

export default function AddBudgetItemForm({
  addBudgetItem,
}: AddBudgetItemFormProps) {

  // ==========================================
  // Form State
  // Store the user's input while typing.
  // ==========================================

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  async function handleSubmit(formData: FormData) {
  console.log("Form handler started");

  const result = await addBudgetItem(formData);

  console.log("Server response:", result);

  if (result.success){

    setTitle("");
    setAmount("");
    setType("expense");
  }
}

  // ==========================================
  // User Interface
  // Display the budget entry form.
  // ==========================================

    // ==========================================
  // User Interface
  // Display the transaction entry form.
  // ==========================================

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-5"
    >
      {/* ==========================================
          Transaction Title
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="title"
          className="text-sm font-medium text-slate-700"
        >
          Title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          placeholder="Example: Groceries"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        />
      </div>

      {/* ==========================================
          Transaction Amount
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="amount"
          className="text-sm font-medium text-slate-700"
        >
          Amount
        </label>

        <input
          id="amount"
          name="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* ==========================================
          Transaction Type
      ========================================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="type"
          className="text-sm font-medium text-slate-700"
        >
          Type
        </label>

        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {/* ==========================================
          Submit Button
      ========================================== */}

      <button
        type="submit"
        className="mt-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        Add transaction
      </button>
    </form>
  );
}