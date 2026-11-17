"use client";

import { useState, useTransition } from "react";
import { getKycDocumentUrlAction } from "@/app/kyc-actions";
import { Download, ExternalLink } from "lucide-react";

/**
 * Fetches a fresh, audit-logged link at click time — the same reasoning as the
 * CV button: a 60-second URL rendered into the page would be stale by the time
 * anyone clicked it, and viewing an identity document should be recorded as its
 * own event.
 */
export function KycDocumentButton({
  userId,
  kind,
  filename,
}: {
  userId: string;
  kind: "id" | "selfie";
  filename: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    startTransition(async () => {
      const result = await getKycDocumentUrlAction(userId, kind);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Attachment disposition: the browser downloads and stays put.
      window.location.href = result.url;
    });
  };

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onClick={handleOpen}
        disabled={isPending}
        title={filename}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black disabled:opacity-50 cursor-pointer"
      >
        {kind === "id" ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
        {isPending ? "Preparing…" : kind === "id" ? "ID" : "Selfie"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
