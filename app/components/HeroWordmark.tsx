// app/components/HeroWordmark.tsx
//
// The name set large, with a picture inside it that keeps changing, and
// letters that take colour when the name is pressed.
//
// Two behaviours, both from the reference:
//
//   The picture is a screensaver, not an entrance. It changes about once a
//   second and never stops while the page is open — the slot inside the
//   wordmark is a frame that work keeps passing through. An earlier pass here
//   dealt a short shuffle on mount and then held one image forever, which is a
//   different thing: a flourish rather than a fixture.
//
//   The letters take colour on press and drop it again. Pressing re-deals, so
//   the same word is a different object every time someone prods it.
//
// The picture is measured in the type's own units — height in `em` — so it
// scales with the font and stays on the cap height at every width. A pixel
// height drifts the moment the heading wraps.
"use client";

import { useCallback, useEffect, useState } from "react";

/** How long each frame is held. The reference sits at about a second. */
const HOLD_MS = 1000;

// Sampled out of the portrait in the slot: the sofa, the shirt, the wood
// behind him. Three, not six, and earthy rather than primary — the reference
// can run a full spectrum because its photograph is black and white, and this
// one is not. When the picture carries the colour the letters cannot also
// carry it, or the two fight and the word stops being readable.
const INK = ["#a13512", "#1e4e68", "#6b3a24"];

// How many letters take colour, and which. The reference does not paint every
// letter — it leaves runs of black and picks a few out, which is what keeps it
// a name rather than a swatch. Two in five here, stepped by the press so the
// same word is a different object each time.
const PAINTED = (i: number, press: number) => (i * 3 + press * 2) % 5 < 2;

export function HeroWordmark({
  first,
  second,
  image,
  alt,
  flash = [],
}: {
  first: string;
  second: string;
  /** The mode's own picture. It is part of the rotation, not the end of it. */
  image: string;
  alt: string;
  /** The other frames the slot passes through. */
  flash?: string[];
}) {
  // Every frame in one list, the mode's picture first, so a mode switch starts
  // the rotation on the face that belongs to it.
  const frames = [image, ...flash.filter((f) => f !== image)];
  const [at, setAt] = useState(0);
  // 0 is the plain name. Each press re-deals which letters take colour and
  // which stay ink; the fifth press puts it back, so this is a loop rather
  // than a one-way door into a permanently coloured heading.
  const [paint, setPaint] = useState(0);

  useEffect(() => {
    setAt(0);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || frames.length < 2) return;

    const id = window.setInterval(
      () => setAt((i) => (i + 1) % frames.length),
      HOLD_MS
    );
    return () => window.clearInterval(id);
    // frames is derived from these two and changing either should restart it
  }, [image, flash.join("|"), frames.length]);

  const repaint = useCallback(() => setPaint((p) => (p + 1) % 5), []);

  const letters = (word: string, offset: number) =>
    [...word].map((ch, i) => (
      <span
        key={`${word}-${i}`}
        style={{
          color:
            paint !== 0 && PAINTED(i + offset, paint)
              ? INK[(i + offset + paint) % INK.length]
              : undefined,
          transition: "color 220ms var(--ease-out)",
        }}
      >
        {ch}
      </span>
    ));

  return (
    <h1 className="mt-6 mb-7">
      <button
        type="button"
        onClick={repaint}
        aria-label={`${first} ${second} — press to recolour the name`}
        // The same face the index stage runs, so the two loudest pieces of
        // type on the site speak in one voice. Oswald is condensed, which buys
        // width back: the name takes less room than it did in Jakarta at the
        // same size, so the size goes up and the picture inside it gets more
        // room rather than less. Tracking sits near zero — negative tracking
        // tightens a wide grotesque, but on a condensed face the letters are
        // already close and pulling them further collapses the counters.
        className="block text-left font-display font-bold text-fg cursor-pointer
                   text-[clamp(44px,12.5vw,88px)] leading-[0.92] tracking-[0.004em]
                   rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {/* One flex line so the picture sits on the baseline run of the first
            word, and wraps under it rather than overflowing where there is no
            room — 390px has none. */}
        <span className="flex flex-wrap items-center gap-x-[0.18em] gap-y-[0.06em]">
          <span>{letters(first, 0)}</span>
          {/* Flush: no border, no rounding, so the block reads as a letterform
              in the word rather than a picture placed beside one. Greyscale
              for the same reason — a colour photograph next to type reads as
              an inset, a grey one reads as part of the setting. Every frame is
              mounted and only opacity moves, so nothing is fetched mid-change
              and there is no white gap between frames. */}
          <span className="relative inline-block h-[1.02em] w-[0.9em] shrink-0 overflow-hidden align-middle bg-bg-muted">
            {frames.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={i === 0 ? alt : ""}
                aria-hidden={i === 0 ? undefined : true}
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover object-center
                           transition-opacity duration-500 ease-[var(--ease-out)]"
                style={{ opacity: i === at ? 1 : 0 }}
              />
            ))}
          </span>
        </span>
        <span className="block">{letters(second, first.length)}</span>
      </button>
    </h1>
  );
}
