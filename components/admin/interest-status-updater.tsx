"use client";

import { useState, useTransition } from "react";
import { updateInterestStatusAction } from "@/app/actions";

const INTEREST_STATUSES = ["Pending", "Intro Made", "Closed"] as const;
type InterestStatus = (typeof INTEREST_STATUSES)[number];

export function InterestStatusUpdater({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: InterestStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(status: InterestStatus) {
    setOpen(false);
    if (status === currentStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await updateInterestStatusAction(id, status);
      if (!result.success) {
        setError(result.error ?? "Failed to update status.");
      }
    });
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="text-gold font-medium hover:underline disabled:opacity-50 disabled:cursor-wait"
      >
        {isPending ? "Updating..." : "Update"}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
          <ul className="py-1 text-left">
            {INTEREST_STATUSES.map((status) => (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => handleSelect(status)}
                  className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 ${
                    status === currentStatus ? "font-semibold text-navy" : "text-gray-700"
                  }`}
                >
                  {status}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
