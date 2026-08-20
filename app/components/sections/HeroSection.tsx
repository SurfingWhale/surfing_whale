// app/components/sections/HeroSection.tsx
// No display type: the name runs at body size in medium weight, exactly as
// the reference site does. Hierarchy comes from weight and colour, not scale.
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

const STATS = [
  { value: "8+", label: "Projects" },
  { value: "3+", label: "Years experience" },
  { value: "∞", label: "Curiosity" },
];

export function HeroSection() {
  const { mode } = useProfileMode();
  const copy = COPY[mode];

  return (
    <section className="w-full">
      <div className="container mx-auto px-6 pt-20 pb-16 max-w-[720px]">
        <AvatarPicker />

        <h1 className="text-[13px] leading-[2] font-medium tracking-normal text-fg mt-5">
          Hello, I&apos;m Fauzy.
        </h1>

        <p className="text-[13px] leading-[2] text-fg-body">{copy.tagline}</p>

        <p className="text-[13px] leading-[2] text-fg-body mt-5 max-w-[560px]">
          {copy.bio}
        </p>

        <div className="flex gap-10 py-5 mt-10 border-y border-border">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-[15px] font-medium tracking-[-0.02em] text-fg leading-[1.6]">
                {s.value}
              </div>
              <div className="text-[11px] text-fg-muted leading-[1.6]">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-5 mt-8 text-[13px]">
          <a
            href="https://wa.me/6285156964766?text=Hello%2C%20aku%20dari%20portfolio%20Fauzy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-fg transition-colors duration-200"
          >
            Get in touch
          </a>
          <a
            href="https://www.linkedin.com/in/muhammad-fauzy-741943203"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-fg transition-colors duration-200"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
