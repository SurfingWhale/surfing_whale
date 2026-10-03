// app/components/sections/HalloSection.tsx
// The first screen: a greeting before the hero says who and what, set in the
// same poured-chrome treatment as the SURFING mark on the guest-note card
// (ChromeWord) — one effect for the site's two big words, not two.
// The hero's name stays the page's h1; this is a hello, not a title, and the
// SVG carries it to a screen reader as an image labelled "Hallo!".
import { ChromeWord } from "@/app/components/ChromeWord";

export function HalloSection() {
  return (
    <section data-spot aria-label="Hallo" className="hallo-stage">
      <div className="frame relative h-full flex flex-col">
        <div className="m-auto w-full">
          <ChromeWord text="Hallo!" tone="hot" fit height="min(56svh, 52vw)" />
        </div>
        <p className="pb-8 text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
