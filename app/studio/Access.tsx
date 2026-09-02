// app/studio/Access.tsx
// Deciding who gets to read the full case studies.
//
// The email is the address; the message is the reason. Both are shown because
// approving on an address alone is not a decision, it is a coin flip.
//
// The link is always visible after approving, whether or not the email sent.
// Resend refuses to send from an unverified domain, and a studio that only
// said "sent" would leave a person waiting for something that never left.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccessRequest } from "@/app/lib/accessRequests";

const chip =
  "text-[11px] leading-[1.6] px-2 py-1 rounded-md border border-border text-fg-body hover:text-fg hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200";

function when(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function Access() {
  const [rows, setRows] = useState<AccessRequest[] | null>(null);
  const [mailOn, setMailOn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/studio/access")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.requests ?? []);
        setMailOn(Boolean(d.mailConfigured));
      })
      .catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  const decide = async (r: AccessRequest, approved: boolean) => {
    setBusy(r.id);
    setStatus(null);
    const res = await fetch("/api/studio/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: r.id, approved, email: r.email, name: r.name, token: r.token,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);

    if (res?.ok) {
      setRows((list) =>
        (list ?? []).map((x) => (x.id === r.id ? { ...x, approved } : x))
      );
      if (approved) {
        setLinks((l) => ({ ...l, [r.id]: data?.link ?? "" }));
        setStatus(
          data?.mail?.sent
            ? `Approved. Email sent to ${r.email}.`
            : `Approved, but the email did not send — copy the link below and send it yourself. (${data?.mail?.reason ?? "no mail provider configured"})`
        );
      } else {
        setStatus("Access withdrawn. Any link they already opened stays valid until it expires.");
      }
    } else {
      setStatus(data?.error ?? "That did not save.");
    }
    setBusy(null);
  };

  if (rows === null) return <p className="text-[13px] text-fg-muted">Loading requests…</p>;

  const pending = rows.filter((r) => !r.approved);
  const done = rows.filter((r) => r.approved);

  return (
    <div className="space-y-8">
      {!mailOn && (
        <p className="text-[11px] leading-[1.8] text-fg-muted border-l-2 border-border-strong pl-4">
          No mail provider configured — set <code className="font-mono">RESEND_API_KEY</code>{" "}
          and <code className="font-mono">MAIL_FROM</code>. Approving still works; the
          link appears here to send by hand.
        </p>
      )}

      {status && <p className="text-[11px] leading-[1.8] text-fg-body">{status}</p>}

      {rows.length === 0 && (
        <p className="text-[13px] text-fg-muted">No one has asked yet.</p>
      )}

      {[["Waiting", pending], ["Approved", done]].map(([label, list]) => {
        const items = list as AccessRequest[];
        if (!items.length) return null;
        return (
          <section key={label as string}>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label mb-3">
              {label as string} · {items.length}
            </h2>
            <ul className="border-t border-border">
              {items.map((r) => (
                <li key={r.id} className="border-b border-border py-4 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[13px] font-medium text-fg">
                      {r.name || "(no name)"}
                    </span>
                    <span className="text-[11px] text-fg-body">{r.email}</span>
                    <span className="text-[11px] text-fg-muted">
                      {r.reason} · {when(r.date)}
                    </span>
                  </div>

                  {r.message && (
                    <p className="text-[13px] leading-[1.9] text-fg-body">{r.message}</p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      className={chip}
                      disabled={busy === r.id}
                      onClick={() => decide(r, !r.approved)}
                    >
                      {r.approved ? "Withdraw access" : "Approve"}
                    </button>
                    {links[r.id] && (
                      <button
                        type="button"
                        className={chip}
                        onClick={() => {
                          navigator.clipboard?.writeText(links[r.id]);
                          setStatus("Link copied.");
                        }}
                      >
                        Copy link
                      </button>
                    )}
                  </div>

                  {links[r.id] && (
                    <p className="text-[11px] font-mono break-all text-fg-muted">
                      {links[r.id]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
