// app/components/VinylPlayer.tsx
//
// The turntable beside the photographs: a clear disc with the sleeve as its
// label, an arm that drops onto it, and the track named beside it. After the
// vinyl card on shwn.design.
//
// The deck itself lives in app/lib/turntable.ts and belongs to the page, not
// to this component — the opening can start the same record, and when it has,
// this mounts onto a side already turning rather than starting a second one.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  TRACK,
  Turntable,
  theDeck,
  deckPlaying,
  SIDE,
  type Position,
} from "@/app/lib/turntable";

export function VinylPlayer() {
  const deck = useRef<Turntable | null>(null);
  const [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState<Turntable["kind"]>("web audio");
  const [{ pass, side }, setPosition] = useState<Position>({ pass: 0, side: 0 });

  useEffect(() => {
    const t = theDeck();
    deck.current = t;
    // Already turning — the opening started it — so show where it is rather
    // than dropping a second needle on the same record.
    if (deckPlaying()) {
      setPlaying(true);
      setKind(t.kind);
    } else {
      void t.play().then((on) => {
        if (t.closed) return;
        setPlaying(on);
        setKind(t.kind);
      });
    }
    const tick = window.setInterval(() => setPosition(t.position()), 250);
    // The deck is NOT closed here. Leaving the gallery used to stop the music,
    // which is wrong once it can start before the gallery exists; the card's
    // own control is how somebody stops it.
    return () => window.clearInterval(tick);
  }, []);

  // Called straight from the tap, so play() can still start the context.
  const toggle = () => {
    const t = deck.current;
    if (!t) return;
    if (playing) {
      setPlaying(false);
      void t.pause();
    } else {
      void t.play().then((on) => {
        if (t.closed) return;
        setPlaying(on);
        setKind(t.kind);
      });
    }
  };

  return (
    <div className="flex items-center gap-5" data-deck={kind}>
      {/* The turntable: disc, label, spindle and arm. Decoration only — the
          button beside it is the control. */}
      <div aria-hidden="true" className="relative shrink-0 w-[128px] h-[128px]">
        <div className="vinyl-spin absolute inset-0 rounded-full" data-playing={playing ? "" : undefined}>
          {/* Clear vinyl: a pale disc with fine grooves pressed into it. */}
          <div
            className="absolute inset-0 rounded-full shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(0,0,0,0.06)]"
            style={{
              background:
                "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.045) 0 1px, transparent 1px 3px), radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--bg) 55%, white) 0%, color-mix(in srgb, var(--bg) 80%, white) 70%, color-mix(in srgb, var(--fg) 10%, var(--bg)) 100%)",
            }}
          />
          {/* The sleeve as the centre label. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TRACK.sleeve}
            alt=""
            className="absolute left-1/2 top-1/2 w-[46%] h-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-[0_0_0_2px_color-mix(in_srgb,var(--bg)_60%,white)]"
          />
          <span className="absolute left-1/2 top-1/2 w-[6px] h-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
        </div>
        {/* Light falls on the record from one side and stays there while it
            turns — which is what makes the turning visible. */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full mix-blend-soft-light"
          style={{
            background:
              "conic-gradient(from 20deg, transparent 0deg, rgba(255,255,255,0.7) 25deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.55) 205deg, transparent 240deg)",
          }}
        />
        {/* The arm pivots just off the top-right corner. Its 60px reach is set
            so the stylus lands on the outer grooves at about 9° and tracks in
            to the last grooves near 33° as the side plays — distances off the
            centre worked out from the pivot, not eyeballed — then swings off
            the record, to -10°, when the music stops. */}
        <span className="absolute -right-2 -top-2 w-[14px] h-[14px] rounded-full bg-bg shadow-[0_0_0_1px_var(--border-strong),0_2px_4px_rgba(0,0,0,0.15)] z-10" />
        <span
          className="absolute -top-[2px] right-[-1.5px] w-[3px] h-[60px] origin-top rounded-full bg-fg-muted transition-transform duration-700 ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ transform: `rotate(${playing ? 9 + side * 24 : -10}deg)` }}
        >
          {/* The headshell. */}
          <span className="absolute -left-[2px] bottom-0 w-[7px] h-[9px] rounded-[2px] bg-fg-muted" />
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] leading-[1.6] uppercase tracking-[0.14em] text-fg-label">
          {playing ? "Now playing" : "Paused"}
        </p>
        <p className="text-[15px] leading-[1.35] font-medium tracking-[-0.02em] text-fg mt-1">{TRACK.title}</p>
        <p className="text-[11px] leading-[1.6] text-fg-muted">{TRACK.artist}</p>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${TRACK.title}` : `Play ${TRACK.title}`}
            className="relative w-9 h-9 shrink-0 rounded-full bg-fg text-bg grid place-items-center hover:opacity-90 transition-opacity duration-200 after:absolute after:-inset-1 after:content-['']"
          >
            {playing ? (
              <svg viewBox="0 0 12 12" aria-hidden="true" className="w-3 h-3 fill-current">
                <rect x="2.5" y="2" width="2.5" height="8" rx="0.6" />
                <rect x="7" y="2" width="2.5" height="8" rx="0.6" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" aria-hidden="true" className="w-3 h-3 fill-current translate-x-[1px]">
                <path d="M3 1.8v8.4c0 .5.5.8.9.5l6.4-4.2c.4-.2.4-.8 0-1L3.9 1.3c-.4-.3-.9 0-.9.5z" />
              </svg>
            )}
          </button>
          <div className="w-[96px] h-[2px] rounded-full bg-border overflow-hidden" aria-hidden="true">
            <div className="h-full bg-fg origin-left" style={{ transform: `scaleX(${pass})` }} />
          </div>
        </div>

        <a
          href={TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[11px] leading-[1.6] text-fg-muted hover:text-fg underline decoration-border-strong underline-offset-[3px] transition-colors duration-200"
        >
          Full song on Apple Music ↗
        </a>
      </div>
    </div>
  );
}
