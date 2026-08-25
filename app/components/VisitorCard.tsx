// app/components/VisitorCard.tsx
// Arrives once someone is far enough down to have actually read something.
// Asking on arrival is a stranger asking for your name at the door; asking
// halfway through is asking someone who stayed.
//
// Carries the same liquid glass as the nav, and remembers a dismissal so it
// does not greet the same person twice.
"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "sw-visitor-card";
const QUIET_DAYS = 30;
const APPEAR_AT = 0.42;

const field =
  "w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 " +
  "text-[13px] leading-[1.9] text-fg placeholder:text-fg-muted " +
  "focus:outline-none focus:border-fg transition-colors duration-200";

function seenRecently(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < QUIET_DAYS * 864e5;
  } catch {
    // Private windows throw on access; treat that as "never seen".
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

export function VisitorCard() {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [form, setForm] = useState({ name: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const armed = useRef(true);

  useEffect(() => {
    if (seenRecently()) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= APPEAR_AT && armed.current) {
        armed.current = false;
        setShown(true);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = () => {
    remember();
    setLeaving(true);
    window.setTimeout(() => setShown(false), 320);
  };

  const send = async () => {
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/guest-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("idle");
        return;
      }
      setState("sent");
      remember();
      window.setTimeout(close, 3200);
    } catch {
      setError("Could not reach the server.");
      setState("idle");
    }
  };

  if (!shown) return null;

  const ready = form.name.trim() && form.message.trim() && state !== "sending";

  return (
    <aside
      aria-label="Leave a note"
      className={`fixed z-40 glass glass-panel rounded-[20px] p-5
        left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[310px]
        transition-[opacity,transform] duration-[380ms]
        ease-[cubic-bezier(0.34,1.24,0.64,1)] motion-reduce:transition-none
        ${leaving ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
            Guest notes
          </p>
          <button
            onClick={close}
            aria-label="Dismiss"
            className="-mt-1 -mr-1 p-1 text-fg-muted hover:text-fg transition-colors duration-200"
          >
            <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 stroke-current stroke-[1.5] [stroke-linecap:round]" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {state === "sent" ? (
          <p className="text-[13px] leading-[2] text-fg mt-2">
            Thank you — I read every one.
          </p>
        ) : (
          <>
            <p className="text-[13px] leading-[1.9] text-fg-body mt-1.5">
              Passing through? Leave a note.
            </p>

            <div className="mt-3 space-y-2.5">
              <input
                value={form.name}
                maxLength={50}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                aria-label="Your name"
                className={field}
              />
              <textarea
                value={form.message}
                maxLength={500}
                rows={2}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ready) send();
                }}
                placeholder="Say hello…"
                aria-label="Your note"
                className={`${field} resize-none`}
              />
              {/* Honeypot — hidden from people, tempting to bots. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden"
              />
            </div>

            <button
              onClick={send}
              disabled={!ready}
              className="mt-4 text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed"
            >
              {state === "sending" ? "Sending…" : "Leave a note →"}
            </button>

            {error && <p className="text-[11px] leading-[1.7] text-fg mt-2">{error}</p>}
          </>
        )}
      </div>
    </aside>
  );
}
