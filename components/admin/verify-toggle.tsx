"use client";

import { useState, useTransition } from "react";
import { setTalentVerifiedAction } from "@/app/actions";

export function VerifyToggle({ userId, initial }: { userId: string; initial: boolean }) {
  const [verified, setVerified] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    const next = !verified;
    setError(false);
    setVerified(next); // optimistic
    startTransition(async () => {
      const result = await setTalentVerifiedAction(userId, next);
      if (!result.success) {
        setVerified(!next); // revert
        setError(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={verified}
      className={`inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        verified ? "bg-green-600" : "bg-gray-300"
      } ${error ? "ring-2 ring-red-400" : ""}`}
      title={verified ? "Listed — click to unlist" : "Not listed — click to verify & list"}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          verified ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
