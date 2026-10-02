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
import HoldButton from "@/app/components/HoldButton/HoldButton";
import { Badge, Button, RoomHeader, labelClass, when } from "./ui";

export function Access() {
  const [rows, setRows] = useState<AccessRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mailOn, setMailOn] = useState(false);
  const [whatsOn, setWhatsOn] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus(null);
    fetch("/api/studio/access")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        setRows(d.requests ?? []);
        setMailOn(Boolean(d.mailConfigured));
        setWhatsOn(d.whatsappConfigured !== false);
        setLoadError(r.ok ? null : d.error ?? `HTTP ${r.status}`);
      })
      .catch(() => {
        setRows([]);
        setLoadError("Could not reach the server.");
      });
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

  const pending = rows?.filter((r) => !r.approved) ?? [];
  const done = rows?.filter((r) => r.approved) ?? [];

  return (
    <>
      <RoomHeader room="access" action={<Button onClick={load}>Refresh</Button>} />

      <div className="space-y-6">
        {rows !== null && !loadError && !mailOn && (
          <p className="text-[11px] leading-[1.8] text-fg-body rounded-lg bg-bg-subtle border border-border px-3 py-3">
            No mail provider configured — set <code className="font-mono">RESEND_API_KEY</code>{" "}
            and <code className="font-mono">MAIL_FROM</code>. Approving still works; the
            link appears here to send by hand.
          </p>
        )}

        {rows !== null && !loadError && !whatsOn && (
          <p className="text-[11px] leading-[1.8] text-fg-body rounded-lg bg-bg-subtle border border-border px-3 py-3">
            No WhatsApp number — set <code className="font-mono">WHATSAPP_NUMBER</code> (digits
            only, country code first). Until then an approved reader who taps WhatsApp gets an
            error instead of the chat.
          </p>
        )}

        <p role="status" className="text-[13px] leading-[1.7] text-fg-body empty:hidden">{status}</p>

        {rows === null ? (
          <p className="text-[13px] leading-[1.7] text-fg-muted">Loading requests…</p>
        ) : loadError ? (
          <div className="rounded-xl border border-border px-4 py-5">
            <p className="text-[13px] leading-[1.7] text-fg font-medium">Unable to load the requests.</p>
            <p className="text-[13px] leading-[1.7] text-fg-body">{loadError}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border px-4 py-5">
            <p className="text-[13px] leading-[1.7] text-fg-body">No one has asked yet.</p>
            <p className="text-[13px] leading-[1.7] text-fg-muted">
              When someone asks to read a case study or the CV, the request shows up here.
            </p>
          </div>
        ) : null}

        {(
          [
            ["Waiting", pending],
            ["Approved", done],
          ] as const
        ).map(([label, items]) => {
          if (!items.length) return null;
          return (
            <section key={label}>
              <h3 className={`${labelClass} mb-3`}>
                {label} · {items.length}
              </h3>
              <ul className="rounded-xl border border-border divide-y divide-border">
                {items.map((r) => (
                  <li key={r.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[13px] leading-[1.5] font-medium text-fg">
                        {r.name || "(no name)"}
                      </span>
                      <Badge live={r.approved}>{r.approved ? "Approved" : "Waiting"}</Badge>
                      <span className="text-[11px] leading-[1.6] text-fg-body break-all">{r.email}</span>
                      <span className="text-[11px] leading-[1.6] text-fg-muted">
                        {r.reason} · {when(r.date)}
                      </span>
                    </div>

                    {r.message && (
                      <p className="text-[13px] leading-[1.8] text-fg-body max-w-[60ch]">{r.message}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {r.approved ? (
                        /* Withdrawing is reversible — approve again and the
                           same link works. A plain button is right for it. */
                        <Button
                          variant="chip"
                          disabled={busy === r.id}
                          onClick={() => decide(r, false)}
                        >
                          Withdraw access
                        </Button>
                      ) : (
                        /* Approving is not reversible: it sends this person an
                           email with their link in it, and withdrawing later
                           does not unsend that. So it has to be held.
                           Filling with --fg and flipping the label to --bg
                           keeps it to colours the theme already has, and works
                           the same in both of them. */
                        <HoldButton
                          size="sm"
                          className="hold-button--chip"
                          radius={6}
                          holdTime={1400}
                          waveAmplitude={3}
                          glow={false}
                          disabled={busy === r.id}
                          backgroundColor="transparent"
                          fillColor="var(--fg)"
                          textColor="var(--fg-body)"
                          fillTextColor="var(--bg)"
                          doneLabel="Approved"
                          onHold={() => decide(r, true)}
                        >
                          Hold to approve
                        </HoldButton>
                      )}
                      {links[r.id] && (
                        <Button
                          variant="chip"
                          onClick={() => {
                            navigator.clipboard?.writeText(links[r.id]);
                            setStatus("Link copied.");
                          }}
                        >
                          Copy link
                        </Button>
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
    </>
  );
}
