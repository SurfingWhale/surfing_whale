// app/components/sections/HeroSection.tsx
// No display type: the name runs at body size in medium weight, exactly as
// the reference site does. Hierarchy comes from weight and colour, not scale.
//
// No call to action either. This is a showcase, and a page that opens by
// asking for an introduction is asking before it has shown anything. The
// ways to reach me are at the end, where someone who wants them will be.
"use client";

import { AvatarPicker } from "@/app/components/AvatarPicker";
import { useProfileMode } from "@/app/components/ProfileMode";

// Not a job title. "Data analyst with an accounting background" is a claim
// about what I am; these are observations about how the work actually goes,
// drawn from a read-back of how I talk about it rather than from a CV line.
const COPY = {
  analyst: {
    tagline:
      "I like building things that tell a story rather than report a number.",
    bio: "Most of it starts as a question — why is this happening, what is actually going on, does this add up. The work is turning something blurry into something that can be seen, compared and argued with. The tool comes after the question, not before it.",
  },
  capture: {
    tagline: "I love capturing moments — joie de vivre.",
    bio: "It is simply a photograph. Perhaps no one cares — I keep taking them anyway.",
  },
} as const;

export function HeroSection() {
  const { mode } = useProfileMode();
  const copy = COPY[mode];

  return (
    <section data-spot className="w-full">
      <div data-reveal className="container mx-auto px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 max-w-[720px]">
        <AvatarPicker />

        <h1 className="text-[13px] leading-[2] font-medium tracking-normal text-fg mt-5">
          Hello, I&apos;m Fauzy.
        </h1>

        <p className="text-[13px] leading-[2] text-fg-body">{copy.tagline}</p>

        <p className="text-[13px] leading-[2] text-fg-body mt-5 max-w-[560px]">
          {copy.bio}
        </p>

      </div>
    </section>
  );
}
