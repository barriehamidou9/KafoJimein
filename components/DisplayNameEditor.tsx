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

import { updateMyDisplayName } from "@/app/actions/profiles";

type DisplayNameEditorProps = {
  initialDisplayName: string | null;
};

// "saved" fades out on its own after ~2 seconds.
type Status = "idle" | "saved";

export default function DisplayNameEditor({
  initialDisplayName,
}: DisplayNameEditorProps) {
  // ==========================================
  // State
  // ==========================================

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialDisplayName ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleStartEdit() {
    setInputValue(displayName ?? "");
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
      formData.set("display_name", inputValue);

      await updateMyDisplayName(formData);

      // Mirrors the server action's own trim-empty-to-null logic, so the
      // read-only view matches what was actually stored.
      const trimmed = inputValue.trim();
      setDisplayName(trimmed ? trimmed : null);

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
            htmlFor="display_name"
            className="text-sm font-medium text-slate-700"
          >
            Name
          </label>

          <input
            id="display_name"
            name="display_name"
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <p className="text-xs text-slate-500">
            Leave blank to show your email instead (in &quot;Paid by&quot;).
          </p>
        </div>

        {error && (
          <p className="text-sm font-medium text-rose-600">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50"
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
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
        <p className="text-slate-900">
          {displayName ?? (
            <span className="text-slate-400">No display name set</span>
          )}
        </p>

        {status === "saved" && (
          <p className="mt-1 text-sm font-medium text-emerald-600">Saved</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleStartEdit}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Edit
      </button>
    </div>
  );
}
