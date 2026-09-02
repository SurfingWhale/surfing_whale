// app/components/AccessGate.tsx
// The gate over the CV and project details, in one of two moods.
//
// Open (the default): leave an email, get in straight away. Not verification —
// a made-up address gets through — but the gate exists to know who is looking,
// not to keep anyone out, so it costs one field.
//
// Approval (ACCESS_GATE=on): the same form asks who you are and why, and then
// says so plainly — nothing opens until Fauzy approves and the link lands in
// your inbox. Nobody is left clicking a button that quietly does nothing.
//
// Which mood is live comes from the server, as does whether this visitor is
// already approved: the reader cookie is httpOnly, so the client cannot see it.
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

// One underline for every field, so three of them read as one form rather
// than three widgets that happen to be stacked.
const FIELD =
  "w-full mt-5 bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200";

export type GateMode = "open" | "approval";

const AccessContext = createContext<{
  unlocked: boolean;
  /** Which mood the gate is in. Decides what the forms say and do. */
  gate: GateMode;
  requireAccess: (reason: AccessReason, onGranted: () => void) => void;
  /** Marks access granted without a dialog — used by the inline read gate. */
  grantAccess: () => void;
} | null>(null);

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}

function storedGrant(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    /* private mode — the gate simply asks again */
    return false;
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [gate, setGate] = useState<GateMode>("open");
  const [pending, setPending] = useState<{ reason: AccessReason } | null>(null);
  const onGrantedRef = useRef<(() => void) | null>(null);

  // Everything the gate needs to know is decided after mount, so the server
  // and client agree on the first render. Under approval the stored grant is
  // ignored on purpose: a localStorage flag anyone can set is fine for a
  // courtesy gate and useless for one that means something.
  useEffect(() => {
    let alive = true;
    fetch("/api/access", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const mode: GateMode = d.gate === "approval" ? "approval" : "open";
        setGate(mode);
        if (d.reader) setUnlocked(true);
        else if (mode === "open") setUnlocked(storedGrant());
      })
      .catch(() => {
        // Unreachable server: fall back to how this behaved before approval
        // existed rather than locking out someone already let in.
        if (alive) setUnlocked(storedGrant());
      });
    return () => {
      alive = false;
    };
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
    <AccessContext.Provider value={{ unlocked, gate, requireAccess, grantAccess: grant }}>
      {children}
      {pending && (
        <GateDialog
          reason={pending.reason}
          gate={gate}
          onGranted={grant}
          onDismiss={dismiss}
        />
      )}
    </AccessContext.Provider>
  );
}

const COPY: Record<GateMode, Record<AccessReason, { title: string; blurb: string }>> = {
  open: {
    CV: {
      title: "Before you read my CV",
      blurb: "Leave an email so I know who stopped by.",
    },
    Project: {
      title: "Before you open this project",
      blurb: "Leave an email so I know who stopped by.",
    },
  },
  approval: {
    CV: {
      title: "Ask to read my CV",
      blurb: "Tell me who you are and I will send a link to the full version. Usually the same day.",
    },
    Project: {
      title: "Ask to read the whole project",
      blurb: "Some of this is client work, so I open it one person at a time. Tell me who you are and I will send you a link.",
    },
  },
};

function GateDialog({
  reason,
  gate,
  onGranted,
  onDismiss,
}: {
  reason: AccessReason;
  gate: GateMode;
  onGranted: () => void;
  onDismiss: () => void;
}) {
  const asking = gate === "approval";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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
        body: JSON.stringify({ email, name, message, reason, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to send. Try again in a moment.");
        setSending(false);
        return;
      }
      // Under approval nothing opens yet — say so rather than closing on a
      // promise the page cannot keep.
      if (data.pending) {
        setSent(true);
        setSending(false);
        return;
      }
      onGranted();
    } catch {
      setError("Could not reach the server.");
      setSending(false);
    }
  };

  const copy = COPY[gate][reason];

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
        {sent ? (
          <>
            <h2 id="gate-title" className="text-[15px] font-medium tracking-[-0.02em]">
              Asked. Now it is on me.
            </h2>
            <p className="text-[13px] leading-[2] text-fg-body mt-2">
              I read every one of these myself, so it is a person deciding, not
              a queue. When I open it you will get a link at{" "}
              <span className="font-mono text-fg break-all">{email}</span> — the
              link is yours, and it keeps working.
            </p>
            <div className="flex gap-5 mt-6 text-[13px]">
              <button
                onClick={onDismiss}
                className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
              >
                Back to the work →
              </button>
            </div>
          </>
        ) : (
          <>
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
              onKeyDown={(e) => { if (e.key === "Enter" && email && !asking) submit(); }}
              placeholder="you@example.com"
              aria-label="Your email"
              autoComplete="email"
              className={FIELD}
            />

            {asking && (
              <>
                <input
                  type="text"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="name"
                  className={FIELD}
                />
                <textarea
                  value={message}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Where you found this, and what you are looking for"
                  aria-label="Why you are asking"
                  className={`${FIELD} resize-none`}
                />
              </>
            )}

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
              {asking
                ? "Goes to me and nowhere else. Never shown publicly, never shared, never added to a mailing list."
                : "Used only so I know who visited. Never shown publicly, never shared, and never added to a mailing list."}
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
                {sending ? (asking ? "Sending…" : "Opening…") : asking ? "Ask →" : "Continue →"}
              </button>
              <button
                onClick={onDismiss}
                className="text-fg-body hover:text-fg transition-colors duration-300"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
