// app/studio/Archive.tsx
// The visual archive: loose frames that belong to no essay.
//
// The darkroom next door takes photographs in too, but everything that goes
// through it has to belong to a piece of writing — which is the right shape
// for a photo essay and the wrong shape for "here are forty frames from this
// month". This room has no title field, no ordering, no publish step. Drop
// files, they go up, they are in the archive.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { size } from "@/app/darkroom/downscale";
import { sendPhoto } from "@/app/darkroom/sendPhoto";

interface Frame {
  publicId: string;
  url: string;
  width: number;
  height: number;
  takenAt: string;
}

interface Pending {
  name: string;
  state: "compressing" | "uploading" | "failed";
  error?: string;
  saved?: string;
}

const chip =
  "text-[11px] leading-[1.6] px-2 py-1 rounded-md border border-border text-fg-body hover:text-fg hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200";

export function Archive() {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/archive/list")
      .then((r) => r.json())
      .then((d) => setFrames(d.frames ?? []))
      .catch(() => setFrames([]));
  }, []);
  useEffect(load, [load]);

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
    const res = await fetch("/api/archive/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    if (res.ok) setFrames((f) => (f ?? []).filter((x) => x.publicId !== publicId));
    else setNote("Could not remove that frame.");
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void ingest(e.dataTransfer.files);
        }}
        className={`border border-dashed rounded-lg px-6 py-10 text-center transition-colors duration-200 ${
          drag ? "border-fg bg-bg-muted" : "border-border"
        }`}
      >
        <p className="text-[13px] leading-[2] text-fg-body">
          Drop photographs here, or{" "}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px]"
          >
            choose files
          </button>
          .
        </p>
        <p className="text-[11px] leading-[1.7] text-fg-muted mt-2">
          Compressed in the browser before sending, location data removed. JPEG, PNG, WebP, AVIF — or HEIC from an iPhone.
        </p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <ul className="mt-5 space-y-1">
          {pending.map((p, i) => (
            <li key={`${p.name}-${i}`} className="text-[11px] leading-[1.8] text-fg-muted">
              {p.name} — {p.state === "failed" ? `failed: ${p.error}` : `${p.state}…`}
              {p.saved && <span className="font-mono"> {p.saved}</span>}
            </li>
          ))}
        </ul>
      )}

      {note && <p className="mt-5 text-[11px] leading-[1.8] text-fg-body">{note}</p>}

      <p className="mt-9 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label">
        In the archive{frames ? ` · ${frames.length}` : ""}
      </p>

      {frames === null && (
        <p className="mt-3 text-[13px] leading-[2] text-fg-muted">Loading…</p>
      )}
      {frames?.length === 0 && (
        <p className="mt-3 text-[13px] leading-[2] text-fg-muted">
          Nothing yet. The public archive page stays hidden until there is
          something in here.
        </p>
      )}

      {frames && frames.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {frames.map((f) => (
            <li key={f.publicId} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt=""
                loading="lazy"
                className="w-full aspect-square object-cover rounded-md bg-bg-muted"
              />
              <button
                type="button"
                onClick={() => void remove(f.publicId)}
                aria-label="Remove this frame from the archive"
                className={`${chip} absolute top-1 right-1 bg-bg opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
