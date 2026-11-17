/**
 * Display helpers for KYC data.
 *
 * Kept out of the database layer so client components can use them without
 * pulling in Drizzle, and out of lib/r2.ts so a page doesn't need storage
 * configured just to render a masked ID.
 */

/** Shows only the last four characters of an ID number. */
export function maskIdNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const visible = trimmed.slice(-4);
  const hidden = Math.max(4, trimmed.length - visible.length);
  return `${"•".repeat(hidden)}${visible}`;
}

export function formatKycDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
