// app/components/ChromeWord.tsx
//
// A word in chrome, cropped by whatever contains it. This is the reference's
// effect, which is a TYPE treatment — the first attempt at it applied the
// filters to the site's icon instead, which missed the point entirely: the
// whole technique exists to make letters look like poured metal.
//
// SVG filters apply to <text> directly, so none of this needs the word
// converted to a path. It stays real text: selectable by the accessibility
// tree, correct in the DOM, and set in the site's own display face.
//
// The chain, which is four primitives and no JavaScript doing the drawing:
//
//   1. The letters are filled with a repeating white→black→white gradient
//      rather than a colour, and that gradient slides sideways forever. What
//      the filters below are colouring is a moving field of grey.
//   2. #material carves a bevel: blur the glyphs' own alpha, subtract the
//      sharp alpha back out (feComposite arithmetic, k2=-1 k3=1), and what
//      survives is a band hugging the inside of every stroke. Blended back
//      over the gradient in overlay, that band reads as a lit edge.
//   3. #surface is a lookup table — feComponentTransfer with type="table",
//      one per channel, mapping every level of grey to a colour. This is the
//      whole trick: the colour is not in the artwork, it is a function of
//      brightness, so a sliding greyscale comes out as sliding iridescence.
//
// Two decisions worth naming:
//
//   lengthAdjust="spacingAndGlyphs" with an explicit textLength. It fixes the
//   width — so the band never reflows while the webfont is loading — and it
//   widens the glyphs to fill it. Oswald is a condensed face and the
//   reference's is a wide heavy grotesque; stretching to fill is the closest
//   this gets to that register without shipping a second font.
//
//   preserveAspectRatio="xMidYMax slice". The viewBox is far taller than the
//   band, so covering it crops, and anchoring the bottom means the crop takes
//   the tops of the letters. That is what the container is for: the word runs
//   off the edge, so the eye reads a surface larger than the frame rather
//   than an object sitting inside it.
"use client";

import { useEffect, useRef } from "react";

const PALETTE = {
  /** The site's own range: deep teal through to amber. */
  calm: {
    r: "0.04 0.08 0.18 0.55 0.88 0.95 0.62 0.14",
    g: "0.14 0.33 0.56 0.74 0.78 0.60 0.30 0.12",
    b: "0.22 0.46 0.58 0.52 0.33 0.18 0.26 0.20",
  },
  /** The technique's own register, for the places that can carry it. */
  hot: {
    r: "0.03 0.06 0.20 0.70 1 0.95 0.85 0.30",
    g: "0.06 0.26 0.62 0.85 0.72 0.30 0.20 0.10",
    b: "0.25 0.62 0.86 0.80 0.55 0.52 0.75 0.40",
  },
};

// Chosen against the band: shallower and the word is barely clipped, deeper
// and only the feet of the letters survive.
const VB_W = 300;
const VB_H = 190;

/**
 * Takes LINES, not a sentence, and each line should be short — roughly three
 * to nine characters.
 *
 * textLength fixes each line's width whatever it says, so the glyphs stretch
 * to fill it. At five or seven letters that widens a condensed face
 * pleasantly; at thirteen on one line ("SURFING WHALE") each glyph gets about
 * a seventh of its height in width and the band renders mush. Measured, not
 * guessed. A name that long is set as two lines instead, which is also what
 * the reference does with the space: one line cropped by the card's edge, the
 * one under it whole.
 */
export function ChromeWord({
  lines,
  height = 112,
  tone = "hot",
  className = "",
  rounded = "",
}: {
  lines: string[];
  /** Height of the band. The type is always cropped to it. */
  height?: number;
  tone?: keyof typeof PALETTE;
  className?: string;
  rounded?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  // Filter ids are document-global. Two of these on one page without a prefix
  // each and the second silently renders with the first's palette.
  const uid = useRef(`cw${Math.random().toString(36).slice(2, 8)}`);
  const id = uid.current;
  const p = PALETTE[tone];

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let onScreen = false;

    // A filter chain re-rasterises on every frame the gradient moves, which is
    // not free. pauseAnimations stops the SVG's own clock, so off screen or
    // where motion is unwelcome this costs nothing — and the word stays
    // exactly as it is rather than disappearing.
    const apply = () => {
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
    <div
      className={`relative overflow-hidden bg-bg-muted ${rounded} ${className}`}
      style={{ height }}
    >
      <svg
        ref={svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax slice"
        role="img"
        aria-label={lines.join(" ")}
      >
        <defs>
          <linearGradient
            id={`${id}-stripe`}
            x1="0"
            y1="0"
            x2="190"
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
              to="190 0"
              dur="4.4s"
              repeatCount="indefinite"
            />
          </linearGradient>

          <filter id={`${id}-material`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="soft" />
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
            <feGaussianBlur stdDeviation="1.6" result="s" />
            <feComponentTransfer in="s">
              <feFuncR type="table" tableValues={p.r} />
              <feFuncG type="table" tableValues={p.g} />
              <feFuncB type="table" tableValues={p.b} />
            </feComponentTransfer>
          </filter>
        </defs>

        <g filter={`url(#${id}-surface)`}>
          {/* Set from the bottom up. The band keeps the last line whole and
              lets the crop eat into the ones above it, so a two-line name
              arrives the way the reference's does: the top line cut by the
              card's own edge, the bottom line complete. */}
          {lines.map((line, i) => {
            const fromBottom = lines.length - 1 - i;
            const size = Math.round((VB_H * 0.82) / lines.length);
            return (
              <text
                key={line + i}
                x={VB_W / 2}
                y={VB_H - 10 - fromBottom * (size + 6)}
                textAnchor="middle"
                textLength={VB_W - 14}
                lengthAdjust="spacingAndGlyphs"
                style={{
                  fontFamily: "var(--font-display), sans-serif",
                  fontWeight: 700,
                  fontSize: size,
                }}
                filter={`url(#${id}-material)`}
                fill={`url(#${id}-stripe)`}
              >
                {line}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
