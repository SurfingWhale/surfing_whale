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

const COPY = {
  analyst: {
    tagline: "Data analyst with an accounting background.",
    bio: "I turn raw numbers into stories people can act on — ledgers, forecasts, and the patterns underneath them.",
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
      <div className="container mx-auto px-6 pt-20 pb-16 max-w-[720px]">
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
