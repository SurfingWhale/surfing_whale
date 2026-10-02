// app/studio/Photos.tsx
// The photo library: every photograph the studio has taken in, in one place.
//
// There used to be two — an archive of loose frames with a public page of its
// own, and the darkroom's uploads, which belonged to essays. One pile is what
// the owner actually has, so it is one pile here: upload once, then pick from
// it in the darkroom or the writing room.
//
// A photograph used to reach the site only inside an essay or a post, which
// meant writing a piece to show one frame — and the gallery on the home page
// was a hand-edited array in the repository, so the other way round was a
// commit. Uploading twenty photographs and expecting to see them is the
// obvious thing to do and it led nowhere. Tapping a frame here now opens the
// one panel that puts it on the site.
//
// Publishing asks for a description and will not go without one. It is the
// only part of a photograph a screen reader can say or a search engine can
// read, and it is cheapest to write while looking at the frame.
"use client";

import { useCallback, useEffect, useState } from "react";
import { size } from "@/app/darkroom/downscale";
import { sendPhoto } from "@/app/darkroom/sendPhoto";
import { Button, DropZone, Field, PendingList, RoomHeader, inputClass, labelClass, textareaClass, type Pending } from "./ui";

type Category = "portraits" | "everyday" | "landscapes";
const CATEGORIES: Category[] = ["portraits", "everyday", "landscapes"];

interface Frame {
  publicId: string;
  url: string;
  width: number;
  height: number;
  takenAt: string;
  alt: string;
  category: Category;
  published: boolean;
}

export function Photos() {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  // Which frame's panel is open, and the unsaved edits in it.
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ alt: string; category: Category } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/library/list", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "Could not load the library.");
        setFrames(d.photos ?? []);
      })
      .catch((err) => {
        setFrames([]);
        setNote(err instanceof Error ? err.message : "Could not load the library.");
      });
  }, []);
  useEffect(load, [load]);

  // A first tap on Remove only arms it. Removing deletes the file from
  // storage — there is nothing to restore it from — and on a phone, where
  // the button is always showing, a stray thumb should not be enough.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const ingest = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setNote(null);
    setPending(list.map((f) => ({ name: f.name, state: "compressing" })));

    // One at a time, on purpose: a phone on mobile data shows a count that is
    // the truth, rather than forty bars that all sit at half.
    let ok = 0, before = 0, after = 0;
    for (let i = 0; i < list.length; i++) {
      const mark = (patch: Partial<Pending>) =>
        setPending((p) => p.map((q, k) => (k === i ? { ...q, ...patch } : q)));
      try {
        const shot = await sendPhoto(list[i], (b, a) =>
          mark({ state: "uploading", saved: `${size(b)} → ${size(a)}` })
        );
        before += shot.before; after += shot.after;
        // Prepended as it lands, so a long batch is visibly making progress
        // rather than sitting still until the last file is done.
        setFrames((f) => [
          {
            publicId: shot.publicId,
            url: shot.url,
            width: shot.width,
            height: shot.height,
            takenAt: new Date().toISOString(),
            alt: "",
            category: "everyday",
            published: false,
          },
          ...(f ?? []),
        ]);
        ok++;
      } catch (err) {
        mark({ state: "failed", error: err instanceof Error ? err.message : String(err) });
      }
    }
    // Failures stay on screen with their reason; everything else clears.
    setPending((p) => p.filter((q) => q.state === "failed"));
    setNote(
      `${ok} of ${list.length} uploaded` +
        (ok ? `, compressed from ${size(before)} to ${size(after)}.` : ".")
    );
  };

  const remove = async (publicId: string) => {
    if (armed !== publicId) return setArmed(publicId);
    setArmed(null);
    setRemoving(publicId);
    const res = await fetch("/api/library/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    }).catch(() => null);
    if (res?.ok) {
      setFrames((f) => (f ?? []).filter((x) => x.publicId !== publicId));
      setNote("Deleted from the library.");
    } else {
      // A photograph still in an essay or a post is refused, and the answer
      // names them — that is the message worth showing as it is.
      const data = await res?.json().catch(() => null);
      setNote(data?.error ?? "Could not delete that photo. Try again in a moment.");
    }
    setRemoving(null);
  };

  const edit = (f: Frame) => {
    setNote(null);
    setOpen(f.publicId);
    setDraft({ alt: f.alt, category: f.category });
  };

  const save = async (f: Frame, published: boolean) => {
    if (!draft) return;
    setSaving(true);
    setNote(null);
    const res = await fetch("/api/library/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId: f.publicId,
        alt: draft.alt,
        category: draft.category,
        published,
        width: f.width,
        height: f.height,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok) {
      setFrames((fs) =>
        (fs ?? []).map((x) =>
          x.publicId === f.publicId ? { ...x, ...draft, published } : x
        )
      );
      setOpen(null);
      setDraft(null);
      setNote(published ? "On the site." : "Taken off the site.");
    } else {
      // A missing description comes back with the reason worth reading.
      setNote(data?.error ?? "Could not save that. Try again in a moment.");
    }
    setSaving(false);
  };

  const live = (frames ?? []).filter((f) => f.published).length;

  return (
    <div>
      <RoomHeader room="photos" />

      <div className="space-y-3">
        <DropZone
          onFiles={(files) => void ingest(files)}
          hint="Compressed in the browser before sending, location data removed. JPEG, PNG, WebP, AVIF — or HEIC from an iPhone."
        />
        <PendingList pending={pending} />
        <p role="status" className="text-[13px] leading-[1.7] text-fg-body empty:hidden">{note}</p>
      </div>

      <section aria-labelledby="library-photos" className="mt-8">
        <h3 id="library-photos" className={`${labelClass} mb-3`}>
          In the library{frames ? ` · ${frames.length}` : ""}
          {frames && frames.length > 0 && (
            <span className="text-fg-muted"> · {live} on the site</span>
          )}
        </h3>

        {frames === null && <p className="text-[13px] leading-[1.7] text-fg-muted">Loading…</p>}
        {frames?.length === 0 && (
          <div className="rounded-xl border border-border px-4 py-5">
            <p className="text-[13px] leading-[1.7] text-fg-body">The library is empty.</p>
            <p className="text-[13px] leading-[1.7] text-fg-muted">
              Photos added here, or with Choose photos in an editor, all land in one place.
            </p>
          </div>
        )}

        {frames && frames.length > 0 && (
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {frames.map((f) => (
              <li key={f.publicId} className="relative group">
                {/* The frame itself is the control. Tapping it opens the one
                    panel that describes and publishes it — on a phone that is
                    the whole gesture, with no second chip to aim at. */}
                <button
                  type="button"
                  onClick={() => (open === f.publicId ? setOpen(null) : edit(f))}
                  aria-expanded={open === f.publicId}
                  aria-label={`Edit ${f.alt || "this photograph"}`}
                  className={`block w-full rounded-md overflow-hidden border-2 transition-colors duration-200 ${
                    open === f.publicId ? "border-fg" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt=""
                    loading="lazy"
                    className={`w-full aspect-square object-cover bg-bg-muted transition-opacity duration-200 ${
                      removing === f.publicId ? "opacity-40" : ""
                    }`}
                  />
                </button>

                {/* Says which frames are already out there, at a glance,
                    without opening any of them. */}
                {f.published && (
                  <span
                    className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-fg text-bg text-[10px] font-medium leading-[1.5] pointer-events-none"
                  >
                    On site
                  </span>
                )}

                <span className="absolute top-1 right-1">
                  <Button
                    variant={armed === f.publicId ? "confirm" : "chip"}
                    onClick={() => void remove(f.publicId)}
                    disabled={removing === f.publicId}
                    aria-label={
                      armed === f.publicId
                        ? "Tap again to delete this photo for good"
                        : "Delete this photo from the library"
                    }
                    className={
                      armed === f.publicId
                        ? ""
                        : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
                    }
                  >
                    {removing === f.publicId ? "Deleting…" : armed === f.publicId ? "Confirm" : "Delete"}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* One panel, under the grid, for whichever frame is open. One set of
            controls rather than a set per tile: twenty tiles each carrying a
            description field is a wall, and on a phone it is unusable. */}
        {open && draft && (() => {
          const f = (frames ?? []).find((x) => x.publicId === open);
          if (!f) return null;
          return (
            <div className="mt-4 rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* A strip on a phone, a square beside the fields on anything
                  wider. Full width and square pushed the description field a
                  screen and a half down, which is the field the panel is for. */}
              <img
                src={f.url}
                alt=""
                className="w-full h-28 sm:h-40 sm:w-40 object-cover rounded-lg bg-bg-muted flex-none"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <Field
                  label="What is in the photograph"
                  hint="Needed to put it on the site"
                >
                  <textarea
                    className={textareaClass}
                    rows={2}
                    autoFocus
                    maxLength={300}
                    value={draft.alt}
                    onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
                    placeholder="A dock worker in an orange jacket crossing a plank between concrete forms"
                  />
                </Field>

                <Field label="Where it belongs">
                  <select
                    className={inputClass}
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c[0].toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Enabled whatever the description says, so pressing it
                      names the missing field instead of greying itself out
                      and explaining nothing. */}
                  <Button variant="primary" disabled={saving} onClick={() => void save(f, true)}>
                    {saving ? "Saving…" : f.published ? "Save" : "Put it on the site"}
                  </Button>
                  {f.published && (
                    <Button disabled={saving} onClick={() => void save(f, false)}>
                      Take it off
                    </Button>
                  )}
                  <Button variant="quiet" onClick={() => { setOpen(null); setDraft(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
