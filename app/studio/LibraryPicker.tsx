// app/studio/LibraryPicker.tsx
// Choosing photographs that are already in the library, from inside an editor.
//
// The library is the one place photographs live; an essay or a post only
// points at them. So adding a frame to an essay should not mean uploading it a
// second time — it means picking it.
//
// A native <dialog> opened with showModal(): the rest of the page goes inert,
// Tab stays inside, Escape closes it, and focus goes back to the button that
// opened it. None of that has to be rebuilt by hand.
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

export interface LibraryPhoto {
  publicId: string;
  url: string;
  width: number;
  height: number;
  takenAt: string;
}

export function LibraryPicker({
  open,
  multiple = true,
  onPick,
  onClose,
}: {
  open: boolean;
  /** One photograph for a post's image block; any number for an essay. */
  multiple?: boolean;
  onPick: (photos: LibraryPhoto[]) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [photos, setPhotos] = useState<LibraryPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setChosen([]);
      setError(null);
      // Fetched each time it opens, so a photograph uploaded a moment ago in
      // the Photos room is already here.
      fetch("/api/library/list", { cache: "no-store" })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error ?? "Could not load the library.");
          setPhotos(data.photos ?? []);
        })
        .catch((err) => {
          setPhotos([]);
          setError(err instanceof Error ? err.message : "Could not load the library.");
        });
    }
    if (!open && d.open) d.close();
  }, [open]);

  const toggle = (id: string) => {
    setError(null);
    setChosen((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : multiple ? [...c, id] : [id]
    );
  };

  const add = () => {
    if (!chosen.length) return setError(multiple ? "Tap the photos you want first." : "Tap a photo first.");
    // In the order they were tapped, which is the order they will sit in.
    const byId = new Map((photos ?? []).map((p) => [p.publicId, p]));
    onPick(chosen.map((id) => byId.get(id)).filter((p): p is LibraryPhoto => Boolean(p)));
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="library-picker-title"
      className="m-auto w-[min(960px,calc(100vw-32px))] max-h-[min(720px,calc(100dvh-32px))] rounded-2xl border border-border bg-bg text-fg p-0 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] backdrop:bg-black/40"
    >
      <div className="flex flex-col max-h-[inherit]">
        <header className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-border shrink-0">
          <h2 id="library-picker-title" className="text-[15px] font-medium tracking-[-0.02em]">
            {multiple ? "Choose from the library" : "Choose a photo"}
          </h2>
          <Button variant="quiet" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="overflow-y-auto px-4 sm:px-6 py-4 min-h-[200px]">
          {photos === null && <p className="text-[13px] leading-[1.7] text-fg-muted">Loading…</p>}
          {error && <p role="alert" className="text-[13px] leading-[1.7] text-fg">{error}</p>}
          {photos && photos.length === 0 && !error && (
            <p className="text-[13px] leading-[1.7] text-fg-body">
              The library is empty. Upload in the Photos room, or use Choose photos in
              the editor — either way they land here.
            </p>
          )}
          {photos && photos.length > 0 && (
            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {photos.map((p) => {
                const at = chosen.indexOf(p.publicId);
                const on = at >= 0;
                return (
                  <li key={p.publicId}>
                    <button
                      type="button"
                      onClick={() => toggle(p.publicId)}
                      aria-pressed={on}
                      aria-label={`Photo uploaded ${p.takenAt ? new Date(p.takenAt).toLocaleDateString("en-GB") : ""}${on ? ", chosen" : ""}`}
                      className={`relative block w-full rounded-md overflow-hidden bg-bg-muted outline-offset-2 transition-[box-shadow] duration-150 ${
                        on ? "shadow-[0_0_0_3px_var(--fg)]" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" loading="lazy" className="w-full aspect-square object-cover" />
                      {on && (
                        <span className="absolute top-1.5 right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-fg text-bg text-[11px] font-medium grid place-items-center tabular-nums">
                          {multiple ? at + 1 : "✓"}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-border shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={add}>
            {chosen.length > 1 ? `Add ${chosen.length} photos` : "Add photo"}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
