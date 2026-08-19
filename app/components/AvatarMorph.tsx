// app/components/AvatarMorph.tsx
// Small single avatar that crossfades between the two portraits when the role
// toggles. Both sources are pre-cropped square to head-and-shoulders, so the
// faces sit at a comparable scale and the outgoing frame reads as becoming
// the incoming one rather than swapping.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfileMode, type Mode } from "./ProfileMode";

const PORTRAIT: Record<Mode, { src: string; alt: string }> = {
  analyst: {
    src: "/avatar-analyst.jpg",
    alt: "Fauzy, seated against a white backdrop",
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
        scale: active ? 1 : 1.08,
        filter: active ? "blur(0px)" : "blur(6px)",
      }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden={!active}
    >
      {failed ? (
        <div className="w-full h-full bg-bg-muted" />
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

/** Clicking the avatar toggles the role, the same affordance as the pills. */
export function AvatarMorph() {
  const { mode, setMode } = useProfileMode();

  return (
    <button
      type="button"
      onClick={() => setMode(mode === "analyst" ? "capture" : "analyst")}
      aria-label="Switch portrait"
      className="relative w-24 h-24 rounded-full overflow-hidden border border-border bg-bg-subtle hover:border-border-strong transition-colors duration-300"
    >
      <Portrait mode="analyst" active={mode === "analyst"} />
      <Portrait mode="capture" active={mode === "capture"} />
    </button>
  );
}
