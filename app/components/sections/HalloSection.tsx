// app/components/sections/HalloSection.tsx
// The first screen: a greeting in a sky, before the hero says who and what.
// The hero's name stays the page's h1; this is a hello, not a title, so it is
// a paragraph and the heading outline is unchanged.
import { IridescentClouds } from "@/app/components/IridescentClouds";

export function HalloSection() {
  return (
    <section data-spot aria-label="Hallo" className="hallo-stage">
      <div className="hallo-sky" aria-hidden="true" />
      <IridescentClouds className="absolute inset-0 h-full w-full" />
      <div className="frame relative h-full flex flex-col">
        <p className="hallo-word m-auto">Hallo!</p>
        <p className="pb-8 text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
