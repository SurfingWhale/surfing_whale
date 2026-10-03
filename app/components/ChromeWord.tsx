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

import { useEffect, useId, useRef } from "react";

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
const STRIPE_W = 120;
const PERIOD_MS = 4400;

const VB_W = 300;
const VB_H = 110;

// The word rides a swell rather than sitting on a line.
//
// The first version stretched the word to the band's full width and let the
// band crop it. On a 342px card that left "RFII" on screen — the letters were
// so large that most of them were outside the box, which is a wordmark nobody
// can read. Setting the type smaller and bending it along a path fixes both
// halves at once: the whole word fits, and the curve is the site's own name.
//
// An S, not an arch. A single arc reads as a badge; two opposed curves read
// as water, which is the point.
// The path is the BASELINE, so the glyphs rise a cap height above it —
// 0.81 of the font size, about 40 units here. The first curve crested at
// y≈33 and the letter tops went 8px past the top of the band. It never rises
// above y=44 now, which leaves the caps inside with a little air.
const SWELL = "M6 72 C 80 118, 140 44, 206 78 S 268 102, 294 68";

/**
 * One short word — roughly three to ten characters.
 *
 * The word is set at a fixed size and bent along a fixed path, so a longer
 * string runs off the end of the swell rather than shrinking to fit. That is
 * deliberate: this is a wordmark, not a label, and "SURFING WHALE" on a curve
 * at this size would be unreadable either way.
 */
export function ChromeWord({
  text,
  height = 112,
  tone = "hot",
  className = "",
  rounded = "",
  fit = false,
}: {
  /** One short word. It is bent along the swell, so it stays one line. */
  text: string;
  /** Height of the band, in px or any CSS length. The type is always cropped to it. */
  height?: number | string;
  /**
   * Draw the word as large as the band allows. The swell is wider than a
   * short word, so at the card's size the word fills about half the box —
   * right for a card, too small for a page's first screen. With fit, the
   * view is cut to the word's own bounds once it has been laid out.
   */
  fit?: boolean;
  tone?: keyof typeof PALETTE;
  className?: string;
  rounded?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const stripe = useRef<SVGLinearGradientElement>(null);
  const word = useRef<SVGTextElement>(null);
  // Filter ids are document-global. Two of these on one page without a prefix
  // each and the second silently renders with the first's palette. useId
  // rather than a random string, so the server and the browser agree on it;
  // its colons are dropped because they do not survive inside url(#…).
  const id = `cw${useId().replace(/:/g, "")}`;
  const p = PALETTE[tone];

  // Measured, not hard-coded: the bounds depend on the word and on the
  // webfont, so they are taken again once the font has arrived. The pad
  // keeps the filters' blur inside the view.
  useEffect(() => {
    const el = svg.current;
    const t = word.current;
    if (!fit || !el || !t) return;
    const measure = () => {
      const b = t.getBBox();
      if (!b.width) return;
      const pad = 6;
      el.setAttribute("viewBox", `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [fit, text]);

  useEffect(() => {
    const el = svg.current;
    const grad = stripe.current;
    if (!el || !grad) return;

    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    let raf = 0;

    // The sweep is driven from here rather than by <animateTransform>.
    //
    // SMIL animating gradientTransform is a long-standing WebKit hole: Safari
    // runs SMIL in general but does not move a gradient this way, so on an
    // iPhone the stripe simply stood still. And a still stripe takes the
    // colour with it — the lookup table maps brightness to hue, so if the
    // brightness never changes neither does the hue, and the whole thing
    // renders as one flat tint. The two faults the effect was reported with
    // are one fault.
    //
    // Writing the attribute from rAF works in every engine, and it is one
    // attribute on one element per frame.
    const tick = (now: number) => {
      const x = ((now / PERIOD_MS) % 1) * STRIPE_W;
      grad.setAttribute("gradientTransform", `translate(${x.toFixed(2)} 0)`);
      raf = requestAnimationFrame(tick);
    };

    const apply = () => {
      const want = onScreen && !motion?.matches;
      if (want && !raf) raf = requestAnimationFrame(tick);
      if (!want && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
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

    return () => {
      io.disconnect();
      motion?.removeEventListener?.("change", apply);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      // No background of its own. The reference has no seam between the
      // artwork and the card — the letters sit on the same white as the
      // heading under them and simply stop. A tinted band made the card two
      // surfaces stacked, which is the separation that was being pointed at.
      // The caller gives it a solid backdrop; what must not happen is the
      // chrome landing on something translucent, where its overlay blends
      // pick up the page behind and turn to mud.
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ height }}
    >
      <svg
        ref={svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        // meet, not slice. Cropping was the problem; the word is sized to
        // fit now, so the box has nothing left to cut.
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text}
      >
        <defs>
          <path id={`${id}-swell`} d={SWELL} fill="none" />

          <linearGradient
            id={`${id}-stripe`}
            ref={stripe}
            x1="0"
            y1="0"
            x2={STRIPE_W}
            y2="0"
            gradientUnits="userSpaceOnUse"
            spreadMethod="repeat"
          >
            <stop stopColor="#fff" />
            <stop offset=".5" stopColor="#000" />
            <stop offset="1" stopColor="#fff" />
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
          <text
            ref={word}
            filter={`url(#${id}-material)`}
            fill={`url(#${id}-stripe)`}
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: "1px",
            }}
          >
            {/* startOffset 50% with text-anchor middle centres the word on the
                curve whatever it says, so the copy can change without the
                path needing to. */}
            <textPath
              href={`#${id}-swell`}
              startOffset="50%"
              textAnchor="middle"
            >
              {text}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
