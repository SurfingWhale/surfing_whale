// app/studio/Photos.tsx
// The photo library: every photograph the studio has taken in, in one place.
//
// There used to be two — an archive of loose frames with a public page of its
// own, and the darkroom's uploads, which belonged to essays. One pile is what
// the owner actually has, so it is one pile here: upload once, then pick from
// it in the darkroom or the writing room. Nothing in the library is public by
// itself; a photograph reaches the site only inside an essay or a post.
"use client";

import { useCallback, useEffect, useState } from "react";
import { size } from "@/app/darkroom/downscale";
import { sendPhoto } from "@/app/darkroom/sendPhoto";
import { Button, DropZone, PendingList, RoomHeader, labelClass, type Pending } from "./ui";

interface Frame {
  publicId: string;
  url: string;
  width: number;
  height: number;
  takenAt: string;
}

export function Photos() {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt=""
                  loading="lazy"
                  className={`w-full aspect-square object-cover rounded-md bg-bg-muted transition-opacity duration-200 ${
                    removing === f.publicId ? "opacity-40" : ""
                  }`}
                />
                {/* Always there on a touch screen, which has no hover to
                    reveal it; on a pointer it waits for the frame to be
                    hovered or reached by keyboard. */}
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
      </section>
    </div>
  );
}
