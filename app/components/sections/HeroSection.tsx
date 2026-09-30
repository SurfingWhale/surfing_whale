// app/components/sections/HeroSection.tsx
// No display type: the name runs at body size in medium weight, exactly as
// the reference site does. Hierarchy comes from weight and colour, not scale.
//
// No call to action either. This is a showcase, and a page that opens by
// asking for an introduction is asking before it has shown anything. The
// ways to reach me are at the end, where someone who wants them will be.
"use client";

import { AvatarPicker } from "@/app/components/AvatarPicker";
import { useProfileMode, MODE_KICKER } from "@/app/components/ProfileMode";
import { EmbedFrame } from "@/app/components/EmbedFrame";
import { HeroWordmark } from "@/app/components/HeroWordmark";
import { DecodeText } from "@/app/components/DecodeText";

// These are observations about how the work actually goes, drawn from a
// read-back of how I talk about it rather than from a CV line. They used to
// stand alone, deliberately, with no job title anywhere near them — which
// left the site describing a temperament and never naming a trade. The title
// now sits above them as a kicker, so the tagline is free to keep being a
// tagline rather than having to do a label's work.
const COPY = {
  analyst: {
    tagline:
      "I like building things that tell a story rather than report a number.",
    bio: "Most of it starts as a question — why is this happening, what is actually going on, does this add up. The work is turning something blurry into something that can be seen, compared and argued with. The tool comes after the question, not before it.",
    // One piece of evidence, immediately. A stranger deciding whether to keep
    // reading should not have to take the paragraph above on trust when there
    // is a map two hundred pixels away that demonstrates it.
    frame: {
      image: "/work/maps/isochrone-tomoro-poster.jpg",
      alt: "Isochrone map of Jabodetabek: Tomoro Coffee branches with 5, 10 and 15-minute drive-time bands shading from pale to deep red.",
      title: "How far a coffee chain actually reaches",
      caption:
        "Drive-time bands around every Tomoro branch in Jabodetabek, laid over where people live. The finding was not the coffee — it was that almost every branch sits on a road you drive rather than a corridor you commute along.",
      href: "/work/coffee-access",
      cta: "Read how it was made",
    },
    // The picture set into the name. Deliberately not the map that runs full
    // width below it: at 130px the two read as the same picture printed twice
    // rather than as two things. The dashboard is a different piece of work
    // and a different colour, so the first screen carries two projects instead
    // of one and an echo.
    inlay: {
      image: "/avatar-analyst-inlay.jpg",
      alt: "Fauzy, set into his own name.",
    },
  },
  capture: {
    tagline: "I love capturing moments — joie de vivre.",
    bio: "It is simply a photograph. Perhaps no one cares — I keep taking them anyway.",
    frame: {
      image: "/photos/cilincing-worker.jpg",
      alt: "Documentary photograph: a worker in Cilincing.",
      title: "Cilincing",
      caption: "One frame, and the reason the other half of this site exists.",
      href: "#photography",
      cta: "See the rest",
    },
    inlay: {
      // A dedicated cut, not the archive file. The archive keeps its 1400px
      // original for the lightbox; the slot needs 400px at the slot's own
      // ratio, and shipping the full frame to fill a 130px hole was 174KB
      // spent on pixels nobody sees.
      image: "/capture-inlay.jpg",
      alt: "A night market, set into the name.",
    },
  },
} as const;

// The frames the slot runs through, one a second, for as long as the page is
// open. Small cuts of the photographs — all six are cut to the slot's own
// landscape ratio at 400px, so the browser crops nothing and the whole set
// costs about 110KB.
//
// Every one of these is a different picture from the one it lands on. A sixth
// was cut from the same portrait the analyst mode settles to, and the
// component's guard only compares paths, so it dealt a frame identical to the
// landing and the shuffle stuttered where it should have cut.
// Where, what, and why this site exists.
//
// The third line said "Open to data roles", which is a different sentence
// from the one this site is making. That is an availability notice — it tells
// a reader the author wants out of where he is, and it dates: the day it
// stops being true it has to be taken down or it is a lie on the front page.
// It also puts the whole site in the service of one transaction, so every
// project underneath it reads as an application rather than as work.
//
// What is actually true is steadier and sells harder: someone with an
// accounting background doing the analysis anyway, in the open, where it can
// be read. That is not a status, it is the reason the rest of the page is
// here — and it holds whether he moves next year or never.
const FACTS: Record<string, [string, string][]> = {
  analyst: [
    ["Based in", "Jakarta, ID"],
    ["Works in", "Analytics · Geospatial"],
    ["Why this exists", "Learning it in the open"],
  ],
  capture: [
    ["Based in", "Jakarta, ID"],
    ["Shoots", "Documentary · 35mm"],
    ["Why this exists", "Frames kept, not filed away"],
  ],
};

const FLASH = [
  "/work/flash/a2.jpg",
  "/work/flash/a3.jpg",
  "/work/flash/a4.jpg",
  "/work/flash/a5.jpg",
  "/work/flash/a6.jpg",
  "/work/flash/a7.jpg",
];

export function HeroSection() {
  const { mode } = useProfileMode();
  const copy = COPY[mode];

  return (
    <section data-spot className="w-full">
      <div data-reveal className="container mx-auto px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 max-w-[720px]">
        {/* What this is, before who it is. A stranger deciding whether to keep
            reading wants the second question answered first, and the toggle
            above already knows the answer — it was just saying it to screen
            readers only. Set as a label rather than a heading: it is the same
            11px the section labels use, so it reads as a caption on the
            photographs rather than as a title competing with the name. */}
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mt-5">
          {MODE_KICKER[mode]}
        </p>

        {/* The greeting used to live here at 13px. The name now says itself at
            the top of the page, so saying it twice was the only thing the
            greeting was still doing. */}
        {/* The name runs to about 520px at its largest, and the column is 720,
            so the second line — the short word plus the picture — used to end
            in a 300px rectangle of nothing. The switch and the standing facts
            move into it and sit on the name's own baseline, which turns the
            gap from something left over into the right-hand half of a block.
            Below the breakpoint there is no gap to fill, so they stack. */}
        <div className="flex flex-col md:flex-row md:items-end md:gap-7">
          <HeroWordmark
            first="Muhammad"
            second="Fauzy"
            image={copy.inlay.image}
            alt={copy.inlay.alt}
            flash={FLASH}
          />

          <div className="shrink-0 md:max-w-[176px] md:pb-[0.9em] flex flex-col gap-3">
            {/* The switch changes the face inside the name, so it belongs
                within reach of it rather than a paragraph below. */}
            <AvatarPicker />
            {/* The facts a stranger checks first, and the only place on the
                page that answers them without scrolling. Set at the kicker's
                size so the two read as one voice bracketing the name. */}
            <dl className="text-[11px] leading-[1.7] tracking-[0.06em] uppercase text-fg-label">
              {FACTS[mode].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="sr-only">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* The two passages resolve in sequence, the second picking up where
            the first lands, so the front reads as one movement down the page
            rather than two that happen to fire together. Keyed on the mode so
            switching modes runs the new copy in rather than swapping it.

            The tagline used to be 13px, the same size as the paragraph under
            it, stretched as a single thin line across the full 720px column.
            Under a 112px name that reads as a caption someone forgot to
            delete. It is the one sentence that says what the work is for, so
            it now runs at display-adjacent size on a measure short enough to
            break over two lines — the line break is what gives it presence,
            not the point size alone. */}
        <DecodeText
          key={`tagline-${mode}`}
          text={copy.tagline}
          className="text-[clamp(19px,2.1vw,26px)] leading-[1.45] tracking-[-0.011em] text-fg mt-9 max-w-[19ch] sm:max-w-[23ch]"
        />

        <DecodeText
          key={`bio-${mode}`}
          text={copy.bio}
          delay={420}
          className="text-[13px] leading-[2] text-fg-body mt-6 max-w-[560px]"
        />

        <EmbedFrame
          image={copy.frame.image}
          alt={copy.frame.alt}
          title={copy.frame.title}
          caption={copy.frame.caption}
          ratio="16 / 9"
        />

        <p className="text-[13px] leading-[2]">
          <a
            href={copy.frame.href}
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            {copy.frame.cta} →
          </a>
        </p>
      </div>
    </section>
  );
}
