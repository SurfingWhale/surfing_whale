// app/components/sections/PhotographySection.tsx
"use client";

import { useState } from "react";
import { photographs, type PhotoCategory } from "@/app/data/photography";
import { SectionLabel } from "@/app/components/SectionLabel";
import { PhotoViewer } from "@/app/components/PhotoViewer";

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
  // Index runs against the filtered set, so arrows walk what is on screen.
  const [viewing, setViewing] = useState<number | null>(null);
  const visible =
    filter === "all" ? photographs : photographs.filter((p) => p.category === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...AVAILABLE.map((c) => ({ key: c as Filter, label: LABEL[c] })),
  ];

  return (
    <section data-spot id="photography" className="w-full py-16 sm:py-24 border-t border-border">
      <div data-reveal className="container mx-auto px-6 max-w-[720px]">
        <div className="mb-16 space-y-5 text-[13px] leading-[2] text-fg-body max-w-[560px]">
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

        <p className="text-[13px] leading-[2] text-fg-body mb-8 -mt-4">
          Longer pieces, where the writing and the frames go together, live in
          the{" "}
          <a
            href="/photo"
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            darkroom
          </a>
          .
        </p>

        <div className="flex gap-5 mb-8 flex-wrap text-[13px]" role="group" aria-label="Filter photographs">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`transition-colors duration-300 ${
                filter === f.key
                  ? "font-medium text-fg underline decoration-border-strong underline-offset-[3px]"
                  : "text-fg-body hover:text-fg"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Frames break out of the reading column and fall into columns, so the
          archive reads as a contact sheet and never strands a last row. */}
      <div data-reveal className="photo-masonry">
          {visible.map((photo, i) => (
          <figure key={photo.id} className="overflow-hidden bg-bg-muted">
            <button
              type="button"
              onClick={() => setViewing(i)}
              aria-label={`Open: ${photo.alt}`}
              className="block w-full cursor-zoom-in border-0 p-0 bg-transparent transition-transform duration-150 active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="w-full h-auto block outline outline-1 -outline-offset-1 outline-black/10"
              />
            </button>
          </figure>
          ))}
      </div>

      <PhotoViewer
        photos={visible}
        index={viewing}
        onIndex={setViewing}
        onClose={() => setViewing(null)}
      />
    </section>
  );
}
