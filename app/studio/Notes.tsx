// app/studio/Notes.tsx
// A note left on the site is created unapproved, and until now the only way
// to publish it was to open Notion and tick a checkbox. This closes that:
// approve, hide, or delete, without leaving the site the note was left on.
//
// The email address is shown here and nowhere else. The public read strips
// it, and it stays stripped.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModeratedNote } from "@/app/lib/guestNotes";

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed";
const chip =
  "text-[11px] leading-[1.6] px-2 py-1 rounded-md border border-border text-fg-body hover:text-fg hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200";

function when(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function Notes() {
  const [notes, setNotes] = useState<ModeratedNote[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/studio/notes")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => setNotes([]));
  }, []);
  useEffect(load, [load]);

  const approve = async (note: ModeratedNote, approved: boolean) => {
    setBusy(note.id);
    setStatus(null);
    const res = await fetch("/api/studio/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, approved }),
    }).catch(() => null);
    if (res?.ok) {
      // Flipped locally rather than refetching the lot, so the row does not
      // jump under the cursor mid-decision.
      setNotes((n) =>
        n?.map((x) => (x.id === note.id ? { ...x, approved } : x)) ?? null
      );
    } else {
      setStatus((await res?.json().catch(() => null))?.error ?? "Unable to update it.");
    }
    setBusy(null);
  };

  const remove = async (note: ModeratedNote) => {
    setBusy(note.id);
    setStatus(null);
    const res = await fetch(`/api/studio/notes?id=${encodeURIComponent(note.id)}`, {
      method: "DELETE",
    }).catch(() => null);
    if (res?.ok) {
      setNotes((n) => n?.filter((x) => x.id !== note.id) ?? null);
      setStatus(`Deleted the note from ${note.name}.`);
    } else {
      setStatus("Unable to delete it.");
    }
    setConfirming(null);
    setBusy(null);
  };

  if (notes === null) {
    return <p className="text-[13px] leading-[2] text-fg-muted">Loading…</p>;
  }
  if (notes.length === 0) {
    return (
      <p className="text-[13px] leading-[2] text-fg-muted">
        No notes yet. They arrive here the moment someone leaves one.
      </p>
    );
  }

  const waiting = notes.filter((n) => !n.approved).length;

  return (
    <>
      <p className="text-[13px] leading-[2] text-fg-body pb-6 border-b border-border">
        {waiting > 0
          ? `${waiting} waiting for you · ${notes.length} in total`
          : `Nothing waiting · ${notes.length} in total`}
      </p>

      <ul className="border-b border-border">
        {notes.map((note) => (
          <li key={note.id} className="border-t border-border py-5 first:border-t-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[13px] font-medium text-fg">{note.name}</span>
              <span className="text-[11px] text-fg-muted">{when(note.date)}</span>
              {/* Not colour alone: the state is spelled out. */}
              <span
                className={`text-[11px] ${note.approved ? "text-fg-body" : "text-fg"}`}
              >
                {note.approved ? "· published" : "· waiting"}
              </span>
            </div>

            <p className="text-[13px] leading-[2] text-fg-body mt-1 max-w-[560px]">
              {note.message}
            </p>

            {note.email && (
              <p className="text-[11px] leading-[1.7] text-fg-muted mt-1">
                <a
                  href={`mailto:${note.email}`}
                  className="underline decoration-border-strong underline-offset-[3px] hover:text-fg transition-colors duration-200"
                >
                  {note.email}
                </a>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => approve(note, !note.approved)}
                disabled={busy === note.id}
                className={chip}
              >
                {note.approved ? "Hide" : "Publish"}
              </button>

              {confirming === note.id ? (
                <>
                  <span className="text-[11px] text-fg">Delete this for good?</span>
                  <button
                    onClick={() => remove(note)}
                    disabled={busy === note.id}
                    className={chip}
                  >
                    Delete it
                  </button>
                  <button onClick={() => setConfirming(null)} className={chip}>
                    Keep it
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirming(note.id)}
                  className={`${chip} ml-auto`}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-5 pt-6 text-[13px]">
        <button onClick={load} className={link}>Refresh</button>
        {status && <span role="status" className="text-fg-body">{status}</span>}
      </div>
    </>
  );
}
