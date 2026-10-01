// app/components/AvatarPicker.tsx
// Two portrait cards stacked like a small deck: the active one sits square on
// top, the other peeks out rotated behind it, and the pair fans apart on hover
// (or on tap, where there is no hover). Clicking either — or swiping across
// them — switches the role.
"use client";

import { Fragment, useRef, useState } from "react";
import { useProfileMode, MODE_LABEL, type Mode } from "./ProfileMode";

const PORTRAIT: Record<Mode, { src: string; alt: string }> = {
  analyst: {
    src: "/avatar-analyst.jpg",
    alt: "Fauzy seated against a white backdrop",
  },
  // A photograph, not another portrait of him. The card is what the side it
  // switches to contains: the analyst side is the person doing the work, the
  // capture side is the work itself. Two pictures of the same face told a
  // reader nothing about the difference between them.
  capture: {
    src: "/photos/tower-above-clouds.jpg",
    alt: "A tower rising above cloud — from the photography archive",
  },
};

const ORDER: Mode[] = ["analyst", "capture"];
const SWIPE_THRESHOLD = 40;

function AvatarCard({ mode, active, open, onSelect }: {
  mode: Mode;
  active: boolean;
  open: boolean;
  onSelect: () => void;
}) {
  // The card behind is almost entirely covered at rest, so its centre is not
  // clickable until the pair fans — which never happens without hover. Both
  // cards therefore advance the deck: the top one is always hittable, and the
  // one behind selects itself once it is exposed.
  const [failed, setFailed] = useState(false);
  const { src, alt } = PORTRAIT[mode];

  // Resting: active square-ish on top, inactive nudged out and rotated behind.
  // Fanned: the inactive card slides clear so both read as pickable.
  const transform = active
    ? open
      ? "translateX(0) rotate(-2deg)"
      : "translate(0, 0) rotate(-1.5deg)"
    : open
      ? "translateX(86px) rotate(3deg)"
      : "translate(9px, 2px) rotate(6deg)";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={active ? `Showing ${MODE_LABEL[mode]} — switch` : `Show ${MODE_LABEL[mode]}`}
      style={{ transform, transformOrigin: "50% 58%" }}
      className={`absolute top-0 left-0 w-[78px] h-[82px] p-1 pb-2 rounded-[18px] bg-white border-0 cursor-pointer
        transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)]
        shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_rgba(24,24,24,0.08),0_8px_22px_rgba(24,24,24,0.1)]
        hover:shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_2px_4px_rgba(24,24,24,0.1),0_12px_28px_rgba(24,24,24,0.13)]
        active:scale-95 ${active ? "z-20" : "z-10"}`}
    >
      {failed ? (
        <span className="block w-full h-full rounded-[14px] bg-bg-muted" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          draggable={false}
          className="block w-full h-full object-cover rounded-[14px] grayscale outline outline-1 -outline-offset-1 outline-black/10"
        />
      )}
    </button>
  );
}

export function AvatarPicker() {
  const { mode, setMode } = useProfileMode();
  const other = (m: Mode): Mode => (m === "analyst" ? "capture" : "analyst");
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setOpen(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    const index = ORDER.indexOf(mode);
    const next = dx < 0 ? index + 1 : index - 1;
    if (next >= 0 && next < ORDER.length) setMode(ORDER[next]);
  };

  return (
    <div
      role="group"
      aria-label="Choose what to view"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="relative w-[164px] h-[82px] mb-[18px] touch-pan-y"
    >
      {ORDER.map((m) => (
        <AvatarCard
          key={m}
          mode={m}
          active={mode === m}
          open={open}
          onSelect={() => setMode(mode === m ? other(m) : m)}
        />
      ))}
    </div>
  );
}

// The same switch, in words.
//
// The deck above is two photographs and nothing else. A reader who has not
// already worked out that this site has two halves sees two small pictures
// and no reason to touch them — the only thing that said what pressing one
// would do was an aria-label, which is to say it was said to screen readers
// and to nobody else. That is the same gap MODE_KICKER was written to close
// one level up, left open at the control itself.
//
// So the two sides are named, and naming them is also the sentence this page
// was missing: that the data work and the photographs are one person's site
// on purpose, not two sites that ended up sharing a domain. Short labels
// rather than the modes' own names — "Joie de Vivre" tells a stranger
// nothing about what is behind it.
//
// This is one control rendered twice, not a second control: both read and
// write the same state, the way a tab bar and a swipe do.
const SWITCH_LABEL: Record<Mode, string> = {
  analyst: "Data",
  capture: "Photographs",
};

export function ModeSwitch() {
  const { mode, setMode } = useProfileMode();
  return (
    <div
      role="group"
      aria-label="Two sides of this site"
      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.06em] leading-[1.7]"
    >
      {ORDER.map((m, i) => (
        <Fragment key={m}>
          {i > 0 && (
            <span aria-hidden="true" className="text-fg-muted">
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`cursor-pointer transition-colors duration-200 rounded-sm
              focus-visible:outline-2 focus-visible:outline-offset-2 ${
                mode === m
                  ? "text-fg underline decoration-border-strong underline-offset-[3px]"
                  : "text-fg-muted hover:text-fg-body"
              }`}
          >
            {SWITCH_LABEL[m]}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
