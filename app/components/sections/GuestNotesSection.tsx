"use client";
// app/components/sections/GuestNotesSection.tsx
//
// Written in the page's own language: 13px copy, hairline-ruled fields rather
// than boxed inputs, and a text link to send. A boxed form with a filled
// button read like a contact widget borrowed from another site.

import { useEffect, useState } from "react";
import { SectionLabel } from "@/app/components/SectionLabel";

interface GuestNote {
  id: string;
  name: string;
  message: string;
  date: string;
}

const MAX_MESSAGE = 500;

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Bottom hairline only — a ruled line to write on, not a box to fill in.
const FIELD =
  "w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-2 " +
  "text-[13px] leading-[2] text-fg placeholder:text-fg-muted " +
  "focus:outline-none focus:border-fg transition-colors duration-200";

const LINK =
  "text-fg underline decoration-border-strong underline-offset-[3px] " +
  "hover:decoration-[var(--accent-soft)] transition-colors duration-200";

export function GuestNotesSection() {
  const [notes, setNotes] = useState<GuestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", message: "", email: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guest-notes")
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const isReady =
    form.name.trim().length > 0 && form.message.trim().length > 0 && status !== "sending";

  const submit = async () => {
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/guest-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
      setForm({ name: "", message: "", email: "", website: "" });
    } catch {
      setError("Could not reach the server.");
      setStatus("idle");
    }
  };

  return (
    <section data-spot id="guest-notes" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[720px]">
        <SectionLabel note="Leave a note if you passed by. I read every one.">
          Guest notes
        </SectionLabel>

        {status === "sent" ? (
          <p className="text-[13px] leading-[2] text-fg-body">
            Thanks for the note — it will show up here once I have had a look.{" "}
            <button onClick={() => setStatus("idle")} className={LINK}>
              Write another
            </button>
          </p>
        ) : (
          <div className="max-w-[520px] space-y-6">
            <input
              type="text"
              maxLength={50}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              aria-label="Your name"
              className={FIELD}
            />

            <div>
              <textarea
                rows={3}
                maxLength={MAX_MESSAGE}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Say hello…"
                aria-label="Your note"
                className={`${FIELD} resize-none`}
              />
              <p className="text-[11px] text-fg-muted mt-1 text-right tabular-nums">
                {form.message.length}/{MAX_MESSAGE}
              </p>
            </div>

            <div>
              <input
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email (optional)"
                aria-label="Your email, optional"
                className={FIELD}
              />
              <p className="text-[11px] leading-[1.7] text-fg-muted mt-2">
                Only so I can reply. Never shown publicly, never shared, never
                added to a mailing list.
              </p>
            </div>

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

            {error && <p className="text-[13px] text-fg">{error}</p>}

            <button
              onClick={submit}
              disabled={!isReady}
              className={`text-[13px] font-medium ${LINK} disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed`}
            >
              {status === "sending" ? "Sending…" : "Leave a note →"}
            </button>
          </div>
        )}

        <div className="mt-16">
          {loading ? (
            <p className="text-[13px] text-fg-muted">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="text-[13px] text-fg-muted">No notes yet — be the first.</p>
          ) : (
            <ul className="border-t border-border">
              {notes.map((note) => (
                <li key={note.id} className="py-6 border-b border-border">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] font-medium text-fg">{note.name}</span>
                    <span className="text-[11px] text-fg-muted flex-shrink-0 tabular-nums">
                      {formatDate(note.date)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-[1.8] text-fg-body mt-1.5 whitespace-pre-line">
                    {note.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
