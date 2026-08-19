// app/components/AvatarMorph.tsx
// Crossfade between the two portraits when the role toggles. The outgoing
// frame scales up and blurs out while the incoming one settles — a dissolve
// rather than a true geometric morph, which reads as a morph because both
// portraits are framed alike.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfileMode, type Mode } from "./ProfileMode";

// Both source files are pre-cropped square around their subject, so the two
// figures occupy a comparable share of the frame and the crossfade reads as
// one portrait becoming the other rather than jumping in scale.
const PORTRAIT: Record<Mode, { src: string; alt: string }> = {
  analyst: {
    src: "/avatar-analyst.jpg",
    alt: "Fauzy seated on a stool against a white backdrop",
  },
  capture: {
    src: "/avatar-capture.jpg",
    alt: "Fauzy holding a film camera up to his eye",
  },
};

function Portrait({ mode, active }: { mode: Mode; active: boolean }) {
  const [failed, setFailed] = useState(false);
  const { src, alt } = PORTRAIT[mode];

  return (
    <motion.div
      className="absolute inset-0"
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        scale: active ? 1 : 1.06,
        filter: active ? "blur(0px)" : "blur(10px)",
      }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden={!active}
    >
      {failed ? (
        // Keeps the layout intentional until the real files are dropped in.
        <div className="w-full h-full flex items-center justify-center bg-bg-muted text-fg-muted text-xs text-center px-4">
          {mode === "capture" ? "camera portrait" : "profile portrait"}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={active ? alt : ""}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover grayscale"
        />
      )}
    </motion.div>
  );
}

export function AvatarMorph() {
  const { mode } = useProfileMode();

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border border-border bg-bg-subtle">
      <Portrait mode="analyst" active={mode === "analyst"} />
      <Portrait mode="capture" active={mode === "capture"} />
    </div>
  );
}
