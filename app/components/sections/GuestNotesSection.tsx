"use client";
// app/components/sections/GuestNotesSection.tsx
//
// The form used to stand open in the page: name, note, email, a privacy
// paragraph and a send link, all stacked down the section before the notes
// anyone came to read. Four fields of empty white is a long way to scroll past
// for a thing most visitors will never fill in, and it buried the notes.
//
// So the section asks once, with a button, and the form arrives as a card when
// someone says yes — the same card the floating prompt uses, chrome band and
// all, so the two places this site asks for a note look like one thing.

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionLabel } from "@/app/components/SectionLabel";
import { ChromeWord } from "@/app/components/ChromeWord";

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

const SOLID =
  "w-full rounded-[11px] bg-fg text-bg text-[13px] font-medium py-2.5 " +
  "hover:opacity-90 active:scale-[0.99] transition-[opacity,transform] duration-200 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export function GuestNotesSection() {
  const [notes, setNotes] = useState<GuestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", message: "", email: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  // Where focus was before the card opened, so closing puts it back rather
  // than dropping the reader at the top of the document.
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch("/api/guest-notes")
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  // Escape closes, and the page behind does not scroll while the card is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The name field is what the card is for; opening with it focused saves a
    // tap and tells a screen reader where it has landed.
    window.setTimeout(() => nameRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const submit = async () => {
    // The button stays enabled and says what is missing, rather than greying
    // itself out and leaving the reader to work out which field it wants.
    if (!form.name.trim()) {
      setError("Add your name so I know who stopped by.");
      nameRef.current?.focus();
      return;
    }
    if (!form.message.trim()) {
      setError("Write a line or two before sending.");
      messageRef.current?.focus();
      return;
    }
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
        setError(data.error ?? "Unable to send. Try again in a moment.");
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
    <section data-spot id="guest-notes" className="w-full py-16 sm:py-24 border-t border-border">
      <div data-reveal className="container mx-auto px-6 max-w-[720px]">
        <SectionLabel note="Leave a note if you passed by. I read every one.">
          Guest notes
        </SectionLabel>

        {/* One button where four fields used to be. */}
        <button
          type="button"
          onClick={(e) => {
            opener.current = e.currentTarget;
            setStatus("idle");
            setError(null);
            setOpen(true);
          }}
          className={`${SOLID} max-w-[240px]`}
        >
          Leave a note
        </button>

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

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-note-card-title"
        >
          {/* The backdrop is a button so a pointer and a keyboard both have a
              way out that is not the × — but it is hidden from assistive tech,
              which already has Escape and the close control. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-[rgba(10,13,16,.45)] backdrop-blur-[2px] cursor-default"
          />

          <div className="relative w-full max-w-[340px] rounded-[20px] overflow-hidden bg-bg shadow-[0_24px_60px_rgba(10,13,16,.28)]">
            <ChromeWord lines={["SURFING", "WHALE"]} height={124} tone="hot" />
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full
                bg-bg/70 backdrop-blur-sm text-fg-body hover:text-fg transition-colors duration-200"
            >
              <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 stroke-current stroke-[1.5] [stroke-linecap:round]" fill="none" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {status === "sent" ? (
                <>
                  <p id="guest-note-card-title" className="font-display font-bold text-[22px] leading-[1.15] text-fg">
                    Noted.
                  </p>
                  <p className="text-[12px] leading-[1.8] text-fg-body mt-2">
                    It will show up below once I have had a look.
                  </p>
                  <button type="button" onClick={close} className={`${SOLID} mt-4`}>
                    Done
                  </button>
                </>
              ) : (
                <>
                  <p id="guest-note-card-title" className="font-display font-bold text-[22px] leading-[1.15] text-fg">
                    Passing through?
                  </p>
                  <p className="text-[12px] leading-[1.8] text-fg-body mt-2">
                    Leave a note — it shows up under this card once I have read
                    it.
                  </p>

                  <div className="mt-4 space-y-3">
                    <input
                      ref={nameRef}
                      type="text"
                      maxLength={50}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      aria-label="Your name"
                      autoComplete="name"
                      className={FIELD}
                    />

                    <div>
                      <textarea
                        ref={messageRef}
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
                        autoComplete="email"
                        className={FIELD}
                      />
                      <p className="text-[11px] leading-[1.7] text-fg-muted mt-2">
                        Only so I can reply. Never shown publicly, never shared,
                        never added to a mailing list.
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
                  </div>

                  {error && (
                    <p role="alert" className="text-[12px] leading-[1.7] text-fg mt-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={status === "sending"}
                    className={`${SOLID} mt-4`}
                  >
                    {status === "sending" ? "Sending…" : "Leave a note"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
