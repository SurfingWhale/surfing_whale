// app/components/DecodeText.tsx
//
// The reveal from the reference, rebuilt from the recording rather than from
// a guess about which library made it.
//
// What the frames actually show, at 54fps and full resolution:
//
//   Characters arrive left to right across the whole paragraph, wrapping
//   through the line breaks — one continuous front, not line by line.
//   Each character enters blurred and transparent and sharpens as it lands.
//   Each one enters as a LOOKALIKE of itself — "design" comes in as "6es|gn",
//   "Attio" as "A+tio", "Billson" as "Bill5on" — and settles to the real
//   glyph a moment later. The substitutes are not random symbols; they are
//   digits and punctuation shaped like the letter they stand in for, which is
//   what keeps the word half-readable while it resolves.
//   Each character carries its own colour while it is unresolved, and the
//   colour drains to the body colour behind the front. So the colour is not
//   decoration — it marks which characters have not landed yet.
//
// Measured off the recording: the front crosses about thirty characters in
// 185ms, a burst runs a little over a second end to end, and every frame at
// 54fps differs, so it is driven by requestAnimationFrame rather than a slow
// interval.
//
// No library. GSAP's ScrambleTextPlugin plus SplitText would do this, but
// that is ~50KB of JavaScript shipped to every visitor for one paragraph,
// and the whole effect is the hundred lines below.
"use client";

import { useEffect, useRef } from "react";

// Lookalikes, not noise. A random symbol set turns the sentence into static;
// these keep the silhouette of the word while it is unresolved.
export const SUBS: Record<string, string> = {
  a: "@4", b: "8", c: "<", d: "6", e: "3€", f: "7", g: "9", h: "#", i: "1!|",
  j: "]", k: "<", l: "1|", m: "^^", n: "&", o: "0", p: "9", q: "9", r: "?",
  s: "5$", t: "7+", u: "v", v: "u", w: "vv", x: "*", y: "7", z: "2",
  A: "4@", B: "8", C: "<", D: "0", E: "3€", F: "7", G: "6", H: "#", I: "1|",
  L: "1", O: "0", S: "5$", T: "7+", Z: "2",
};
const POOL = "#$%&*+<>?@^~=|/";

// A second, quieter set for display type. At 112px a "^" standing in for an
// "m" is a hole in the word — punctuation is drawn light and sits high, so a
// heavy grotesque full of it falls apart. The reference does not do that to
// its name either: "Billson" becomes "Bill5on", one letter swapped for one
// digit. Digits carry the same weight and sit on the same two lines as caps,
// so the word keeps its colour and its rhythm while it resolves. A letter
// with no digit that looks like it is simply left alone, which is what makes
// the substitution sparse rather than total.
const DIGITS: Record<string, string> = {
  a: "4", b: "6", d: "0", e: "3", g: "9", i: "1", l: "1", o: "0", q: "9",
  s: "5", t: "7", u: "0", y: "7", z: "2", A: "4", B: "8", E: "3", G: "6",
  I: "1", O: "0", S: "5", T: "7", Z: "2",
};
export const subDigit = (ch: string) => DIGITS[ch] ?? ch;
export const sub = (ch: string) =>
  (SUBS[ch] ?? POOL)[Math.floor(Math.random() * (SUBS[ch] ?? POOL).length)];

// Restrained on purpose. The reference runs a full spectrum because its
// photograph is black and white; this site's is not, and a rainbow paragraph
// under a colour portrait is two things shouting. Five hues, drawn from the
// portrait and the site's own accent.
export const INK = ["#1e4e68", "#a13512", "#2f6b4f", "#6b3a24", "#3b3f8f"];

// The front's SPEED is the constant, not its duration. Measured off the
// recording: the reference crosses about thirty characters in 185ms, so
// roughly 160 a second. A fixed duration would crawl through a short line and
// sprint through a long one; a fixed speed reads the same either way. Clamped
// so a very short passage still registers as a movement and a very long one
// does not outstay its welcome.
const RATE = 160;     // characters per second
const MIN_SPREAD = 320;
const MAX_SPREAD = 1100;
export const spreadFor = (n: number) =>
  Math.min(MAX_SPREAD, Math.max(MIN_SPREAD, (n / RATE) * 1000));
export const UNSET = 170;    // ms a character spends unresolved
export const FLIP = 45;      // ms between glyph swaps while unresolved
export const HOLD = 280;     // ms the colour is held after the character lands
export const FADE = 420;     // ms the colour takes to drain to the body colour

type Phase = 0 | 1 | 2 | 3; // waiting | unresolved | landed, coloured | done

export function DecodeText({
  text,
  className,
  as: Tag = "p",
  /** Delay before the front starts, so stacked passages run in sequence. */
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
  delay?: number;
}) {
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // The server already rendered the real sentence, so it is in the markup
    // for search engines and for anyone without JavaScript. Past this point
    // React is not managing these children — the loop writes to the DOM
    // directly, because re-rendering two hundred spans sixty times a second
    // through React would cost more than the effect is worth.
    const chars = [...text];
    el.textContent = "";

    // The animated layer is hidden from assistive tech and a plain copy of
    // the sentence is exposed instead, so a screen reader is never handed a
    // paragraph of half-resolved punctuation.
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    el.append(sr, vis);

    const spans = chars.map((ch) => {
      const s = document.createElement("span");
      if (ch === " ") {
        s.textContent = " ";
        s.style.whiteSpace = "pre";
        return s;
      }
      s.textContent = ch;
      s.style.opacity = "0";
      s.style.display = "inline-block";
      s.style.transition = `color ${FADE}ms var(--ease-out)`;
      return s;
    });
    vis.append(...spans);

    // Lock each character to the width of the character it will become,
    // measured once here. Without this the substitutes — "@" standing in for
    // "a", "^" for "m" — are wider than what they replace, so the line reflows
    // on every flip and anything after it shivers. One forced layout now buys
    // a run with no movement in it but the one that is intended.
    const widths = spans.map((s) => s.getBoundingClientRect().width);
    spans.forEach((s, i) => {
      if (chars[i] === " ") return;
      s.style.width = `${widths[i]}px`;
      s.style.textAlign = "center";
    });

    const n = chars.length;
    const spread = spreadFor(n);
    const at = chars.map((_, i) => delay + (i / Math.max(1, n - 1)) * spread);
    const hue = chars.map(() => INK[Math.floor(Math.random() * INK.length)]);
    const phase: Phase[] = chars.map(() => 0);
    const lastFlip = chars.map(() => -1);

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = now - t0;
      let live = false;

      for (let i = 0; i < n; i++) {
        if (chars[i] === " " || phase[i] === 3) continue;
        const s = spans[i];
        const start = at[i];

        if (t < start) { live = true; continue; }

        if (t < start + UNSET) {
          live = true;
          if (phase[i] === 0) {
            phase[i] = 1;
            s.style.opacity = "1";
            s.style.color = hue[i];
            // Blur only while unresolved. It is the most expensive thing here,
            // so it exists on at most a couple of dozen characters at a time —
            // the ones inside the moving front — and never on settled text.
            s.style.filter = "blur(4px)";
            s.style.transition = `color ${FADE}ms var(--ease-out), filter 140ms linear`;
          }
          if (now - lastFlip[i] > FLIP) {
            s.textContent = sub(chars[i]);
            lastFlip[i] = now;
          }
          continue;
        }

        if (phase[i] < 2) {
          phase[i] = 2;
          s.textContent = chars[i];
          s.style.filter = "none";
        }
        if (t < start + UNSET + HOLD) { live = true; continue; }

        phase[i] = 3;
        s.style.color = "";          // transitions back to the body colour
      }

      if (live) raf = requestAnimationFrame(tick);
      else {
        // Hand the text back to the browser as one run once nothing is moving,
        // so selection, copy and paste behave like ordinary prose again.
        window.setTimeout(() => {
          if (el.isConnected) el.textContent = text;
        }, FADE);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (el.isConnected) el.textContent = text;
    };
  }, [text, delay]);

  // Rendered plain on the server and on first paint. Nothing is hidden behind
  // JavaScript: with it off, this is simply a paragraph.
  return (
    <Tag ref={host as never} className={className} suppressHydrationWarning>
      {text}
    </Tag>
  );
}
