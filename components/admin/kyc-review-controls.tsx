"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewKycAction } from "@/app/kyc-actions";
import { Check, X } from "lucide-react";

/**
 * Approve / reject controls for one submission.
 *
 * Rejection opens a note field and the server refuses an empty one — the note
 * is the entire message the talent receives, so "no" without a reason would
 * send them back to guess.
 */
export function KycReviewControls({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const review = (decision: "approve" | "reject") => {
    setError(null);
    startTransition(async () => {
      const result = await reviewKycAction({ userId, decision, note });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMode("idle");
      setNote("");
      router.refresh();
    });
  };

  // Approved and rejected submissions can still be reversed — an admin who
  // approved the wrong row needs a way back that doesn't involve the database.
  return (
    <div className="flex flex-col items-start gap-1.5 min-w-[140px]">
      {mode === "idle" ? (
        <div className="flex items-center gap-2">
          {/* Only the action that would change the current state is offered —
              re-approving an approved row would just re-send the notification. */}
          {status !== "Approved" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => review("approve")}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
          )}
          {status !== "Rejected" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMode("reject")}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          )}
        </div>
      ) : (
        <div className="w-full space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="What should the talent fix? They will see this."
            className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending || !note.trim()}
              onClick={() => review("reject")}
              className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
            >
              {isPending ? "Saving…" : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setNote("");
                setError(null);
              }}
              className="text-xs text-gray-500 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status !== "Pending" && mode === "idle" && (
        <span className="text-[11px] text-gray-400">Reviewed — you can change this.</span>
      )}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
