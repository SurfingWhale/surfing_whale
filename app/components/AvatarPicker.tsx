// app/components/AvatarPicker.tsx
// Both portraits sit side by side and act as the role switch — the active one
// comes forward, the other holds back. Replaces the pill toggle entirely, so
// the photographs carry the affordance rather than a pair of labelled buttons.
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
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

function AvatarCard({ mode, active, onSelect }: {
  mode: Mode;
  active: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const { src, alt } = PORTRAIT[mode];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Show ${MODE_LABEL[mode]}`}
      initial={false}
      animate={{ scale: active ? 1 : 0.82, opacity: active ? 1 : 0.45 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`relative w-20 h-20 rounded-full overflow-hidden bg-bg-subtle transition-shadow duration-300 ${
        active
          ? "ring-2 ring-fg ring-offset-2 ring-offset-bg"
          : "ring-1 ring-border hover:ring-border-strong"
      }`}
    >
      {failed ? (
        <span className="block w-full h-full bg-bg-muted" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover grayscale"
          draggable={false}
        />
      )}
    </motion.button>
  );
}

export function AvatarPicker() {
  const { mode, setMode } = useProfileMode();
  const startX = useRef<number | null>(null);

  // Horizontal swipe moves between portraits on touch devices.
  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
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
      className="flex items-center gap-4 touch-pan-y"
    >
      {ORDER.map((m) => (
        <AvatarCard
          key={m}
          mode={m}
          active={mode === m}
          onSelect={() => setMode(m)}
        />
      ))}
    </div>
  );
}
