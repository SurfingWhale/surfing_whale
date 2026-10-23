"use client";
// app/components/ReelPlayer.tsx
//
// The DALRS film, played by Remotion's own <Player> — the composition runs
// live in React rather than as a video file, so it stays sharp at any width.
//
// THREE DEPARTURES FROM THE BRIEF, all the same reason. The brief asked for
// "autoplay muted loop". This site's brand book lists three things under
// Never, and all three are this element:
//
//   "An entrance that delays reading"            -> no autoplay
//   "Anything that loops in the corner of the
//    eye while reading"                          -> no loop
//   "Motion that continues after its section
//    has scrolled away"                          -> pauses on exit
//
// The brief's own first instruction was to follow the patterns already in the
// repository, and app/components/Showreel.tsx — click-to-play, no loop,
// IntersectionObserver — is that pattern, with eleven checks behind it.
// Turning autoplay back on is one prop.
//
// The Player and the composition load only when the figure comes into view,
// through next/dynamic — see ReelStage.tsx for why a bare import() was not
// enough. Before that the page costs a 42 KB poster and no Remotion at all.
// Under prefers-reduced-motion the poster is all there ever is, with the
// rendered file offered as a link rather than played.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";

const W = 1920;
const H = 1080;

// next/dynamic with ssr:false, not a bare import() in the effect. The bare one
// looked lazy and was not — see the note at the top of ReelStage.tsx.
const ReelStage = dynamic(() => import("./ReelStage"), { ssr: false });

export function ReelPlayer({
  poster, posterSmall, mp4, seconds, label, children,
}: {
  poster: string;
  posterSmall?: string;
  /** The rendered file. Offered under reduced motion, and the social cut. */
  mp4: string;
  seconds: number;
  label: string;
  children: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const [near, setNear] = useState(false);
  const [want, setWant] = useState(false);
  const [calm, setCalm] = useState(false);

  // Read the preference after mount: the server has no media queries, and a
  // component that renders differently on each side is a hydration mismatch
  // rather than a feature test.
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el || calm || near) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { io.disconnect(); setNear(true); } },
      { rootMargin: "320px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [calm, near]);

  // Leaving the section stops it. A 30-second piece is long enough to still
  // be running two screens later.
  useEffect(() => {
    const el = wrap.current;
    if (!el || !want) return;
    const io = new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting) player.current?.pause(); },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [want]);

  const play = () => {
    setWant(true);
    player.current?.play();
  };

  // Mounted on APPROACH, paused, with the poster still over it — not on the
  // press. Mounting at the press meant next/dynamic only started fetching
  // then, so the first thing a press did was wait for a chunk. The Player
  // starts paused, so nothing moves until play() is called.
  const mounted = near && !calm;

  return (
    <figure className="my-10" ref={wrap}>
      <div className="relative isolate overflow-hidden rounded-[2px] border border-border bg-white">
        <div className="relative aspect-video w-full">
          {mounted && <ReelStage ref={player} />}
          {!want && (
            // Over the Player, not instead of it: the still is what the page
            // shows until somebody asks for the film.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              srcSet={posterSmall ? `${posterSmall} 960w, ${poster} 1920w` : undefined}
              sizes="(max-width: 700px) 100vw, 680px"
              alt={label}
              width={W}
              height={H}
              className="absolute inset-0 block h-full w-full object-cover"
            />
          )}
        </div>

        {!want && !calm && (
          <button
            type="button"
            data-reel-play
            onClick={play}
            className="absolute inset-0 z-10 flex items-end justify-center pb-[6%]
                       bg-[color-mix(in_srgb,#ffffff_26%,transparent)]
                       transition-colors duration-300 hover:bg-[color-mix(in_srgb,#ffffff_10%,transparent)]
                       focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          >
            <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3
                             text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-[#000]
                             shadow-[0_1px_3px_rgba(14,17,22,0.22)]">
              <span aria-hidden="true" className="block h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-current" />
              Putar · {seconds} dtk · tanpa suara
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-3 text-[11px] leading-[1.7] text-fg-muted">
        {children}
        {calm && (
          <>
            {" "}
            <a href={mp4} className="font-medium text-fg underline decoration-border-strong underline-offset-[3px]">
              Buka filmnya sebagai berkas video
            </a>{" "}
            — animasinya dimatikan karena perangkat ini minta gerak seminimal mungkin.
          </>
        )}
      </figcaption>
    </figure>
  );
}
