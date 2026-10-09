"use client";
// app/components/Showreel.tsx
//
// The only <video> on this site, and the brand book's Motion page is the
// reason it is shaped the way it is. Three of the five things listed under
// "Never" there are about exactly this element:
//
//   "An entrance that delays reading"            — so it never autoplays, and
//                                                   nothing waits for it.
//   "Anything that loops in the corner of the
//    eye while reading"                          — so `loop` is off and the
//                                                   last frame simply stays.
//   "Motion that continues after its section
//    has scrolled away"                          — so it pauses itself when it
//                                                   leaves the viewport.
//
// Until somebody presses play there is no video at all: `preload="none"` means
// the 382 KB mp4 is never fetched, and what is painted is a 28 KB still. The
// page costs a poster to anyone who does not ask for the film.
//
// Native controls appear only after the first press. Before it, the poster
// carries one button that says how long the thing is and that it is silent —
// the two facts somebody needs before deciding to spend fifteen seconds.

import { useEffect, useRef, useState } from "react";

export function Showreel({
  src,
  poster,
  posterSmall,
  posterAlt,
  seconds,
  label,
  children,
}: {
  /** Path without extension: `${src}.mp4` and `${src}.webm` must both exist. */
  src: string;
  poster: string;
  posterSmall?: string;
  /** Describes the still, for the one place it stands alone: the fallback
      inside <video>, which is all a browser without <video> support shows. An
      empty alt there would leave that visitor with nothing at all. */
  posterAlt: string;
  seconds: number;
  /** What the film is, for anyone who hears the page rather than sees it. */
  label: string;
  /** The caption under the frame. Read it as part of the figure. */
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  // Leaving the section stops the film. Not a nicety: the brand book lists
  // motion that outlives its section under Never, and a 15-second piece is
  // long enough to still be running two screens later.
  useEffect(() => {
    const v = ref.current;
    if (!v || !started) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && !v.paused) v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [started]);

  const play = () => {
    const v = ref.current;
    if (!v) return;
    setStarted(true);
    // An explicit press, so no autoplay policy applies. A rejection here is
    // a codec or a network failure; the controls are already on screen by
    // then, so the visitor can try again rather than be told nothing.
    void v.play().catch(() => {});
  };

  return (
    <figure className="my-10">
      <div className="relative isolate overflow-hidden rounded-[2px] border border-border bg-bg-subtle">
        {/* 16:9 held by the element itself, so nothing reflows when the
            poster or the film arrives. */}
        <video
          ref={ref}
          className="block w-full aspect-video bg-bg-subtle"
          poster={poster}
          preload="none"
          playsInline
          controls={started}
          onPlay={() => setStarted(true)}
          aria-label={label}
        >
          {/* mp4 first, and the order is the whole point. A browser takes
              the first source it can decode, so Chrome, Safari, Firefox and
              Edge get the h264 file, which measured SMALLER than the vp9 one
              here (382 KB against 490 KB — flat vector frames are not where
              vp9 wins). The webm is the fallback for a Chromium built without
              proprietary codecs, which is not a hypothetical: the Chromium
              this site's checkers drive is one, and a page that only shipped
              the mp4 could not be tested at all. */}
          <source src={`${src}.mp4`} type="video/mp4" />
          <source src={`${src}.webm`} type="video/webm" />
          {/* Reached only where <video> itself is unsupported. */}
          <img src={posterSmall ?? poster} alt={posterAlt} />
        </video>

        {!started && (
          <button
            type="button"
            onClick={play}
            // Low and centred, not dead centre. The poster is a frame of the
            // film, so the middle of it is where the film's own content is —
            // a pill parked there covers the figures somebody is deciding on.
            className="absolute inset-0 z-10 flex items-end justify-center pb-[6%]
                       bg-[color-mix(in_srgb,var(--bg)_28%,transparent)]
                       transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--bg)_12%,transparent)]
                       focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          >
            <span
              className="flex items-center gap-3 rounded-full bg-bg px-5 py-3
                         text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg
                         shadow-[0_1px_3px_rgba(17,17,17,0.14)]"
            >
              <span aria-hidden="true" className="block h-0 w-0
                border-y-[6px] border-y-transparent border-l-[10px] border-l-current" />
              Play · {seconds}s · silent
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-3 text-[11px] leading-[1.7] text-fg-muted">
        {children}
      </figcaption>
    </figure>
  );
}
