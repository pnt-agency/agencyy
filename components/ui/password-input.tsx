"use client";

import { useId, useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Password field with a reveal toggle. The two surfaces that ask for a password
 * sit on opposite backgrounds — the sign-in screen is dark, the reset-password
 * card is light — so the palette is a prop rather than a fork of the component.
 */
type Tone = "dark" | "light";

const TONES: Record<Tone, { input: string; icon: string; toggle: string }> = {
  dark: {
    input:
      "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-gold/40 focus:border-gold/50",
    icon: "text-white/40",
    toggle: "text-white/40 hover:text-white focus-visible:ring-gold/60",
  },
  light: {
    input:
      "bg-gray-50 focus:bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-black",
    icon: "text-gray-400",
    toggle: "text-gray-400 hover:text-black focus-visible:ring-black",
  },
};

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  tone?: Tone;
};

export function PasswordInput({
  tone = "dark",
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const palette = TONES[tone];

  return (
    <div className="relative">
      <KeyRound
        aria-hidden="true"
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none",
          palette.icon
        )}
      />
      <input
        {...props}
        id={inputId}
        // Toggling the type is what actually reveals the value; the icon just
        // reflects it.
        type={revealed ? "text" : "password"}
        className={cn(
          "w-full pl-12 pr-12 py-3.5 border rounded-xl transition-all focus:outline-none focus:ring-2",
          palette.input,
          className
        )}
      />
      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        // aria-controls + aria-pressed tell a screen reader what this toggles
        // and which way it currently sits; the label alone wouldn't.
        aria-controls={inputId}
        aria-pressed={revealed}
        aria-label={revealed ? "Hide password" : "Show password"}
        title={revealed ? "Hide password" : "Show password"}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2",
          palette.toggle
        )}
      >
        {revealed ? (
          <EyeOff aria-hidden="true" className="w-5 h-5" />
        ) : (
          <Eye aria-hidden="true" className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
