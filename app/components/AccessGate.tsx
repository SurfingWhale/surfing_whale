// app/components/AccessGate.tsx
// Soft gate over the CV and project details: leave an email, get in straight
// away. It is not verification — a made-up address gets through — but that is
// the intended trade. The gate exists to know who is looking, not to keep
// anyone out, so it must never cost a visitor more than one field.
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AccessReason } from "@/app/lib/accessRequests";

const STORAGE_KEY = "sw-access-granted";

const AccessContext = createContext<{
  unlocked: boolean;
  requireAccess: (reason: AccessReason, onGranted: () => void) => void;
  /** Marks access granted without a dialog — used by the inline read gate. */
  grantAccess: () => void;
} | null>(null);

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pending, setPending] = useState<{ reason: AccessReason } | null>(null);
  const onGrantedRef = useRef<(() => void) | null>(null);

  // Read the stored grant after mount so the server and client agree on the
  // first render.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
    } catch {
      /* private mode — the gate simply asks again */
    }
  }, []);

  const requireAccess = useCallback(
    (reason: AccessReason, onGranted: () => void) => {
      if (unlocked) {
        onGranted();
        return;
      }
      onGrantedRef.current = onGranted;
      setPending({ reason });
    },
    [unlocked]
  );

  const grant = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* not fatal — access still holds for this page view */
    }
    setUnlocked(true);
    setPending(null);
    const run = onGrantedRef.current;
    onGrantedRef.current = null;
    run?.();
  };

  const dismiss = () => {
    onGrantedRef.current = null;
    setPending(null);
  };

  return (
    <AccessContext.Provider value={{ unlocked, requireAccess, grantAccess: grant }}>
      {children}
      {pending && (
        <GateDialog reason={pending.reason} onGranted={grant} onDismiss={dismiss} />
      )}
    </AccessContext.Provider>
  );
}

const COPY: Record<AccessReason, { title: string; blurb: string }> = {
  CV: {
    title: "Before you read my CV",
    blurb: "Leave an email so I know who stopped by.",
  },
  Project: {
    title: "Before you open this project",
    blurb: "Leave an email so I know who stopped by.",
  },
};

function GateDialog({
  reason,
  onGranted,
  onDismiss,
}: {
  reason: AccessReason;
  onGranted: () => void;
  onDismiss: () => void;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Where focus came from, so it can be handed back on close rather than
    // dropped at the top of the document.
    const opener = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onDismiss();
      if (e.key !== "Tab") return;
      // Without this, Tab walks straight out of the dialog and into the page
      // behind it, which is still there and still clickable.
      const stops = focusable();
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      opener?.focus?.();
    };
  }, [onDismiss]);

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
      onGranted();
    } catch {
      setError("Could not reach the server.");
      setSending(false);
    }
  };

  const copy = COPY[reason];

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-3rem)] max-w-md bg-bg border border-border rounded-2xl p-7"
      >
        <h2 id="gate-title" className="text-[15px] font-medium tracking-[-0.02em]">
          {copy.title}
        </h2>
        <p className="text-[13px] leading-[2] text-fg-body mt-2">{copy.blurb}</p>

        <input
          ref={inputRef}
          type="email"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && email) submit(); }}
          placeholder="you@example.com"
          aria-label="Your email"
          autoComplete="email"
          className="w-full mt-5 bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200"
        />

        {/* Honeypot */}
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

        <p className="text-[11px] text-fg-muted mt-2">
          Used only so I know who visited. Never shown publicly, never shared,
          and never added to a mailing list.
        </p>

        {error && (
          <p role="alert" className="text-[13px] text-fg mt-3">
            {error}
          </p>
        )}

        <div className="flex gap-5 mt-6 text-[13px]">
          <button
            onClick={submit}
            disabled={!email || sending}
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed"
          >
            {sending ? "Opening…" : "Continue →"}
          </button>
          <button
            onClick={onDismiss}
            className="text-fg-body hover:text-fg transition-colors duration-300"
          >
            Not now
          </button>
        </div>
      </div>
    </>
  );
}
