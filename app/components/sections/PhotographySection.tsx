// app/components/sections/PhotographySection.tsx
"use client";

import { useState } from "react";
import { photographs, type PhotoCategory } from "@/app/data/photography";
import { SectionLabel } from "@/app/components/SectionLabel";

const LABEL: Record<PhotoCategory, string> = {
  portraits: "Portraits",
  everyday: "Everyday",
  landscapes: "Landscapes",
};

const ORDER: PhotoCategory[] = ["portraits", "everyday", "landscapes"];

// Only offer filters that actually have frames behind them, so a tab never
// leads to an empty grid.
const AVAILABLE = ORDER.filter((c) => photographs.some((p) => p.category === c));

type Filter = "all" | PhotoCategory;

export function PhotographySection() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible =
    filter === "all" ? photographs : photographs.filter((p) => p.category === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...AVAILABLE.map((c) => ({ key: c as Filter, label: LABEL[c] })),
  ];

  return (
    <section id="photography" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[720px]">
        <div className="mb-16 space-y-5 text-fg-secondary leading-relaxed">
          <p>
            I might snap myself in a mirror, someone laughing, a random moment,
            a friend&apos;s expression. It is simply a photograph ✌️ Perhaps no
            one cares. Perhaps tomorrow even I won&apos;t like it.
          </p>
          <p>
            Yet decades later someone might look at that very same frame and
            find something I missed the moment I pressed the shutter.
          </p>
          <p>
            Perhaps that is why Vivian Maier sits so close to the heart — not
            because she was a &ldquo;great photographer,&rdquo; but simply
            because she kept on taking pictures.
          </p>
          <p>
            There is more to capture, more to carry, and more of life to move
            through — all while knowing we can never truly control what an image
            means, or how long it endures.
          </p>
          <p className="text-fg">
            To my old soul, and to my faithful vintage Fujifilm: thank you. 📸
          </p>
        </div>

        <SectionLabel note={`Photography archive · ${photographs.length} photographs.`}>
          Selected photography
        </SectionLabel>

        <div className="flex gap-2 mb-8 flex-wrap" role="group" aria-label="Filter photographs">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-300 border ${
                filter === f.key
                  ? "bg-fg text-bg border-fg"
                  : "border-border text-fg-secondary hover:text-fg hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Column masonry keeps every frame at its own aspect ratio — a uniform
            grid would crop compositions the photographer chose. */}
        <div className="columns-1 sm:columns-2 gap-4 [column-fill:_balance]">
          {visible.map((photo) => (
            <figure
              key={photo.id}
              className="break-inside-avoid mb-4 overflow-hidden rounded-lg border border-border bg-bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="w-full h-auto block"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
