"use client";

import { useState, useTransition } from "react";
import { setUserRoleAction } from "@/app/actions";
import { ASSIGNABLE_ACCOUNT_ROLES } from "@/lib/roles";

export function RoleSelector({
  userId,
  initial,
  disabled = false,
  disabledReason,
}: {
  userId: string;
  initial: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [role, setRole] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: string) {
    if (next === role) return;
    const previous = role;
    setError(null);
    setRole(next); // optimistic
    startTransition(async () => {
      const result = await setUserRoleAction(userId, next);
      if (!result.success) {
        setRole(previous); // revert
        setError(result.error ?? "Failed to update.");
      }
    });
  }

  if (disabled) {
    return (
      <span className="text-sm text-gray-400" title={disabledReason}>
        {initial}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <select
        value={role}
        onChange={(e) => change(e.target.value)}
        disabled={isPending}
        aria-label="Account role"
        className={`rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        {/* A transient "user" is not assignable, but an account can currently
            hold it — keep it selectable-as-current so the value shown is true. */}
        {!(ASSIGNABLE_ACCOUNT_ROLES as readonly string[]).includes(role) && (
          <option value={role}>{role}</option>
        )}
        {ASSIGNABLE_ACCOUNT_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
