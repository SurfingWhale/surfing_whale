// app/studio/Archive.tsx
// The visual archive: loose frames that belong to no essay.
//
// The darkroom next door takes photographs in too, but everything that goes
// through it has to belong to a piece of writing — which is the right shape
// for a photo essay and the wrong shape for "here are forty frames from this
// month". This room has no title field, no ordering, no publish step. Drop
// files, they go up, they are in the archive.
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

export function Archive() {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/archive/list")
      .then((r) => r.json())
      .then((d) => setFrames(d.frames ?? []))
      .catch(() => setFrames([]));
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
        const shot = await sendPhoto(list[i], "archive", (b, a) =>
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
    const res = await fetch("/api/archive/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    }).catch(() => null);
    if (res?.ok) {
      setFrames((f) => (f ?? []).filter((x) => x.publicId !== publicId));
      setNote("Removed from the archive.");
    } else {
      setNote("Could not remove that frame. Try again in a moment.");
    }
    setRemoving(null);
  };

  return (
    <div>
      <RoomHeader room="archive" />

      <div className="space-y-3">
        <DropZone
          onFiles={(files) => void ingest(files)}
          hint="Compressed in the browser before sending, location data removed. JPEG, PNG, WebP, AVIF — or HEIC from an iPhone."
        />
        <PendingList pending={pending} />
        <p role="status" className="text-[13px] leading-[1.7] text-fg-body empty:hidden">{note}</p>
      </div>

      <section aria-labelledby="archive-frames" className="mt-8">
        <h3 id="archive-frames" className={`${labelClass} mb-3`}>
          In the archive{frames ? ` · ${frames.length}` : ""}
        </h3>

        {frames === null && <p className="text-[13px] leading-[1.7] text-fg-muted">Loading…</p>}
        {frames?.length === 0 && (
          <div className="rounded-xl border border-border px-4 py-5">
            <p className="text-[13px] leading-[1.7] text-fg-body">Nothing in the archive yet.</p>
            <p className="text-[13px] leading-[1.7] text-fg-muted">
              The public archive page stays hidden until there is something in here.
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
                        ? "Tap again to remove this frame for good"
                        : "Remove this frame from the archive"
                    }
                    className={
                      armed === f.publicId
                        ? ""
                        : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
                    }
                  >
                    {removing === f.publicId ? "Removing…" : armed === f.publicId ? "Confirm" : "Remove"}
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
