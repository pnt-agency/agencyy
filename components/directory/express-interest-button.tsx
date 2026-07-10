"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { expressInterest } from "@/app/actions";

export function ExpressInterestButton({ talentId }: { talentId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await expressInterest({ talentId, message });
      if (result.success) setSent(true);
      else setError(result.error);
    });
  };

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <p className="text-sm text-green-900">
          Interest sent. Our team will review it and make the introduction.
        </p>
      </div>
    );
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Express interest</Button>;
  }

  return (
    <div className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Optional: tell us which role you're hiring for and what you're looking for…"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Sending…" : "Send interest"}
        </Button>
        <Button variant="outline" onClick={() => { setOpen(false); setError(null); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
