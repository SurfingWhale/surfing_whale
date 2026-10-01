// app/components/ChromeMark.tsx
//
// The wave mark, in chrome. Four SVG primitives and no JavaScript doing the
// drawing — roughly 2KB of markup, no image, no canvas, no library.
//
// How it works, which is worth stating because none of it is obvious:
//
//   1. The bars are filled with a repeating white→black→white gradient rather
//      than a colour. That gradient slides sideways forever, so what the
//      filters below are colouring is a moving field of grey.
//   2. #material carves a bevel: blur the shape's own alpha, subtract the
//      sharp alpha back out (feComposite arithmetic k2=-1 k3=1), and what is
//      left is a band hugging the inside of every edge. Blended back over the
//      gradient in overlay, that band reads as a lit rim.
//   3. #surface is a lookup table. feComponentTransfer with type="table" maps
//      every level of grey to a colour, one table per channel — so the sliding
//      greyscale becomes a sliding iridescence. This is the whole trick: the
//      colour is not in the artwork, it is a function of brightness.
//
// Two things about it are decisions rather than mechanics:
//
//   The palette is the restrained one. The technique's natural register is
//   blue→magenta — full spectrum, and very loud. This maps to teal→amber,
//   which is the site's own range, because a rainbow in the footer of a data
//   portfolio is spectacle with no job.
//
//   The gradient's period is 128 units against a 100-unit viewBox. Wider than
//   the mark and every bar lands on nearly the same grey, so the thing reads
//   as one flat ramp; this way the sweep is visibly crossing the bars.
//
// What it costs, and what is done about it: a filter chain re-rasterises on
// every frame the gradient moves, which is not free. So it runs only while it
// is on screen and only when motion is welcome — otherwise the SVG's own
// animation clock is stopped, which costs nothing at all.
"use client";

import { useEffect, useRef } from "react";

const BARS: [number, number, number][] = [
  [9.5, 55, 26],
  [21.5, 43, 38],
  [33.5, 27, 54],
  [45.5, 19, 62],
  [57.5, 25, 56],
  [69.5, 39, 42],
  [81.5, 51, 30],
];

/** Greyscale → colour, one table per channel. */
const PALETTE = {
  // The site's own range: deep teal through to amber.
  calm: {
    r: "0.04 0.08 0.18 0.55 0.88 0.95 0.62 0.14",
    g: "0.14 0.33 0.56 0.74 0.78 0.60 0.30 0.12",
    b: "0.22 0.46 0.58 0.52 0.33 0.18 0.26 0.20",
  },
  // The technique's own register, kept for the places that can carry it.
  hot: {
    r: "0.03 0.06 0.20 0.70 1 0.95 0.85 0.30",
    g: "0.06 0.26 0.62 0.85 0.72 0.30 0.20 0.10",
    b: "0.25 0.62 0.86 0.80 0.55 0.52 0.75 0.40",
  },
};

export function ChromeMark({
  size = 112,
  tone = "calm",
  title = "Surfing Whale",
  className = "",
  style,
  cover = false,
}: {
  size?: number;
  tone?: keyof typeof PALETTE;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Fill the parent and crop, the way object-fit: cover does for an image. */
  cover?: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  // Filter ids are document-global, so two of these on one page would collide
  // and the second would silently take the first's palette.
  const uid = useRef(`cm${Math.random().toString(36).slice(2, 8)}`);
  const id = uid.current;
  const p = PALETTE[tone];

  useEffect(() => {
    const el = svg.current;
    if (!el) return;

    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let onScreen = false;

    const apply = () => {
      // pauseAnimations stops the SVG's own clock. The mark stays exactly as
      // it is — a still frame of chrome, which is the point: nothing
      // disappears when the motion does.
      if (onScreen && !motion?.matches) el.unpauseAnimations();
      else el.pauseAnimations();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        apply();
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    motion?.addEventListener?.("change", apply);
    apply();

    return () => {
      io.disconnect();
      motion?.removeEventListener?.("change", apply);
    };
  }, []);

  return (
    <svg
      ref={svg}
      viewBox="0 0 100 100"
      width={cover ? "100%" : size}
      height={cover ? "100%" : size}
      preserveAspectRatio={cover ? "xMidYMid slice" : undefined}
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id={`${id}-stripe`}
          x1="0"
          y1="0"
          x2="128"
          y2="0"
          gradientUnits="userSpaceOnUse"
          spreadMethod="repeat"
        >
          <stop stopColor="#fff" />
          <stop offset=".5" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0 0"
            to="128 0"
            dur="4.4s"
            repeatCount="indefinite"
          />
        </linearGradient>

        <filter id={`${id}-material`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="soft" />
          <feComposite
            in="soft"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="rim"
          />
          <feBlend in="SourceGraphic" in2="rim" mode="overlay" />
        </filter>

        <filter id={`${id}-surface`}>
          <feGaussianBlur stdDeviation="0.7" result="s" />
          <feComponentTransfer in="s">
            <feFuncR type="table" tableValues={p.r} />
            <feFuncG type="table" tableValues={p.g} />
            <feFuncB type="table" tableValues={p.b} />
          </feComponentTransfer>
        </filter>
      </defs>

      <g filter={`url(#${id}-surface)`}>
        <g filter={`url(#${id}-material)`} fill={`url(#${id}-stripe)`}>
          {BARS.map(([x, y, h]) => (
            <rect key={x} x={x} y={y} width="9" height={h} rx="4.5" />
          ))}
        </g>
      </g>
    </svg>
  );
}

/**
 * The same mark as a band across the top of a card, cropped by the card's own
 * edge so the bars run off it.
 *
 * This is the part the first attempt got wrong. A filtered mark floating in
 * the middle of white space is a sticker — it has no relationship to anything
 * around it, and at the size that keeps it tasteful it is too small for the
 * bevel to read. Cropped, it stops being an object on the page and becomes a
 * surface the card is cut out of: the bars continue past the edge, so the eye
 * reads something larger than the frame rather than something small inside it.
 *
 * The band carries its own solid backdrop. The chrome is made of overlay
 * blends and a lookup table over whatever is behind it, so on a translucent
 * panel it picks up the page underneath and turns to mud.
 */
export function ChromeBand({
  height = 128,
  tone = "hot",
  className = "",
  title = "Surfing Whale",
}: {
  height?: number;
  tone?: keyof typeof PALETTE;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-bg-muted ${className}`}
      style={{ height }}
    >
      {/* cover, not a fixed size. A mark sized off the band's HEIGHT leaves
          the band's width empty either side — 300px of artwork adrift in a
          672px strip, which is the sticker problem again at a larger scale.
          Covering scales the mark until it fills the box and lets the box
          crop it, so what is on screen is a slice through bars far taller
          than the band. That is what the reference is doing to its letters. */}
      <ChromeMark cover tone={tone} title={title} />
    </div>
  );
}
