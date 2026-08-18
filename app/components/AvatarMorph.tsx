// app/components/AvatarMorph.tsx
// Crossfade between the two portraits when the role toggles. The outgoing
// frame scales up and blurs out while the incoming one settles — a dissolve
// rather than a true geometric morph, which reads as a morph because both
// portraits are framed alike.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfileMode, type Mode } from "./ProfileMode";

// The two portraits are framed very differently — one is a full-body seated
// shot with the subject low in frame, the other a tight headshot. A square
// crop mangles the first, so the frame is 3:4 and each image carries its own
// focal point to keep the subject placed consistently through the crossfade.
const PORTRAIT: Record<Mode, { src: string; alt: string; position: string }> = {
  analyst: {
    src: "/avatar-analyst.jpg",
    alt: "Fauzy seated on a stool against a white backdrop",
    position: "center 55%",
  },
  capture: {
    src: "/avatar-capture.jpg",
    alt: "Fauzy holding a film camera up to his eye",
    position: "center 35%",
  },
};

function Portrait({ mode, active }: { mode: Mode; active: boolean }) {
  const [failed, setFailed] = useState(false);
  const { src, alt, position } = PORTRAIT[mode];

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
          style={{ objectPosition: position }}
          className="w-full h-full object-cover grayscale"
        />
      )}
    </motion.div>
  );
}

export function AvatarMorph() {
  const { mode } = useProfileMode();

  return (
    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto overflow-hidden rounded-2xl border border-border bg-bg-subtle">
      <Portrait mode="analyst" active={mode === "analyst"} />
      <Portrait mode="capture" active={mode === "capture"} />
    </div>
  );
}
