// app/components/sections/HeroSection.tsx
//
// THE PLATE: the evidence first, the name as its label.
//
// Chosen out of three directions built thin and rendered side by side rather
// than out of the first idea (PRD 24). The other two:
//
//   the name as the object — a 70px wordmark with a picture inlaid in its own
//     cap box. The handsomest of the three at 1440 and the emptiest at 390,
//     where it left the bottom 40% of the screen blank and scattered its three
//     pieces into three corners.
//   the logbook header — the first screen as the top of a ledger. Read well on
//     a phone, broke at 1440, where a label and its value ended up 1800px
//     apart and stopped reading as a pair.
//
// This one opens with the work. A stranger sees what was made before they see
// who made it, which is the order a site arguing "this person does the
// analysis" should use. The cost is real and was accepted knowingly: the
// wordmark, which was the most distinctive object on the site.
//
// Still no call to action. This is a showcase, and a page that opens by asking
// for an introduction is asking before it has shown anything.
"use client";

import { ModeSwitch } from "@/app/components/AvatarPicker";
import { useProfileMode, MODE_KICKER } from "@/app/components/ProfileMode";
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
      plate: "Plate 01 — drive-time bands, Jabodetabek",
      // The dense half of this map is left of centre; a centred cover crop on
      // a phone cut every branch out of it.
      focus: "34% 46%",
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
      plate: "Plate 01 — Cilincing, 35mm",
      focus: "50% 42%",
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

export function HeroSection() {
  const { mode } = useProfileMode();
  const copy = COPY[mode];

  return (
    <section data-spot id="hero" className="w-full">
      {/* THE PLATE.
          
          The evidence arrives before the claim. Three directions were built
          and rendered side by side before this one was chosen (PRD 24); the
          one it beat opened with the name set at 70px and the picture inlaid
          in its own cap box, which was the most distinctive thing on this
          site. That is what this costs, and it buys one thing: a stranger
          sees the WORK before they see the person. For a site whose job is to
          say "this person does the analysis", that is the right order.

          What is deliberately NOT here is the thing the reference direction
          had — a soft black gradient fading up from the bottom of the photo
          with white type on it. Measured, its label ran at 2.23:1 against the
          pale half of the map, which is unreadable; and it is the single most
          applied-by-default treatment in the whole vocabulary. A real plate
          does not fade into its label. It has a printed card under it. So the
          image is an image, the card is on the page's own surface, and the
          contrast is whatever the page's contrast already is. */}
      <figure data-reveal className="hero-plate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={copy.frame.image}
          alt={copy.frame.alt}
          // The crop is named per image rather than centred. At 390 a centred
          // cover crop on the isochrone map landed on empty suburb and cut
          // every branch out of the picture — the one thing the plate exists
          // to show.
          style={{ objectPosition: copy.frame.focus ?? "50% 50%" }}
          fetchPriority="high"
        />

        <figcaption className="frame hero-card">
          <div className="hero-card-head">
            <span className="hero-card-label">{copy.frame.plate}</span>
            <span className="hero-card-year">&rsquo;26</span>
          </div>

          {/* One column on a phone; on a wide screen the name hangs on the
              left of the same rule and the sentence on the right, because a
              72px name alone on a 1440px line leaves a 700px gutter of
              nothing beside it — which is the fault the direction this beat
              had at the same width. */}
          <div className="hero-card-body">
            <div className="hero-card-id">
              <h1 className="hero-card-name">Muhammad Fauzy</h1>
              <p className="hero-card-kicker">{MODE_KICKER[mode]}</p>
            </div>

            <div className="hero-card-say">
              {/* The one sentence that says what the work is for. It resolves
                  the way the prose elsewhere does, so the front page and the
                  rest of the site speak at the same speed. */}
              <DecodeText
                key={`tagline-${mode}`}
                text={copy.tagline}
                className="hero-card-line"
              />

              <div className="hero-card-foot">
            {/* The switch stays. It is not decoration — it is what makes the
                two halves of this site one site, and every section below reads
                the mode it sets. */}
                {/* Only the switch, not the avatar card that used to sit
                    beside it. Both set the same state — the avatar is a
                    swipe, the switch is two words — so nothing is lost but a
                    photograph of the author on the first screen, which is the
                    exact thing this direction decided not to lead with. */}
                <ModeSwitch />
                <dl className="hero-card-facts">
                  {FACTS[mode].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="sr-only">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </figcaption>
      </figure>

      {/* What the plate shows, and where to read how it was made. The old
          hero carried an EmbedFrame here holding this same picture; with the
          picture now the first thing on the page, keeping it was printing it
          twice. */}
      <div data-reveal className="frame frame-split frame-flush pb-24 min-[66rem]:pb-16 pt-12 min-[66rem]:pt-16">
        <p className="text-[15px] leading-[1.7] text-fg max-w-[46ch]">
          {copy.frame.caption}
        </p>

        <DecodeText
          key={`bio-${mode}`}
          text={copy.bio}
          delay={420}
          className="text-[13px] leading-[2] text-fg-body mt-8 max-w-[560px]"
        />

        <p className="text-[13px] leading-[2] mt-8">
          <a
            href={copy.frame.href}
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            {copy.frame.cta} &rarr;
          </a>
        </p>
      </div>
    </section>
  );
}
