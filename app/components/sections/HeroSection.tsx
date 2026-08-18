// app/components/sections/HeroSection.tsx
"use client";

import { AvatarMorph } from "@/app/components/AvatarMorph";
import { RoleToggle, useProfileMode } from "@/app/components/ProfileMode";

const COPY = {
  analyst: {
    tagline: "Data analyst with an accounting background.",
    bio: "I turn raw numbers into stories people can act on — ledgers, forecasts, and the patterns underneath them.",
  },
  capture: {
    tagline: "I love capturing moments — joie de vivre.",
    bio: "Film and everyday frames. The same attention that reads a balance sheet, pointed at the ordinary.",
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
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 py-16 md:py-24 items-center max-w-[1120px]">
        <div className="order-2 md:order-1 flex flex-col gap-6">
          <div>
            <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-semibold tracking-[-0.03em] leading-[1.05]">
              Muhammad Fauzy
            </h1>
            <p className="text-lg text-fg-secondary mt-3 leading-relaxed">
              {copy.tagline}
            </p>
          </div>

          <p className="text-fg-secondary leading-relaxed max-w-md">{copy.bio}</p>

          <RoleToggle />

          <div className="flex gap-10 py-5 border-y border-border">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-xs text-fg-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
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

        <div className="order-1 md:order-2">
          <AvatarMorph />
        </div>
      </div>
    </section>
  );
}
