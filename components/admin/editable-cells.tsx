"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateTalentDetails, updateEmployerDetails } from "@/app/actions";

type Kind = "talent" | "employer";

function save(kind: Kind, id: string, patch: { notes?: string; followUpDate?: string }) {
  return kind === "talent"
    ? updateTalentDetails(id, patch)
    : updateEmployerDetails(id, patch);
}

export function EditableFollowUp({
  id,
  kind,
  initial,
}: {
  id: string;
  kind: Kind;
  initial: string; // YYYY-MM-DD or ""
}) {
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function commit(next: string) {
    setValue(next);
    setError(false);
    startTransition(async () => {
      const result = await save(kind, id, { followUpDate: next });
      if (!result.success) setError(true);
    });
  }

  return (
    <input
      type="date"
      value={value}
      disabled={isPending}
      onChange={(e) => commit(e.target.value)}
      className={`rounded-md border px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 ${
        error ? "border-red-400" : "border-gray-200"
      }`}
    />
  );
}

export function EditableNotes({
  id,
  kind,
  initial,
}: {
  id: string;
  kind: Kind;
  initial: string;
}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit() {
    setError(null);
    startTransition(async () => {
      const result = await save(kind, id, { notes: draft });
      if (result.success) {
        setSaved(draft);
        setEditing(false);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2 max-w-[220px]">
        <span className="text-gray-600 truncate">{saved || "-"}</span>
        <button
          type="button"
          onClick={() => { setDraft(saved); setEditing(true); }}
          className="text-gray-400 hover:text-black shrink-0"
          aria-label="Edit notes"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[220px]">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        autoFocus
        className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
      />
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={commit}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setError(null); }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
