"use client";

import { Button } from "@/components/ui/button";
import type { TalentRow, EmployerRow } from "@/lib/db/schema";

// Serialize a single CSV cell: wrap in quotes and double any embedded quotes so
// commas, newlines, and quotes in free-text fields (bio, notes) can't break the row.
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

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

export function ExportDataButton({
  talents,
  employers,
}: {
  talents: TalentRow[];
  employers: EmployerRow[];
}) {
  function handleExport() {
    const talentCsv = toCsv(
      ["Name", "Email", "Phone", "Country", "Role", "Experience", "Portfolio", "CV Link", "Status", "Follow-up", "Notes", "Created"],
      talents.map((t) => [
        t.name, t.email, t.phone, t.country, t.role, t.experience,
        t.portfolio, t.cvLink, t.status, t.followUpDate, t.notes, t.createdAt,
      ])
    );

    const employerCsv = toCsv(
      ["Company", "Contact", "Email", "Phone", "Country", "Role Needed", "Number Needed", "Budget", "Start Date", "Requirements", "Status", "Follow-up", "Notes", "Created"],
      employers.map((e) => [
        e.companyName, e.contactName, e.email, e.phone, e.country, e.roleNeeded,
        e.numberNeeded, e.budget, e.startDate, e.requirements, e.status,
        e.followUpDate, e.notes, e.createdAt,
      ])
    );

    download("talents.csv", talentCsv);
    download("employers.csv", employerCsv);
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      Export Data CSV
    </Button>
  );
}
