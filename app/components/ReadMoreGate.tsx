// app/components/ReadMoreGate.tsx
// The gate sits partway through the story rather than in front of it. A
// visitor reads the opening, decides it is worth their time, and only then is
// asked for an email — which is both a better trade for them and a far better
// signal for whoever is collecting the addresses.
"use client";

import { useState } from "react";
import { useAccess } from "./AccessGate";
import type { AccessReason } from "@/app/lib/accessRequests";

export function ReadMoreGate({ reason }: { reason: AccessReason }) {
  const { grantAccess } = useAccess();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to send. Try again in a moment.");
        setSending(false);
        return;
      }
      grantAccess();
    } catch {
      setError("Could not reach the server.");
      setSending(false);
    }
  };

  return (
    <div className="relative">
      {/* Fades the last visible lines into the gate so the cut reads as the
          text trailing off rather than being chopped. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="relative border-t border-border pt-8">
        <p className="text-[13px] leading-[2] text-fg">
          There is more to this one.
        </p>
        <p className="text-[13px] leading-[2] text-fg-body max-w-[440px]">
          Leave an email to read the rest. It is only so I know who stopped by —
          never shown publicly, never shared, never added to a mailing list.
        </p>

        <div className="flex flex-wrap items-end gap-4 mt-5 max-w-[440px]">
          <input
            type="email"
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && email) submit(); }}
            placeholder="you@example.com"
            aria-label="Your email"
            autoComplete="email"
            className="flex-1 min-w-[200px] bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200"
          />
          <button
            onClick={submit}
            disabled={!email || sending}
            className="text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed"
          >
            {sending ? "Opening…" : "Keep reading →"}
          </button>
        </div>

        {/* Honeypot — hidden from people, tempting to bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
        />

        {error && (
          <p role="alert" className="text-[13px] text-fg mt-3">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
