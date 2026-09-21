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
  },
} as const;

export function HeroSection() {
  const { mode } = useProfileMode();
  const copy = COPY[mode];

  return (
    <section data-spot className="w-full">
      <div data-reveal className="container mx-auto px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 max-w-[720px]">
        <AvatarPicker />

        {/* What this is, before who it is. A stranger deciding whether to keep
            reading wants the second question answered first, and the toggle
            above already knows the answer — it was just saying it to screen
            readers only. Set as a label rather than a heading: it is the same
            11px the section labels use, so it reads as a caption on the
            photographs rather than as a title competing with the name. */}
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mt-5">
          {MODE_KICKER[mode]}
        </p>

        <h1 className="text-[13px] leading-[2] font-medium tracking-normal text-fg mt-2">
          Hello, I&apos;m Fauzy.
        </h1>

        <p className="text-[13px] leading-[2] text-fg-body">{copy.tagline}</p>

        <p className="text-[13px] leading-[2] text-fg-body mt-5 max-w-[560px]">
          {copy.bio}
        </p>

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
