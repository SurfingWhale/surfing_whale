// app/components/sections/HeroSection.tsx
// Single-column editorial layout: small avatar, name, then the copy running
// the full measure — rather than a two-column split with a large portrait.
"use client";

import { AvatarMorph } from "@/app/components/AvatarMorph";
import { RoleToggle, useProfileMode } from "@/app/components/ProfileMode";

const COPY = {
  analyst: {
    tagline: "Data analyst with an accounting background.",
    bio: "I turn raw numbers into stories people can act on — ledgers, forecasts, and the patterns underneath them. Most of what I build starts as a question I could not answer from a spreadsheet.",
  },
  capture: {
    tagline: "I love capturing moments — joie de vivre.",
    bio: "Film and everyday frames. The same attention that reads a balance sheet, pointed at the ordinary — light on a wall, someone mid-laugh, a street that will not look like this again.",
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
      <div className="container mx-auto px-6 py-20 md:py-28 max-w-[680px]">
        <AvatarMorph />

        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-semibold tracking-[-0.03em] leading-[1.05] mt-8">
          Hey, I&apos;m Fauzy.
        </h1>

        <p className="text-lg text-fg-secondary mt-3 leading-relaxed">
          {copy.tagline}
        </p>

        <p className="text-fg-secondary leading-relaxed mt-6">{copy.bio}</p>

        <div className="mt-8">
          <RoleToggle />
        </div>

        <div className="flex gap-10 py-6 mt-8 border-y border-border">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-fg-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap mt-8">
          <a
            href="https://wa.me/6285156964766?text=Hello%2C%20aku%20dari%20portfolio%20Fauzy"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-fg text-bg text-sm font-medium hover:opacity-85 transition-opacity duration-300"
          >
            Get in touch
          </a>
          <a
            href="https://www.linkedin.com/in/muhammad-fauzy-741943203"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-border text-fg text-sm font-medium hover:border-border-strong transition-colors duration-300"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
