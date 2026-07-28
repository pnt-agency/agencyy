"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportAdminDataAction } from "@/app/actions";

function download(filename: string, csv: string) {
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * The CSV is now built by a server action rather than from rows handed to this
 * component as props. That's deliberate: it's the only way the export — the
 * largest single PII disclosure this app performs — can be attributed to an
 * admin and written to the audit log.
 */
export function ExportDataButton() {
  const [error, setError] = useState<string | null>(null);
  const [isExporting, startExport] = useTransition();

  function handleExport() {
    setError(null);
    startExport(async () => {
      const result = await exportAdminDataAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      download("talents.csv", result.talentCsv);
      download("employers.csv", result.employerCsv);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
        {isExporting ? "Preparing…" : "Export Data CSV"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
