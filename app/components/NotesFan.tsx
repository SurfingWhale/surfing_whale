// app/components/NotesFan.tsx
//
// The guest notes as a hand of cards rather than a list.
//
// A list of notes reads as a comments section — something to scroll past. The
// same notes dealt as a fan read as a stack of letters someone kept, which is
// the difference the ask was about: it is the same content making a claim
// about how many people have been here.
//
// The fan is one transform per card. Every card shares a transform-origin
// well below itself, so rotating a card sweeps it along an arc rather than
// spinning it in place — that single line is what makes a hand of cards a
// hand of cards. Everything else is bookkeeping: how far from the front a
// card is decides its angle, its scale, how far it sits back and which side
// of its neighbour it stacks on.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface FanNote {
  id: string;
  name: string;
  message: string;
  date: string;
}

// The whole spread, not the gap between two cards: three notes should fan as
// widely as thirty, or a long guest book becomes a closed fist.
const SPREAD_DEG = 38;
const MAX_STEP = 7;
const DRAG_PER_CARD = 70;
// How far below the card the pivot sits. Bigger sweeps wider, and the sweep
// is what runs the far cards off a phone: at a 430px pivot and 9 degrees a
// card three out lands 200px sideways, which on a 390px screen is past the
// edge. These two numbers are the fan's whole size, and they were measured
// against a 390px viewport rather than picked.
const PIVOT_PX = 330;
// Past this the cards are gone, so they are not drawn, not hit-tested and not
// read out.
const VISIBLE = 2.6;

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NotesFan({ notes }: { notes: FanNote[] }) {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const live = useRef<HTMLDivElement>(null);

  const n = notes.length;
  const step = Math.min(MAX_STEP, SPREAD_DEG / Math.max(1, n - 1));

  const go = useCallback(
    (to: number) => setActive(Math.max(0, Math.min(n - 1, to))),
    [n]
  );

  // Arrow keys when the fan has focus. A carousel that only answers to a
  // pointer is a carousel half the people on a page cannot use.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null) return;
    setDrag(e.clientX - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    // Dragged far enough to count as a card, and dragging left advances —
    // the fan follows the hand rather than the index.
    const moved = Math.round(-drag / DRAG_PER_CARD);
    if (moved) go(active + moved);
    start.current = null;
    setDrag(0);
  };

  // Opens on the middle card, so the fan is balanced at rest instead of
  // leaning entirely to one side.
  useEffect(() => { setActive(Math.floor((n - 1) / 2)); }, [n]);

  if (n === 0) return null;

  return (
    <div>
      <div
        ref={live}
        role="group"
        aria-roledescription="carousel"
        aria-label="Notes left by visitors"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        // overflow-hidden so a wide fan bleeds off its own box rather than
        // off the page — verified at 0 horizontal page overflow.
        className="relative h-[286px] sm:h-[310px] overflow-hidden touch-pan-y select-none
          rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {notes.map((note, i) => {
          // How far this card sits from the front, with the drag folded in so
          // the fan moves under the finger instead of snapping at the end.
          const from = i - active - drag / DRAG_PER_CARD;
          const away = Math.abs(from);
          const front = Math.round(from) === 0;
          return (
            <article
              key={note.id}
              aria-hidden={away > VISIBLE ? true : undefined}
              onClick={() => !front && go(i)}
              style={{
                transform: `rotate(${(from * step).toFixed(2)}deg) translateY(${(
                  away * 4
                ).toFixed(1)}px) scale(${Math.max(0.86, 1 - away * 0.05).toFixed(3)})`,
                // Below the card, so a rotation sweeps along an arc. This is
                // the whole illusion.
                transformOrigin: `50% ${PIVOT_PX}px`,
                opacity: away > VISIBLE ? 0 : Math.max(0.3, 1 - away * 0.2),
                zIndex: 100 - Math.round(away * 10),
                pointerEvents: away > VISIBLE ? "none" : undefined,
                transition: start.current === null
                  ? "transform 420ms cubic-bezier(0.2,0,0,1), opacity 420ms ease"
                  : "none",
              }}
              className={`absolute left-1/2 top-2 -ml-[116px] w-[232px] h-[204px] p-4
                sm:-ml-[132px] sm:w-[264px] sm:h-[216px] sm:p-5
                rounded-[16px] bg-bg border border-border
                shadow-[0_1px_2px_rgba(24,24,24,.06),0_14px_34px_rgba(24,24,24,.10)]
                motion-reduce:!transition-none
                ${front ? "" : "cursor-pointer"}`}
            >
              <p className="text-[13px] leading-[1.75] text-fg-body line-clamp-5 whitespace-pre-line">
                {note.message}
              </p>
              <footer className="absolute left-5 right-5 bottom-5 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-fg truncate">
                  {note.name}
                </span>
                <span className="text-[11px] text-fg-muted shrink-0 tabular-nums">
                  {formatDate(note.date)}
                </span>
              </footer>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 mt-5">
        <p className="text-[11px] text-fg-muted tabular-nums" aria-live="polite">
          {active + 1} / {n}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="Previous note"
            className="w-8 h-8 grid place-items-center rounded-full border border-border
              text-fg-body hover:text-fg hover:border-border-strong
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" fill="none" aria-hidden="true"><path d="M7.5 2L3.5 6l4 4" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            disabled={active === n - 1}
            aria-label="Next note"
            className="w-8 h-8 grid place-items-center rounded-full border border-border
              text-fg-body hover:text-fg hover:border-border-strong
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" fill="none" aria-hidden="true"><path d="M4.5 2l4 4-4 4" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
