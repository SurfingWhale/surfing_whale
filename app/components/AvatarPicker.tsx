// app/components/AvatarPicker.tsx
// Two portrait cards stacked like a small deck: the active one sits square on
// top, the other peeks out rotated behind it, and the pair fans apart on hover
// (or on tap, where there is no hover). Clicking either — or swiping across
// them — switches the role.
"use client";

import { useRef, useState } from "react";
import { useProfileMode, MODE_LABEL, type Mode } from "./ProfileMode";

const PORTRAIT: Record<Mode, { src: string; alt: string }> = {
  analyst: {
    src: "/avatar-analyst.jpg",
    alt: "Fauzy seated against a white backdrop",
  },
  capture: {
    src: "/avatar-capture.jpg",
    alt: "Fauzy holding a film camera up to his eye",
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
      aria-label={`Show ${MODE_LABEL[mode]}`}
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
          onSelect={() => setMode(m)}
        />
      ))}
    </div>
  );
}
