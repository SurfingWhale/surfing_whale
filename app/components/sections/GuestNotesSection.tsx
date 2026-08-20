"use client";
// app/components/sections/GuestNotesSection.tsx

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

  const fieldClass =
    "w-full bg-bg border border-border rounded-lg px-4 py-3 text-fg text-sm placeholder:text-fg-muted focus:outline-none focus:border-border-strong transition-colors";

  return (
    <section id="guest-notes" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[680px]">
        <SectionLabel note="Leave a note if you passed by. I read every one.">
          Guest notes
        </SectionLabel>

        {status === "sent" ? (
          <div className="text-center py-12 border border-border rounded-lg bg-bg-subtle">
            <p className="text-sm font-medium">Thanks for the note</p>
            <p className="text-sm text-fg-secondary mt-2">
              It will show up here once I have had a look.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-fg-secondary hover:text-fg transition-colors underline underline-offset-4"
            >
              Write another
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label htmlFor="note-name" className="text-sm text-fg-secondary block mb-2">
                Name
              </label>
              <input
                id="note-name"
                type="text"
                maxLength={50}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="note-message" className="text-sm text-fg-secondary block mb-2">
                Note
              </label>
              <textarea
                id="note-message"
                rows={4}
                maxLength={MAX_MESSAGE}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Say hello…"
                className={`${fieldClass} resize-none`}
              />
              <p className="text-xs text-fg-muted mt-1 text-right">
                {form.message.length}/{MAX_MESSAGE}
              </p>
            </div>

            <div>
              <label htmlFor="note-email" className="text-sm text-fg-secondary block mb-2">
                Email <span className="text-fg-muted">(optional)</span>
              </label>
              <input
                id="note-email"
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={fieldClass}
              />
              <p className="text-xs text-fg-muted mt-2">
                Only so I can reply. It is never shown publicly, and never shared
                or used for any mailing list.
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

            {error && <p className="text-sm text-fg">{error}</p>}

            <button
              onClick={submit}
              disabled={!isReady}
              className="w-full text-sm font-medium py-3 rounded-lg bg-fg text-bg hover:opacity-85 transition-opacity duration-300 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Sending…" : "Leave a note"}
            </button>
          </div>
        )}

        <div className="mt-14">
          {loading ? (
            <p className="text-sm text-fg-muted text-center animate-pulse">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-fg-muted text-center">
              No notes yet — be the first.
            </p>
          ) : (
            <ul className="space-y-4">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="border border-border rounded-lg p-5 bg-bg-subtle"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{note.name}</span>
                    <span className="text-xs text-fg-muted flex-shrink-0">
                      {formatDate(note.date)}
                    </span>
                  </div>
                  <p className="text-sm text-fg-secondary leading-relaxed mt-2 whitespace-pre-line">
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
