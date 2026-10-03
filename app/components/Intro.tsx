// app/components/Intro.tsx
// The opening: a count to 100 over ink, then a wave of paper comes up and the
// site is behind it.
//
// Taken from the reference Fauzy sent — a counter climbing the right edge of a
// black screen, a monogram pinned bottom left, and a soft-edged wipe at the
// end — with the wipe changed to the thing this site is named after. The edge
// is the same cubic swell the chrome type rides along (ChromeWord's SWELL), so
// the curtain is a wave rather than a straight line, and it is the same curve
// twice rather than two ideas.
//
// NOTHING HERE IS ON A CLOCK THAT STARTS AT FIRST PAINT. The ink is painted by
// INTRO_CRITICAL_CSS, inlined in <head>, and it stays until something says the
// page is ready. That is the whole shape of this file and it is the second
// version: the first put the ink in the external stylesheet with a fixed
// 1400ms delay on its exit, which on a real phone over 4G produced a 1.3s
// white screen and *then* the counter — two loading states, measured, where
// the reference has one. The page is render-blocked on that stylesheet, so
// until it lands there is no ink to paint.
//
// A fixed delay would have been wrong anyway. On a slow connection the exit
// would fire before React had loaded to draw the number, and the whole count
// would be skipped. The ink leaves when the count finishes, or when the
// backstop in the inline script gives up on React — not when a timer that
// started before anything was loaded says so.
//
// THREE RULES, because an intro is the one component that can lock somebody
// out of a site they have not seen yet:
//
//  1. It never gates the content. The page is server-rendered underneath and
//     complete before this mounts; this is an overlay that takes itself away.
//     With JavaScript off, the inline script never adds the class, no overlay
//     is painted, and the site is simply there.
//
//  2. It cannot get stuck. The backstop is a setTimeout in the inline script,
//     which runs from the HTML itself rather than from a chunk that can fail
//     to load, and the exit it triggers is a CSS animation with `forwards`.
//     React is not on the path that removes this.
//
//  3. It plays once a session, and not at all for anyone who has asked for
//     less motion.
//
// The cost, stated rather than buried: for one visit per session the overlay
// is the largest thing painted, so it is what LCP measures. Returning within
// the session, and anyone with reduced motion, pay nothing — no overlay is
// rendered at all.
"use client";

import { useEffect, useRef, useState } from "react";

// The crest only. ChromeWord's SWELL in shape, stretched to a 1200-wide box so
// the high point sits off-centre rather than dead middle.
//
// It is drawn as a strip ABOVE the paper rather than as the top of one tall
// shape. The first version made the whole curtain one path whose top 30% was
// the wave: on a 390x844 phone the paper part then came to 709px, less than
// the viewport, so the crest had to travel above the top of the screen before
// the screen was covered — and the only edge anyone saw was the straight
// bottom of the fill. Caught on a frame-by-frame capture at 45ms, not by
// looking at the code.
const CREST = "M0 120 L0 46 C 240 98, 520 6, 760 42 S 1020 82, 1200 30 L1200 120 Z";

const COUNT_MS = 1200;
const HOLD_MS = 200;
const WAVE_MS = 550;
const FADE_MS = 250;
export const INTRO_MS = COUNT_MS + HOLD_MS + WAVE_MS + FADE_MS;

const SEEN = "sw-intro-seen";
// How long to wait for React before clearing the ink anyway.
//
// A real trade, both ends of which cost something. Too short and a phone on
// bad data loses the count it was waiting through. Too long and a bundle that
// never arrives holds somebody on a black screen for no reason. Five seconds
// is past where JavaScript lands on a slow connection in testing (~1.3s with
// the chunks held back 1.2s) with room to spare, and short enough that a
// broken deploy reads as slow rather than as broken.
//
// If this does fire, React may still mount afterwards — so the component
// checks for `intro-out` and renders nothing rather than drawing a counter
// over an overlay that has already left.
const BACKSTOP_MS = 5000;

/**
 * The ink, inlined in <head> so it is painted from the HTML itself.
 *
 * It cannot use var(--fg): those tokens live in the external stylesheet, and
 * the whole point of this is to be on screen before that arrives. The two
 * literals below are --fg's light and dark values; they have to be changed
 * with globals.css, and there is a check for that in scripts/verify-intro.mjs.
 *
 * Theme resolution matches THEME_INIT_SCRIPT: an explicit data-theme wins,
 * otherwise the system preference.
 */
export const INTRO_CRITICAL_CSS = `
html.intro::before{content:"";position:fixed;inset:0;z-index:9998;background:#111111;pointer-events:none}
html.intro[data-theme="dark"]::before{background:#f0f0f0}
@media (prefers-color-scheme:dark){html.intro:not([data-theme="light"])::before{background:#f0f0f0}}
html.intro-out::before{animation:sw-intro-gone ${FADE_MS}ms linear ${WAVE_MS}ms forwards}
@keyframes sw-intro-gone{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){html.intro::before{display:none}}
`.trim();

/**
 * Runs before first paint, in <head>, the way the theme and reveal scripts
 * already do. Deciding here rather than in React is what stops a returning
 * visitor seeing a flash of ink before the component can say "not this time".
 *
 * The timeout is the backstop: it lives in the HTML, so a JavaScript bundle
 * that never arrives cannot leave anyone looking at a black screen.
 */
export const INTRO_INIT_SCRIPT = `
try {
  var seen = sessionStorage.getItem('${SEEN}');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!seen && !still) {
    document.documentElement.classList.add('intro');
    sessionStorage.setItem('${SEEN}', '1');
    setTimeout(function () {
      document.documentElement.classList.add('intro-out');
    }, ${BACKSTOP_MS});
  }
} catch (e) {}
`.trim();

/** 0→100, fast then settling, so the last few feel like arriving. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-block w-[0.62em] h-[1em] overflow-hidden align-baseline">
      <span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        style={{ transform: `translateY(${-d * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em] leading-[1] tabular-nums">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Intro() {
  // Rendered only once the class the pre-paint script may have added is
  // confirmed, so the server and the first client render agree on nothing
  // being there — no hydration mismatch, no flash.
  const [on, setOn] = useState(false);
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro")) return;
    // The backstop already gave up on us. Drawing a counter now would put it
    // over an overlay that has finished leaving.
    if (html.classList.contains("intro-out")) return;
    setOn(true);

    // The count starts when React does, not when the page was requested. On a
    // slow connection the ink has already been up for a while; this is the
    // part that says the waiting is over.
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      setN(Math.round(ease(t) * 100));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    // Counting done, hold on 100, then hand over to the CSS exit.
    const out = setTimeout(() => html.classList.add("intro-out"), COUNT_MS + HOLD_MS);
    // And the class that gates all of this goes once the exit has run, so a
    // second mount — a fast route change, Strict Mode in development — never
    // replays it.
    //
    // The overlay unmounts here too. It used to stay mounted with the classes
    // gone, which put it back to its resting frame — the 100 and the wave's
    // crest across the bottom sixth of the screen, above everything (z 9999)
    // — until the inline backstop re-added intro-out seconds later and swept
    // the wave a second time. The audit caught it covering the access form.
    const done = setTimeout(() => {
      html.classList.remove("intro", "intro-out");
      setOn(false);
    }, INTRO_MS + 400);

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(out);
      clearTimeout(done);
    };
  }, []);

  if (!on) return null;

  const digits = String(n).padStart(n === 100 ? 3 : 2, "0").split("").map(Number);

  return (
    <div
      aria-hidden="true"
      // Not a dialog and not announced: it carries no information a reader
      // needs, and the page behind it is already complete.
      className="sw-intro fixed inset-0 z-[9999] overflow-hidden pointer-events-none"
    >
      {/* The ink itself is painted by `html.intro::before` in globals.css,
          not here — it has to be on screen in the first frame, and anything
          React draws arrives a hydration late. This overlay carries only what
          moves. */}
      {/* The count, right-aligned, climbing as it goes — at 0 it sits near the
          bottom of the screen and at 100 near the top, which is the whole of
          the reference's motion. */}
      <div
        className="sw-intro-count absolute right-5 sm:right-8 font-mono font-medium text-bg
          text-[clamp(44px,13vw,96px)] leading-[1] tracking-[-0.03em] flex"
        style={{
          bottom: "8%",
          transform: `translateY(${-(ease(Math.min(1, n / 100)) * 72)}vh)`,
        }}
      >
        {digits.map((d, i) => (
          <Digit key={i} d={d} />
        ))}
      </div>

      {/* The mark, bottom left, where the reference puts its monogram. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data-wave-mark-32.svg"
        alt=""
        width={28}
        height={28}
        className="sw-intro-mark absolute left-5 sm:left-8 bottom-6 w-7 h-7 opacity-90"
      />

      {/* Paper, with a wave for its leading edge, rising over the ink. Both
          this and the page behind are the page's own background, so when the
          overlay goes there is nothing to see going.

          The crest rides on top of the body instead of being cut out of it,
          so the edge is a wave for the whole sweep and the body always has
          enough height to cover the screen behind it. */}
      <div className="sw-intro-wave absolute inset-x-0 top-full h-[110vh]">
        <svg
          className="absolute inset-x-0 bottom-full w-full h-[16vh] fill-bg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={CREST} />
        </svg>
        <div className="absolute inset-0 bg-bg" />
      </div>
    </div>
  );
}
