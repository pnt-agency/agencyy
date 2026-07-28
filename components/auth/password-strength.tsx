"use client";

import { useMemo } from "react";
import { evaluatePassword } from "@/lib/password";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

// Four segments for scores 1-4; a score of 0 lights the first segment red so
// "very weak" still reads as feedback rather than as an empty, unresponsive bar.
const SEGMENT_COLORS = ["bg-red-500", "bg-red-500", "bg-orange-400", "bg-lime-400", "bg-green-500"];
const LABEL_COLORS = [
  "text-red-400",
  "text-red-400",
  "text-orange-400",
  "text-lime-400",
  "text-green-400",
];
const LABEL_COLORS_LIGHT = [
  "text-red-600",
  "text-red-600",
  "text-orange-600",
  "text-lime-600",
  "text-green-600",
];

export function PasswordStrength({
  password,
  email,
  name,
  tone = "dark",
}: {
  password: string;
  email?: string;
  name?: string;
  tone?: Tone;
}) {
  const { score, label, suggestions } = useMemo(
    () => evaluatePassword(password, { email, name }),
    [password, email, name]
  );

  if (!password) return null;

  const isDark = tone === "dark";
  const filled = Math.max(score, 1);

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 flex-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index < filled
                  ? SEGMENT_COLORS[score]
                  : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-semibold shrink-0",
            (isDark ? LABEL_COLORS : LABEL_COLORS_LIGHT)[score]
          )}
        >
          {label}
        </span>
      </div>

      {suggestions.length > 0 && (
        <ul className={cn("mt-2 space-y-1 text-xs", isDark ? "text-white/50" : "text-gray-500")}>
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="flex gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
