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
import { Badge, Button, RoomHeader, when } from "./ui";

export function Notes() {
  const [notes, setNotes] = useState<ModeratedNote[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus(null);
    fetch("/api/studio/notes")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        setNotes(d.notes ?? []);
        setLoadError(r.ok ? null : d.error ?? `HTTP ${r.status}`);
      })
      .catch(() => {
        setNotes([]);
        setLoadError("Could not reach the server.");
      });
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
      setStatus(approved ? `Published the note from ${note.name}.` : `Hid the note from ${note.name}.`);
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

  const waiting = notes?.filter((n) => !n.approved).length ?? 0;

  return (
    <>
      <RoomHeader room="notes" action={<Button onClick={load}>Refresh</Button>} />

      <p role="status" className="text-[13px] leading-[1.7] text-fg-body mb-4 empty:hidden">
        {status}
      </p>

      {notes === null ? (
        <p className="text-[13px] leading-[1.7] text-fg-muted">Loading…</p>
      ) : loadError ? (
        <div className="rounded-xl border border-border px-4 py-5">
          <p className="text-[13px] leading-[1.7] text-fg font-medium">Unable to load the notes.</p>
          <p className="text-[13px] leading-[1.7] text-fg-body">{loadError}</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-border px-4 py-5">
          <p className="text-[13px] leading-[1.7] text-fg-body">No notes yet.</p>
          <p className="text-[13px] leading-[1.7] text-fg-muted">
            They arrive here the moment someone leaves one, waiting for you to publish them.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[11px] leading-[1.6] text-fg-label mb-3">
            {waiting > 0
              ? `${waiting} waiting for you · ${notes.length} in total`
              : `Nothing waiting · ${notes.length} in total`}
          </p>

          <ul className="rounded-xl border border-border divide-y divide-border">
            {notes.map((note) => (
              <li key={note.id} className="p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[13px] leading-[1.5] font-medium text-fg">{note.name}</span>
                  {/* Not colour alone: the state is spelled out. */}
                  <Badge live={note.approved}>{note.approved ? "Published" : "Waiting"}</Badge>
                  <span className="text-[11px] leading-[1.6] text-fg-muted tabular-nums">{when(note.date)}</span>
                </div>

                <p className="text-[13px] leading-[1.8] text-fg-body mt-2 max-w-[60ch]">
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
                  <Button
                    variant="chip"
                    onClick={() => approve(note, !note.approved)}
                    disabled={busy === note.id}
                  >
                    {note.approved ? "Hide" : "Publish"}
                  </Button>

                  {confirming === note.id ? (
                    <span className="flex flex-wrap items-center gap-2 ml-auto">
                      <span className="text-[11px] leading-[1.6] text-fg">Delete this for good?</span>
                      <Button
                        variant="confirm"
                        onClick={() => remove(note)}
                        disabled={busy === note.id}
                      >
                        Delete it
                      </Button>
                      <Button variant="chip" onClick={() => setConfirming(null)}>
                        Keep it
                      </Button>
                    </span>
                  ) : (
                    <Button variant="chip" onClick={() => setConfirming(note.id)} className="ml-auto">
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
