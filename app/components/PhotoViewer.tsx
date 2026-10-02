// app/components/PhotoViewer.tsx
// Fullscreen viewer for the photographs. They are the work, so they get to be
// seen at more than column width.
//
// Three things here exist because QA found them missing, and each is worth
// stating because they are easy to drop again in a refactor.
//
// 1. OPENING PUSHES A HISTORY ENTRY. Without it, Back — the browser button on
//    a desktop, the system gesture or key on a phone — does not close the
//    photograph. It leaves the site. Every other page on this site has a
//    "← Back" in the top left, so a reader arrives here having been taught
//    that Back is how you get out, presses it, and lands somewhere else
//    entirely. The entry is popped on close, so the history stack is left the
//    way it was found.
//
// 2. THE WAY OUT IS IN THE TOP LEFT, where this site always puts it. The old
//    viewer had only a ✕ in a pill at the bottom right, over the browser's own
//    toolbar on a phone and nowhere near where anyone looks for "back".
//
// 3. FOCUS MOVES IN AND COMES BACK. `role="dialog" aria-modal="true"` is a
//    promise that the page behind is inert. It was not: focus stayed on the
//    thumbnail, so Tab walked the page underneath and a screen reader never
//    entered the dialog at all.
"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const panel = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLButtonElement>(null);
  // Whoever was focused when this opened, so it can be handed back.
  const opener = useRef<HTMLElement | null>(null);
  // True while a popstate is closing us, so the close handler knows not to go
  // back a second time and swallow a real page from the stack.
  const popping = useRef(false);

  const step = useCallback(
    (delta: number) => {
      if (index === null || photos.length === 0) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndex]
  );

  // `onClose` is an inline arrow in the caller, so it is a new function on
  // every render. Held in a ref, the effects below can depend on `open` alone
  // — which is what they actually care about. Depending on the callback made
  // every effect tear down and re-run each time the reader stepped to the next
  // photograph, and the teardown is what closes the viewer: pressing → closed
  // it instead of advancing. Found in QA, after the fix that introduced it.
  const close = useRef(onClose);
  close.current = onClose;

  // Back closes the photograph instead of leaving the site.
  //
  // The marker on the state is what makes this safe to pop: only an entry this
  // component pushed is ever popped, so arriving here with the viewer already
  // open — or closing after the reader navigated elsewhere — cannot eat
  // somebody else's history.
  useEffect(() => {
    if (!open) return;
    history.pushState({ photoViewer: true }, "");
    const onPop = () => {
      popping.current = true;
      close.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed by the ✕, Escape or the backdrop: the entry we pushed is still
      // on the stack, so take it off. Closed by Back: it is already gone.
      if (popping.current) popping.current = false;
      else if (history.state?.photoViewer) history.back();
    };
  }, [open]);

  // Opening and closing: what the page behind owes a modal. Keyed on `open`
  // only, so stepping between photographs never tears this down.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    // Focus the way out, not the image: the first thing a keyboard reader
    // should be able to do is leave.
    exit.current?.focus();
    // Hold the scroll position while the overlay is up.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener.current?.focus?.();
    };
  }, [open]);

  // Keys. This one may re-bind freely — adding and removing a listener costs
  // nothing and changes no state.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close.current(); return; }
      if (e.key === "ArrowRight") { step(1); return; }
      if (e.key === "ArrowLeft") { step(-1); return; }
      if (e.key !== "Tab") return;
      // Keep Tab inside the dialog, which is what aria-modal claims.
      const items = panel.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (!open || index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[10000]"
    >
      <button
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full bg-bg/[0.88] backdrop-blur-[4px] cursor-zoom-out border-0"
      />

      {/* The way out, in the top left, in the same words and the same place as
          the nav on every other page. `env(safe-area-inset-*)` keeps it clear
          of a notch; the pill keeps it readable if a tall photograph reaches
          up behind it. */}
      <button
        ref={exit}
        type="button"
        onClick={onClose}
        className="absolute z-10 flex items-center gap-2 h-10 pl-3 pr-4 rounded-full
          bg-bg/90 text-[13px] text-fg-secondary hover:text-fg
          shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.06)]
          transition-colors duration-200"
        style={{
          top: "max(1.25rem, env(safe-area-inset-top))",
          left: "max(1.25rem, env(safe-area-inset-left))",
        }}
      >
        <span aria-hidden="true">←</span> Back
      </button>

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

      {photos.length > 1 && (
        <div
          className="absolute flex items-center gap-1 px-1 py-1 rounded-[22px] bg-bg/90
            shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.06)]"
          style={{
            right: "max(1.25rem, env(safe-area-inset-right))",
            // Clears the home indicator and the browser's own bottom chrome,
            // which is exactly where this pill used to sit.
            bottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
        >
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
        </div>
      )}
    </div>
  );
}
