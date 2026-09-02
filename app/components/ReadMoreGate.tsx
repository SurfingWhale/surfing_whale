// app/components/ReadMoreGate.tsx
// The gate sits partway through the story rather than in front of it. A
// visitor reads the opening, decides it is worth their time, and only then is
// asked for an email — which is both a better trade for them and a far better
// signal for whoever is collecting the addresses.
"use client";

import { useState } from "react";
import { useAccess } from "./AccessGate";
import type { AccessReason } from "@/app/lib/accessRequests";

// Same underline as the dialog's fields, so the two gates look like one gate.
const FIELD =
  "bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200";

export function ReadMoreGate({ reason }: { reason: AccessReason }) {
  const { grantAccess, gate } = useAccess();
  const asking = gate === "approval";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, message, reason, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to send. Try again in a moment.");
        setSending(false);
        return;
      }
      if (data.pending) {
        setSent(true);
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
        {sent ? (
          <>
            <p className="text-[13px] leading-[2] text-fg">Asked. Now it is on me.</p>
            <p className="text-[13px] leading-[2] text-fg-body max-w-[440px]">
              I read every one of these myself, so it is a person deciding, not a
              queue. When I open it you will get a link at{" "}
              <span className="font-mono text-fg break-all">{email}</span> — the
              link is yours, and it keeps working.
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-[2] text-fg">
              {asking ? "The rest of this one is on request." : "There is more to this one."}
            </p>
            <p className="text-[13px] leading-[2] text-fg-body max-w-[440px]">
              {asking
                ? "Some of this is client work, so I open it one person at a time. Tell me who you are and I will send you a link — usually the same day."
                : "Leave an email to read the rest. It is only so I know who stopped by — never shown publicly, never shared, never added to a mailing list."}
            </p>

            {asking && (
              <div className="flex flex-wrap gap-4 mt-1 max-w-[440px]">
                <input
                  type="text"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="name"
                  className={`${FIELD} flex-1 min-w-[200px]`}
                />
                <textarea
                  value={message}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Where you found this, and what you are looking for"
                  aria-label="Why you are asking"
                  className={`${FIELD} w-full resize-none`}
                />
              </div>
            )}

            <div className="flex flex-wrap items-end gap-4 mt-5 max-w-[440px]">
              <input
                type="email"
                value={email}
                maxLength={254}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && email && !asking) submit(); }}
                placeholder="you@example.com"
                aria-label="Your email"
                autoComplete="email"
                className={`${FIELD} flex-1 min-w-[200px]`}
              />
              <button
                onClick={submit}
                disabled={!email || sending}
                className="text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed"
              >
                {sending ? (asking ? "Sending…" : "Opening…") : asking ? "Ask for access →" : "Keep reading →"}
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
          </>
        )}
      </div>
    </div>
  );
}
