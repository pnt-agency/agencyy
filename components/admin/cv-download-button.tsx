"use client";

import { useState, useTransition } from "react";
import { Download, ExternalLink } from "lucide-react";
import { getCvDownloadUrlAction } from "@/app/upload-actions";

/**
 * Fetches a fresh presigned link at click time rather than rendering one into
 * the page. Two reasons: the link is only valid for 60 seconds, so a rendered
 * one would be stale by the time anyone clicked it; and it means the download
 * is audit-logged per click, not per page view.
 */
export function CvDownloadButton({
  talentId,
  filename,
  cvLink,
}: {
  talentId: string;
  filename: string | null;
  cvLink: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // No uploaded file — fall back to whatever link the applicant supplied.
  if (!filename) {
    return cvLink ? (
      <a
        href={cvLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        CV link
      </a>
    ) : (
      <span className="text-xs text-gray-300">—</span>
    );
  }

  const handleDownload = () => {
    setError(null);
    startTransition(async () => {
      const result = await getCvDownloadUrlAction(talentId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Navigating rather than opening a tab: the object comes back with an
      // attachment disposition, so the browser downloads it and stays put.
      window.location.href = result.url;
    });
  };

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onClick={handleDownload}
        disabled={isPending}
        title={filename}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        {isPending ? "Preparing…" : "CV"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
