"use client";

// ==========================================
// React
// Toggles between a read-only view and an edit
// form, with a brief "Saved" confirmation on success.
// ==========================================

import { useState } from "react";

// ==========================================
// Server Actions
// Called directly (not bound to a <form action>) so we can update local
// state and show the confirmation without a page reload.
// ==========================================

import { updateSavingsReminderDay } from "@/app/actions/households";

type SavingsReminderEditorProps = {
  initialDay: number;
};

// "saved" fades out on its own after ~2 seconds.
type Status = "idle" | "saved";

export default function SavingsReminderEditor({
  initialDay,
}: SavingsReminderEditorProps) {
  // ==========================================
  // State
  // ==========================================

  const [day, setDay] = useState(initialDay);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(initialDay));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleStartEdit() {
    setInputValue(String(day));
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError(null);
  }

  // ==========================================
  // Handlers
  // ==========================================

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("savings_reminder_day", inputValue);

      await updateSavingsReminderDay(formData);

      const parsed = Number(inputValue);
      setDay(parsed);

      setIsEditing(false);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // User Interface
  // Edit mode
  // ==========================================

  if (isEditing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="savings_reminder_day"
            className="text-sm font-medium text-secondary"
          >
            Remind us to save from day
          </label>

          <input
            id="savings_reminder_day"
            name="savings_reminder_day"
            type="number"
            min={1}
            max={28}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
          />

          <p className="text-xs text-secondary">
            Day of each month, 1-28, that the dashboard should start showing
            the savings reminder.
          </p>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-xl bg-accent px-4 py-3 font-semibold text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="min-h-11 rounded-xl border border-border px-4 py-3 font-semibold text-secondary transition hover:bg-surface-track disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // ==========================================
  // User Interface
  // Read-only view
  // ==========================================

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-primary">Day {day} of each month</p>

        {status === "saved" && (
          <p className="mt-1 text-sm font-medium text-accent-deep">Saved</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleStartEdit}
        className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-surface-track"
      >
        Edit
      </button>
    </div>
  );
}
