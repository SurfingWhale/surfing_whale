// app/components/HeroWordmark.tsx
//
// The name set large, with a picture sitting inside it rather than beside it —
// and the picture flashes through a handful of frames before it settles.
//
// The flash is the point. In the reference the block inside the wordmark is
// not one photograph, it is several cutting past each other; the name arrives
// and the picture is still deciding what it is. A still image in that slot is
// a different thing entirely, which is what was there before.
//
// The move only works if the image is measured in the type's own units — its
// height is set in `em`, so it scales with the font and stays locked to the
// cap height at every width. Give it a pixel height and it drifts the moment
// the heading wraps.
"use client";

import { useEffect, useRef, useState } from "react";

/** How long each frame is held, and how many are dealt before it settles. */
const HOLD_MS = 85;
const DEALS = 9;

export function HeroWordmark({
  first,
  second,
  image,
  alt,
  flash = [],
}: {
  first: string;
  second: string;
  /** Where it lands. */
  image: string;
  alt: string;
  /** Frames dealt on the way there. */
  flash?: string[];
}) {
  const [shown, setShown] = useState(image);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Nothing to deal from, or the visitor has asked for no motion: land
    // straight on the image and skip the performance.
    if (reduce || flash.length === 0) {
      setShown(image);
      return;
    }

    for (let i = 0; i < DEALS; i++) {
      timers.current.push(
        window.setTimeout(() => {
          // Never deal the landing image mid-flight — seeing it twice reads as
          // a stutter rather than as a shuffle that stopped.
          const pool = flash.filter((f) => f !== image);
          setShown(pool[i % pool.length] ?? image);
        }, i * HOLD_MS)
      );
    }
    timers.current.push(
      window.setTimeout(() => setShown(image), DEALS * HOLD_MS)
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [image, flash]);

  return (
    <h1
      // The same face the index stage runs, so the two loudest pieces of type
      // on the site are speaking in one voice rather than two. Oswald is
      // condensed, which buys width back: the name takes less room than it did
      // in Jakarta at the same size, so the size goes up and the picture set
      // into it gets more room rather than less.
      //
      // Tracking goes from -0.04em to near zero. Negative tracking tightens a
      // wide grotesque; on a condensed face the letters are already close and
      // pulling them further collapses the counters.
      className="mt-6 mb-7 font-display font-bold text-fg
                 text-[clamp(44px,12.5vw,88px)] leading-[0.92] tracking-[0.004em]"
    >
      {/* One flex line so the picture sits on the baseline run of the first
          word, and wraps under it rather than overflowing when there is no
          room — 390px has none. */}
      <span className="flex flex-wrap items-center gap-x-[0.18em] gap-y-[0.06em]">
        <span>{first}</span>
        {/* Flush, the way the reference sets it: no border and no rounding, so
            the block reads as a letterform in the word rather than as a
            picture placed next to one. Greyscale for the same reason — a
            colour photograph beside black type reads as an inset, a grey one
            reads as part of the setting.

            Near-square, not the wide block the reference uses: theirs holds a
            landscape scene, this holds a face shot square on a white wall.
            Sized just over the cap height, because at 0.86em it read as a
            stamp beside a condensed bold. */}
        <span className="relative inline-block h-[1.02em] w-[0.9em] shrink-0 overflow-hidden align-middle bg-bg-muted">
          {/* Every frame is mounted and only opacity changes. Swapping one
              img's src would make the browser fetch mid-flash and paint
              nothing in between — at 85ms a hold that is the whole frame. */}
          {[image, ...flash].map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={src === image ? alt : ""}
              aria-hidden={src === image ? undefined : true}
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-center grayscale"
              style={{ opacity: shown === src ? 1 : 0 }}
            />
          ))}
        </span>
      </span>
      <span className="block">{second}</span>
    </h1>
  );
}
