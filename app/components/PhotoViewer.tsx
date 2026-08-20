// app/components/PhotoViewer.tsx
// Fullscreen viewer for the archive. Photographs are the work, so they get to
// be seen at more than column width.
"use client";

import { useCallback, useEffect } from "react";
import type { Photo } from "@/app/data/photography";

export function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null || photos.length === 0) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndex]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);

    // Hold the scroll position while the overlay is up.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, step]);

  if (!open || index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[10000]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute inset-0 w-full h-full bg-bg/[0.88] backdrop-blur-[4px] cursor-zoom-out border-0"
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 md:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="max-w-full max-h-full w-auto h-auto object-contain shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        />
      </div>

      <div className="absolute right-5 bottom-5 flex items-center gap-1 pl-3.5 pr-1 py-1 rounded-[22px] bg-bg/90 shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.06)]">
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photograph"
              className="w-9 h-9 grid place-items-center rounded-full text-fg-secondary hover:text-fg hover:bg-fg/5 transition-colors"
            >
              ←
            </button>
            <span className="min-w-[46px] text-center text-[11px] tabular-nums text-fg-secondary tracking-normal">
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photograph"
              className="w-9 h-9 grid place-items-center rounded-full text-fg-secondary hover:text-fg hover:bg-fg/5 transition-colors"
            >
              →
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="w-9 h-9 grid place-items-center rounded-full text-fg-secondary hover:text-fg hover:bg-fg/5 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
