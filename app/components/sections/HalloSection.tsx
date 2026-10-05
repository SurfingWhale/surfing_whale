// app/components/sections/HalloSection.tsx
//
// The greeting, with the work scattered round it.
//
// It used to be the word alone on an empty screen — which, now that the hero
// opens with evidence (PRD 24), meant a stranger met a full screen of nothing
// before meeting any of it. The word stays; what is round it is the point.
//
// The structure is borrowed and the look is not. The reference pinned small
// captioned photographs at irregular positions around a centred serif line,
// each one labelled in a handwriting-sized note — "new manicure", "my gym" —
// so the screen reads as a pinboard rather than a hero. That arrangement is
// what is taken. Its deep red ground and its typeface are not: this site is
// ink on paper, and dropping someone else's colour into it would make the
// first screen the one place on the site that belongs to a different site.
//
// The pictures cycle. That behaviour came off the wordmark the hero used to
// carry — a slot that work keeps passing through, changing about once a
// second and never stopping while the page is open. Choosing the plate for the
// hero cost that, and this is where it goes: six slots instead of one, each on
// its own offset so they never flip together, which is the difference between
// a pinboard breathing and a slideshow.
"use client";

import { useEffect, useRef, useState } from "react";
import { ChromeWord } from "@/app/components/ChromeWord";

// One plate changes per tick, and there are six plates — so any given plate
// holds for 6 x 700ms, about four seconds, and something on the board is
// always just about to move. The wordmark this came from held one slot for a
// second; six slots on that clock would be a strobe.
const TICK_MS = 700;

interface Frame {
  src: string;
  alt: string;
  /** The note pinned beside it. Short, lowercase, true. */
  note: string;
}

// Every caption is the photograph's own description cut short — the alts in
// app/data/photography.ts. Nothing here is invented copy about a picture
// nobody checked.
const PLATES: Frame[][] = [
  [
    { src: "/photos/cilincing-worker.jpg", alt: "A dock worker in an orange jacket crossing a plank between concrete forms", note: "a plank in Cilincing" },
    { src: "/work/flash/a2.jpg", alt: "The same dock, a moment earlier", note: "same dock, earlier" },
  ],
  [
    { src: "/photos/jakarta-platform.jpg", alt: "Commuters waiting on a Jakarta station platform, tracks curving away toward the skyline", note: "waiting for the train" },
    { src: "/work/flash/a3.jpg", alt: "The platform from the footbridge", note: "from the footbridge" },
  ],
  [
    { src: "/photos/tower-above-clouds.jpg", alt: "A telecoms tower standing above a bank of cloud, shot on black and white film", note: "above the cloud" },
    { src: "/work/flash/a4.jpg", alt: "The same tower, black and white", note: "black and white" },
  ],
  [
    { src: "/photos/cirimpak-valley.jpg", alt: "A valley town seen through foliage from a hillside, a transmission tower rising from the treeline", note: "a valley, through trees" },
    { src: "/work/flash/a6.jpg", alt: "The valley from higher up", note: "higher up" },
  ],
  [
    { src: "/photos/lantern-market.jpg", alt: "A man on a stairway looking toward a market stall hung with red lanterns, a light leak across the frame", note: "red lanterns" },
    { src: "/work/flash/a5.jpg", alt: "The stairway by the stall", note: "the stairway" },
  ],
  [
    { src: "/work/flash/a7.jpg", alt: "Fauzy, sitting", note: "the one of me" },
  ],
];

/** Where the note sits. The reference alternates; so does this. */
const NOTE_ABOVE = [true, false, true, false, true, false];

function Plate({ frames, i, tick, of }: { frames: Frame[]; i: number; tick: number; of: number }) {
  // The index advances once every `of` ticks, and the + i means each plate
  // crosses that boundary on a different tick — so exactly one changes at a
  // time, in a loop round the board.
  //
  // The first version of this wrote `(tick + i * 2) % frames.length`, which
  // for a two-frame list is `tick % 2` for EVERY plate: all six flipped in
  // unison, which is what the comment above it claimed it prevented. The
  // checker caught it only by accident — with every plate on one parity, a
  // 3.4-second sample window straddled the boundary and the test was a coin
  // toss. Staggering properly made the behaviour testable as well as better.
  const f = frames[Math.floor((tick + i) / of) % frames.length];
  const above = NOTE_ABOVE[i];
  return (
    <figure className={`hallo-plate hallo-plate-${i + 1}`}>
      {/* The number always sits on the frame, whichever side the note takes.
          Set in the mono at full ink against the note's muted grey, which is
          where the weight comes from — the site already numbers things this
          way (the index rows, the note cards, the plate in the hero), and a
          bold sans figure here would have been a fourth numeric voice on a
          page that has one. */}
      <figcaption className="hallo-head">
        <span className="hallo-num">({i + 1})</span>
        {above && <span className="hallo-note">{f.note}</span>}
      </figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={f.src} alt={f.alt} loading={i < 3 ? "eager" : "lazy"} />
      {!above && <figcaption className="hallo-note">{f.note}</figcaption>}
    </figure>
  );
}

export function HalloSection() {
  const [tick, setTick] = useState(0);
  const stage = useRef<HTMLElement>(null);

  // Runs only while the greeting is on screen and only if motion is wanted —
  // the same two conditions the chrome effect is held to, for the same reason:
  // nothing on this page should keep working after it has scrolled away.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let onScreen = false;
    const apply = () => {
      const want = onScreen && !motion?.matches;
      if (want && !timer) timer = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
      if (!want && timer) { window.clearInterval(timer); timer = 0; }
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; apply(); });
    io.observe(el);
    motion?.addEventListener?.("change", apply);
    return () => {
      io.disconnect();
      motion?.removeEventListener?.("change", apply);
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return (
    <section ref={stage} data-spot aria-label="Hallo" className="hallo-stage">
      <div className="hallo-scatter" aria-hidden="true">
        {PLATES.map((frames, i) => (
          <Plate key={i} frames={frames} i={i} tick={tick} of={PLATES.length} />
        ))}
      </div>

      <div className="frame relative h-full flex flex-col">
        <div className="hallo-word m-auto w-full">
          <ChromeWord text="Hallo!" tone="hot" fit height="min(38svh, 40vw)" />
        </div>
        <p className="pb-8 text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
